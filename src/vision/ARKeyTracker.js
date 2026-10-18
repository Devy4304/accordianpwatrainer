// AR Image Recognition & Optical Key Tracking Engine with Interactive Calibration

export class ARKeyTracker {
  constructor(options = {}) {
    this.videoElement = null;
    this.canvasElement = null;
    this.ctx = null;
    this.mediaStream = null;
    this.isRunning = false;
    this.animationFrameId = null;

    this.facingMode = options.facingMode || 'environment'; // 'environment' or 'user'
    this.isMirrored = options.isMirrored || false;
    this.showCalibration = true;
    this.showGrid = true;
    this.showTargetGlow = true;
    this.showKeyLabels = true;

    // Callbacks
    this.onKeyDetected = options.onKeyDetected || (() => {});
    this.onKeyReleased = options.onKeyReleased || (() => {});

    // Calibration Quad (Coordinates in normalized 0.0 to 1.0 range)
    this.quad = this.loadCalibration() || {
      topLeft:     { x: 0.15, y: 0.15 },
      topRight:    { x: 0.85, y: 0.15 },
      bottomRight: { x: 0.85, y: 0.85 },
      bottomLeft:  { x: 0.15, y: 0.85 }
    };

    this.activeDragHandle = null;
    this.dragOffset = { x: 0, y: 0 };

    // Active keys and target preview
    this.activeKeys = new Set(); // Set of key IDs
    this.targetKey = null; // { keyId, midi, noteName, finger, direction }
    this.accordionModel = null;
    this.renderedKeyBoxes = []; // Cache of calculated bounding polygons for each key

    // Computer Vision Baseline & Motion buffers
    this.previousFrameData = null;
    this.keyActivityScores = new Map();
    this.motionThreshold = 0.22;
    this.lastTriggerTime = new Map();
  }

  loadCalibration() {
    try {
      const saved = localStorage.getItem('accordion_ar_calibration');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return null;
  }

  saveCalibration() {
    try {
      localStorage.setItem('accordion_ar_calibration', JSON.stringify(this.quad));
    } catch (e) {
      // ignore
    }
  }

  resetCalibrationPreset(preset = 'vertical') {
    if (preset === 'vertical') {
      this.quad = {
        topLeft:     { x: 0.25, y: 0.10 },
        topRight:    { x: 0.75, y: 0.10 },
        bottomRight: { x: 0.75, y: 0.90 },
        bottomLeft:  { x: 0.25, y: 0.90 }
      };
    } else if (preset === 'horizontal') {
      this.quad = {
        topLeft:     { x: 0.10, y: 0.30 },
        topRight:    { x: 0.90, y: 0.30 },
        bottomRight: { x: 0.90, y: 0.70 },
        bottomLeft:  { x: 0.10, y: 0.70 }
      };
    } else if (preset === 'slanted') {
      this.quad = {
        topLeft:     { x: 0.30, y: 0.12 },
        topRight:    { x: 0.80, y: 0.18 },
        bottomRight: { x: 0.65, y: 0.88 },
        bottomLeft:  { x: 0.15, y: 0.82 }
      };
    }
    this.saveCalibration();
  }

  setAccordionModel(model, keysList) {
    this.accordionModel = model;
    this.keysList = keysList;
    this.calculateKeyBoxes();
  }

  setTargetKey(target) {
    this.targetKey = target;
  }

  setActiveKeys(keys) {
    this.activeKeys = new Set(keys);
  }

  async start(videoElement, canvasElement) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.ctx = this.canvasElement.getContext('2d', { willReadFrequently: true });

    try {
      const constraints = {
        video: {
          facingMode: this.facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.mediaStream;
      await this.videoElement.play();

      this.isRunning = true;
      this.setupCanvasInteractions();
      this.renderLoop();
      return true;
    } catch (err) {
      console.warn('AR Camera startup failed with default constraints, retrying basic:', err);
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        this.videoElement.srcObject = this.mediaStream;
        await this.videoElement.play();
        this.isRunning = true;
        this.setupCanvasInteractions();
        this.renderLoop();
        return true;
      } catch (fallbackErr) {
        console.error('AR Camera failed entirely:', fallbackErr);
        throw fallbackErr;
      }
    }
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  toggleCamera() {
    this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
    if (this.isRunning) {
      this.stop();
      return this.start(this.videoElement, this.canvasElement);
    }
  }

  toggleMirror() {
    this.isMirrored = !this.isMirrored;
  }

  // Bilinear interpolation inside calibrated Quad
  interpolateQuad(u, v) {
    const { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl } = this.quad;
    // Top line point
    const topX = tl.x + u * (tr.x - tl.x);
    const topY = tl.y + u * (tr.y - tl.y);
    // Bottom line point
    const botX = bl.x + u * (br.x - bl.x);
    const botY = bl.y + u * (br.y - bl.y);

    return {
      x: topX + v * (botX - topX),
      y: topY + v * (botY - topY)
    };
  }

  calculateKeyBoxes() {
    if (!this.keysList || this.keysList.length === 0) return;

    this.renderedKeyBoxes = [];
    const isPiano = this.accordionModel?.trebleType === 'PIANO';
    const isCba = this.accordionModel?.trebleType?.startsWith('CBA');
    const isDiatonic = this.accordionModel?.trebleType === 'DIATONIC';

    if (isPiano) {
      // Piano keyboard: White keys vertical or horizontal strip
      const whiteKeys = this.keysList.filter(k => !k.isBlack);
      const totalWhite = whiteKeys.length;

      whiteKeys.forEach((key, wIdx) => {
        const vStart = wIdx / totalWhite;
        const vEnd = (wIdx + 1) / totalWhite;

        const pTL = this.interpolateQuad(0.0, vStart);
        const pTR = this.interpolateQuad(1.0, vStart);
        const pBR = this.interpolateQuad(1.0, vEnd);
        const pBL = this.interpolateQuad(0.0, vEnd);

        this.renderedKeyBoxes.push({
          key,
          isBlack: false,
          polygon: [pTL, pTR, pBR, pBL],
          center: { x: (pTL.x + pBR.x) / 2, y: (pTL.y + pBR.y) / 2 }
        });
      });

      // Black keys on top layer
      const blackKeys = this.keysList.filter(k => k.isBlack);
      blackKeys.forEach(key => {
        const vPos = key.position;
        const vStart = (vPos + 0.15) / totalWhite;
        const vEnd = (vPos + 0.85) / totalWhite;

        // Black keys occupy outer 58% of keyboard width
        const pTL = this.interpolateQuad(0.0, vStart);
        const pTR = this.interpolateQuad(0.58, vStart);
        const pBR = this.interpolateQuad(0.58, vEnd);
        const pBL = this.interpolateQuad(0.0, vEnd);

        this.renderedKeyBoxes.push({
          key,
          isBlack: true,
          polygon: [pTL, pTR, pBR, pBL],
          center: { x: (pTL.x + pBR.x) / 2, y: (pTL.y + pBR.y) / 2 }
        });
      });
    } else if (isCba || isDiatonic) {
      // Button Matrix / Staggered Grid
      const rows = isCba ? 5 : (this.accordionModel?.diatonicModel === '3_ROW_GCF' ? 3 : 2);
      const buttonsByRow = {};
      this.keysList.forEach(k => {
        const r = k.row || 0;
        if (!buttonsByRow[r]) buttonsByRow[r] = [];
        buttonsByRow[r].push(k);
      });

      Object.entries(buttonsByRow).forEach(([rStr, rowButtons]) => {
        const r = parseInt(rStr, 10);
        const uPos = (r + 0.5) / (rows + 0.2);
        const count = rowButtons.length;

        rowButtons.forEach((btn, colIdx) => {
          const vPos = (colIdx + 0.5) / (count + 0.5);
          const center = this.interpolateQuad(uPos, vPos);
          const radU = 0.4 / (rows * 2);
          const radV = 0.4 / (count * 2);

          const pTL = this.interpolateQuad(uPos - radU, vPos - radV);
          const pTR = this.interpolateQuad(uPos + radU, vPos - radV);
          const pBR = this.interpolateQuad(uPos + radU, vPos + radV);
          const pBL = this.interpolateQuad(uPos - radU, vPos + radV);

          this.renderedKeyBoxes.push({
            key: btn,
            isBlack: btn.isBlack || false,
            polygon: [pTL, pTR, pBR, pBL],
            center
          });
        });
      });
    }
  }

  setupCanvasInteractions() {
    if (!this.canvasElement) return;

    const getCanvasPoint = (e) => {
      const rect = this.canvasElement.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) / rect.width,
        y: (clientY - rect.top) / rect.height
      };
    };

    const findHandleNear = (pt) => {
      const radius = 0.08;
      for (const [name, coord] of Object.entries(this.quad)) {
        const dx = pt.x - coord.x;
        const dy = pt.y - coord.y;
        if (Math.sqrt(dx * dx + dy * dy) < radius) {
          return name;
        }
      }
      return null;
    };

    const onPointerDown = (e) => {
      const pt = getCanvasPoint(e);
      if (this.showCalibration) {
        const handle = findHandleNear(pt);
        if (handle) {
          this.activeDragHandle = handle;
          return;
        }
      }

      // Check key tap
      const tappedKey = this.findKeyAtPoint(pt);
      if (tappedKey) {
        this.activeKeys.add(tappedKey.key.id);
        this.onKeyDetected(tappedKey.key);
      }
    };

    const onPointerMove = (e) => {
      if (!this.activeDragHandle) return;
      const pt = getCanvasPoint(e);
      this.quad[this.activeDragHandle] = {
        x: Math.max(0.02, Math.min(0.98, pt.x)),
        y: Math.max(0.02, Math.min(0.98, pt.y))
      };
      this.calculateKeyBoxes();
    };

    const onPointerUp = () => {
      if (this.activeDragHandle) {
        this.activeDragHandle = null;
        this.saveCalibration();
      }
    };

    this.canvasElement.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    this.canvasElement.addEventListener('touchstart', onPointerDown, { passive: false });
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
  }

  findKeyAtPoint(pt) {
    for (let i = this.renderedKeyBoxes.length - 1; i >= 0; i--) {
      const box = this.renderedKeyBoxes[i];
      if (this.isPointInPolygon(pt, box.polygon)) {
        return box;
      }
    }
    return null;
  }

  isPointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // Vision Frame Processing & Real-time Key Press Detection
  processComputerVision(width, height) {
    if (!this.renderedKeyBoxes || this.renderedKeyBoxes.length === 0) return;

    try {
      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = 160;
      sampleCanvas.height = 120;
      const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
      sampleCtx.drawImage(this.videoElement, 0, 0, 160, 120);

      const frameData = sampleCtx.getImageData(0, 0, 160, 120).data;
      const now = Date.now();

      if (this.previousFrameData) {
        // Compare pixel changes for each key region
        this.renderedKeyBoxes.forEach(box => {
          const cx = Math.floor(box.center.x * 160);
          const cy = Math.floor(box.center.y * 120);

          if (cx >= 2 && cx < 158 && cy >= 2 && cy < 118) {
            let diffSum = 0;
            let pixelCount = 0;

            for (let dy = -2; dy <= 2; dy++) {
              for (let dx = -2; dx <= 2; dx++) {
                const idx = ((cy + dy) * 160 + (cx + dx)) * 4;
                const rDiff = Math.abs(frameData[idx] - this.previousFrameData[idx]);
                const gDiff = Math.abs(frameData[idx + 1] - this.previousFrameData[idx + 1]);
                const bDiff = Math.abs(frameData[idx + 2] - this.previousFrameData[idx + 2]);
                diffSum += (rDiff + gDiff + bDiff) / 3;
                pixelCount++;
              }
            }

            const avgDiff = (diffSum / pixelCount) / 255;
            const prevScore = this.keyActivityScores.get(box.key.id) || 0;
            const score = prevScore * 0.7 + avgDiff * 0.3;
            this.keyActivityScores.set(box.key.id, score);

            const lastTrigger = this.lastTriggerTime.get(box.key.id) || 0;
            if (score > this.motionThreshold && now - lastTrigger > 350) {
              this.lastTriggerTime.set(box.key.id, now);
              this.onKeyDetected(box.key);
            }
          }
        });
      }

      this.previousFrameData = frameData;
    } catch (e) {
      // ignore frame read errors
    }
  }

  renderLoop() {
    if (!this.isRunning) return;

    const width = this.canvasElement.width = this.canvasElement.clientWidth || 640;
    const height = this.canvasElement.height = this.canvasElement.clientHeight || 480;

    this.ctx.clearRect(0, 0, width, height);

    // 1. Draw Camera Video Feed
    if (this.videoElement.readyState >= 2) {
      this.ctx.save();
      if (this.isMirrored) {
        this.ctx.translate(width, 0);
        this.ctx.scale(-1, 1);
      }
      this.ctx.drawImage(this.videoElement, 0, 0, width, height);
      this.ctx.restore();

      // Vision processing every ~4 frames
      if (Math.random() < 0.35) {
        this.processComputerVision(width, height);
      }
    }

    // 2. Render AR Keys & Holographic Guidance Overlay
    this.renderAROverlay(width, height);

    // 3. Render Calibration Quad & Controls (if enabled)
    if (this.showCalibration) {
      this.renderCalibrationHandles(width, height);
    }

    this.animationFrameId = requestAnimationFrame(() => this.renderLoop());
  }

  renderAROverlay(width, height) {
    if (!this.showGrid || !this.renderedKeyBoxes) return;

    const now = Date.now();
    const pulse = Math.sin(now / 180) * 0.25 + 0.75; // 0.5 to 1.0 glow pulse

    // Draw Keys
    this.renderedKeyBoxes.forEach(box => {
      const poly = box.polygon;
      const isTarget = this.targetKey && (
        box.key.id === this.targetKey.keyId ||
        box.key.midi === this.targetKey.midi ||
        box.key.pushMidi === this.targetKey.midi ||
        box.key.pullMidi === this.targetKey.midi
      );
      const isActive = this.activeKeys.has(box.key.id);

      this.ctx.beginPath();
      this.ctx.moveTo(poly[0].x * width, poly[0].y * height);
      for (let i = 1; i < poly.length; i++) {
        this.ctx.lineTo(poly[i].x * width, poly[i].y * height);
      }
      this.ctx.closePath();

      if (isActive) {
        // Active key pressed: Emerald neon glow
        this.ctx.fillStyle = 'rgba(16, 185, 129, 0.75)';
        this.ctx.strokeStyle = '#34d399';
        this.ctx.lineWidth = 3;
        this.ctx.fill();
        this.ctx.stroke();
      } else if (isTarget && this.showTargetGlow) {
        // Target key to press: Glowing Amber/Cyan Hologram
        const glowColor = this.targetKey.direction === 'pull' ? 'rgba(249, 115, 22, ' : 'rgba(56, 189, 248, ';
        this.ctx.fillStyle = `${glowColor}${0.45 * pulse})`;
        this.ctx.strokeStyle = this.targetKey.direction === 'pull' ? '#f97316' : '#38bdf8';
        this.ctx.lineWidth = 3 + 2 * pulse;
        this.ctx.shadowColor = this.targetKey.direction === 'pull' ? '#ea580c' : '#0284c7';
        this.ctx.shadowBlur = 12 * pulse;
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.shadowBlur = 0; // reset
      } else {
        // Standard Key Wireframe
        if (box.isBlack) {
          this.ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
          this.ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
        } else {
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          this.ctx.strokeStyle = 'rgba(226, 232, 240, 0.6)';
        }
        this.ctx.lineWidth = 1.2;
        this.ctx.fill();
        this.ctx.stroke();
      }

      // Key Note Label
      if (this.showKeyLabels && (isTarget || isActive || box.key.noteName?.startsWith('C'))) {
        const cx = box.center.x * width;
        const cy = box.center.y * height;
        const label = box.key.noteName || box.key.label || '';

        this.ctx.font = isTarget ? 'bold 13px system-ui, sans-serif' : '10px system-ui, sans-serif';
        this.ctx.fillStyle = isTarget ? '#ffffff' : 'rgba(255, 255, 255, 0.85)';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(label, cx, cy);
      }
    });

    // Draw Next Note Hologram Badge (Floating 3D Pin)
    if (this.targetKey && this.showTargetGlow) {
      const targetBox = this.renderedKeyBoxes.find(b =>
        b.key.id === this.targetKey.keyId ||
        b.key.midi === this.targetKey.midi ||
        b.key.pushMidi === this.targetKey.midi ||
        b.key.pullMidi === this.targetKey.midi
      );

      if (targetBox) {
        const cx = targetBox.center.x * width;
        const cy = targetBox.center.y * height;
        const finger = this.targetKey.finger || '1';
        const direction = this.targetKey.direction || 'push';

        // Floating Target Badge
        const badgeY = cy - 28 - Math.sin(now / 150) * 4;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(cx, badgeY, 15, 0, Math.PI * 2);
        this.ctx.fillStyle = direction === 'pull' ? '#ea580c' : '#0284c7';
        this.ctx.shadowColor = '#000000';
        this.ctx.shadowBlur = 8;
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 11px system-ui, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`F${finger}`, cx, badgeY);

        // Arrow pointing down to key
        this.ctx.beginPath();
        this.ctx.moveTo(cx - 5, badgeY + 15);
        this.ctx.lineTo(cx + 5, badgeY + 15);
        this.ctx.lineTo(cx, badgeY + 22);
        this.ctx.closePath();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fill();
        this.ctx.restore();
      }
    }
  }

  renderCalibrationHandles(width, height) {
    const { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl } = this.quad;

    // Draw Quad Outline
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(tl.x * width, tl.y * height);
    this.ctx.lineTo(tr.x * width, tr.y * height);
    this.ctx.lineTo(br.x * width, br.y * height);
    this.ctx.lineTo(bl.x * width, bl.y * height);
    this.ctx.closePath();
    this.ctx.strokeStyle = '#f59e0b';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([6, 6]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Draw Corner Handles
    const handles = [
      { name: 'topLeft', pt: tl, label: '↖ Top-Left' },
      { name: 'topRight', pt: tr, label: '↗ Top-Right' },
      { name: 'bottomRight', pt: br, label: '↘ Bottom-Right' },
      { name: 'bottomLeft', pt: bl, label: '↙ Bottom-Left' }
    ];

    handles.forEach(h => {
      const hx = h.pt.x * width;
      const hy = h.pt.y * height;
      const isDragging = this.activeDragHandle === h.name;

      this.ctx.beginPath();
      this.ctx.arc(hx, hy, isDragging ? 18 : 14, 0, Math.PI * 2);
      this.ctx.fillStyle = isDragging ? '#ef4444' : '#f59e0b';
      this.ctx.fill();
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2.5;
      this.ctx.stroke();

      // Mini crosshair inside handle
      this.ctx.beginPath();
      this.ctx.moveTo(hx - 5, hy);
      this.ctx.lineTo(hx + 5, hy);
      this.ctx.moveTo(hx, hy - 5);
      this.ctx.lineTo(hx, hy + 5);
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    });

    this.ctx.restore();
  }
}

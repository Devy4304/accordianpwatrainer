// Interactive Virtual Accordion UI Component: Treble Keys, Stradella Bass Board & Bellows Control

export class VirtualAccordionView {
  constructor(containerElement, audioEngine, options = {}) {
    this.container = containerElement;
    this.audioEngine = audioEngine;
    this.accordionModel = options.accordionModel;
    this.trebleKeys = options.trebleKeys || [];
    this.bassGrid = options.bassGrid || null;

    this.targetKey = null;
    this.bellowsDirection = 'push'; // 'push' or 'pull'
    this.bellowsPressure = 1.0;
    this.activePointers = new Map(); // pointerId -> keyId

    this.onKeyPlay = options.onKeyPlay || (() => {});
    this.onKeyRelease = options.onKeyRelease || (() => {});
    this.onBassPlay = options.onBassPlay || (() => {});
    this.onBassRelease = options.onBassRelease || (() => {});
  }

  setModelData(model, trebleKeys, bassGrid) {
    this.accordionModel = model;
    this.trebleKeys = trebleKeys;
    this.bassGrid = bassGrid;
    this.render();
  }

  setTargetKey(target) {
    this.targetKey = target;
    this.updateTargetHighlight();
  }

  setBellowsDirection(dir) {
    this.bellowsDirection = dir;
    this.audioEngine.setBellowsDirection(dir);
    const indicator = this.container.querySelector('.bellows-direction-badge');
    if (indicator) {
      indicator.className = `bellows-direction-badge ${dir}`;
      indicator.innerHTML = dir === 'push' ? '⬅️ PUSH BELLOWS' : '➡️ PULL BELLOWS';
    }
    // Update diatonic button labels if bisonoric
    if (this.accordionModel?.isBisonoric) {
      this.updateDiatonicLabels();
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="virtual-accordion-wrapper">
        <!-- Accordion Top Control Bar -->
        <div class="accordion-control-bar">
          <div class="bellows-section">
            <button class="bellows-toggle-btn ${this.bellowsDirection}" id="bellows-toggle-btn" title="Toggle Push / Pull Bellows Direction">
              <span class="bellows-direction-badge ${this.bellowsDirection}">
                ${this.bellowsDirection === 'push' ? '⬅️ PUSH BELLOWS' : '➡️ PULL BELLOWS'}
              </span>
            </button>
            <div class="bellows-pressure-wrap">
              <span class="pressure-label">🫁 Pressure</span>
              <input type="range" class="pressure-slider" id="pressure-slider" min="0.3" max="1.6" step="0.05" value="1.0" />
            </div>
          </div>
          <div class="accordion-badges">
            <span class="accordion-badge model-badge">${this.accordionModel?.icon || '🪗'} ${this.accordionModel?.name || 'Piano Accordion'}</span>
          </div>
        </div>

        <!-- Accordion Split Playboard -->
        <div class="accordion-playboard">
          <!-- Left Hand: Stradella Bass Board -->
          <div class="bass-board-container" id="bass-board-container">
            <div class="section-title">
              <span>Left Hand • Stradella Bass</span>
              <span class="sub-title">Circle of 5ths</span>
            </div>
            <div class="bass-scroll-view">
              <div class="bass-matrix" id="bass-matrix"></div>
            </div>
          </div>

          <!-- Central Bellows Visual Divider -->
          <div class="bellows-divider">
            <div class="bellows-ribs">
              ${Array.from({ length: 8 }).map(() => '<div class="bellow-fold"></div>').join('')}
            </div>
          </div>

          <!-- Right Hand: Treble Board (Piano Keys / Buttons) -->
          <div class="treble-board-container" id="treble-board-container">
            <div class="section-title">
              <span>Right Hand • Treble Melody</span>
              <span class="sub-title">${this.accordionModel?.trebleType === 'PIANO' ? 'Piano Keyboard' : 'Button Board'}</span>
            </div>
            <div class="treble-scroll-view">
              <div class="treble-keyboard ${this.accordionModel?.trebleType?.toLowerCase() || 'piano'}" id="treble-keyboard"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderTrebleKeys();
    this.renderBassButtons();
    this.attachEventListeners();
  }

  renderTrebleKeys() {
    const keyboardEl = this.container.querySelector('#treble-keyboard');
    if (!keyboardEl || !this.trebleKeys) return;

    keyboardEl.innerHTML = '';
    const isPiano = this.accordionModel?.trebleType === 'PIANO';

    if (isPiano) {
      keyboardEl.className = 'treble-keyboard piano-layout';
      this.trebleKeys.forEach(key => {
        const keyEl = document.createElement('div');
        keyEl.className = `piano-key ${key.isBlack ? 'black-key' : 'white-key'}`;
        keyEl.dataset.keyId = key.id;
        keyEl.dataset.midi = key.midi;
        keyEl.dataset.note = key.noteName;

        const isC = key.noteName.startsWith('C') && !key.isBlack;
        keyEl.innerHTML = `
          <div class="key-label ${isC ? 'is-c-key' : ''}">${key.noteName}</div>
          <div class="target-indicator"></div>
        `;
        keyboardEl.appendChild(keyEl);
      });
    } else if (this.accordionModel?.trebleType?.startsWith('CBA')) {
      keyboardEl.className = 'treble-keyboard cba-layout';
      // Group by row
      const rowsCount = this.accordionModel.rowsCount || 5;
      const rowsEls = [];
      for (let r = 0; r < rowsCount; r++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = `cba-row cba-row-${r}`;
        rowsEls.push(rowDiv);
        keyboardEl.appendChild(rowDiv);
      }

      this.trebleKeys.forEach(btn => {
        const rowDiv = rowsEls[btn.row || 0];
        if (rowDiv) {
          const btnEl = document.createElement('div');
          btnEl.className = `cba-button ${btn.isBlack ? 'black-button' : 'white-button'} ${btn.isAuxiliary ? 'aux-button' : ''}`;
          btnEl.dataset.keyId = btn.id;
          btnEl.dataset.midi = btn.midi;
          btnEl.dataset.note = btn.noteName;
          btnEl.innerHTML = `
            <span class="btn-note">${btn.noteName}</span>
            <div class="target-indicator"></div>
          `;
          rowDiv.appendChild(btnEl);
        }
      });
    } else if (this.accordionModel?.trebleType === 'DIATONIC') {
      keyboardEl.className = 'treble-keyboard diatonic-layout';
      const rows = this.accordionModel.diatonicModel === '3_ROW_GCF' ? 3 : (this.accordionModel.diatonicModel === '2_ROW_GC' ? 2 : 1);
      const rowsEls = [];
      for (let r = 0; r < rows; r++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = `diatonic-row diatonic-row-${r}`;
        rowsEls.push(rowDiv);
        keyboardEl.appendChild(rowDiv);
      }

      this.trebleKeys.forEach(btn => {
        const rowDiv = rowsEls[btn.row || 0];
        if (rowDiv) {
          const btnEl = document.createElement('div');
          btnEl.className = 'diatonic-button';
          btnEl.dataset.keyId = btn.id;
          btnEl.dataset.pushMidi = btn.pushMidi;
          btnEl.dataset.pullMidi = btn.pullMidi;
          btnEl.dataset.pushNote = btn.pushNote;
          btnEl.dataset.pullNote = btn.pullNote;

          const currentNote = this.bellowsDirection === 'push' ? btn.pushNote : btn.pullNote;
          btnEl.innerHTML = `
            <span class="btn-num">${btn.label}</span>
            <span class="btn-note dynamic-note">${currentNote}</span>
            <div class="target-indicator"></div>
          `;
          rowDiv.appendChild(btnEl);
        }
      });
    }
  }

  updateDiatonicLabels() {
    const dynamicNotes = this.container.querySelectorAll('.diatonic-button');
    dynamicNotes.forEach(btnEl => {
      const pushNote = btnEl.dataset.pushNote;
      const pullNote = btnEl.dataset.pullNote;
      const noteSpan = btnEl.querySelector('.dynamic-note');
      if (noteSpan) {
        noteSpan.textContent = this.bellowsDirection === 'push' ? pushNote : pullNote;
      }
    });
  }

  renderBassButtons() {
    const bassMatrixEl = this.container.querySelector('#bass-matrix');
    if (!bassMatrixEl || !this.bassGrid) return;

    bassMatrixEl.innerHTML = '';
    const { rows, columns, buttons } = this.bassGrid;

    // Render Row Headers
    const gridWrapper = document.createElement('div');
    gridWrapper.className = 'stradella-grid';
    gridWrapper.style.gridTemplateColumns = `repeat(${columns.length}, 1fr)`;
    gridWrapper.style.gridTemplateRows = `repeat(${rows.length}, 1fr)`;

    buttons.forEach(btn => {
      const btnEl = document.createElement('button');
      btnEl.className = `stradella-btn row-${btn.rowType} ${btn.isMarked ? 'is-marked-bass' : ''}`;
      btnEl.dataset.bassId = btn.id;
      btnEl.dataset.fundamental = btn.fundamentalMidi;
      btnEl.dataset.notes = JSON.stringify(btn.midiNotes);
      btnEl.dataset.label = btn.label;

      btnEl.innerHTML = `
        <span class="bass-label">${btn.label}</span>
        <span class="bass-type">${btn.subLabel}</span>
        <div class="target-indicator"></div>
      `;
      gridWrapper.appendChild(btnEl);
    });

    bassMatrixEl.appendChild(gridWrapper);

    // Auto scroll to center C
    const centerC = gridWrapper.querySelector('.is-marked-bass');
    if (centerC) {
      setTimeout(() => {
        centerC.scrollIntoView({ inline: 'center', block: 'center', behavior: 'smooth' });
      }, 100);
    }
  }

  updateTargetHighlight() {
    // Clear previous targets
    this.container.querySelectorAll('.is-target-key').forEach(el => el.classList.remove('is-target-key'));

    if (!this.targetKey) return;

    // Highlight Treble
    if (this.targetKey.keyId) {
      const keyEl = this.container.querySelector(`[data-key-id="${this.targetKey.keyId}"]`);
      if (keyEl) keyEl.classList.add('is-target-key');
    } else if (this.targetKey.midi) {
      const targetMidi = this.targetKey.midi;
      const keyEl = this.container.querySelector(
        `[data-midi="${targetMidi}"], [data-push-midi="${targetMidi}"], [data-pull-midi="${targetMidi}"]`
      );
      if (keyEl) keyEl.classList.add('is-target-key');
    }

    // Highlight Bass button if specified in song
    if (this.targetKey.bassId) {
      const bassBtn = this.container.querySelector(`[data-bass-id*="${this.targetKey.bassId}"]`);
      if (bassBtn) bassBtn.classList.add('is-target-key');
    }
  }

  attachEventListeners() {
    // Bellows Toggle
    const bellowsToggle = this.container.querySelector('#bellows-toggle-btn');
    if (bellowsToggle) {
      bellowsToggle.addEventListener('click', () => {
        const newDir = this.bellowsDirection === 'push' ? 'pull' : 'push';
        this.setBellowsDirection(newDir);
      });
    }

    // Pressure Slider
    const pressureSlider = this.container.querySelector('#pressure-slider');
    if (pressureSlider) {
      pressureSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.bellowsPressure = val;
        this.audioEngine.setBellowsPressure(val);
      });
    }

    // Multi-Touch Pointer Interaction for Keys and Bass
    const handleKeyStart = (targetEl) => {
      if (!targetEl) return;
      const keyEl = targetEl.closest('.piano-key, .cba-button, .diatonic-button');
      if (keyEl && !keyEl.classList.contains('is-active')) {
        keyEl.classList.add('is-active');
        const keyId = keyEl.dataset.keyId;
        const midi = parseInt(
          this.bellowsDirection === 'push' ? (keyEl.dataset.pushMidi || keyEl.dataset.midi) : (keyEl.dataset.pullMidi || keyEl.dataset.midi),
          10
        );
        const noteName = keyEl.dataset.note || keyEl.dataset.pushNote;

        this.audioEngine.playNote(keyId, midi, 0.85);
        this.onKeyPlay({ keyId, midi, noteName });
      }

      const bassEl = targetEl.closest('.stradella-btn');
      if (bassEl && !bassEl.classList.contains('is-active')) {
        bassEl.classList.add('is-active');
        const bassId = bassEl.dataset.bassId;
        const midiNotes = JSON.parse(bassEl.dataset.notes || '[]');
        const label = bassEl.dataset.label;

        this.audioEngine.playBass(bassId, midiNotes, 0.9);
        this.onBassPlay({ bassId, midiNotes, label });
      }
    };

    const handleKeyEnd = (targetEl) => {
      if (!targetEl) return;
      const keyEl = targetEl.closest('.piano-key, .cba-button, .diatonic-button');
      if (keyEl && keyEl.classList.contains('is-active')) {
        keyEl.classList.remove('is-active');
        const keyId = keyEl.dataset.keyId;
        this.audioEngine.stopNote(keyId);
        this.onKeyRelease(keyId);
      }

      const bassEl = targetEl.closest('.stradella-btn');
      if (bassEl && bassEl.classList.contains('is-active')) {
        bassEl.classList.remove('is-active');
        const bassId = bassEl.dataset.bassId;
        this.audioEngine.stopBass(bassId);
        this.onBassRelease(bassId);
      }
    };

    // Pointer events on playboard
    const playboard = this.container.querySelector('.accordion-playboard');
    if (playboard) {
      playboard.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.activePointers.set(e.pointerId, e.target);
        handleKeyStart(e.target);
      });

      playboard.addEventListener('pointermove', (e) => {
        if (!this.activePointers.has(e.pointerId)) return;
        const currentTarget = document.elementFromPoint(e.clientX, e.clientY);
        const prevTarget = this.activePointers.get(e.pointerId);
        if (currentTarget !== prevTarget) {
          handleKeyEnd(prevTarget);
          handleKeyStart(currentTarget);
          this.activePointers.set(e.pointerId, currentTarget);
        }
      });

      const onPointerEnd = (e) => {
        if (this.activePointers.has(e.pointerId)) {
          const target = this.activePointers.get(e.pointerId);
          handleKeyEnd(target);
          this.activePointers.delete(e.pointerId);
        }
      };

      playboard.addEventListener('pointerup', onPointerEnd);
      playboard.addEventListener('pointercancel', onPointerEnd);
    }
  }
}

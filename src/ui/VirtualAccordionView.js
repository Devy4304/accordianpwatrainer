// Interactive Virtual Accordion UI Component: Treble Keys, Stradella Bass Board & Bellows Control
import { STRADELLA_CIRCLE_OF_FIFTHS } from '../models/AccordionModels.js';

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

    // Hand mode: 'both', 'treble', 'bass'
    // Default to 'treble' on small screens if not explicitly passed
    const isMobile = window.innerWidth <= 768;
    this.handMode = options.handMode || (isMobile ? 'treble' : 'both');

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

  setHandMode(mode) {
    this.handMode = mode;
    const playboard = this.container.querySelector('.accordion-playboard');
    if (playboard) {
      playboard.className = `accordion-playboard mode-${mode}`;
    }
    this.container.querySelectorAll('.hand-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.hand === mode);
    });

    // Auto center current target or middle key when switching mode
    setTimeout(() => {
      this.centerCurrentFocus();
    }, 120);
  }

  setTargetKey(target) {
    this.targetKey = target;
    this.updateTargetHighlight();
    this.centerTargetKey();
  }

  centerTargetKey() {
    if (!this.targetKey) return;

    // Center Treble
    if (this.targetKey.keyId || this.targetKey.midi) {
      const targetMidi = this.targetKey.midi;
      const keyEl = this.container.querySelector(
        this.targetKey.keyId
          ? `[data-key-id="${this.targetKey.keyId}"]`
          : `[data-midi="${targetMidi}"], [data-push-midi="${targetMidi}"], [data-pull-midi="${targetMidi}"]`
      );
      if (keyEl && keyEl.offsetParent !== null) {
        keyEl.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      }
    }

    // Center Bass
    if (this.targetKey.bassId) {
      const bassBtn = this.container.querySelector(`[data-bass-id*="${this.targetKey.bassId}"]`);
      if (bassBtn && bassBtn.offsetParent !== null) {
        bassBtn.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      }
    }
  }

  centerCurrentFocus() {
    if (this.targetKey) {
      this.centerTargetKey();
      return;
    }
    // Default center on middle C
    const centerCKey = this.container.querySelector('[data-note="C4"], [data-note="C3"], .is-c-key');
    if (centerCKey && centerCKey.offsetParent !== null) {
      centerCKey.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }
    const centerCBass = this.container.querySelector('.is-marked-bass');
    if (centerCBass && centerCBass.offsetParent !== null) {
      centerCBass.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }
  }

  setBellowsDirection(dir) {
    this.bellowsDirection = dir;
    this.audioEngine.setBellowsDirection(dir);
    const indicator = this.container.querySelector('.bellows-direction-badge');
    if (indicator) {
      indicator.className = `bellows-direction-badge ${dir}`;
      indicator.innerHTML = dir === 'push' ? '⬅️ PUSH' : '➡️ PULL';
    }
    if (this.accordionModel?.isBisonoric) {
      this.updateDiatonicLabels();
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="virtual-accordion-wrapper">
        <!-- Accordion Top Control Bar -->
        <div class="accordion-control-bar">
          <!-- Hand View Mode Switcher -->
          <div class="hand-switch-group">
            <button class="hand-tab ${this.handMode === 'treble' ? 'active' : ''}" data-hand="treble" title="Full Right Hand Treble Keyboard">
              🎹 Treble
            </button>
            <button class="hand-tab ${this.handMode === 'bass' ? 'active' : ''}" data-hand="bass" title="Full Left Hand Stradella Bass Matrix">
              🔘 Bass
            </button>
            <button class="hand-tab ${this.handMode === 'both' ? 'active' : ''}" data-hand="both" title="Dual Hands Split View">
              👐 Both
            </button>
          </div>

          <!-- Bellows Direction & Pressure -->
          <div class="bellows-section">
            <button class="bellows-toggle-btn ${this.bellowsDirection}" id="bellows-toggle-btn" title="Toggle Push / Pull Bellows Direction">
              <span class="bellows-direction-badge ${this.bellowsDirection}">
                ${this.bellowsDirection === 'push' ? '⬅️ PUSH' : '➡️ PULL'}
              </span>
            </button>
            <div class="bellows-pressure-wrap">
              <span class="pressure-label">🫁</span>
              <input type="range" class="pressure-slider" id="pressure-slider" min="0.3" max="1.6" step="0.05" value="1.0" title="Bellows Air Pressure Dynamics" />
            </div>
          </div>

          <div class="accordion-badges">
            <span class="accordion-badge model-badge">${this.accordionModel?.icon || '🪗'} ${this.accordionModel?.name?.split('(')[0]?.trim() || 'Piano Accordion'}</span>
          </div>
        </div>

        <!-- Accordion Split Playboard -->
        <div class="accordion-playboard mode-${this.handMode}">
          <!-- Left Hand: Stradella Bass Board -->
          <div class="bass-board-container" id="bass-board-container">
            <div class="section-title">
              <div class="title-left">
                <span>Left Hand • Stradella Bass</span>
                <span class="sub-title">Circle of 5ths Matrix</span>
              </div>
              <!-- Circle of 5ths Quick Navigation Jump Chips -->
              <div class="circle-quick-jumps" id="circle-quick-jumps"></div>
            </div>
            <div class="bass-scroll-view" id="bass-scroll-view">
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
              <div class="title-left">
                <span>Right Hand • Treble Melody</span>
                <span class="sub-title">${this.accordionModel?.trebleType === 'PIANO' ? 'Piano Keyboard' : 'Button Board'}</span>
              </div>
              <!-- Quick Octave Jump Chips -->
              <div class="octave-quick-jumps" id="octave-quick-jumps"></div>
            </div>
            <div class="treble-scroll-view" id="treble-scroll-view">
              <div class="treble-keyboard ${this.accordionModel?.trebleType?.toLowerCase() || 'piano'}" id="treble-keyboard"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderTrebleKeys();
    this.renderBassButtons();
    this.renderNavigationChips();
    this.attachEventListeners();

    // Initial centering
    setTimeout(() => {
      this.centerCurrentFocus();
    }, 150);
  }

  renderNavigationChips() {
    // 1. Circle of 5ths quick jump chips for Bass
    const circleJumpContainer = this.container.querySelector('#circle-quick-jumps');
    if (circleJumpContainer && this.bassGrid) {
      circleJumpContainer.innerHTML = '';
      const commonRoots = ['Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B'];
      commonRoots.forEach(root => {
        const btn = document.createElement('button');
        btn.className = `quick-root-chip ${root === 'C' ? 'is-c-root' : ''}`;
        btn.textContent = root;
        btn.title = `Jump to ${root} column in Circle of 5ths`;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetColBtn = this.container.querySelector(`.stradella-btn[data-bass-id^="${root}_"]`);
          if (targetColBtn) {
            targetColBtn.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
          }
        });
        circleJumpContainer.appendChild(btn);
      });
    }

    // 2. Octave quick jump chips for Treble
    const octaveJumpContainer = this.container.querySelector('#octave-quick-jumps');
    if (octaveJumpContainer && this.trebleKeys) {
      octaveJumpContainer.innerHTML = '';
      const octaves = [];
      this.trebleKeys.forEach(k => {
        const match = k.noteName.match(/^([A-G]#?)([0-9])$/);
        if (match && match[1] === 'C' && !octaves.includes(match[2])) {
          octaves.push(match[2]);
        }
      });

      octaves.forEach(oct => {
        const btn = document.createElement('button');
        btn.className = 'quick-octave-chip';
        btn.textContent = `C${oct}`;
        btn.title = `Jump to Octave ${oct}`;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetKey = this.container.querySelector(`[data-note="C${oct}"]`);
          if (targetKey) {
            targetKey.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
          }
        });
        octaveJumpContainer.appendChild(btn);
      });
    }
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
  }

  updateTargetHighlight() {
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

    // Highlight Bass
    if (this.targetKey.bassId) {
      const bassBtn = this.container.querySelector(`[data-bass-id*="${this.targetKey.bassId}"]`);
      if (bassBtn) bassBtn.classList.add('is-target-key');
    }
  }

  attachEventListeners() {
    // Hand Mode Switcher
    this.container.querySelectorAll('.hand-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const hand = tab.dataset.hand;
        this.setHandMode(hand);
      });
    });

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

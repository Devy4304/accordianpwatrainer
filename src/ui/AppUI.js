// Main Application Coordinator UI & View Switcher

import { ACCORDION_TYPES, generatePianoTrebleKeys, generateChromaticButtonKeys, generateDiatonicButtonKeys, generateStradellaBassGrid } from '../models/AccordionModels.js';
import { SONG_LIBRARY, getSongById } from '../models/SongLibrary.js';
import { PRACTICE_MODES } from '../practice/PracticeEngine.js';
import { WaterfallVisualizer } from './WaterfallVisualizer.js';
import { VirtualAccordionView } from './VirtualAccordionView.js';
import { ARKeyTracker } from '../vision/ARKeyTracker.js';
import { TunerFreePlayView } from './TunerFreePlayView.js';
import { BellowsLabView } from './BellowsLabView.js';

export class AppUI {
  constructor(appElement, audioEngine, pitchDetector, practiceEngine) {
    this.app = appElement;
    this.audioEngine = audioEngine;
    this.pitchDetector = pitchDetector;
    this.practiceEngine = practiceEngine;

    this.currentView = 'practice'; // 'practice', 'ar', 'accordion', 'tuner', 'bellows_lab'
    this.currentAccordion = ACCORDION_TYPES.PIANO_41_120;
    this.trebleKeys = [];
    this.bassGrid = null;

    // View Components
    this.waterfall = null;
    this.virtualAccordion = null;
    this.arTracker = null;
    this.tunerFreePlay = null;
    this.bellowsLab = null;

    this.pwaInstaller = null;
    this.isMicActive = false;
    this.isArActive = false;
    this.currentTheme = localStorage.getItem('accordion_trainer_theme') || 'dark';
  }

  init(pwaInstaller) {
    this.pwaInstaller = pwaInstaller;
    this.loadAccordionData(this.currentAccordion);
    this.renderBaseLayout();
    this.applyTheme(this.currentTheme);
    this.initComponents();
    this.setupPracticeSubscriptions();
    this.setupPitchSubscriptions();
    this.attachGlobalEvents();

    // Listen to system color scheme changes if set to auto/system
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
        if (this.currentTheme === 'system') {
          this.applyTheme('system');
        }
      });
    }
  }

  loadAccordionData(model) {
    this.currentAccordion = model;
    if (model.trebleType === 'PIANO') {
      const { keys } = generatePianoTrebleKeys(model.trebleStartMidi, model.trebleKeyCount);
      this.trebleKeys = keys;
    } else if (model.trebleType.startsWith('CBA')) {
      const sys = model.trebleType === 'CBA_B' ? 'B_SYSTEM' : 'C_SYSTEM';
      const { buttons } = generateChromaticButtonKeys(sys, model.rowsCount || 5);
      this.trebleKeys = buttons;
    } else if (model.trebleType === 'DIATONIC') {
      const { buttons } = generateDiatonicButtonKeys(model.diatonicModel);
      this.trebleKeys = buttons;
    }

    this.bassGrid = generateStradellaBassGrid(model.bassButtonCount);

    if (this.virtualAccordion) {
      this.virtualAccordion.setModelData(this.currentAccordion, this.trebleKeys, this.bassGrid);
    }
    if (this.arTracker) {
      this.arTracker.setAccordionModel(this.currentAccordion, this.trebleKeys);
    }
    if (this.waterfall) {
      this.waterfall.setKeys(this.trebleKeys);
    }
  }

  renderBaseLayout() {
    this.app.innerHTML = `
      <div class="app-root">
        <!-- Top App Navigation & Controls Header -->
        <header class="app-header">
          <div class="header-left">
            <div class="app-brand" title="Accordion AR Trainer PWA">
              <span class="brand-icon">🪗</span>
              <div class="brand-text">
                <span class="brand-title">Accordion AR</span>
                <span class="brand-sub">Trainer PWA</span>
              </div>
            </div>

            <div class="header-selectors">
              <button class="selector-btn" id="btn-select-song" title="Choose practice song">
                <span class="btn-icon">🎵</span>
                <div class="selector-info">
                  <span class="sel-label">Song</span>
                  <span class="sel-value" id="hdr-song-title">${this.practiceEngine.currentSong.title}</span>
                </div>
                <span class="chevron">▾</span>
              </button>

              <button class="selector-btn" id="btn-select-accordion" title="Choose accordion model">
                <span class="btn-icon">${this.currentAccordion.icon}</span>
                <div class="selector-info">
                  <span class="sel-label">Accordion</span>
                  <span class="sel-value" id="hdr-accordion-name">${this.currentAccordion.name}</span>
                </div>
                <span class="chevron">▾</span>
              </button>
            </div>
          </div>

          <!-- Practice Transport Controls -->
          <div class="header-center">
            <div class="transport-bar">
              <button class="transport-btn main-play-btn" id="btn-play-pause" title="Play / Pause Practice">
                ▶️ Play
              </button>
              <button class="transport-btn icon-only" id="btn-reset-practice" title="Restart Song">
                ⏮️
              </button>
              <button class="transport-btn" id="btn-mode-toggle" title="Switch Practice Mode">
                <span id="hdr-mode-icon">⏳</span> <span id="hdr-mode-name">Wait Mode</span>
              </button>
              <button class="transport-btn icon-only active" id="btn-guide-audio-toggle" title="Toggle Song Audio Guide (Melody & Bass Accompany)">
                <span id="hdr-guide-audio-icon">🔊</span>
              </button>
              <button class="transport-btn icon-only" id="btn-metronome-toggle" title="Toggle Metronome">
                ⏱️
              </button>
              <div class="speed-control-wrap" title="Practice Speed">
                <span class="speed-label" id="speed-display">1.0x</span>
                <input type="range" class="speed-slider" id="speed-slider" min="0.5" max="1.5" step="0.1" value="1.0" />
              </div>
            </div>
          </div>

          <div class="header-right">
            <!-- Dynamic Real-Time Next Note Preview Pill -->
            <button class="next-note-pill clickable-pill" id="next-note-pill" title="Click to hear and preview this accordion key!">
              <span class="pill-preview-icon">🔉</span>
              <span class="pill-label">Target:</span>
              <span class="pill-note" id="pill-note-name">--</span>
              <span class="pill-finger" id="pill-finger-badge">F--</span>
              <span class="pill-dir" id="pill-bellows-dir">PUSH</span>
            </button>

            <!-- Global Action Buttons -->
            <button class="action-btn icon-btn" id="btn-theme-toggle" title="Toggle Light / Dark Mode">
              <span id="hdr-theme-icon">☀️</span>
            </button>
            <button class="action-btn icon-btn" id="btn-toggle-mic" title="Toggle Microphone Pitch Detection">
              🎤 <span class="badge-dot" id="mic-status-dot"></span>
            </button>
            <button class="action-btn icon-btn" id="btn-open-settings" title="Settings & PWA Info">
              ⚙️
            </button>
            <button class="action-btn pwa-install-btn hidden" id="btn-pwa-install" title="Install App to Device">
              📲 Install App
            </button>
          </div>
        </header>

        <!-- Main Content Area -->
        <main class="app-main">
          <!-- View 1: Practice Waterfall & Score Timeline View -->
          <section class="app-view active" id="view-practice">
            <div class="practice-view-container">
              <!-- Live Score & Progress Stats Bar -->
              <div class="practice-stats-bar">
                <div class="stat-pill score-pill">
                  <span class="stat-label">Score</span>
                  <span class="stat-value" id="stat-score">0</span>
                </div>
                <div class="stat-pill accuracy-pill">
                  <span class="stat-label">Accuracy</span>
                  <span class="stat-value" id="stat-accuracy">100%</span>
                </div>
                <div class="stat-pill combo-pill">
                  <span class="stat-label">Streak</span>
                  <span class="stat-value" id="stat-combo">0 🔥</span>
                </div>
                <div class="stat-progress-wrap">
                  <div class="progress-bar-track">
                    <div class="progress-bar-fill" id="song-progress-fill" style="width: 0%;"></div>
                  </div>
                </div>
                <div class="feedback-badge" id="live-feedback-badge">Ready!</div>
              </div>

              <!-- Waterfall Canvas Container -->
              <div class="waterfall-container">
                <canvas class="waterfall-canvas" id="waterfall-canvas"></canvas>
              </div>

              <!-- Interactive Virtual Keyboard Strip under Waterfall -->
              <div class="practice-virtual-strip" id="practice-virtual-strip"></div>
            </div>
          </section>

          <!-- View 2: AR Vision Camera Overlay View -->
          <section class="app-view" id="view-ar">
            <div class="ar-view-container">
              <div class="ar-video-wrap">
                <video class="ar-video" id="ar-video" playsinline muted autoplay></video>
                <canvas class="ar-canvas" id="ar-canvas"></canvas>
              </div>

              <!-- AR Floating Floating Controls Panel -->
              <div class="ar-floating-panel">
                <div class="ar-controls-row">
                  <button class="action-btn" id="btn-toggle-ar-cam">📷 Start AR Camera</button>
                  <button class="action-btn" id="btn-switch-camera">🔄 Flip Cam</button>
                  <button class="action-btn" id="btn-toggle-mirror">🪞 Mirror</button>
                  <button class="action-btn" id="btn-toggle-calibration">📐 Calibrate Pins</button>
                  <div class="preset-selector">
                    <span class="preset-label">Alignment Preset:</span>
                    <button class="preset-btn" data-preset="vertical">Vertical</button>
                    <button class="preset-btn" data-preset="horizontal">Horizontal</button>
                    <button class="preset-btn" data-preset="slanted">Slanted</button>
                  </div>
                </div>
                <p class="ar-help-text">
                  ✨ <strong>AR Key Guide:</strong> Align the amber corner pins over your real accordion's keyboard. Glowing holographic badges indicate the exact key to play!
                </p>
              </div>
            </div>
          </section>

          <!-- View 3: Full Virtual Accordion View -->
          <section class="app-view" id="view-accordion">
            <div class="accordion-view-container" id="full-virtual-accordion-container"></div>
          </section>

          <!-- View 4: Tuner & Sound Registers View -->
          <section class="app-view" id="view-tuner">
            <div class="tuner-view-container" id="tuner-container"></div>
          </section>

          <!-- View 5: Bellows & Bass Lab View -->
          <section class="app-view" id="view-bellows_lab">
            <div class="bellows-lab-container" id="bellows-lab-container"></div>
          </section>
        </main>

        <!-- Bottom Navigation Tab Bar (Mobile First) -->
        <nav class="app-bottom-nav">
          <button class="nav-tab active" data-view="practice">
            <span class="nav-icon">🎯</span>
            <span class="nav-text">Practice</span>
          </button>
          <button class="nav-tab" data-view="ar">
            <span class="nav-icon">📷</span>
            <span class="nav-text">AR Camera</span>
          </button>
          <button class="nav-tab" data-view="accordion">
            <span class="nav-icon">🪗</span>
            <span class="nav-text">Playboard</span>
          </button>
          <button class="nav-tab" data-view="tuner">
            <span class="nav-icon">🎙️</span>
            <span class="nav-text">Tuner & Reeds</span>
          </button>
          <button class="nav-tab" data-view="bellows_lab">
            <span class="nav-icon">🔄</span>
            <span class="nav-text">Bellows Lab</span>
          </button>
        </nav>

        <!-- Modals Root -->
        <div class="modal-overlay hidden" id="modal-overlay">
          <!-- Modal: Song Selector -->
          <div class="modal-card hidden" id="modal-songs">
            <div class="modal-header">
              <h3>🎵 Select Practice Song</h3>
              <button class="modal-close-btn" id="modal-songs-close">✕</button>
            </div>
            <div class="modal-body songs-list-body" id="modal-songs-list"></div>
          </div>

          <!-- Modal: Accordion Selector -->
          <div class="modal-card hidden" id="modal-accordions">
            <div class="modal-header">
              <h3>🪗 Select Accordion Model</h3>
              <button class="modal-close-btn" id="modal-accordions-close">✕</button>
            </div>
            <div class="modal-body accordions-list-body" id="modal-accordions-list"></div>
          </div>

          <!-- Modal: Song Complete -->
          <div class="modal-card hidden" id="modal-complete">
            <div class="modal-header">
              <h3>🏆 Song Complete!</h3>
              <button class="modal-close-btn" id="modal-complete-close">✕</button>
            </div>
            <div class="modal-body complete-body" id="modal-complete-body"></div>
          </div>

          <!-- Modal: Settings -->
          <div class="modal-card hidden" id="modal-settings">
            <div class="modal-header">
              <h3>⚙️ Settings & PWA Options</h3>
              <button class="modal-close-btn" id="modal-settings-close">✕</button>
            </div>
            <div class="modal-body settings-body" id="modal-settings-body">
              <div class="settings-group">
                <h4>🎨 Visual Appearance</h4>
                <p>Select interface color theme:</p>
                <div class="theme-options-row">
                  <button class="action-btn theme-choice-btn" id="btn-theme-dark" data-theme-val="dark">🌙 Dark</button>
                  <button class="action-btn theme-choice-btn" id="btn-theme-light" data-theme-val="light">☀️ Light</button>
                  <button class="action-btn theme-choice-btn" id="btn-theme-auto" data-theme-val="system">💻 System</button>
                </div>
              </div>
              <div class="settings-group">
                <h4>🎛️ Audio Synthesizer Volume</h4>
                <input type="range" id="synth-volume" min="0" max="1" step="0.05" value="0.85" />
              </div>
              <div class="settings-group">
                <h4>🎙️ Note Pitch Detection Sensitivity</h4>
                <p>Adjust background noise rejection threshold:</p>
                <input type="range" id="mic-sensitivity" min="0.005" max="0.05" step="0.005" value="0.015" />
              </div>
              <div class="settings-group">
                <h4>📲 Progressive Web App (PWA)</h4>
                <p>This web app is installable on iPhone, iPad, Android, Mac, and Windows with 100% offline support.</p>
                <button class="action-btn primary" id="btn-modal-install-pwa">Install Accordion Trainer</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  initComponents() {
    // 1. Waterfall Visualizer
    const waterfallCanvas = this.app.querySelector('#waterfall-canvas');
    this.waterfall = new WaterfallVisualizer(waterfallCanvas);
    this.waterfall.setKeys(this.trebleKeys);
    this.waterfall.setSong(this.practiceEngine.currentSong);

    // 2. Virtual Accordion View
    const accordionContainer = this.app.querySelector('#full-virtual-accordion-container');
    this.virtualAccordion = new VirtualAccordionView(accordionContainer, this.audioEngine, {
      accordionModel: this.currentAccordion,
      trebleKeys: this.trebleKeys,
      bassGrid: this.bassGrid,
      onKeyPlay: (key) => {
        this.practiceEngine.handleNoteInput(key.midi, key.noteName, 'touch');
      },
      onKeyRelease: (keyId) => {},
      onBassPlay: (bass) => {},
      onBassRelease: (bassId) => {}
    });
    this.virtualAccordion.render();

    // Also mount mini virtual keyboard in practice view
    const miniStrip = this.app.querySelector('#practice-virtual-strip');
    if (miniStrip) {
      this.miniVirtual = new VirtualAccordionView(miniStrip, this.audioEngine, {
        accordionModel: this.currentAccordion,
        trebleKeys: this.trebleKeys,
        bassGrid: this.bassGrid,
        onKeyPlay: (key) => {
          this.practiceEngine.handleNoteInput(key.midi, key.noteName, 'touch');
        }
      });
      this.miniVirtual.render();
    }

    // 3. AR Key Tracker
    this.arTracker = new ARKeyTracker({
      onKeyDetected: (key) => {
        const midi = key.midi || key.pushMidi;
        this.practiceEngine.handleNoteInput(midi, key.noteName, 'ar');
      }
    });
    this.arTracker.setAccordionModel(this.currentAccordion, this.trebleKeys);

    // 4. Tuner & Free Play View
    const tunerContainer = this.app.querySelector('#tuner-container');
    this.tunerFreePlay = new TunerFreePlayView(tunerContainer, this.audioEngine, this.pitchDetector);
    this.tunerFreePlay.render();

    // 5. Bellows Lab View
    const bellowsContainer = this.app.querySelector('#bellows-lab-container');
    this.bellowsLab = new BellowsLabView(bellowsContainer, this.audioEngine);
    this.bellowsLab.render();

    // Render 60fps Waterfall Loop
    const renderLoop = () => {
      if (this.currentView === 'practice' && this.waterfall) {
        this.waterfall.render(this.practiceEngine.currentBeat);
      }
      requestAnimationFrame(renderLoop);
    };
    renderLoop();
  }

  setupPracticeSubscriptions() {
    this.practiceEngine.onNoteTargetChange = (targetNote, nextNote, meta) => {
      // Update Next Note Pill
      const pillNote = this.app.querySelector('#pill-note-name');
      const pillFinger = this.app.querySelector('#pill-finger-badge');
      const pillDir = this.app.querySelector('#pill-bellows-dir');

      if (targetNote) {
        if (pillNote) pillNote.textContent = targetNote.pitch;
        if (pillFinger) pillFinger.textContent = targetNote.finger ? `F${targetNote.finger}` : '--';
        if (pillDir) {
          pillDir.textContent = targetNote.direction === 'pull' ? 'PULL' : 'PUSH';
          pillDir.className = `pill-dir ${targetNote.direction}`;
        }
      } else {
        if (pillNote) pillNote.textContent = '--';
        if (pillFinger) pillFinger.textContent = '--';
      }

      // Update Waterfall & Accordion highlights
      if (this.waterfall) this.waterfall.setTargetNote(targetNote);
      if (this.virtualAccordion) this.virtualAccordion.setTargetKey(targetNote);
      if (this.miniVirtual) this.miniVirtual.setTargetKey(targetNote);
      if (this.arTracker) this.arTracker.setTargetKey(targetNote);
    };

    this.practiceEngine.onScoreUpdate = (stats) => {
      const scoreEl = this.app.querySelector('#stat-score');
      const accEl = this.app.querySelector('#stat-accuracy');
      const comboEl = this.app.querySelector('#stat-combo');
      const fillEl = this.app.querySelector('#song-progress-fill');

      if (scoreEl) scoreEl.textContent = stats.score;
      if (accEl) accEl.textContent = `${stats.accuracy}%`;
      if (comboEl) comboEl.textContent = `${stats.combo} 🔥`;
      if (fillEl) fillEl.style.width = `${stats.progressPercent}%`;
    };

    this.practiceEngine.onFeedback = (type, note) => {
      const badge = this.app.querySelector('#live-feedback-badge');
      if (badge) {
        badge.className = `feedback-badge ${type}`;
        if (type === 'perfect') badge.textContent = `⭐ PERFECT! (${note.pitch})`;
        else if (type === 'good') badge.textContent = `👍 GOOD! (${note.pitch})`;
        else if (type === 'miss') badge.textContent = `❌ MISS!`;

        clearTimeout(this.feedbackTimer);
        this.feedbackTimer = setTimeout(() => {
          badge.className = 'feedback-badge';
          badge.textContent = 'Keep playing...';
        }, 800);
      }
    };

    this.practiceEngine.onSongNotePlay = (note) => {
      // Visual indicator on virtual accordion keyboards when song plays notes
      if (this.miniVirtual && note.midi) {
        const miniKey = this.miniVirtual.container.querySelector(`[data-midi="${note.midi}"]`);
        if (miniKey) {
          miniKey.classList.add('is-song-active');
          setTimeout(() => miniKey.classList.remove('is-song-active'), 280);
        }
      }
      if (this.virtualAccordion && note.midi) {
        const fullKey = this.virtualAccordion.container.querySelector(`[data-midi="${note.midi}"]`);
        if (fullKey) {
          fullKey.classList.add('is-song-active');
          setTimeout(() => fullKey.classList.remove('is-song-active'), 280);
        }
      }
    };

    this.practiceEngine.onSongComplete = (stats) => {
      this.showCompleteModal(stats);
    };
  }

  setupPitchSubscriptions() {
    this.pitchDetector.onNoteDetected = (info) => {
      this.practiceEngine.handleNoteInput(info.midi, info.displayName, 'mic');
      // Visual feedback on virtual accordion
      if (this.virtualAccordion) {
        const keyEl = this.virtualAccordion.container.querySelector(`[data-midi="${info.midi}"]`);
        if (keyEl) {
          keyEl.classList.add('mic-detected');
          setTimeout(() => keyEl.classList.remove('mic-detected'), 250);
        }
      }
    };
  }

  attachGlobalEvents() {
    // Navigation Tabs
    this.app.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const viewId = tab.dataset.view;
        this.switchView(viewId);
      });
    });

    // Play/Pause button
    const playBtn = this.app.querySelector('#btn-play-pause');
    if (playBtn) {
      playBtn.addEventListener('click', async () => {
        await this.audioEngine.init();
        if (this.practiceEngine.isPlaying) {
          this.practiceEngine.pause();
          playBtn.innerHTML = '▶️ Play';
          playBtn.classList.remove('is-playing');
        } else {
          this.practiceEngine.start();
          playBtn.innerHTML = '⏸️ Pause';
          playBtn.classList.add('is-playing');
        }
      });
    }

    // Reset button
    const resetBtn = this.app.querySelector('#btn-reset-practice');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.practiceEngine.reset();
        if (playBtn) {
          playBtn.innerHTML = '▶️ Play';
          playBtn.classList.remove('is-playing');
        }
      });
    }

    // Guide Audio (Melody & Bass) Toggle
    const guideAudioBtn = this.app.querySelector('#btn-guide-audio-toggle');
    const guideAudioIcon = this.app.querySelector('#hdr-guide-audio-icon');
    if (guideAudioBtn) {
      guideAudioBtn.addEventListener('click', async () => {
        await this.audioEngine.init();
        const active = this.practiceEngine.toggleGuideAudio();
        guideAudioBtn.classList.toggle('active', active);
        if (guideAudioIcon) guideAudioIcon.textContent = active ? '🔊' : '🔈';
      });
    }

    // Target Note Preview Pill Click
    const nextPill = this.app.querySelector('#next-note-pill');
    if (nextPill) {
      nextPill.addEventListener('click', async () => {
        await this.audioEngine.init();
        this.practiceEngine.previewTargetNote();
        nextPill.classList.add('pill-pulse');
        setTimeout(() => nextPill.classList.remove('pill-pulse'), 350);
      });
    }

    // Mode Toggle (Wait Mode vs Flow Mode)
    const modeBtn = this.app.querySelector('#btn-mode-toggle');
    if (modeBtn) {
      modeBtn.addEventListener('click', () => {
        const nextMode = this.practiceEngine.currentMode === PRACTICE_MODES.WAIT.id ? PRACTICE_MODES.FLOW.id : PRACTICE_MODES.WAIT.id;
        this.practiceEngine.setMode(nextMode);
        const icon = nextMode === PRACTICE_MODES.WAIT.id ? '⏳' : '🌊';
        const name = nextMode === PRACTICE_MODES.WAIT.id ? 'Wait Mode' : 'Flow Mode';
        this.app.querySelector('#hdr-mode-icon').textContent = icon;
        this.app.querySelector('#hdr-mode-name').textContent = name;
      });
    }

    // Metronome Toggle
    const metBtn = this.app.querySelector('#btn-metronome-toggle');
    if (metBtn) {
      metBtn.addEventListener('click', () => {
        const active = this.practiceEngine.toggleMetronome();
        metBtn.classList.toggle('active', active);
      });
    }

    // Theme Toggle Header Button
    const themeBtn = this.app.querySelector('#btn-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // Theme Choice Buttons (in Settings modal)
    this.app.querySelectorAll('.theme-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const themeVal = btn.dataset.themeVal;
        this.applyTheme(themeVal);
      });
    });

    // Speed Slider
    const speedSlider = this.app.querySelector('#speed-slider');
    const speedDisplay = this.app.querySelector('#speed-display');
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.practiceEngine.setSpeed(val);
        if (speedDisplay) speedDisplay.textContent = `${val.toFixed(1)}x`;
      });
    }

    // Mic Toggle Header Button
    const micBtn = this.app.querySelector('#btn-toggle-mic');
    if (micBtn) {
      micBtn.addEventListener('click', async () => {
        if (!this.isMicActive) {
          try {
            await this.pitchDetector.start();
            this.isMicActive = true;
            micBtn.classList.add('active-mic');
            this.app.querySelector('#mic-status-dot').classList.add('online');
          } catch (e) {
            alert('Could not enable microphone: ' + e.message);
          }
        } else {
          this.pitchDetector.stop();
          this.isMicActive = false;
          micBtn.classList.remove('active-mic');
          this.app.querySelector('#mic-status-dot').classList.remove('online');
        }
      });
    }

    // Modals Triggers
    const songBtn = this.app.querySelector('#btn-select-song');
    if (songBtn) songBtn.addEventListener('click', () => this.showSongModal());

    const accBtn = this.app.querySelector('#btn-select-accordion');
    if (accBtn) accBtn.addEventListener('click', () => this.showAccordionModal());

    const settingsBtn = this.app.querySelector('#btn-open-settings');
    if (settingsBtn) settingsBtn.addEventListener('click', () => this.showSettingsModal());

    // AR Video & Calibration Controls
    const startArBtn = this.app.querySelector('#btn-toggle-ar-cam');
    if (startArBtn) {
      startArBtn.addEventListener('click', async () => {
        const video = this.app.querySelector('#ar-video');
        const canvas = this.app.querySelector('#ar-canvas');
        if (!this.isArActive) {
          try {
            await this.arTracker.start(video, canvas);
            this.isArActive = true;
            startArBtn.textContent = '⏹️ Stop AR Camera';
            startArBtn.classList.add('danger');
          } catch (e) {
            alert('Camera access failed: ' + e.message);
          }
        } else {
          this.arTracker.stop();
          this.isArActive = false;
          startArBtn.textContent = '📷 Start AR Camera';
          startArBtn.classList.remove('danger');
        }
      });
    }

    const switchCamBtn = this.app.querySelector('#btn-switch-camera');
    if (switchCamBtn) {
      switchCamBtn.addEventListener('click', () => this.arTracker.toggleCamera());
    }

    const mirrorCamBtn = this.app.querySelector('#btn-toggle-mirror');
    if (mirrorCamBtn) {
      mirrorCamBtn.addEventListener('click', () => this.arTracker.toggleMirror());
    }

    const calibBtn = this.app.querySelector('#btn-toggle-calibration');
    if (calibBtn) {
      calibBtn.addEventListener('click', () => {
        this.arTracker.showCalibration = !this.arTracker.showCalibration;
        calibBtn.classList.toggle('active', this.arTracker.showCalibration);
      });
    }

    this.app.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        this.arTracker.resetCalibrationPreset(preset);
      });
    });

    // Modal Close buttons
    this.app.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => this.closeModals());
    });
  }

  switchView(viewId) {
    this.currentView = viewId;
    this.app.querySelectorAll('.nav-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.view === viewId);
    });
    this.app.querySelectorAll('.app-view').forEach(v => {
      v.classList.toggle('active', v.id === `view-${viewId}`);
    });
  }

  showSongModal() {
    const overlay = this.app.querySelector('#modal-overlay');
    const modal = this.app.querySelector('#modal-songs');
    const list = this.app.querySelector('#modal-songs-list');

    overlay.classList.remove('hidden');
    modal.classList.remove('hidden');

    list.innerHTML = '';
    SONG_LIBRARY.forEach(song => {
      const isSelected = song.id === this.practiceEngine.currentSong.id;
      const card = document.createElement('div');
      card.className = `song-card ${isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="song-card-header">
          <div class="song-card-title">${song.title}</div>
          <span class="difficulty-badge diff-${song.difficultyScore}">${song.difficulty}</span>
        </div>
        <div class="song-card-subtitle">${song.subtitle} • ${song.category}</div>
        <div class="song-card-meta">
          <span>⏱️ ${song.bpm} BPM</span>
          <span>🎼 ${song.timeSignature} (${song.keySignature})</span>
          <span>🎹 ${song.notes.length} notes</span>
        </div>
        <p class="song-card-desc">${song.description}</p>
      `;
      card.addEventListener('click', () => {
        this.practiceEngine.setSong(song);
        if (this.waterfall) this.waterfall.setSong(song);
        this.app.querySelector('#hdr-song-title').textContent = song.title;
        this.closeModals();
      });
      list.appendChild(card);
    });
  }

  showAccordionModal() {
    const overlay = this.app.querySelector('#modal-overlay');
    const modal = this.app.querySelector('#modal-accordions');
    const list = this.app.querySelector('#modal-accordions-list');

    overlay.classList.remove('hidden');
    modal.classList.remove('hidden');

    list.innerHTML = '';
    Object.values(ACCORDION_TYPES).forEach(acc => {
      const isSelected = acc.id === this.currentAccordion.id;
      const card = document.createElement('div');
      card.className = `accordion-select-card ${isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="acc-card-icon">${acc.icon}</div>
        <div class="acc-card-details">
          <div class="acc-card-title">${acc.name}</div>
          <div class="acc-card-cat">${acc.category}</div>
          <div class="acc-card-desc">${acc.description}</div>
        </div>
      `;
      card.addEventListener('click', () => {
        this.loadAccordionData(acc);
        this.app.querySelector('#hdr-accordion-name').textContent = acc.name;
        this.closeModals();
      });
      list.appendChild(card);
    });
  }

  showCompleteModal(stats) {
    const overlay = this.app.querySelector('#modal-overlay');
    const modal = this.app.querySelector('#modal-complete');
    const body = this.app.querySelector('#modal-complete-body');

    overlay.classList.remove('hidden');
    modal.classList.remove('hidden');

    const grade = stats.accuracy >= 95 ? 'A+' : (stats.accuracy >= 85 ? 'A' : (stats.accuracy >= 70 ? 'B' : 'C'));

    body.innerHTML = `
      <div class="complete-stats-grid">
        <div class="grade-banner">
          <span class="grade-label">Performance Grade</span>
          <span class="grade-letter">${grade}</span>
        </div>
        <div class="stats-summary-row">
          <div class="summary-item">
            <span class="summary-val">${stats.score}</span>
            <span class="summary-lbl">Final Score</span>
          </div>
          <div class="summary-item">
            <span class="summary-val">${stats.accuracy}%</span>
            <span class="summary-lbl">Accuracy</span>
          </div>
          <div class="summary-item">
            <span class="summary-val">${stats.maxCombo} 🔥</span>
            <span class="summary-lbl">Max Streak</span>
          </div>
          <div class="summary-item">
            <span class="summary-val">${stats.durationSeconds}s</span>
            <span class="summary-lbl">Time Played</span>
          </div>
        </div>
        <div class="complete-actions">
          <button class="action-btn primary" id="btn-replay-song">🔄 Play Again</button>
          <button class="action-btn" id="btn-next-song">🎵 Choose Another Song</button>
        </div>
      </div>
    `;

    body.querySelector('#btn-replay-song').addEventListener('click', () => {
      this.closeModals();
      this.practiceEngine.reset();
      this.practiceEngine.start();
    });

    body.querySelector('#btn-next-song').addEventListener('click', () => {
      this.closeModals();
      this.showSongModal();
    });
  }

  showSettingsModal() {
    const overlay = this.app.querySelector('#modal-overlay');
    const modal = this.app.querySelector('#modal-settings');
    overlay.classList.remove('hidden');
    modal.classList.remove('hidden');

    const pwaBtn = modal.querySelector('#btn-modal-install-pwa');
    if (pwaBtn && this.pwaInstaller) {
      pwaBtn.addEventListener('click', async () => {
        await this.pwaInstaller.promptInstall();
      });
    }

    const volSlider = modal.querySelector('#synth-volume');
    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        this.audioEngine.setVolume(parseFloat(e.target.value));
      });
    }
  }

  applyTheme(themeName) {
    this.currentTheme = themeName;
    try {
      localStorage.setItem('accordion_trainer_theme', themeName);
    } catch (e) {
      // ignore in private browsing/storage disabled
    }

    let effective = themeName;
    if (themeName === 'system') {
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      effective = prefersLight ? 'light' : 'dark';
    }

    document.documentElement.setAttribute('data-theme', effective);
    document.documentElement.classList.toggle('theme-light', effective === 'light');

    const themeIcon = this.app.querySelector('#hdr-theme-icon');
    const themeBtn = this.app.querySelector('#btn-theme-toggle');
    if (themeIcon) {
      themeIcon.textContent = effective === 'light' ? '🌙' : '☀️';
    }
    if (themeBtn) {
      themeBtn.title = effective === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
    }

    this.app.querySelectorAll('.theme-choice-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.themeVal === themeName);
    });
  }

  toggleTheme() {
    let effective = this.currentTheme;
    if (this.currentTheme === 'system') {
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      effective = prefersLight ? 'light' : 'dark';
    }
    const next = effective === 'light' ? 'dark' : 'light';
    this.applyTheme(next);
  }

  closeModals() {
    const overlay = this.app.querySelector('#modal-overlay');
    overlay.classList.add('hidden');
    this.app.querySelectorAll('.modal-card').forEach(m => m.classList.add('hidden'));
  }
}

// Interactive Stradella Circle-of-Fifths & Bellows Mechanics Lab

import { STRADELLA_CIRCLE_OF_FIFTHS } from '../models/AccordionModels.js';

export class BellowsLabView {
  constructor(containerElement, audioEngine) {
    this.container = containerElement;
    this.audioEngine = audioEngine;
    this.selectedKey = 'C';
    this.currentPattern = 'waltz'; // 'waltz' (3/4) or 'polka' (2/4 / 4/4) or 'tarantella' (6/8)
    this.isPlayingPattern = false;
    this.patternInterval = null;
    this.patternStep = 0;
  }

  render() {
    this.container.innerHTML = `
      <div class="bellows-lab-wrapper">
        <div class="lab-header">
          <div class="lab-title">
            <span class="lab-icon">🔄</span>
            <h3>Bellows & Stradella Bass Laboratory</h3>
          </div>
          <p class="lab-desc">
            Master the left hand of the accordion! Learn the famous Circle of Fifths layout, alternating bass-chord patterns, and bellows dynamics.
          </p>
        </div>

        <!-- Stradella Circle of Fifths Wheel -->
        <div class="lab-section circle-section">
          <div class="section-badge">1. Circle of Fifths (Stradella Left-Hand Layout)</div>
          <div class="circle-controls">
            <span class="info-text">Select a Root Key to see adjacent 4th (subdominant) and 5th (dominant) columns:</span>
            <div class="circle-nav-wrapper">
              <button class="circle-arrow-btn" id="circle-prev-btn" title="Previous Key in Circle of 5ths">‹</button>
              <div class="circle-chips-scroll" id="circle-chips-scroll">
                <div class="circle-chips" id="circle-chips"></div>
              </div>
              <button class="circle-arrow-btn" id="circle-next-btn" title="Next Key in Circle of 5ths">›</button>
            </div>
          </div>

          <div class="selected-key-card" id="selected-key-card">
            <!-- Dynamically populated -->
          </div>
        </div>

        <!-- Alternating Bass Pattern Generator -->
        <div class="lab-section pattern-section">
          <div class="section-badge">2. Left-Hand Rhythmic Accompaniment Trainer</div>
          <div class="pattern-toolbar">
            <div class="pattern-selector">
              <button class="pattern-btn active" data-pattern="waltz">3/4 Waltz (Oom-Pah-Pah)</button>
              <button class="pattern-btn" data-pattern="polka">2/4 Polka / Fox (Oom-Pah)</button>
              <button class="pattern-btn" data-pattern="tarantella">6/8 Tarantella Jump</button>
            </div>
            <button class="action-btn primary play-pattern-btn" id="play-pattern-btn">
              ▶️ Play Accompaniment Loop
            </button>
          </div>

          <div class="pattern-timeline" id="pattern-timeline">
            <!-- Dynamically populated beats -->
          </div>
        </div>

        <!-- Diatonic Bisonoric Push/Pull Explainer -->
        <div class="lab-section diatonic-section">
          <div class="section-badge">3. Bellows Direction & Bisonoric Reeds</div>
          <div class="diatonic-explainer-grid">
            <div class="explainer-card push-card">
              <div class="card-icon">⬅️</div>
              <h4>PUSH (Compressing Bellows)</h4>
              <p>Air pushes inward through the push reed bank. On diatonic accordions, this typically sounds the tonic / home chord (e.g. C Major: C, E, G).</p>
            </div>
            <div class="explainer-card pull-card">
              <div class="card-icon">➡️</div>
              <h4>PULL (Expanding Bellows)</h4>
              <p>Air pulls outward through the pull reed bank. On diatonic accordions, this sounds complementary scale notes and the dominant chord (e.g. G / Dm).</p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderCircleChips();
    this.updateKeyCard();
    this.updatePatternTimeline();
    this.attachEventListeners();
  }

  renderCircleChips() {
    const chipsContainer = this.container.querySelector('#circle-chips');
    if (!chipsContainer) return;

    chipsContainer.innerHTML = '';
    STRADELLA_CIRCLE_OF_FIFTHS.forEach((col, idx) => {
      const chip = document.createElement('button');
      chip.className = `circle-chip ${col.name === this.selectedKey ? 'active' : ''} ${col.isMarked ? 'is-marked' : ''}`;
      chip.textContent = col.name;
      chip.title = `Root ${col.name} (MIDI ${col.rootMidi})`;
      chip.dataset.index = idx;
      chip.addEventListener('click', () => {
        this.selectKey(col.name);
      });
      chipsContainer.appendChild(chip);
    });

    // Auto scroll active chip to center
    this.centerActiveChip();
  }

  selectKey(keyName) {
    this.selectedKey = keyName;
    this.container.querySelectorAll('.circle-chip').forEach(c => {
      c.classList.toggle('active', c.textContent === keyName);
    });
    this.updateKeyCard();
    this.updatePatternTimeline();
    this.centerActiveChip();
  }

  centerActiveChip() {
    setTimeout(() => {
      const activeChip = this.container.querySelector('.circle-chip.active');
      if (activeChip) {
        activeChip.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      }
    }, 50);
  }

  updateKeyCard() {
    const card = this.container.querySelector('#selected-key-card');
    if (!card) return;

    const colIdx = STRADELLA_CIRCLE_OF_FIFTHS.findIndex(c => c.name === this.selectedKey);
    const curr = STRADELLA_CIRCLE_OF_FIFTHS[colIdx] || STRADELLA_CIRCLE_OF_FIFTHS[9];
    const prev = STRADELLA_CIRCLE_OF_FIFTHS[Math.max(0, colIdx - 1)]; // 4th / Subdominant
    const next = STRADELLA_CIRCLE_OF_FIFTHS[Math.min(STRADELLA_CIRCLE_OF_FIFTHS.length - 1, colIdx + 1)]; // 5th / Dominant

    card.innerHTML = `
      <div class="key-card-grid">
        <div class="column-card subdominant">
          <span class="role-tag">Subdominant (4th)</span>
          <div class="col-name">${prev.name}</div>
          <div class="buttons-stack">
            <button class="lab-sample-btn" data-type="counter" data-root="${prev.rootMidi}">Counter: ${prev.name} 3rd</button>
            <button class="lab-sample-btn primary" data-type="fundamental" data-root="${prev.rootMidi}">Bass: ${prev.name}</button>
            <button class="lab-sample-btn" data-type="major" data-root="${prev.rootMidi}">${prev.name} Maj Chord</button>
            <button class="lab-sample-btn" data-type="minor" data-root="${prev.rootMidi}">${prev.name} Min Chord</button>
            <button class="lab-sample-btn" data-type="seventh" data-root="${prev.rootMidi}">${prev.name} 7th Chord</button>
          </div>
        </div>

        <div class="column-card tonic active-tonic">
          <span class="role-tag tonic-tag">⭐ TONIC (Home Key)</span>
          <div class="col-name">${curr.name}</div>
          <div class="buttons-stack">
            <button class="lab-sample-btn" data-type="counter" data-root="${curr.rootMidi}">Counter (3rd)</button>
            <button class="lab-sample-btn primary pulse-btn" data-type="fundamental" data-root="${curr.rootMidi}">Fundamental Bass: ${curr.name}</button>
            <button class="lab-sample-btn" data-type="major" data-root="${curr.rootMidi}">${curr.name} Maj Chord</button>
            <button class="lab-sample-btn" data-type="minor" data-root="${curr.rootMidi}">${curr.name} Min Chord</button>
            <button class="lab-sample-btn" data-type="seventh" data-root="${curr.rootMidi}">${curr.name} 7th Chord</button>
          </div>
        </div>

        <div class="column-card dominant">
          <span class="role-tag">Dominant (5th / Alternating)</span>
          <div class="col-name">${next.name}</div>
          <div class="buttons-stack">
            <button class="lab-sample-btn" data-type="counter" data-root="${next.rootMidi}">Counter: ${next.name} 3rd</button>
            <button class="lab-sample-btn primary" data-type="fundamental" data-root="${next.rootMidi}">Bass: ${next.name}</button>
            <button class="lab-sample-btn" data-type="major" data-root="${next.rootMidi}">${next.name} Maj Chord</button>
            <button class="lab-sample-btn" data-type="minor" data-root="${next.rootMidi}">${next.name} Min Chord</button>
            <button class="lab-sample-btn" data-type="seventh" data-root="${next.rootMidi}">${next.name} 7th Chord</button>
          </div>
        </div>
      </div>
    `;

    // Attach sample audio plays
    card.querySelectorAll('.lab-sample-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const rootMidi = parseInt(btn.dataset.root, 10);
        const type = btn.dataset.type;
        let notes = [];
        if (type === 'counter') notes = [rootMidi + 4, rootMidi + 16];
        else if (type === 'fundamental') notes = [rootMidi, rootMidi + 12];
        else if (type === 'major') notes = [rootMidi + 12, rootMidi + 16, rootMidi + 19];
        else if (type === 'minor') notes = [rootMidi + 12, rootMidi + 15, rootMidi + 19];
        else if (type === 'seventh') notes = [rootMidi + 12, rootMidi + 16, rootMidi + 22];

        this.audioEngine.playBass('sample', notes, 0.9);
        setTimeout(() => this.audioEngine.stopBass('sample'), 400);
      });
    });
  }

  updatePatternTimeline() {
    const timeline = this.container.querySelector('#pattern-timeline');
    if (!timeline) return;

    const colIdx = STRADELLA_CIRCLE_OF_FIFTHS.findIndex(c => c.name === this.selectedKey);
    const curr = STRADELLA_CIRCLE_OF_FIFTHS[colIdx] || STRADELLA_CIRCLE_OF_FIFTHS[9];
    const next = STRADELLA_CIRCLE_OF_FIFTHS[Math.min(STRADELLA_CIRCLE_OF_FIFTHS.length - 1, colIdx + 1)];

    let beats = [];
    if (this.currentPattern === 'waltz') {
      beats = [
        { label: `Root Bass [${curr.name}]`, type: 'fundamental', root: curr.rootMidi, sub: 'Beat 1 (OOM)' },
        { label: `Chord [${curr.name}M]`, type: 'major', root: curr.rootMidi, sub: 'Beat 2 (PAH)' },
        { label: `Chord [${curr.name}M]`, type: 'major', root: curr.rootMidi, sub: 'Beat 3 (PAH)' },
        { label: `Alt 5th Bass [${next.name}]`, type: 'fundamental', root: next.rootMidi, sub: 'Beat 1 (OOM)' },
        { label: `Chord [${curr.name}M]`, type: 'major', root: curr.rootMidi, sub: 'Beat 2 (PAH)' },
        { label: `Chord [${curr.name}M]`, type: 'major', root: curr.rootMidi, sub: 'Beat 3 (PAH)' }
      ];
    } else if (this.currentPattern === 'polka') {
      beats = [
        { label: `Root Bass [${curr.name}]`, type: 'fundamental', root: curr.rootMidi, sub: 'Beat 1 (BOOM)' },
        { label: `Chord [${curr.name}M]`, type: 'major', root: curr.rootMidi, sub: 'Beat & (CHICK)' },
        { label: `Alt 5th Bass [${next.name}]`, type: 'fundamental', root: next.rootMidi, sub: 'Beat 2 (BOOM)' },
        { label: `Chord [${curr.name}M]`, type: 'major', root: curr.rootMidi, sub: 'Beat & (CHICK)' }
      ];
    } else if (this.currentPattern === 'tarantella') {
      beats = [
        { label: `Root [${curr.name}]`, type: 'fundamental', root: curr.rootMidi, sub: '1' },
        { label: `Chord`, type: 'minor', root: curr.rootMidi, sub: '2' },
        { label: `Chord`, type: 'minor', root: curr.rootMidi, sub: '3' },
        { label: `Counter 3rd`, type: 'counter', root: curr.rootMidi, sub: '4' },
        { label: `Chord`, type: 'minor', root: curr.rootMidi, sub: '5' },
        { label: `Chord`, type: 'minor', root: curr.rootMidi, sub: '6' }
      ];
    }

    timeline.innerHTML = `
      <div class="beats-row">
        ${beats.map((b, i) => `
          <div class="beat-card beat-${i}" id="beat-card-${i}">
            <span class="beat-badge">${b.sub}</span>
            <div class="beat-name">${b.label}</div>
          </div>
        `).join('')}
      </div>
    `;

    this.currentBeatsData = beats;
  }

  attachEventListeners() {
    // Circle of 5ths arrow buttons
    const prevBtn = this.container.querySelector('#circle-prev-btn');
    const nextBtn = this.container.querySelector('#circle-next-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const colIdx = STRADELLA_CIRCLE_OF_FIFTHS.findIndex(c => c.name === this.selectedKey);
        const newIdx = Math.max(0, colIdx - 1);
        this.selectKey(STRADELLA_CIRCLE_OF_FIFTHS[newIdx].name);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const colIdx = STRADELLA_CIRCLE_OF_FIFTHS.findIndex(c => c.name === this.selectedKey);
        const newIdx = Math.min(STRADELLA_CIRCLE_OF_FIFTHS.length - 1, colIdx + 1);
        this.selectKey(STRADELLA_CIRCLE_OF_FIFTHS[newIdx].name);
      });
    }

    // Pattern selection buttons
    this.container.querySelectorAll('.pattern-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.pattern-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentPattern = btn.dataset.pattern;
        this.stopPattern();
        this.updatePatternTimeline();
      });
    });

    // Play loop
    const playBtn = this.container.querySelector('#play-pattern-btn');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (this.isPlayingPattern) {
          this.stopPattern();
        } else {
          this.startPattern();
        }
      });
    }
  }

  startPattern() {
    this.isPlayingPattern = true;
    this.patternStep = 0;
    const playBtn = this.container.querySelector('#play-pattern-btn');
    if (playBtn) {
      playBtn.innerHTML = '⏹️ Stop Loop';
      playBtn.classList.add('danger');
    }

    const intervalMs = this.currentPattern === 'polka' ? 320 : (this.currentPattern === 'tarantella' ? 220 : 420);

    const stepTick = () => {
      if (!this.isPlayingPattern) return;
      const beats = this.currentBeatsData;
      if (!beats || beats.length === 0) return;

      const idx = this.patternStep % beats.length;
      const b = beats[idx];

      // Highlight UI beat
      this.container.querySelectorAll('.beat-card').forEach(c => c.classList.remove('active-beat'));
      const activeCard = this.container.querySelector(`#beat-card-${idx}`);
      if (activeCard) activeCard.classList.add('active-beat');

      // Play sound
      const rootMidi = b.root;
      let notes = [];
      if (b.type === 'counter') notes = [rootMidi + 4, rootMidi + 16];
      else if (b.type === 'fundamental') notes = [rootMidi, rootMidi + 12];
      else if (b.type === 'major') notes = [rootMidi + 12, rootMidi + 16, rootMidi + 19];
      else if (b.type === 'minor') notes = [rootMidi + 12, rootMidi + 15, rootMidi + 19];

      this.audioEngine.playBass('pattern_loop', notes, 0.85);
      setTimeout(() => this.audioEngine.stopBass('pattern_loop'), intervalMs * 0.75);

      this.patternStep++;
    };

    stepTick();
    this.patternInterval = setInterval(stepTick, intervalMs);
  }

  stopPattern() {
    this.isPlayingPattern = false;
    if (this.patternInterval) {
      clearInterval(this.patternInterval);
      this.patternInterval = null;
    }
    const playBtn = this.container.querySelector('#play-pattern-btn');
    if (playBtn) {
      playBtn.innerHTML = '▶️ Play Accompaniment Loop';
      playBtn.classList.remove('danger');
    }
    this.container.querySelectorAll('.beat-card').forEach(c => c.classList.remove('active-beat'));
  }
}

// Real-time Accordion Tuner, Pitch Gauge & Free Play Audio Spectrum

import { ACCORDION_REGISTERS } from '../audio/AudioEngine.js';

export class TunerFreePlayView {
  constructor(containerElement, audioEngine, pitchDetector) {
    this.container = containerElement;
    this.audioEngine = audioEngine;
    this.pitchDetector = pitchDetector;
    this.isMicActive = false;
    this.animationFrameId = null;
    this.frequencyBuffer = new Uint8Array(64);
  }

  render() {
    this.container.innerHTML = `
      <div class="tuner-view-wrapper">
        <div class="tuner-grid">
          <!-- Left: Pitch Gauge & Tuner -->
          <div class="tuner-card main-tuner-card">
            <div class="tuner-top-bar">
              <span class="card-badge">🎙️ Acoustic Pitch Detector & Tuner</span>
              <button class="action-btn mic-toggle-btn" id="tuner-mic-btn">
                <span class="mic-icon">🎤</span> <span class="mic-status-text">Enable Mic Tuner</span>
              </button>
            </div>

            <!-- Pitch Readout Display -->
            <div class="pitch-display" id="pitch-display">
              <div class="pitch-note-badge" id="pitch-note-badge">--</div>
              <div class="pitch-sub-info">
                <span class="pitch-freq" id="pitch-freq">-- Hz</span>
                <span class="pitch-target-freq" id="pitch-target-freq">Target: -- Hz</span>
              </div>
            </div>

            <!-- Cents Needle Gauge -->
            <div class="cents-gauge-wrap">
              <div class="cents-scale">
                <span>-50♭</span>
                <span>-25</span>
                <span class="center-zero">0 (In Tune)</span>
                <span>+25</span>
                <span>+50♯</span>
              </div>
              <div class="cents-track">
                <div class="cents-zone-good"></div>
                <div class="cents-needle" id="cents-needle" style="left: 50%;"></div>
              </div>
              <div class="cents-value-badge" id="cents-value-badge">0 cents</div>
            </div>

            <!-- Live Audio Frequency Spectrum Canvas -->
            <div class="spectrum-wrap">
              <canvas class="spectrum-canvas" id="spectrum-canvas"></canvas>
            </div>
          </div>

          <!-- Right: Register / Timbre Selector & Settings -->
          <div class="tuner-card registers-card">
            <span class="card-badge">🎛️ Accordion Reed Registers</span>
            <p class="section-desc">Change the mechanical reed stops of your accordion synthesizer:</p>
            <div class="registers-list" id="registers-list"></div>
          </div>
        </div>
      </div>
    `;

    this.renderRegisters();
    this.attachEventListeners();
    this.startSpectrumLoop();
  }

  renderRegisters() {
    const list = this.container.querySelector('#registers-list');
    if (!list) return;

    list.innerHTML = '';
    Object.values(ACCORDION_REGISTERS).forEach(reg => {
      const isCurrent = this.audioEngine.currentRegister.id === reg.id;
      const item = document.createElement('div');
      item.className = `register-item ${isCurrent ? 'active' : ''}`;
      item.innerHTML = `
        <div class="reg-icon-box">${reg.symbol}</div>
        <div class="reg-details">
          <div class="reg-name">${reg.name}</div>
          <div class="reg-desc">${reg.description}</div>
        </div>
      `;
      item.addEventListener('click', () => {
        this.audioEngine.setRegister(reg.id);
        this.container.querySelectorAll('.register-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
      list.appendChild(item);
    });
  }

  attachEventListeners() {
    const micBtn = this.container.querySelector('#tuner-mic-btn');
    if (micBtn) {
      micBtn.addEventListener('click', async () => {
        if (!this.isMicActive) {
          try {
            await this.pitchDetector.start();
            this.isMicActive = true;
            micBtn.classList.add('active-recording');
            micBtn.querySelector('.mic-status-text').textContent = 'Mic Active (Listening...)';
          } catch (e) {
            alert('Could not access microphone: ' + e.message);
          }
        } else {
          this.pitchDetector.stop();
          this.isMicActive = false;
          micBtn.classList.remove('active-recording');
          micBtn.querySelector('.mic-status-text').textContent = 'Enable Mic Tuner';
          this.resetDisplay();
        }
      });
    }

    // Subscribe to pitch updates
    this.pitchDetector.onPitchUpdate = (info) => {
      this.updatePitchDisplay(info);
    };

    this.pitchDetector.onSilent = () => {
      this.resetDisplay();
    };
  }

  updatePitchDisplay(info) {
    const noteBadge = this.container.querySelector('#pitch-note-badge');
    const freqEl = this.container.querySelector('#pitch-freq');
    const targetFreqEl = this.container.querySelector('#pitch-target-freq');
    const needle = this.container.querySelector('#cents-needle');
    const centsBadge = this.container.querySelector('#cents-value-badge');

    if (noteBadge) {
      noteBadge.textContent = info.displayName;
      const inTune = Math.abs(info.cents) <= 6;
      noteBadge.className = `pitch-note-badge ${inTune ? 'in-tune' : (info.cents > 0 ? 'sharp' : 'flat')}`;
    }

    if (freqEl) freqEl.textContent = `${info.frequency} Hz`;
    if (targetFreqEl) targetFreqEl.textContent = `Target: ${info.standardFreq} Hz`;

    if (needle) {
      // Clamped -50 to +50 cents mapped to 0% - 100%
      const clampedCents = Math.max(-50, Math.min(50, info.cents));
      const percent = ((clampedCents + 50) / 100) * 100;
      needle.style.left = `${percent}%`;
    }

    if (centsBadge) {
      const sign = info.cents > 0 ? '+' : '';
      centsBadge.textContent = `${sign}${info.cents} cents`;
      centsBadge.className = `cents-value-badge ${Math.abs(info.cents) <= 6 ? 'in-tune' : ''}`;
    }
  }

  resetDisplay() {
    const noteBadge = this.container.querySelector('#pitch-note-badge');
    const freqEl = this.container.querySelector('#pitch-freq');
    const targetFreqEl = this.container.querySelector('#pitch-target-freq');
    const needle = this.container.querySelector('#cents-needle');
    const centsBadge = this.container.querySelector('#cents-value-badge');

    if (noteBadge) {
      noteBadge.textContent = '--';
      noteBadge.className = 'pitch-note-badge';
    }
    if (freqEl) freqEl.textContent = '-- Hz';
    if (targetFreqEl) targetFreqEl.textContent = 'Target: -- Hz';
    if (needle) needle.style.left = '50%';
    if (centsBadge) centsBadge.textContent = '0 cents';
  }

  startSpectrumLoop() {
    const canvas = this.container.querySelector('#spectrum-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const width = canvas.width = canvas.clientWidth || 300;
      const height = canvas.height = canvas.clientHeight || 70;

      ctx.clearRect(0, 0, width, height);

      if (this.pitchDetector.isRunning) {
        this.pitchDetector.getFrequencyData(this.frequencyBuffer);
        const barWidth = width / this.frequencyBuffer.length;

        for (let i = 0; i < this.frequencyBuffer.length; i++) {
          const val = this.frequencyBuffer[i] / 255;
          const barHeight = val * height;
          const x = i * barWidth;
          const y = height - barHeight;

          const hue = 190 + (i / this.frequencyBuffer.length) * 50;
          ctx.fillStyle = `hsl(${hue}, 85%, 55%)`;
          ctx.fillRect(x, y, barWidth - 1, barHeight);
        }
      } else {
        // Subtle resting baseline
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      this.animationFrameId = requestAnimationFrame(draw);
    };

    draw();
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

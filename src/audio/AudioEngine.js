// Web Audio API Polyphonic Accordion Synthesizer with Multi-Reed Registers

export const ACCORDION_REGISTERS = {
  MASTER: {
    id: 'MASTER',
    name: 'Master',
    description: 'Full rich sound with 16\' Bassoon, 8\' Clarinet, 8\' Musette & 4\' Piccolo',
    symbol: '𝄢𝄡𝄠',
    reeds: [
      { octave: -1, detune: 0, gain: 0.8, type: 'sawtooth' }, // 16' Bassoon
      { octave: 0, detune: 0, gain: 1.0, type: 'sawtooth' },  // 8' Clarinet
      { octave: 0, detune: 14, gain: 0.7, type: 'triangle' }, // 8' Musette tremolo
      { octave: 1, detune: 0, gain: 0.5, type: 'sawtooth' }   // 4' Piccolo
    ]
  },
  MUSETTE: {
    id: 'MUSETTE',
    name: 'French Musette',
    description: 'Iconic Parisian accordion sound with twin detuned tremolo reeds',
    symbol: '•••',
    reeds: [
      { octave: 0, detune: -12, gain: 0.9, type: 'sawtooth' },
      { octave: 0, detune: 0, gain: 1.0, type: 'sawtooth' },
      { octave: 0, detune: 14, gain: 0.9, type: 'sawtooth' }
    ]
  },
  BANDONEON: {
    id: 'BANDONEON',
    name: 'Bandoneon / Tango',
    description: 'Deep expressive sound with 16\' Bassoon and 8\' Clarinet',
    symbol: '▮▮',
    reeds: [
      { octave: -1, detune: -4, gain: 1.0, type: 'sawtooth' },
      { octave: 0, detune: 4, gain: 0.9, type: 'triangle' }
    ]
  },
  CELESTE: {
    id: 'CELESTE',
    name: 'Celeste / Polka',
    description: 'Sweet dual 8\' reeds with gentle wet vibrato',
    symbol: '••',
    reeds: [
      { octave: 0, detune: 0, gain: 1.0, type: 'sawtooth' },
      { octave: 0, detune: 12, gain: 0.8, type: 'triangle' }
    ]
  },
  BASSOON: {
    id: 'BASSOON',
    name: 'Bassoon 16\'',
    description: 'Deep, warm low octave reed for mellow bass and warm melodies',
    symbol: '𝄢',
    reeds: [
      { octave: -1, detune: 0, gain: 1.0, type: 'sawtooth' }
    ]
  },
  CLARINET: {
    id: 'CLARINET',
    name: 'Clarinet 8\'',
    description: 'Pure single dry reed for clean, articulate folk lines',
    symbol: '•',
    reeds: [
      { octave: 0, detune: 0, gain: 1.0, type: 'sawtooth' }
    ]
  },
  ORGAN: {
    id: 'ORGAN',
    name: 'Organ / Harmonium',
    description: 'Combination of low 16\' and high 4\' reeds',
    symbol: '▮•',
    reeds: [
      { octave: -1, detune: 0, gain: 0.9, type: 'sawtooth' },
      { octave: 1, detune: 0, gain: 0.7, type: 'triangle' }
    ]
  }
};

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bellowsGain = null;
    this.filterNode = null;
    this.reverbNode = null;
    this.activeVoices = new Map(); // keyId -> Array of active oscillator objects
    this.currentRegister = ACCORDION_REGISTERS.MUSETTE;
    this.volume = 0.85;
    this.bellowsPressure = 1.0; // 0.2 to 1.5
    this.bellowsDirection = 'push'; // 'push' or 'pull'
    this.isMuted = false;
    this.metronomeInterval = null;
    this.metronomeBpm = 100;
    this.isMetronomePlaying = false;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Master Volume
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

    // Bellows Dynamics Gain
    this.bellowsGain = this.ctx.createGain();
    this.bellowsGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

    // Acoustic Accordion Body Resonator Lowpass Filter
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(4500, this.ctx.currentTime);
    this.filterNode.Q.setValueAtTime(1.2, this.ctx.currentTime);

    // Subtle Stereo Acoustic Reverb Convolver
    this.createSimpleReverb();

    // Routing
    this.bellowsGain.connect(this.filterNode);
    this.filterNode.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.isInitialized = true;
  }

  createSimpleReverb() {
    if (!this.ctx) return;
    try {
      const length = this.ctx.sampleRate * 0.8;
      const decay = 2.0;
      const buffer = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const channelData = buffer.getChannelData(c);
        for (let i = 0; i < length; i++) {
          channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        }
      }
      const convolver = this.ctx.createConvolver();
      convolver.buffer = buffer;

      const dryGain = this.ctx.createGain();
      const wetGain = this.ctx.createGain();
      dryGain.gain.value = 0.88;
      wetGain.gain.value = 0.12;

      this.masterGain.disconnect();
      this.masterGain.connect(dryGain);
      this.masterGain.connect(convolver);
      convolver.connect(wetGain);
      dryGain.connect(this.ctx.destination);
      wetGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Reverb creation fallback to direct output', e);
    }
  }

  setRegister(registerId) {
    if (ACCORDION_REGISTERS[registerId]) {
      this.currentRegister = ACCORDION_REGISTERS[registerId];
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.02);
    }
  }

  setBellowsPressure(pressure) {
    this.bellowsPressure = Math.max(0.1, Math.min(2.0, pressure));
    if (this.bellowsGain && this.ctx) {
      this.bellowsGain.gain.setTargetAtTime(this.bellowsPressure, this.ctx.currentTime, 0.05);
      // Brighten tone with higher bellow pressure
      const filterFreq = 2200 + this.bellowsPressure * 2500;
      this.filterNode.frequency.setTargetAtTime(filterFreq, this.ctx.currentTime, 0.05);
    }
  }

  setBellowsDirection(dir) {
    if (this.bellowsDirection !== dir) {
      this.bellowsDirection = dir;
      this.playBellowsAirSound();
    }
  }

  playBellowsAirSound() {
    if (!this.ctx || this.isMuted) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.03 * (1 - i / bufferSize);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 600;
      filter.Q.value = 2.0;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start();
    } catch (e) {
      // ignore
    }
  }

  // Play single note (Treble keyboard / button)
  playNote(keyId, midiNote, velocity = 0.8) {
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();

    // Release existing if already playing
    this.stopNote(keyId);

    const baseFreq = 440 * Math.pow(2, (midiNote - 69) / 12);
    const voiceObjects = [];
    const now = this.ctx.currentTime;

    this.currentRegister.reeds.forEach(reed => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Reed Frequency calculation with octave shifts and detune cents
      const reedFreq = baseFreq * Math.pow(2, reed.octave);
      osc.type = reed.type;
      osc.frequency.setValueAtTime(reedFreq, now);
      osc.detune.setValueAtTime(reed.detune, now);

      // Accordion key attack envelope (quick snappy acoustic attack)
      const targetGain = reed.gain * velocity * 0.28;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(targetGain, now + 0.015);

      osc.connect(gain);
      gain.connect(this.bellowsGain);
      osc.start(now);

      voiceObjects.push({ osc, gain });
    });

    this.activeVoices.set(keyId, voiceObjects);
  }

  // Play single note with fixed duration (for song playback, guide melody, note preview)
  playNoteDuration(keyId, midiNote, durationSeconds = 0.5, velocity = 0.8) {
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();

    this.stopNote(keyId);

    const baseFreq = 440 * Math.pow(2, (midiNote - 69) / 12);
    const voiceObjects = [];
    const now = this.ctx.currentTime;
    const attack = 0.018;
    const release = 0.06;
    const sustainTime = Math.max(0.04, durationSeconds - attack);

    this.currentRegister.reeds.forEach(reed => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const reedFreq = baseFreq * Math.pow(2, reed.octave);
      osc.type = reed.type;
      osc.frequency.setValueAtTime(reedFreq, now);
      osc.detune.setValueAtTime(reed.detune, now);

      const targetGain = reed.gain * velocity * 0.28;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(targetGain, now + attack);
      gain.gain.setValueAtTime(targetGain, now + sustainTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + sustainTime + release);

      osc.connect(gain);
      gain.connect(this.bellowsGain);
      osc.start(now);
      osc.stop(now + sustainTime + release + 0.02);

      voiceObjects.push({ osc, gain });
    });

    this.activeVoices.set(keyId, voiceObjects);

    const totalMs = (sustainTime + release + 0.03) * 1000;
    setTimeout(() => {
      if (this.activeVoices.get(keyId) === voiceObjects) {
        this.activeVoices.delete(keyId);
      }
    }, totalMs);
  }

  stopNote(keyId) {
    const voices = this.activeVoices.get(keyId);
    if (!voices || !this.ctx) return;

    const now = this.ctx.currentTime;
    voices.forEach(({ osc, gain }) => {
      try {
        // Natural acoustic accordion release without popping
        gain.gain.cancelScheduledValues(now);
        const curr = Math.max(0.0001, gain.gain.value);
        gain.gain.setValueAtTime(curr, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        osc.stop(now + 0.06);
      } catch (e) {
        // ignore
      }
    });

    this.activeVoices.delete(keyId);
  }

  // Play Bass Button (Stradella Bass: Root + Octave bass or Multi-tone Chord)
  playBass(bassId, midiNotes, velocity = 0.9) {
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();

    this.stopBass(bassId);

    const voiceObjects = [];
    const now = this.ctx.currentTime;
    const isSingleBass = midiNotes.length <= 2;

    midiNotes.forEach((midi, idx) => {
      const baseFreq = 440 * Math.pow(2, (midi - 69) / 12);

      // Bass Reed 1: Deep Reed (Sawtooth)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(baseFreq, now);

      // Bass Reed 2: Body Warmth (Triangle)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(baseFreq, now);
      osc2.detune.setValueAtTime(isSingleBass ? 4 : 2, now);

      const baseVolume = isSingleBass ? 0.35 : 0.22 / Math.sqrt(midiNotes.length);
      const targetGain = baseVolume * velocity;

      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.linearRampToValueAtTime(targetGain * 0.7, now + 0.015);

      gain2.gain.setValueAtTime(0.0001, now);
      gain2.gain.linearRampToValueAtTime(targetGain * 0.4, now + 0.015);

      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(this.bellowsGain);
      gain2.connect(this.bellowsGain);

      osc1.start(now);
      osc2.start(now);

      voiceObjects.push({ osc: osc1, gain: gain1 }, { osc: osc2, gain: gain2 });
    });

    this.activeVoices.set(bassId, voiceObjects);
  }

  // Play Bass / Chord with fixed duration
  playBassDuration(bassId, midiNotes, durationSeconds = 0.45, velocity = 0.85) {
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();

    this.stopBass(bassId);

    const voiceObjects = [];
    const now = this.ctx.currentTime;
    const isSingleBass = midiNotes.length <= 2;
    const attack = 0.015;
    const release = 0.08;
    const sustainTime = Math.max(0.05, durationSeconds - attack);

    midiNotes.forEach((midi, idx) => {
      const baseFreq = 440 * Math.pow(2, (midi - 69) / 12);

      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(baseFreq, now);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(baseFreq, now);
      osc2.detune.setValueAtTime(isSingleBass ? 4 : 2, now);

      const baseVolume = isSingleBass ? 0.35 : 0.22 / Math.sqrt(midiNotes.length);
      const targetGain = baseVolume * velocity;

      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.linearRampToValueAtTime(targetGain * 0.7, now + attack);
      gain1.gain.setValueAtTime(targetGain * 0.7, now + sustainTime);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + sustainTime + release);

      gain2.gain.setValueAtTime(0.0001, now);
      gain2.gain.linearRampToValueAtTime(targetGain * 0.4, now + attack);
      gain2.gain.setValueAtTime(targetGain * 0.4, now + sustainTime);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + sustainTime + release);

      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(this.bellowsGain);
      gain2.connect(this.bellowsGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + sustainTime + release + 0.02);
      osc2.stop(now + sustainTime + release + 0.02);

      voiceObjects.push({ osc: osc1, gain: gain1 }, { osc: osc2, gain: gain2 });
    });

    this.activeVoices.set(bassId, voiceObjects);

    const totalMs = (sustainTime + release + 0.03) * 1000;
    setTimeout(() => {
      if (this.activeVoices.get(bassId) === voiceObjects) {
        this.activeVoices.delete(bassId);
      }
    }, totalMs);
  }

  stopBass(bassId) {
    this.stopNote(bassId);
  }

  stopAll() {
    this.activeVoices.forEach((_, keyId) => {
      this.stopNote(keyId);
    });
    this.activeVoices.clear();
  }

  // Metronome Click Sound
  playClick(isAccented = false) {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isAccented ? 1200 : 800, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      // ignore
    }
  }

  // Feedback Chimes for Practice Mode
  playFeedback(type = 'correct') {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (type === 'correct' || type === 'perfect') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, now); // C6
        osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.08); // G6
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      } else if (type === 'miss') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(261.63, now); // C4
        osc.frequency.exponentialRampToValueAtTime(196.0, now + 0.08); // G3
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      }

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) {
      // ignore
    }
  }
}

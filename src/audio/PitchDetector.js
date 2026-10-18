// Real-time Audio Pitch & Note Detector with Autocorrelation and Parabolic Interpolation

export class PitchDetector {
  constructor(options = {}) {
    this.audioCtx = null;
    this.mediaStream = null;
    this.analyserNode = null;
    this.sourceNode = null;
    this.buffer = null;
    this.isRunning = false;
    this.animationFrameId = null;

    this.sampleRate = 44100;
    this.fftSize = 2048;
    this.minVolumeThreshold = options.minVolumeThreshold || 0.015; // RMS threshold
    this.clarityThreshold = options.clarityThreshold || 0.82; // Autocorrelation confidence
    this.minFreq = options.minFreq || 55; // A1 (~55Hz)
    this.maxFreq = options.maxFreq || 1760; // A6 (~1760Hz)

    this.onNoteDetected = options.onNoteDetected || (() => {});
    this.onPitchUpdate = options.onPitchUpdate || (() => {});
    this.onSilent = options.onSilent || (() => {});

    // Note stabilization and hysteresis
    this.currentNote = null;
    this.recentDetections = [];
    this.historyLength = 4;
  }

  async start() {
    if (this.isRunning) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1
        }
      });

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.sampleRate = this.audioCtx.sampleRate;

      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = this.fftSize;
      this.buffer = new Float32Array(this.analyserNode.fftSize);

      this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);

      // Lowpass / Bandpass filter to isolate fundamental accordion reed frequencies
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2400;

      this.sourceNode.connect(filter);
      filter.connect(this.analyserNode);

      this.isRunning = true;
      this.detectLoop();
      return true;
    } catch (err) {
      console.error('Microphone access failed:', err);
      throw err;
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
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
    this.currentNote = null;
    this.recentDetections = [];
  }

  detectLoop() {
    if (!this.isRunning) return;

    this.analyserNode.getFloatTimeDomainData(this.buffer);

    // Compute RMS Energy
    let sum = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      sum += this.buffer[i] * this.buffer[i];
    }
    const rms = Math.sqrt(sum / this.buffer.length);

    if (rms < this.minVolumeThreshold) {
      this.recentDetections = [];
      if (this.currentNote !== null) {
        this.currentNote = null;
        this.onSilent();
      }
      this.animationFrameId = requestAnimationFrame(() => this.detectLoop());
      return;
    }

    const { frequency, confidence } = this.autoCorrelate(this.buffer, this.sampleRate);

    if (frequency > 0 && confidence >= this.clarityThreshold && frequency >= this.minFreq && frequency <= this.maxFreq) {
      const noteInfo = this.frequencyToNoteInfo(frequency);
      noteInfo.volume = rms;
      noteInfo.confidence = confidence;

      // Note stabilization buffer
      this.recentDetections.push(noteInfo.midi);
      if (this.recentDetections.length > this.historyLength) {
        this.recentDetections.shift();
      }

      // Check if majority of recent detections agree
      const noteCount = {};
      let dominantMidi = null;
      let maxCount = 0;
      this.recentDetections.forEach(m => {
        noteCount[m] = (noteCount[m] || 0) + 1;
        if (noteCount[m] > maxCount) {
          maxCount = noteCount[m];
          dominantMidi = m;
        }
      });

      if (maxCount >= Math.ceil(this.historyLength * 0.6)) {
        if (!this.currentNote || this.currentNote.midi !== dominantMidi) {
          this.currentNote = noteInfo;
          this.onNoteDetected(noteInfo);
        }
      }

      this.onPitchUpdate(noteInfo);
    } else {
      if (this.currentNote !== null) {
        this.recentDetections = [];
        this.currentNote = null;
        this.onSilent();
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.detectLoop());
  }

  // Normalized Autocorrelation with Sub-harmonic rejection and parabolic interpolation
  autoCorrelate(buffer, sampleRate) {
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let bestOffset = -1;
    let bestCorrelation = 0;
    let rms = 0;
    let foundGoodCorrelation = false;
    const correlations = new Float32Array(MAX_SAMPLES);

    for (let i = 0; i < SIZE; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return { frequency: -1, confidence: 0 };

    let lastCorrelation = 1;
    const minPeriod = Math.floor(sampleRate / this.maxFreq);
    const maxPeriod = Math.floor(sampleRate / this.minFreq);

    for (let offset = minPeriod; offset < Math.min(MAX_SAMPLES, maxPeriod); offset++) {
      let correlation = 0;

      for (let i = 0; i < MAX_SAMPLES; i++) {
        correlation += Math.abs(buffer[i] - buffer[i + offset]);
      }
      correlation = 1 - (correlation / MAX_SAMPLES);
      correlations[offset] = correlation;

      if (correlation > 0.85 && correlation > lastCorrelation) {
        foundGoodCorrelation = true;
        if (correlation > bestCorrelation) {
          bestCorrelation = correlation;
          bestOffset = offset;
        }
      } else if (foundGoodCorrelation) {
        // Local peak found
        break;
      }
      lastCorrelation = correlation;
    }

    if (bestCorrelation > 0.5 && bestOffset > 0) {
      // Parabolic interpolation for sub-bin precision
      let shift = 0;
      if (bestOffset > 0 && bestOffset < MAX_SAMPLES - 1) {
        const alpha = correlations[bestOffset - 1];
        const beta = correlations[bestOffset];
        const gamma = correlations[bestOffset + 1];
        shift = (alpha - gamma) / (2 * (alpha - 2 * beta + gamma));
      }
      const accuratePeriod = bestOffset + shift;
      const frequency = sampleRate / accuratePeriod;
      return { frequency, confidence: bestCorrelation };
    }

    return { frequency: -1, confidence: 0 };
  }

  frequencyToNoteInfo(frequency) {
    const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const noteStringsFlat = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
    
    // MIDI 69 is A4 (440Hz)
    const midiFloat = 69 + 12 * Math.log2(frequency / 440);
    const midi = Math.round(midiFloat);
    const cents = Math.round((midiFloat - midi) * 100);
    const noteIndex = ((midi % 12) + 12) % 12;
    const octave = Math.floor(midi / 12) - 1;

    const noteName = noteStrings[noteIndex];
    const noteNameFlat = noteStringsFlat[noteIndex];
    const standardFreq = 440 * Math.pow(2, (midi - 69) / 12);

    return {
      frequency: Math.round(frequency * 10) / 10,
      standardFreq: Math.round(standardFreq * 10) / 10,
      midi,
      cents, // -50 to +50
      noteName,
      noteNameFlat,
      octave,
      displayName: `${noteName}${octave}`,
      displayFlatName: `${noteNameFlat}${octave}`
    };
  }

  getFrequencyData(frequencyArray) {
    if (this.analyserNode && this.isRunning) {
      this.analyserNode.getByteFrequencyData(frequencyArray);
    }
  }
}

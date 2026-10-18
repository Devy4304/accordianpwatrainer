// Practice Engine: Manages Guided Step-by-Step Training, Waterfall Flow, Scoring & Real-time Evaluation

import { getBassMidiNotes } from '../models/AccordionModels.js';

export const PRACTICE_MODES = {
  WAIT: {
    id: 'WAIT',
    name: 'Wait For Me (Learn Mode)',
    description: 'Pauses on each note and gives you live previews. Only advances when you play the right key on your accordion.',
    icon: '⏳'
  },
  FLOW: {
    id: 'FLOW',
    name: 'Rhythm Flow (Waterfall Mode)',
    description: 'Notes scroll continuously at your chosen BPM tempo. Tests your timing accuracy, rhythm, and combo streaks.',
    icon: '🌊'
  },
  FREEPLAY: {
    id: 'FREEPLAY',
    name: 'Free Play & Tuner',
    description: 'Freely play your virtual or physical accordion with real-time pitch detection, chord analysis, and tuning meter.',
    icon: '🎵'
  },
  BELLOWS_LAB: {
    id: 'BELLOWS_LAB',
    name: 'Bellows & Bass Lab',
    description: 'Interactive masterclass on Stradella Circle of Fifths, alternating bass-chord patterns, and push/pull dynamics.',
    icon: '🔄'
  }
};

export class PracticeEngine {
  constructor(audioEngine, songLibrary) {
    this.audioEngine = audioEngine;
    this.songLibrary = songLibrary;

    this.currentMode = PRACTICE_MODES.WAIT.id;
    this.currentSong = songLibrary[0];
    this.speedMultiplier = 1.0;
    this.isMetronomeEnabled = false;
    this.isGuideAudioEnabled = true; // Plays authentic accordion notes and bass for the song
    this.guideVolume = 0.85;

    // Playback State
    this.isPlaying = false;
    this.currentBeat = 0;
    this.currentNoteIndex = 0;
    this.playedNoteIndices = new Set();
    this.lastTimestamp = null;
    this.animationFrameId = null;

    // Scoring & Stats
    this.score = 0;
    this.notesHit = 0;
    this.notesMissed = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.startTime = null;
    this.totalPracticeSeconds = 0;

    // Callbacks
    this.onNoteTargetChange = () => {};
    this.onScoreUpdate = () => {};
    this.onFeedback = () => {};
    this.onSongComplete = () => {};
    this.onBeatTick = () => {};
    this.onSongNotePlay = () => {};

    // Hit registration window for Flow mode (in beats)
    this.hitWindowPerfect = 0.25; // ~120ms at 120bpm
    this.hitWindowGood = 0.5;
  }

  setSong(song) {
    this.currentSong = song;
    this.reset();
  }

  setMode(modeId) {
    if (PRACTICE_MODES[modeId]) {
      this.currentMode = modeId;
      this.reset();
    }
  }

  setSpeed(multiplier) {
    this.speedMultiplier = Math.max(0.25, Math.min(2.0, multiplier));
  }

  toggleMetronome() {
    this.isMetronomeEnabled = !this.isMetronomeEnabled;
    return this.isMetronomeEnabled;
  }

  toggleGuideAudio() {
    this.isGuideAudioEnabled = !this.isGuideAudioEnabled;
    return this.isGuideAudioEnabled;
  }

  setGuideAudio(enabled) {
    this.isGuideAudioEnabled = !!enabled;
  }

  setGuideVolume(val) {
    this.guideVolume = Math.max(0, Math.min(1, val));
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.lastTimestamp = performance.now();
    this.startTime = Date.now();
    this.notifyTargetChange();

    // In Wait mode, preview the first note when starting
    if (this.currentMode === PRACTICE_MODES.WAIT.id && this.isGuideAudioEnabled) {
      this.previewTargetNote();
    }

    this.loop();
  }

  pause() {
    this.isPlaying = false;
    if (this.animationFrameId) {
      if (typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this.animationFrameId);
      }
      this.animationFrameId = null;
    }
  }

  reset() {
    this.pause();
    this.currentBeat = 0;
    this.currentNoteIndex = 0;
    this.playedNoteIndices.clear();
    this.score = 0;
    this.notesHit = 0;
    this.notesMissed = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.totalPracticeSeconds = 0;
    this.notifyTargetChange();
    this.notifyScoreUpdate();
  }

  getCurrentTargetNote() {
    if (!this.currentSong || !this.currentSong.notes || this.currentNoteIndex >= this.currentSong.notes.length) {
      return null;
    }
    return this.currentSong.notes[this.currentNoteIndex];
  }

  getNextTargetNote() {
    if (!this.currentSong || !this.currentSong.notes || this.currentNoteIndex + 1 >= this.currentSong.notes.length) {
      return null;
    }
    return this.currentSong.notes[this.currentNoteIndex + 1];
  }

  // Preview the sound of the current target key using the accordion synth
  previewTargetNote() {
    const target = this.getCurrentTargetNote();
    if (!target) return;

    const durSeconds = 0.65;
    this.audioEngine.playNoteDuration(`target_preview_${target.midi}`, target.midi, durSeconds, 0.85);

    if (target.bassId) {
      const bassMidi = getBassMidiNotes(target.bassId);
      if (bassMidi && bassMidi.length > 0) {
        this.audioEngine.playBassDuration(`target_bass_${target.bassId}`, bassMidi, 0.45, 0.8);
      }
    }
  }

  notifyTargetChange() {
    const current = this.getCurrentTargetNote();
    const next = this.getNextTargetNote();
    this.onNoteTargetChange(current, next, {
      index: this.currentNoteIndex,
      total: this.currentSong?.notes?.length || 0,
      beat: this.currentBeat
    });
  }

  notifyScoreUpdate() {
    const total = this.notesHit + this.notesMissed;
    const accuracy = total > 0 ? Math.round((this.notesHit / total) * 100) : 100;
    this.onScoreUpdate({
      score: this.score,
      notesHit: this.notesHit,
      notesMissed: this.notesMissed,
      accuracy,
      combo: this.combo,
      maxCombo: this.maxCombo,
      beat: this.currentBeat,
      progressPercent: this.currentSong?.notes ? Math.round((this.currentNoteIndex / this.currentSong.notes.length) * 100) : 0
    });
  }

  // Handle Note Input (From Microphone Pitch Detector, AR Camera, or Virtual Screen Keys)
  handleNoteInput(detectedMidi, detectedPitchName, source = 'audio') {
    if (!this.isPlaying && this.currentMode !== PRACTICE_MODES.FREEPLAY.id) return;

    if (this.currentMode === PRACTICE_MODES.WAIT.id) {
      this.handleWaitModeInput(detectedMidi, source);
    } else if (this.currentMode === PRACTICE_MODES.FLOW.id) {
      this.handleFlowModeInput(detectedMidi, source);
    }
  }

  handleWaitModeInput(detectedMidi, source = 'audio') {
    const target = this.getCurrentTargetNote();
    if (!target) return;

    // Check if detected note matches target MIDI (or note in octave)
    if (detectedMidi === target.midi || (detectedMidi % 12 === target.midi % 12)) {
      // Correct note hit!
      this.notesHit++;
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      this.score += 100 * Math.min(4, 1 + Math.floor(this.combo / 5));

      // Play authentic key sound if coming from microphone/AR
      if (source !== 'touch') {
        this.audioEngine.playNoteDuration(`hit_${target.midi}`, target.midi, 0.45, 0.85);
        if (target.bassId) {
          const bassMidi = getBassMidiNotes(target.bassId);
          if (bassMidi.length > 0) this.audioEngine.playBassDuration(`hit_bass_${target.bassId}`, bassMidi, 0.35, 0.75);
        }
      }

      this.audioEngine.playFeedback('perfect');
      this.onFeedback('perfect', target);

      // Advance to next note
      this.currentNoteIndex++;
      if (this.currentNoteIndex >= this.currentSong.notes.length) {
        // Song Finished!
        this.finishSong();
      } else {
        const next = this.getCurrentTargetNote();
        this.currentBeat = next ? next.start : this.currentBeat;
        this.notifyTargetChange();

        // Optional gentle preview of next note in Wait mode
        if (this.isGuideAudioEnabled && next) {
          setTimeout(() => {
            if (this.isPlaying && this.currentMode === PRACTICE_MODES.WAIT.id) {
              this.previewTargetNote();
            }
          }, 350);
        }
      }
      this.notifyScoreUpdate();
    }
  }

  handleFlowModeInput(detectedMidi, source = 'audio') {
    const notes = this.currentSong?.notes || [];
    // Search nearby target notes within timing window
    let matchedIndex = -1;
    let minDiff = Infinity;

    for (let i = this.currentNoteIndex; i < Math.min(notes.length, this.currentNoteIndex + 3); i++) {
      const n = notes[i];
      if (n.midi === detectedMidi || (detectedMidi % 12 === n.midi % 12)) {
        const diff = Math.abs(this.currentBeat - n.start);
        if (diff < minDiff && diff <= this.hitWindowGood) {
          minDiff = diff;
          matchedIndex = i;
        }
      }
    }

    if (matchedIndex !== -1) {
      const isPerfect = minDiff <= this.hitWindowPerfect;
      const feedbackType = isPerfect ? 'perfect' : 'good';
      const hitNote = notes[matchedIndex];
      this.notesHit++;
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      this.score += (isPerfect ? 150 : 80) * Math.min(4, 1 + Math.floor(this.combo / 5));

      if (source !== 'touch') {
        this.audioEngine.playNoteDuration(`flow_hit_${hitNote.midi}`, hitNote.midi, 0.4, 0.85);
      }

      this.audioEngine.playFeedback(feedbackType);
      this.onFeedback(feedbackType, hitNote);

      if (matchedIndex === this.currentNoteIndex) {
        this.currentNoteIndex++;
        this.notifyTargetChange();
      }
      this.notifyScoreUpdate();
    }
  }

  finishSong() {
    this.pause();
    const total = this.notesHit + this.notesMissed;
    const accuracy = total > 0 ? Math.round((this.notesHit / total) * 100) : 100;
    const stats = {
      song: this.currentSong,
      score: this.score,
      accuracy,
      notesHit: this.notesHit,
      notesMissed: this.notesMissed,
      maxCombo: this.maxCombo,
      durationSeconds: Math.round((Date.now() - this.startTime) / 1000)
    };
    this.onSongComplete(stats);
  }

  loop() {
    if (!this.isPlaying) return;

    const now = performance.now();
    const deltaSeconds = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;

    if (this.currentMode === PRACTICE_MODES.FLOW.id) {
      const bpm = (this.currentSong?.bpm || 100) * this.speedMultiplier;
      const beatsPerSecond = bpm / 60;
      const prevBeat = this.currentBeat;
      this.currentBeat += deltaSeconds * beatsPerSecond;

      // Metronome tick
      if (this.isMetronomeEnabled) {
        const prevFloor = Math.floor(prevBeat);
        const currFloor = Math.floor(this.currentBeat);
        if (currFloor > prevFloor) {
          const isDownbeat = (currFloor % 4 === 0);
          this.audioEngine.playClick(isDownbeat);
          this.onBeatTick(currFloor);
        }
      }

      const notes = this.currentSong?.notes || [];

      // Guide Audio: Play authentic accordion notes and left-hand bass as the song timeline flows
      if (this.isGuideAudioEnabled) {
        for (let i = 0; i < notes.length; i++) {
          const note = notes[i];
          if (!this.playedNoteIndices.has(i) && this.currentBeat >= note.start && this.currentBeat <= note.start + 0.6) {
            this.playedNoteIndices.add(i);

            const durationSec = Math.max(0.12, (note.duration / beatsPerSecond) * 0.92);
            this.audioEngine.playNoteDuration(`song_${note.id || i}_${note.midi}`, note.midi, durationSec, 0.82 * this.guideVolume);

            if (note.bassId) {
              const bassMidis = getBassMidiNotes(note.bassId);
              if (bassMidis && bassMidis.length > 0) {
                this.audioEngine.playBassDuration(`song_bass_${note.bassId}_${i}`, bassMidis, Math.min(0.42, durationSec), 0.72 * this.guideVolume);
              }
            }

            this.onSongNotePlay(note);
          }
        }
      }

      // Check for missed notes in Flow Mode
      while (this.currentNoteIndex < notes.length) {
        const note = notes[this.currentNoteIndex];
        if (this.currentBeat > note.start + this.hitWindowGood) {
          // Note Missed
          this.notesMissed++;
          this.combo = 0;
          this.onFeedback('miss', note);
          this.currentNoteIndex++;
          this.notifyTargetChange();
          this.notifyScoreUpdate();
        } else {
          break;
        }
      }

      if (this.currentNoteIndex >= notes.length) {
        this.finishSong();
        return;
      }
    }

    if (typeof requestAnimationFrame === 'function') {
      this.animationFrameId = requestAnimationFrame(() => this.loop());
    }
  }
}

// 60FPS Canvas Waterfall Timeline Visualizer for Upcoming Notes & Chords

export class WaterfallVisualizer {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.keysList = [];
    this.song = null;
    this.currentBeat = 0;
    this.visibleBeatsAhead = options.visibleBeatsAhead || 6.0;
    this.visibleBeatsBehind = options.visibleBeatsBehind || 1.0;
    this.targetNote = null;
    this.hitLineRatio = 0.82; // Hit bar line position from top
  }

  setKeys(keysList) {
    this.keysList = keysList;
  }

  setSong(song) {
    this.song = song;
  }

  setTargetNote(target) {
    this.targetNote = target;
  }

  render(currentBeat) {
    this.currentBeat = currentBeat;
    if (!this.canvas || !this.ctx) return;

    const width = this.canvas.width = this.canvas.clientWidth || 600;
    const height = this.canvas.height = this.canvas.clientHeight || 240;

    this.ctx.clearRect(0, 0, width, height);

    // Background Grid / Lanes
    this.drawLanes(width, height);

    // Hit Line
    const hitY = height * this.hitLineRatio;
    this.ctx.beginPath();
    this.ctx.moveTo(0, hitY);
    this.ctx.lineTo(width, hitY);
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 2.5;
    this.ctx.shadowColor = '#0284c7';
    this.ctx.shadowBlur = 8;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Falling Notes
    if (this.song && this.song.notes) {
      this.drawFallingNotes(width, height, hitY);
    }
  }

  drawLanes(width, height) {
    const isPiano = this.keysList.some(k => k.id.startsWith('treble_piano'));
    const whiteKeys = this.keysList.filter(k => !k.isBlack);
    const count = whiteKeys.length || 1;
    const laneWidth = width / count;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    for (let i = 0; i <= count; i++) {
      const x = i * laneWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.05)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
  }

  drawFallingNotes(width, height, hitY) {
    const minMidi = Math.min(...this.keysList.map(k => k.midi || k.pushMidi || 60));
    const maxMidi = Math.max(...this.keysList.map(k => k.midi || k.pullMidi || 72));
    const midiSpan = Math.max(12, maxMidi - minMidi + 1);

    const beatToPixels = hitY / this.visibleBeatsAhead;

    this.song.notes.forEach(note => {
      const beatDiff = note.start - this.currentBeat;
      // Check if note is in visible window
      if (beatDiff > -this.visibleBeatsBehind && beatDiff < this.visibleBeatsAhead) {
        const y = hitY - (beatDiff * beatToPixels);
        const noteHeight = Math.max(16, note.duration * beatToPixels);

        // Calculate X position corresponding to keyboard layout
        const keyObj = this.keysList.find(k => k.midi === note.midi || k.pushMidi === note.midi || k.pullMidi === note.midi);
        let x = 0;
        let noteWidth = 24;

        if (keyObj && keyObj.position !== undefined) {
          const whiteKeys = this.keysList.filter(k => !k.isBlack);
          const laneWidth = width / (whiteKeys.length || 1);
          x = keyObj.position * laneWidth;
          noteWidth = keyObj.isBlack ? laneWidth * 0.7 : laneWidth * 0.9;
        } else {
          const norm = (note.midi - minMidi) / midiSpan;
          x = norm * (width - 30);
          noteWidth = width / midiSpan * 0.85;
        }

        const isTarget = this.targetNote && this.targetNote.id === note.id;
        const isPull = note.direction === 'pull';

        // Draw Note Capsule
        this.ctx.save();
        this.ctx.beginPath();
        const radius = Math.min(6, noteWidth / 2);
        this.ctx.roundRect(x, y - noteHeight, noteWidth, noteHeight, radius);

        if (isTarget) {
          this.ctx.fillStyle = isPull ? '#ea580c' : '#0284c7';
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.lineWidth = 2.5;
          this.ctx.shadowColor = isPull ? '#f97316' : '#38bdf8';
          this.ctx.shadowBlur = 10;
        } else {
          this.ctx.fillStyle = isPull ? 'rgba(234, 88, 12, 0.7)' : 'rgba(2, 132, 199, 0.7)';
          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          this.ctx.lineWidth = 1;
        }

        this.ctx.fill();
        this.ctx.stroke();

        // Note Label
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 10px system-ui, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(note.pitch, x + noteWidth / 2, y - noteHeight / 2);

        // Finger badge
        if (note.finger) {
          this.ctx.font = '9px system-ui, sans-serif';
          this.ctx.fillText(`F${note.finger}`, x + noteWidth / 2, y - noteHeight / 2 + 11);
        }

        this.ctx.restore();
      }
    });
  }
}

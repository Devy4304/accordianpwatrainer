// Comprehensive Accordion Models and Layout Definitions

export const STRADELLA_CIRCLE_OF_FIFTHS = [
  { name: 'Bbb', rootMidi: 46, altName: 'A' },
  { name: 'Fb',  rootMidi: 52, altName: 'E' },
  { name: 'Cb',  rootMidi: 47, altName: 'B' },
  { name: 'Gb',  rootMidi: 54, altName: 'F#' },
  { name: 'Db',  rootMidi: 49, altName: 'C#' },
  { name: 'Ab',  rootMidi: 44, altName: 'G#' },
  { name: 'Eb',  rootMidi: 51, altName: 'D#' },
  { name: 'Bb',  rootMidi: 46, altName: 'A#' },
  { name: 'F',   rootMidi: 53, altName: 'F' },
  { name: 'C',   rootMidi: 48, altName: 'C', isMarked: true }, // Indented center C
  { name: 'G',   rootMidi: 55, altName: 'G' },
  { name: 'D',   rootMidi: 50, altName: 'D' },
  { name: 'A',   rootMidi: 45, altName: 'A' },
  { name: 'E',   rootMidi: 52, altName: 'E', isMarked: true }, // Marked E button
  { name: 'B',   rootMidi: 47, altName: 'B' },
  { name: 'F#',  rootMidi: 54, altName: 'Gb' },
  { name: 'C#',  rootMidi: 49, altName: 'Db' },
  { name: 'G#',  rootMidi: 44, altName: 'Ab', isMarked: true }, // Marked Ab/G#
  { name: 'D#',  rootMidi: 51, altName: 'Eb' },
  { name: 'A#',  rootMidi: 46, altName: 'Bb' }
];

export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const NOTE_NAMES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

export function getMidiNoteName(midi, useFlat = false) {
  const index = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const name = useFlat ? NOTE_NAMES_FLAT[index] : NOTE_NAMES[index];
  return `${name}${octave}`;
}

export function isBlackKey(midi) {
  const mod = ((midi % 12) + 12) % 12;
  return [1, 3, 6, 8, 10].includes(mod); // C#, D#, F#, G#, A#
}

// Convert a bass identifier (e.g. 'Am_Bass', 'C_Chord', 'E7_Bass') to its Stradella MIDI array
export function getBassMidiNotes(bassId) {
  if (!bassId) return [];
  const parts = bassId.split('_');
  const chordName = parts[0] || '';
  const type = (parts[1] || 'Bass').toLowerCase(); // 'bass' or 'chord'

  let rootName = chordName;
  let isMinor = false;
  let isSeventh = false;
  let isDim = false;

  if (chordName.endsWith('m') && !chordName.endsWith('dim')) {
    rootName = chordName.slice(0, -1);
    isMinor = true;
  } else if (chordName.endsWith('7')) {
    rootName = chordName.slice(0, -1);
    isSeventh = true;
  } else if (chordName.endsWith('d') || chordName.endsWith('dim')) {
    rootName = chordName.replace(/d(im)?$/, '');
    isDim = true;
  }

  const col = STRADELLA_CIRCLE_OF_FIFTHS.find(c => c.name === rootName || c.altName === rootName);
  const rootMidi = col ? col.rootMidi : 48;

  if (type === 'bass') {
    return [rootMidi, rootMidi + 12];
  }

  const chordRoot = rootMidi + 12;
  if (isMinor) {
    return [chordRoot, chordRoot + 3, chordRoot + 7];
  } else if (isSeventh) {
    return [chordRoot, chordRoot + 4, chordRoot + 10];
  } else if (isDim) {
    return [chordRoot, chordRoot + 3, chordRoot + 6, chordRoot + 9];
  } else {
    return [chordRoot, chordRoot + 4, chordRoot + 7];
  }
}

// Generate Stradella Bass button matrix
export function generateStradellaBassGrid(buttonCount = 120) {
  // Common configurations: 120 (6 rows x 20 cols), 72 (6 rows x 12 cols), 48 (4 or 6 rows x 12 cols), 24 (3 rows x 8 cols), 12 (2 rows x 6 cols)
  let colStart = 3;
  let colCount = 20;
  let hasCounterbass = true;
  let hasMajor = true;
  let hasMinor = true;
  let hasSeventh = true;
  let hasDiminished = true;

  if (buttonCount === 120) {
    colStart = 0;
    colCount = 20;
  } else if (buttonCount === 72) {
    colStart = 5; // Db to F#
    colCount = 12;
  } else if (buttonCount === 48) {
    colStart = 6; // Ab to B
    colCount = 12;
    hasDiminished = false;
  } else if (buttonCount === 24) {
    colStart = 7; // Eb to E
    colCount = 8;
    hasSeventh = false;
    hasDiminished = false;
  } else if (buttonCount === 12) {
    colStart = 7; // Eb to E (6 cols: Eb, Bb, F, C, G, D)
    colCount = 6;
    hasMinor = false;
    hasSeventh = false;
    hasDiminished = false;
  }

  const columns = STRADELLA_CIRCLE_OF_FIFTHS.slice(colStart, colStart + colCount);
  const rows = [];

  if (hasCounterbass) rows.push({ id: 'counter', name: 'Counter-Bass (3rd)', type: 'counter' });
  rows.push({ id: 'fundamental', name: 'Fundamental Bass', type: 'fundamental' });
  if (hasMajor) rows.push({ id: 'major', name: 'Major Chord [M]', type: 'major' });
  if (hasMinor) rows.push({ id: 'minor', name: 'Minor Chord [m]', type: 'minor' });
  if (hasSeventh) rows.push({ id: 'seventh', name: 'Dominant 7th [7]', type: 'seventh' });
  if (hasDiminished) rows.push({ id: 'diminished', name: 'Diminished 7th [d]', type: 'diminished' });

  const buttons = [];

  columns.forEach((col, cIdx) => {
    rows.forEach((row, rIdx) => {
      const rootMidi = col.rootMidi; // octave 2-3 (e.g. C3 = 48)
      let midiNotes = [];
      let label = '';
      let subLabel = '';

      if (row.type === 'counter') {
        // Major 3rd above fundamental bass (e.g. E for C)
        const counterMidi = rootMidi + 4;
        midiNotes = [counterMidi, counterMidi + 12];
        label = getMidiNoteName(counterMidi, false).replace(/\d/, '');
        subLabel = '3rd';
      } else if (row.type === 'fundamental') {
        midiNotes = [rootMidi, rootMidi + 12];
        label = col.name;
        subLabel = 'Bass';
      } else if (row.type === 'major') {
        // Root + Major 3rd + 5th (octave 4)
        const chordRoot = rootMidi + 12;
        midiNotes = [chordRoot, chordRoot + 4, chordRoot + 7];
        label = `${col.name}M`;
        subLabel = 'Maj';
      } else if (row.type === 'minor') {
        // Root + Minor 3rd + 5th
        const chordRoot = rootMidi + 12;
        midiNotes = [chordRoot, chordRoot + 3, chordRoot + 7];
        label = `${col.name}m`;
        subLabel = 'Min';
      } else if (row.type === 'seventh') {
        // Root + Major 3rd + Minor 7th (omits 5th per standard Stradella accordion voicing)
        const chordRoot = rootMidi + 12;
        midiNotes = [chordRoot, chordRoot + 4, chordRoot + 10];
        label = `${col.name}7`;
        subLabel = '7th';
      } else if (row.type === 'diminished') {
        // Root + Minor 3rd + Dim 5th / Dim 7th
        const chordRoot = rootMidi + 12;
        midiNotes = [chordRoot, chordRoot + 3, chordRoot + 6, chordRoot + 9];
        label = `${col.name}d`;
        subLabel = 'Dim';
      }

      buttons.push({
        id: `bass_${row.id}_${col.name}_${cIdx}`,
        colIndex: cIdx,
        rowIndex: rIdx,
        rowType: row.type,
        colName: col.name,
        isMarked: col.isMarked && (row.type === 'fundamental' || row.type === 'counter'),
        label,
        subLabel,
        midiNotes,
        fundamentalMidi: rootMidi,
        noteName: col.name
      });
    });
  });

  return { rows, columns, buttons };
}

// Generate Piano Treble Keys
export function generatePianoTrebleKeys(startMidi = 53, keyCount = 41) {
  // startMidi 53 = F3, keyCount 41 => F3 to A6 (MIDI 53 to 93)
  const keys = [];
  let whiteKeyIndex = 0;

  for (let i = 0; i < keyCount; i++) {
    const midi = startMidi + i;
    const isBlack = isBlackKey(midi);
    const noteName = getMidiNoteName(midi, false);
    const flatName = getMidiNoteName(midi, true);

    keys.push({
      id: `treble_piano_${midi}`,
      midi,
      noteName,
      flatName,
      isBlack,
      whiteKeyIndex: isBlack ? -1 : whiteKeyIndex++,
      keyNumber: i + 1,
      freq: Math.round(440 * Math.pow(2, (midi - 69) / 12) * 10) / 10
    });
  }

  // Assign relative x-positions for black keys
  let currentWhite = 0;
  keys.forEach(key => {
    if (!key.isBlack) {
      key.position = currentWhite;
      currentWhite++;
    } else {
      key.position = currentWhite - 0.35; // Position between previous and current white key
    }
  });

  return { keys, whiteKeyCount: whiteKeyIndex };
}

// Generate Chromatic Button Accordion (C-System / B-System)
export function generateChromaticButtonKeys(system = 'C_SYSTEM', rowsCount = 5) {
  // C-System Bayan 5 rows: Row 1 (outer), Row 2, Row 3, Row 4 (aux duplicate of 1), Row 5 (aux duplicate of 2)
  const buttons = [];
  const startMidi = 53; // F3
  const buttonColumns = 16;

  // C-System Row Offsets (semitones between adjacent buttons):
  // Along a diagonal: +1 semitone
  // Along a row: +3 semitones (minor 3rds)
  // Row 1 to Row 2: +1 semitone, Row 2 to Row 3: +1 semitone
  for (let row = 0; row < rowsCount; row++) {
    for (let col = 0; col < buttonColumns; col++) {
      let midi;
      if (system === 'C_SYSTEM') {
        const rowBase = (row % 3);
        const octaveOffset = Math.floor(row / 3) * 12;
        // In C-System, Row 1 has C, Eb, F#, A
        midi = startMidi + rowBase + col * 3 + octaveOffset;
      } else {
        // B-System
        const rowBase = (2 - (row % 3));
        const octaveOffset = Math.floor(row / 3) * 12;
        midi = startMidi + rowBase + col * 3 + octaveOffset;
      }

      if (midi <= 96) { // Up to C7
        buttons.push({
          id: `cba_${system}_r${row}_c${col}`,
          row,
          col,
          midi,
          noteName: getMidiNoteName(midi, false),
          flatName: getMidiNoteName(midi, true),
          isBlack: isBlackKey(midi),
          isAuxiliary: row >= 3,
          freq: Math.round(440 * Math.pow(2, (midi - 69) / 12) * 10) / 10
        });
      }
    }
  }

  return { buttons, system, rowsCount };
}

// Generate Diatonic Button Accordion (Melodeon / Corona Tex-Mex)
export function generateDiatonicButtonKeys(modelType = '3_ROW_GCF') {
  // Diatonic accordions produce different notes on Push vs Pull (Bisonoric)
  const buttons = [];

  if (modelType === '1_ROW_C') {
    // 10 buttons in key of C
    // Push: C E G C E G C E G C
    // Pull: D F A B D F A B D F
    const pushMidis = [60, 64, 67, 72, 76, 79, 84, 88, 91, 96]; // C4, E4, G4, C5...
    const pullMidis = [62, 65, 69, 71, 74, 77, 81, 83, 86, 89]; // D4, F4, A4, B4...

    for (let i = 0; i < 10; i++) {
      buttons.push({
        id: `diatonic_1row_${i}`,
        buttonIndex: i + 1,
        row: 0,
        col: i,
        pushMidi: pushMidis[i],
        pullMidi: pullMidis[i],
        pushNote: getMidiNoteName(pushMidis[i]),
        pullNote: getMidiNoteName(pullMidis[i]),
        label: `${i + 1}`
      });
    }
  } else if (modelType === '2_ROW_GC') {
    // 21 buttons: Outer Row G (11 buttons), Inner Row C (10 buttons)
    const gPush = [55, 59, 62, 67, 71, 74, 79, 83, 86, 91, 95];
    const gPull = [57, 60, 64, 66, 69, 72, 76, 78, 81, 84, 88];
    const cPush = [60, 64, 67, 72, 76, 79, 84, 88, 91, 96];
    const cPull = [62, 65, 69, 71, 74, 77, 81, 83, 86, 89];

    for (let i = 0; i < 11; i++) {
      buttons.push({
        id: `diatonic_2row_g_${i}`,
        buttonIndex: i + 1,
        row: 0,
        rowName: 'G Row',
        col: i,
        pushMidi: gPush[i],
        pullMidi: gPull[i],
        pushNote: getMidiNoteName(gPush[i]),
        pullNote: getMidiNoteName(gPull[i]),
        label: `G${i + 1}`
      });
    }
    for (let i = 0; i < 10; i++) {
      buttons.push({
        id: `diatonic_2row_c_${i}`,
        buttonIndex: i + 1,
        row: 1,
        rowName: 'C Row',
        col: i,
        pushMidi: cPush[i],
        pullMidi: cPull[i],
        pushNote: getMidiNoteName(cPush[i]),
        pullNote: getMidiNoteName(cPull[i]),
        label: `C${i + 1}`
      });
    }
  } else if (modelType === '3_ROW_GCF') {
    // Hohner Corona II/III (34 / 31 buttons: G, C, F rows)
    const gPush = [55, 59, 62, 67, 71, 74, 79, 83, 86, 91, 95];
    const gPull = [57, 60, 64, 66, 69, 72, 76, 78, 81, 84, 88];
    const cPush = [60, 64, 67, 72, 76, 79, 84, 88, 91, 96];
    const cPull = [62, 65, 69, 71, 74, 77, 81, 83, 86, 89];
    const fPush = [53, 57, 60, 65, 69, 72, 77, 81, 84, 89];
    const fPull = [55, 58, 62, 64, 67, 70, 74, 76, 79, 82];

    for (let i = 0; i < 11; i++) {
      buttons.push({
        id: `diatonic_3row_g_${i}`,
        buttonIndex: i + 1,
        row: 0,
        rowName: 'G Row',
        col: i,
        pushMidi: gPush[i],
        pullMidi: gPull[i],
        pushNote: getMidiNoteName(gPush[i]),
        pullNote: getMidiNoteName(gPull[i]),
        label: `G${i + 1}`
      });
    }
    for (let i = 0; i < 10; i++) {
      buttons.push({
        id: `diatonic_3row_c_${i}`,
        buttonIndex: i + 1,
        row: 1,
        rowName: 'C Row',
        col: i,
        pushMidi: cPush[i],
        pullMidi: cPull[i],
        pushNote: getMidiNoteName(cPush[i]),
        pullNote: getMidiNoteName(cPull[i]),
        label: `C${i + 1}`
      });
    }
    for (let i = 0; i < 10; i++) {
      buttons.push({
        id: `diatonic_3row_f_${i}`,
        buttonIndex: i + 1,
        row: 2,
        rowName: 'F Row',
        col: i,
        pushMidi: fPush[i],
        pullMidi: fPull[i],
        pushNote: getMidiNoteName(fPush[i]),
        pullNote: getMidiNoteName(fPull[i]),
        label: `F${i + 1}`
      });
    }
  }

  return { buttons, modelType };
}

// List of all supported accordion presets
export const ACCORDION_TYPES = {
  PIANO_41_120: {
    id: 'PIANO_41_120',
    name: 'Piano Accordion (41 Keys / 120 Bass)',
    category: 'Piano Accordion',
    description: 'Standard full-size classical and folk accordion with 41 piano treble keys and 120 Stradella bass buttons.',
    trebleType: 'PIANO',
    trebleStartMidi: 53, // F3
    trebleKeyCount: 41,  // F3 to A6
    bassType: 'STRADELLA',
    bassButtonCount: 120,
    isBisonoric: false,
    icon: '🎹'
  },
  PIANO_34_72: {
    id: 'PIANO_34_72',
    name: 'Compact Piano Accordion (34 Keys / 72 Bass)',
    category: 'Piano Accordion',
    description: 'Popular mid-size model for folk, jazz, and students. 34 piano keys (G3-E6) and 72 bass buttons.',
    trebleType: 'PIANO',
    trebleStartMidi: 55, // G3
    trebleKeyCount: 34,  // G3 to E6
    bassType: 'STRADELLA',
    bassButtonCount: 72,
    isBisonoric: false,
    icon: '🎹'
  },
  PIANO_26_48: {
    id: 'PIANO_26_48',
    name: 'Beginner Piano Accordion (26 Keys / 48 Bass)',
    category: 'Piano Accordion',
    description: 'Lightweight beginner accordion with 26 piano keys (B3-C6) and 48 bass buttons.',
    trebleType: 'PIANO',
    trebleStartMidi: 59, // B3
    trebleKeyCount: 26,  // B3 to C6
    bassType: 'STRADELLA',
    bassButtonCount: 48,
    isBisonoric: false,
    icon: '🎹'
  },
  CBA_C_SYSTEM: {
    id: 'CBA_C_SYSTEM',
    name: 'Chromatic Button Accordion (C-System / Bayan)',
    category: 'Chromatic Button',
    description: 'European standard 5-row button accordion with C in the 1st outer row.',
    trebleType: 'CBA_C',
    rowsCount: 5,
    bassType: 'STRADELLA',
    bassButtonCount: 120,
    isBisonoric: false,
    icon: '🔘'
  },
  CBA_B_SYSTEM: {
    id: 'CBA_B_SYSTEM',
    name: 'Chromatic Button Accordion (B-System / Russian Bayan)',
    category: 'Chromatic Button',
    description: 'Russian Bayan system with B in the outer row and inverted chromatic diagonals.',
    trebleType: 'CBA_B',
    rowsCount: 5,
    bassType: 'STRADELLA',
    bassButtonCount: 120,
    isBisonoric: false,
    icon: '🔘'
  },
  DIATONIC_3_ROW: {
    id: 'DIATONIC_3_ROW',
    name: 'Diatonic Accordion (3-Row GCF / Corona)',
    category: 'Diatonic Melodeon',
    description: 'Tex-Mex, Vallenato, and Cajun 3-row bisonoric accordion (different notes on Push vs Pull).',
    trebleType: 'DIATONIC',
    diatonicModel: '3_ROW_GCF',
    bassType: 'STRADELLA',
    bassButtonCount: 24,
    isBisonoric: true,
    icon: '🪗'
  },
  DIATONIC_2_ROW: {
    id: 'DIATONIC_2_ROW',
    name: 'Diatonic Melodeon (2-Row G/C)',
    category: 'Diatonic Melodeon',
    description: 'Traditional French, English, and Irish folk 2-row melodeon with push/pull bisonoric reeds.',
    trebleType: 'DIATONIC',
    diatonicModel: '2_ROW_GC',
    bassType: 'STRADELLA',
    bassButtonCount: 12,
    isBisonoric: true,
    icon: '🪗'
  },
  DIATONIC_1_ROW: {
    id: 'DIATONIC_1_ROW',
    name: 'Cajun 1-Row Melodeon (Key of C)',
    category: 'Diatonic Melodeon',
    description: 'Traditional 10-button single-row Cajun & Quebecois melodeon.',
    trebleType: 'DIATONIC',
    diatonicModel: '1_ROW_C',
    bassType: 'STRADELLA',
    bassButtonCount: 12,
    isBisonoric: true,
    icon: '🪗'
  }
};

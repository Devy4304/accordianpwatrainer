// Rich Accordion Song Library with Melody, Left-Hand Bass Chords, Fingerings & Bellows Dynamics

export const SONG_LIBRARY = [
  {
    id: 'bella_ciao',
    title: 'Bella Ciao',
    subtitle: 'Italian Folk / Partisan Anthem',
    category: 'Folk & Traditional',
    difficulty: 'Beginner',
    difficultyScore: 1,
    bpm: 116,
    timeSignature: '4/4',
    keySignature: 'Am',
    description: 'Energetic and iconic Italian folk melody. Great for learning rhythmic right-hand phrasing with alternating Am and E7 bass buttons.',
    notes: [
      // Measure 1: Pickup & intro (Am)
      { id: 'n1', pitch: 'E4', midi: 64, start: 0.0, duration: 0.5, hand: 'right', finger: 1, direction: 'push', bassId: 'Am_Bass' },
      { id: 'n2', pitch: 'A4', midi: 69, start: 0.5, duration: 0.5, hand: 'right', finger: 3, direction: 'push', bassId: 'Am_Chord' },
      { id: 'n3', pitch: 'B4', midi: 71, start: 1.0, duration: 0.5, hand: 'right', finger: 4, direction: 'push', bassId: 'Am_Bass' },
      { id: 'n4', pitch: 'C5', midi: 72, start: 1.5, duration: 0.5, hand: 'right', finger: 5, direction: 'push', bassId: 'Am_Chord' },
      { id: 'n5', pitch: 'A4', midi: 69, start: 2.0, duration: 1.0, hand: 'right', finger: 3, direction: 'push', bassId: 'Am_Bass' },
      { id: 'n6', pitch: 'E4', midi: 64, start: 3.0, duration: 0.5, hand: 'right', finger: 1, direction: 'pull', bassId: 'Am_Chord' },
      { id: 'n7', pitch: 'A4', midi: 69, start: 3.5, duration: 0.5, hand: 'right', finger: 3, direction: 'pull', bassId: 'Am_Bass' },

      // Measure 2 (Am)
      { id: 'n8', pitch: 'B4', midi: 71, start: 4.0, duration: 0.5, hand: 'right', finger: 4, direction: 'pull', bassId: 'Am_Chord' },
      { id: 'n9', pitch: 'C5', midi: 72, start: 4.5, duration: 0.5, hand: 'right', finger: 5, direction: 'pull', bassId: 'Am_Bass' },
      { id: 'n10', pitch: 'A4', midi: 69, start: 5.0, duration: 1.0, hand: 'right', finger: 3, direction: 'push', bassId: 'Am_Chord' },
      { id: 'n11', pitch: 'E4', midi: 64, start: 6.0, duration: 0.5, hand: 'right', finger: 1, direction: 'push', bassId: 'Am_Bass' },
      { id: 'n12', pitch: 'A4', midi: 69, start: 6.5, duration: 0.5, hand: 'right', finger: 3, direction: 'push', bassId: 'Am_Chord' },

      // Measure 3: "O bella ciao..." (Am -> Dm)
      { id: 'n13', pitch: 'B4', midi: 71, start: 7.0, duration: 0.5, hand: 'right', finger: 4, direction: 'push', bassId: 'Am_Bass' },
      { id: 'n14', pitch: 'C5', midi: 72, start: 7.5, duration: 0.5, hand: 'right', finger: 5, direction: 'push', bassId: 'Am_Chord' },
      { id: 'n15', pitch: 'A4', midi: 69, start: 8.0, duration: 0.5, hand: 'right', finger: 3, direction: 'pull', bassId: 'Dm_Bass' },
      { id: 'n16', pitch: 'A4', midi: 69, start: 8.5, duration: 0.5, hand: 'right', finger: 3, direction: 'pull', bassId: 'Dm_Chord' },
      { id: 'n17', pitch: 'B4', midi: 71, start: 9.0, duration: 0.5, hand: 'right', finger: 4, direction: 'pull', bassId: 'Dm_Bass' },
      { id: 'n18', pitch: 'C5', midi: 72, start: 9.5, duration: 0.5, hand: 'right', finger: 5, direction: 'pull', bassId: 'Dm_Chord' },

      // Measure 4 (Dm -> D5)
      { id: 'n19', pitch: 'D5', midi: 74, start: 10.0, duration: 1.0, hand: 'right', finger: 5, direction: 'pull', bassId: 'Dm_Bass' },
      { id: 'n20', pitch: 'D5', midi: 74, start: 11.0, duration: 0.5, hand: 'right', finger: 5, direction: 'pull', bassId: 'Dm_Chord' },
      { id: 'n21', pitch: 'D5', midi: 74, start: 11.5, duration: 0.5, hand: 'right', finger: 5, direction: 'pull', bassId: 'Dm_Bass' },
      { id: 'n22', pitch: 'E5', midi: 76, start: 12.0, duration: 0.5, hand: 'right', finger: 5, direction: 'push', bassId: 'Dm_Chord' },
      { id: 'n23', pitch: 'D5', midi: 74, start: 12.5, duration: 0.5, hand: 'right', finger: 4, direction: 'push', bassId: 'Am_Bass' },

      // Measure 5 (Am)
      { id: 'n24', pitch: 'C5', midi: 72, start: 13.0, duration: 0.5, hand: 'right', finger: 3, direction: 'push', bassId: 'Am_Chord' },
      { id: 'n25', pitch: 'B4', midi: 71, start: 13.5, duration: 0.5, hand: 'right', finger: 2, direction: 'push', bassId: 'Am_Bass' },
      { id: 'n26', pitch: 'C5', midi: 72, start: 14.0, duration: 1.0, hand: 'right', finger: 3, direction: 'push', bassId: 'Am_Chord' },
      { id: 'n27', pitch: 'E5', midi: 76, start: 15.0, duration: 0.5, hand: 'right', finger: 5, direction: 'pull', bassId: 'E7_Bass' },
      { id: 'n28', pitch: 'D5', midi: 74, start: 15.5, duration: 0.5, hand: 'right', finger: 4, direction: 'pull', bassId: 'E7_Chord' },

      // Measure 6 (E7 -> Am resolution)
      { id: 'n29', pitch: 'C5', midi: 72, start: 16.0, duration: 0.5, hand: 'right', finger: 3, direction: 'pull', bassId: 'E7_Bass' },
      { id: 'n30', pitch: 'B4', midi: 71, start: 16.5, duration: 0.5, hand: 'right', finger: 2, direction: 'pull', bassId: 'E7_Chord' },
      { id: 'n31', pitch: 'A4', midi: 69, start: 17.0, duration: 2.0, hand: 'right', finger: 1, direction: 'push', bassId: 'Am_Bass' }
    ]
  },
  {
    id: 'tarantella_napoletana',
    title: 'Tarantella Napoletana',
    subtitle: 'Traditional Neapolitan Dance',
    category: 'Italian Accordion',
    difficulty: 'Intermediate',
    difficultyScore: 3,
    bpm: 132,
    timeSignature: '6/8',
    keySignature: 'Am',
    description: 'Fast, joyous Italian accordion showstopper. Features characteristic 6/8 triplet triplets and jumping bass accompaniment.',
    notes: [
      { id: 't1', pitch: 'E4', midi: 64, start: 0.0, duration: 0.5, hand: 'right', finger: 1, direction: 'push', bassId: 'Am_Bass' },
      { id: 't2', pitch: 'A4', midi: 69, start: 0.5, duration: 0.5, hand: 'right', finger: 3, direction: 'push', bassId: 'Am_Chord' },
      { id: 't3', pitch: 'C5', midi: 72, start: 1.0, duration: 0.5, hand: 'right', finger: 5, direction: 'push', bassId: 'Am_Chord' },
      { id: 't4', pitch: 'B4', midi: 71, start: 1.5, duration: 0.5, hand: 'right', finger: 4, direction: 'push', bassId: 'E7_Bass' },
      { id: 't5', pitch: 'A4', midi: 69, start: 2.0, duration: 0.5, hand: 'right', finger: 3, direction: 'push', bassId: 'E7_Chord' },
      { id: 't6', pitch: 'G#4', midi: 68, start: 2.5, duration: 0.5, hand: 'right', finger: 2, direction: 'push', bassId: 'E7_Chord' },

      { id: 't7', pitch: 'A4', midi: 69, start: 3.0, duration: 0.5, hand: 'right', finger: 3, direction: 'pull', bassId: 'Am_Bass' },
      { id: 't8', pitch: 'B4', midi: 71, start: 3.5, duration: 0.5, hand: 'right', finger: 4, direction: 'pull', bassId: 'Am_Chord' },
      { id: 't9', pitch: 'C5', midi: 72, start: 4.0, duration: 0.5, hand: 'right', finger: 5, direction: 'pull', bassId: 'Am_Chord' },
      { id: 't10', pitch: 'B4', midi: 71, start: 4.5, duration: 0.5, hand: 'right', finger: 4, direction: 'pull', bassId: 'E7_Bass' },
      { id: 't11', pitch: 'A4', midi: 69, start: 5.0, duration: 0.5, hand: 'right', finger: 3, direction: 'pull', bassId: 'E7_Chord' },
      { id: 't12', pitch: 'G#4', midi: 68, start: 5.5, duration: 0.5, hand: 'right', finger: 2, direction: 'pull', bassId: 'E7_Chord' },

      { id: 't13', pitch: 'A4', midi: 69, start: 6.0, duration: 1.0, hand: 'right', finger: 3, direction: 'push', bassId: 'Am_Bass' },
      { id: 't14', pitch: 'C5', midi: 72, start: 7.0, duration: 0.5, hand: 'right', finger: 5, direction: 'push', bassId: 'Am_Chord' },
      { id: 't15', pitch: 'E5', midi: 76, start: 7.5, duration: 1.0, hand: 'right', finger: 5, direction: 'push', bassId: 'Am_Bass' },
      { id: 't16', pitch: 'D5', midi: 74, start: 8.5, duration: 0.5, hand: 'right', finger: 4, direction: 'push', bassId: 'Dm_Bass' },
      { id: 't17', pitch: 'C5', midi: 72, start: 9.0, duration: 0.5, hand: 'right', finger: 3, direction: 'pull', bassId: 'Dm_Chord' },
      { id: 't18', pitch: 'B4', midi: 71, start: 9.5, duration: 0.5, hand: 'right', finger: 2, direction: 'pull', bassId: 'E7_Bass' },
      { id: 't19', pitch: 'A4', midi: 69, start: 10.0, duration: 1.5, hand: 'right', finger: 1, direction: 'pull', bassId: 'Am_Bass' }
    ]
  },
  {
    id: 'korobeiniki',
    title: 'Korobeiniki (Tetris Theme)',
    subtitle: 'Russian Folk / Peddlers Song',
    category: 'Folk & Traditional',
    difficulty: 'Intermediate',
    difficultyScore: 2,
    bpm: 128,
    timeSignature: '4/4',
    keySignature: 'Am',
    description: 'World-famous Russian folk song made legendary by Tetris. Brilliant piece for bellows control and right-hand runs.',
    notes: [
      { id: 'k1', pitch: 'E5', midi: 76, start: 0.0, duration: 1.0, hand: 'right', finger: 5, direction: 'push', bassId: 'Am_Bass' },
      { id: 'k2', pitch: 'B4', midi: 71, start: 1.0, duration: 0.5, hand: 'right', finger: 2, direction: 'push', bassId: 'E7_Bass' },
      { id: 'k3', pitch: 'C5', midi: 72, start: 1.5, duration: 0.5, hand: 'right', finger: 3, direction: 'push', bassId: 'E7_Chord' },
      { id: 'k4', pitch: 'D5', midi: 74, start: 2.0, duration: 1.0, hand: 'right', finger: 4, direction: 'push', bassId: 'Dm_Bass' },
      { id: 'k5', pitch: 'C5', midi: 72, start: 3.0, duration: 0.5, hand: 'right', finger: 3, direction: 'push', bassId: 'Am_Bass' },
      { id: 'k6', pitch: 'B4', midi: 71, start: 3.5, duration: 0.5, hand: 'right', finger: 2, direction: 'push', bassId: 'Am_Chord' },

      { id: 'k7', pitch: 'A4', midi: 69, start: 4.0, duration: 1.0, hand: 'right', finger: 1, direction: 'pull', bassId: 'Am_Bass' },
      { id: 'k8', pitch: 'A4', midi: 69, start: 5.0, duration: 0.5, hand: 'right', finger: 1, direction: 'pull', bassId: 'Am_Chord' },
      { id: 'k9', pitch: 'C5', midi: 72, start: 5.5, duration: 0.5, hand: 'right', finger: 3, direction: 'pull', bassId: 'Am_Bass' },
      { id: 'k10', pitch: 'E5', midi: 76, start: 6.0, duration: 1.0, hand: 'right', finger: 5, direction: 'pull', bassId: 'E7_Bass' },
      { id: 'k11', pitch: 'D5', midi: 74, start: 7.0, duration: 0.5, hand: 'right', finger: 4, direction: 'pull', bassId: 'Dm_Bass' },
      { id: 'k12', pitch: 'C5', midi: 72, start: 7.5, duration: 0.5, hand: 'right', finger: 3, direction: 'pull', bassId: 'Dm_Chord' },

      { id: 'k13', pitch: 'B4', midi: 71, start: 8.0, duration: 1.5, hand: 'right', finger: 2, direction: 'push', bassId: 'E7_Bass' },
      { id: 'k14', pitch: 'C5', midi: 72, start: 9.5, duration: 0.5, hand: 'right', finger: 3, direction: 'push', bassId: 'E7_Chord' },
      { id: 'k15', pitch: 'D5', midi: 74, start: 10.0, duration: 1.0, hand: 'right', finger: 4, direction: 'push', bassId: 'Dm_Bass' },
      { id: 'k16', pitch: 'E5', midi: 76, start: 11.0, duration: 1.0, hand: 'right', finger: 5, direction: 'push', bassId: 'Am_Bass' },
      { id: 'k17', pitch: 'C5', midi: 72, start: 12.0, duration: 1.0, hand: 'right', finger: 3, direction: 'push', bassId: 'Am_Chord' },
      { id: 'k18', pitch: 'A4', midi: 69, start: 13.0, duration: 1.0, hand: 'right', finger: 1, direction: 'push', bassId: 'Am_Bass' },
      { id: 'k19', pitch: 'A4', midi: 69, start: 14.0, duration: 2.0, hand: 'right', finger: 1, direction: 'push', bassId: 'Am_Chord' }
    ]
  },
  {
    id: 'beer_barrel_polka',
    title: 'Beer Barrel Polka (Roll Out the Barrel)',
    subtitle: 'Classic Bohemian Polka',
    category: 'Polka & Oktoberfest',
    difficulty: 'Intermediate',
    difficultyScore: 3,
    bpm: 124,
    timeSignature: '2/4',
    keySignature: 'C',
    description: 'The quintessential accordion polka anthem. Features bright upbeat rhythms with alternating C and G bass-chord boom-chick patterns.',
    notes: [
      { id: 'p1', pitch: 'G4', midi: 67, start: 0.0, duration: 0.5, hand: 'right', finger: 1, direction: 'push', bassId: 'C_Bass' },
      { id: 'p2', pitch: 'A4', midi: 69, start: 0.5, duration: 0.5, hand: 'right', finger: 2, direction: 'push', bassId: 'C_Chord' },
      { id: 'p3', pitch: 'B4', midi: 71, start: 1.0, duration: 0.5, hand: 'right', finger: 3, direction: 'push', bassId: 'C_Bass' },
      { id: 'p4', pitch: 'C5', midi: 72, start: 1.5, duration: 0.5, hand: 'right', finger: 4, direction: 'push', bassId: 'C_Chord' },
      { id: 'p5', pitch: 'E5', midi: 76, start: 2.0, duration: 1.0, hand: 'right', finger: 5, direction: 'push', bassId: 'C_Bass' },
      { id: 'p6', pitch: 'E5', midi: 76, start: 3.0, duration: 1.0, hand: 'right', finger: 5, direction: 'push', bassId: 'C_Chord' },

      { id: 'p7', pitch: 'D5', midi: 74, start: 4.0, duration: 0.5, hand: 'right', finger: 4, direction: 'pull', bassId: 'G7_Bass' },
      { id: 'p8', pitch: 'C5', midi: 72, start: 4.5, duration: 0.5, hand: 'right', finger: 3, direction: 'pull', bassId: 'G7_Chord' },
      { id: 'p9', pitch: 'D5', midi: 74, start: 5.0, duration: 1.0, hand: 'right', finger: 4, direction: 'pull', bassId: 'G7_Bass' },
      { id: 'p10', pitch: 'F5', midi: 77, start: 6.0, duration: 1.0, hand: 'right', finger: 5, direction: 'pull', bassId: 'G7_Chord' },
      { id: 'p11', pitch: 'F5', midi: 77, start: 7.0, duration: 1.0, hand: 'right', finger: 5, direction: 'pull', bassId: 'G7_Bass' },

      { id: 'p12', pitch: 'E5', midi: 76, start: 8.0, duration: 0.5, hand: 'right', finger: 4, direction: 'push', bassId: 'C_Bass' },
      { id: 'p13', pitch: 'D5', midi: 74, start: 8.5, duration: 0.5, hand: 'right', finger: 3, direction: 'push', bassId: 'C_Chord' },
      { id: 'p14', pitch: 'C5', midi: 72, start: 9.0, duration: 1.0, hand: 'right', finger: 2, direction: 'push', bassId: 'C_Bass' },
      { id: 'p15', pitch: 'G4', midi: 67, start: 10.0, duration: 2.0, hand: 'right', finger: 1, direction: 'push', bassId: 'C_Chord' }
    ]
  },
  {
    id: 'la_vie_en_rose',
    title: 'La Vie En Rose',
    subtitle: 'French Musette Waltz',
    category: 'French Musette',
    difficulty: 'Intermediate',
    difficultyScore: 3,
    bpm: 96,
    timeSignature: '3/4',
    keySignature: 'C',
    description: 'Romantic French musette waltz. Ideal for practicing gentle expressive bellow movements and smooth waltz bass (Bass-Chord-Chord).',
    notes: [
      { id: 'v1', pitch: 'G4', midi: 67, start: 0.0, duration: 1.0, hand: 'right', finger: 1, direction: 'push', bassId: 'C_Bass' },
      { id: 'v2', pitch: 'A4', midi: 69, start: 1.0, duration: 1.0, hand: 'right', finger: 2, direction: 'push', bassId: 'C_Chord' },
      { id: 'v3', pitch: 'B4', midi: 71, start: 2.0, duration: 1.0, hand: 'right', finger: 3, direction: 'push', bassId: 'C_Chord' },

      { id: 'v4', pitch: 'C5', midi: 72, start: 3.0, duration: 2.0, hand: 'right', finger: 4, direction: 'push', bassId: 'C_Bass' },
      { id: 'v5', pitch: 'B4', midi: 71, start: 5.0, duration: 1.0, hand: 'right', finger: 3, direction: 'push', bassId: 'C_Chord' },

      { id: 'v6', pitch: 'A4', midi: 69, start: 6.0, duration: 2.0, hand: 'right', finger: 2, direction: 'pull', bassId: 'Dm_Bass' },
      { id: 'v7', pitch: 'G4', midi: 67, start: 8.0, duration: 1.0, hand: 'right', finger: 1, direction: 'pull', bassId: 'Dm_Chord' },

      { id: 'v8', pitch: 'F4', midi: 65, start: 9.0, duration: 3.0, hand: 'right', finger: 1, direction: 'pull', bassId: 'G7_Bass' },

      { id: 'v9', pitch: 'E4', midi: 64, start: 12.0, duration: 3.0, hand: 'right', finger: 1, direction: 'push', bassId: 'C_Bass' }
    ]
  },
  {
    id: 'ode_to_joy',
    title: 'Ode to Joy',
    subtitle: 'L. van Beethoven (9th Symphony)',
    category: 'Classical & Easy',
    difficulty: 'Beginner',
    difficultyScore: 1,
    bpm: 108,
    timeSignature: '4/4',
    keySignature: 'C',
    description: 'Perfect introductory song for beginners. Uses 5 consecutive right-hand fingers in C position without needing finger shifts.',
    notes: [
      { id: 'o1', pitch: 'E4', midi: 64, start: 0.0, duration: 1.0, hand: 'right', finger: 3, direction: 'push', bassId: 'C_Bass' },
      { id: 'o2', pitch: 'E4', midi: 64, start: 1.0, duration: 1.0, hand: 'right', finger: 3, direction: 'push', bassId: 'C_Chord' },
      { id: 'o3', pitch: 'F4', midi: 65, start: 2.0, duration: 1.0, hand: 'right', finger: 4, direction: 'push', bassId: 'C_Bass' },
      { id: 'o4', pitch: 'G4', midi: 67, start: 3.0, duration: 1.0, hand: 'right', finger: 5, direction: 'push', bassId: 'C_Chord' },

      { id: 'o5', pitch: 'G4', midi: 67, start: 4.0, duration: 1.0, hand: 'right', finger: 5, direction: 'pull', bassId: 'G_Bass' },
      { id: 'o6', pitch: 'F4', midi: 65, start: 5.0, duration: 1.0, hand: 'right', finger: 4, direction: 'pull', bassId: 'G_Chord' },
      { id: 'o7', pitch: 'E4', midi: 64, start: 6.0, duration: 1.0, hand: 'right', finger: 3, direction: 'pull', bassId: 'G_Bass' },
      { id: 'o8', pitch: 'D4', midi: 62, start: 7.0, duration: 1.0, hand: 'right', finger: 2, direction: 'pull', bassId: 'G_Chord' },

      { id: 'o9', pitch: 'C4', midi: 60, start: 8.0, duration: 1.0, hand: 'right', finger: 1, direction: 'push', bassId: 'C_Bass' },
      { id: 'o10', pitch: 'C4', midi: 60, start: 9.0, duration: 1.0, hand: 'right', finger: 1, direction: 'push', bassId: 'C_Chord' },
      { id: 'o11', pitch: 'D4', midi: 62, start: 10.0, duration: 1.0, hand: 'right', finger: 2, direction: 'push', bassId: 'C_Bass' },
      { id: 'o12', pitch: 'E4', midi: 64, start: 11.0, duration: 1.0, hand: 'right', finger: 3, direction: 'push', bassId: 'C_Chord' },

      { id: 'o13', pitch: 'E4', midi: 64, start: 12.0, duration: 1.5, hand: 'right', finger: 3, direction: 'push', bassId: 'G_Bass' },
      { id: 'o14', pitch: 'D4', midi: 62, start: 13.5, duration: 0.5, hand: 'right', finger: 2, direction: 'push', bassId: 'G_Chord' },
      { id: 'o15', pitch: 'D4', midi: 62, start: 14.0, duration: 2.0, hand: 'right', finger: 2, direction: 'push', bassId: 'G_Bass' }
    ]
  },
  {
    id: 'scarborough_fair',
    title: 'Scarborough Fair',
    subtitle: 'Traditional English Ballad',
    category: 'Folk & Traditional',
    difficulty: 'Intermediate',
    difficultyScore: 2,
    bpm: 100,
    timeSignature: '3/4',
    keySignature: 'Dm',
    description: 'Haunting Dorian mode folk tune. Builds smooth legato phrasing and Dm to C major bass transitions.',
    notes: [
      { id: 's1', pitch: 'D4', midi: 62, start: 0.0, duration: 2.0, hand: 'right', finger: 1, direction: 'push', bassId: 'Dm_Bass' },
      { id: 's2', pitch: 'D4', midi: 62, start: 2.0, duration: 1.0, hand: 'right', finger: 1, direction: 'push', bassId: 'Dm_Chord' },

      { id: 's3', pitch: 'A4', midi: 69, start: 3.0, duration: 2.0, hand: 'right', finger: 4, direction: 'push', bassId: 'Dm_Bass' },
      { id: 's4', pitch: 'A4', midi: 69, start: 5.0, duration: 1.0, hand: 'right', finger: 4, direction: 'push', bassId: 'Dm_Chord' },

      { id: 's5', pitch: 'E4', midi: 64, start: 6.0, duration: 1.5, hand: 'right', finger: 2, direction: 'pull', bassId: 'C_Bass' },
      { id: 's6', pitch: 'F4', midi: 65, start: 7.5, duration: 0.5, hand: 'right', finger: 3, direction: 'pull', bassId: 'C_Chord' },
      { id: 's7', pitch: 'E4', midi: 64, start: 8.0, duration: 1.0, hand: 'right', finger: 2, direction: 'pull', bassId: 'C_Chord' },

      { id: 's8', pitch: 'D4', midi: 62, start: 9.0, duration: 3.0, hand: 'right', finger: 1, direction: 'push', bassId: 'Dm_Bass' }
    ]
  },
  {
    id: 'drunken_sailor',
    title: 'Drunken Sailor',
    subtitle: 'Traditional Sea Shanty',
    category: 'Folk & Sea Shanty',
    difficulty: 'Beginner',
    difficultyScore: 1,
    bpm: 120,
    timeSignature: '4/4',
    keySignature: 'Dm',
    description: 'Fun, punchy sea shanty. Great for building energetic syncopation and snappy push/pull articulation.',
    notes: [
      { id: 'd1', pitch: 'D4', midi: 62, start: 0.0, duration: 0.5, hand: 'right', finger: 1, direction: 'push', bassId: 'Dm_Bass' },
      { id: 'd2', pitch: 'D4', midi: 62, start: 0.5, duration: 0.5, hand: 'right', finger: 1, direction: 'push', bassId: 'Dm_Chord' },
      { id: 'd3', pitch: 'D4', midi: 62, start: 1.0, duration: 0.5, hand: 'right', finger: 1, direction: 'push', bassId: 'Dm_Bass' },
      { id: 'd4', pitch: 'D4', midi: 62, start: 1.5, duration: 0.5, hand: 'right', finger: 1, direction: 'push', bassId: 'Dm_Chord' },
      { id: 'd5', pitch: 'D4', midi: 62, start: 2.0, duration: 1.0, hand: 'right', finger: 1, direction: 'push', bassId: 'Dm_Bass' },
      { id: 'd6', pitch: 'D4', midi: 62, start: 3.0, duration: 1.0, hand: 'right', finger: 1, direction: 'push', bassId: 'Dm_Chord' },

      { id: 'd7', pitch: 'E4', midi: 64, start: 4.0, duration: 0.5, hand: 'right', finger: 2, direction: 'pull', bassId: 'C_Bass' },
      { id: 'd8', pitch: 'E4', midi: 64, start: 4.5, duration: 0.5, hand: 'right', finger: 2, direction: 'pull', bassId: 'C_Chord' },
      { id: 'd9', pitch: 'E4', midi: 64, start: 5.0, duration: 0.5, hand: 'right', finger: 2, direction: 'pull', bassId: 'C_Bass' },
      { id: 'd10', pitch: 'E4', midi: 64, start: 5.5, duration: 0.5, hand: 'right', finger: 2, direction: 'pull', bassId: 'C_Chord' },
      { id: 'd11', pitch: 'E4', midi: 64, start: 6.0, duration: 1.0, hand: 'right', finger: 2, direction: 'pull', bassId: 'C_Bass' },
      { id: 'd12', pitch: 'E4', midi: 64, start: 7.0, duration: 1.0, hand: 'right', finger: 2, direction: 'pull', bassId: 'C_Chord' },

      { id: 'd13', pitch: 'F4', midi: 65, start: 8.0, duration: 1.0, hand: 'right', finger: 3, direction: 'push', bassId: 'Dm_Bass' },
      { id: 'd14', pitch: 'E4', midi: 64, start: 9.0, duration: 1.0, hand: 'right', finger: 2, direction: 'push', bassId: 'Dm_Chord' },
      { id: 'd15', pitch: 'D4', midi: 62, start: 10.0, duration: 1.0, hand: 'right', finger: 1, direction: 'push', bassId: 'Dm_Bass' },
      { id: 'd16', pitch: 'C4', midi: 60, start: 11.0, duration: 1.0, hand: 'right', finger: 1, direction: 'push', bassId: 'C_Bass' },
      { id: 'd17', pitch: 'D4', midi: 62, start: 12.0, duration: 2.0, hand: 'right', finger: 2, direction: 'push', bassId: 'Dm_Bass' }
    ]
  },
  {
    id: 'silent_night',
    title: 'Silent Night (Stille Nacht)',
    subtitle: 'Franz Xaver Gruber',
    category: 'Holiday & Classical',
    difficulty: 'Beginner',
    difficultyScore: 1,
    bpm: 88,
    timeSignature: '3/4',
    keySignature: 'C',
    description: 'Gentle Christmas waltz. Excellent for developing subtle bellows pressure and soothing musette tone.',
    notes: [
      { id: 'sn1', pitch: 'G4', midi: 67, start: 0.0, duration: 1.5, hand: 'right', finger: 3, direction: 'push', bassId: 'C_Bass' },
      { id: 'sn2', pitch: 'A4', midi: 69, start: 1.5, duration: 0.5, hand: 'right', finger: 4, direction: 'push', bassId: 'C_Chord' },
      { id: 'sn3', pitch: 'G4', midi: 67, start: 2.0, duration: 1.0, hand: 'right', finger: 3, direction: 'push', bassId: 'C_Chord' },

      { id: 'sn4', pitch: 'E4', midi: 64, start: 3.0, duration: 3.0, hand: 'right', finger: 1, direction: 'push', bassId: 'C_Bass' },

      { id: 'sn5', pitch: 'G4', midi: 67, start: 6.0, duration: 1.5, hand: 'right', finger: 3, direction: 'push', bassId: 'C_Bass' },
      { id: 'sn6', pitch: 'A4', midi: 69, start: 7.5, duration: 0.5, hand: 'right', finger: 4, direction: 'push', bassId: 'C_Chord' },
      { id: 'sn7', pitch: 'G4', midi: 67, start: 8.0, duration: 1.0, hand: 'right', finger: 3, direction: 'push', bassId: 'C_Chord' },

      { id: 'sn8', pitch: 'E4', midi: 64, start: 9.0, duration: 3.0, hand: 'right', finger: 1, direction: 'push', bassId: 'C_Bass' },

      { id: 'sn9', pitch: 'D5', midi: 74, start: 12.0, duration: 2.0, hand: 'right', finger: 5, direction: 'pull', bassId: 'G7_Bass' },
      { id: 'sn10', pitch: 'D5', midi: 74, start: 14.0, duration: 1.0, hand: 'right', finger: 5, direction: 'pull', bassId: 'G7_Chord' },

      { id: 'sn11', pitch: 'B4', midi: 71, start: 15.0, duration: 3.0, hand: 'right', finger: 3, direction: 'pull', bassId: 'G7_Bass' },

      { id: 'sn12', pitch: 'C5', midi: 72, start: 18.0, duration: 2.0, hand: 'right', finger: 4, direction: 'push', bassId: 'C_Bass' },
      { id: 'sn13', pitch: 'C5', midi: 72, start: 20.0, duration: 1.0, hand: 'right', finger: 4, direction: 'push', bassId: 'C_Chord' },

      { id: 'sn14', pitch: 'G4', midi: 67, start: 21.0, duration: 3.0, hand: 'right', finger: 1, direction: 'push', bassId: 'C_Bass' }
    ]
  }
];

export function getSongById(id) {
  return SONG_LIBRARY.find(s => s.id === id) || SONG_LIBRARY[0];
}

export function calculateSongDurationBeats(song) {
  if (!song.notes || song.notes.length === 0) return 0;
  return Math.max(...song.notes.map(n => n.start + n.duration));
}

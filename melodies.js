// Each box has its own melody and a name.
// Notes are semitones above C4 (null = a rest). Every melody has 8 beats.
const melodies = [
  [0, 4, 7, 4, 0, 4, 7, null],
  [12, null, 11, 9, 7, null, 9, 7],
  [-12, null, -5, null, -12, null, -7, null],
  [4, 4, 7, 7, 9, 9, 7, null],
  [7, 5, 4, 2, 0, 2, 4, null],
  [16, 14, 12, 14, 16, 16, 16, null]
];
const melodyNames = ['Arpeggio', 'Wanderer', 'Slow bass', 'Climb', 'Stairs', 'Twinkle'];

let audioCtx = null;

// turn semitones into a frequency (C4 = 261.63 Hz)
function noteFreq(semi) {
  return 261.63 * Math.pow(2, semi / 12);
}

// a soft little bell-ish pluck
function playNote(semi, when, length) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = noteFreq(semi);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(0.18, when + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + length);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(when);
  osc.stop(when + length + 0.05);
}

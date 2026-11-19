// Step 2: each box gets its own short melody.
// Notes are semitones above C4 (null = a rest). Every melody has 8 beats.
const melodies = [
  [0, 4, 7, 4, 0, 4, 7, null],          // box 1: happy little arpeggio
  [12, null, 11, 9, 7, null, 9, 7],     // box 2: high and wandering
  [-12, null, -5, null, -12, null, -7, null], // box 3: slow low bass
  [4, 4, 7, 7, 9, 9, 7, null],          // box 4: steady climb
  [7, 5, 4, 2, 0, 2, 4, null],          // box 5: walking down the stairs
  [16, 14, 12, 14, 16, 16, 16, null]    // box 6: twinkly top
];

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
  gain.gain.exponentialRampToValueAtTime(0.25, when + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + length);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(when);
  osc.stop(when + length + 0.05);
}

// play one box's whole melody once (real start/stop and timing come in later steps)
function playMelody(index) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const beat = 0.3;
  const t0 = audioCtx.currentTime + 0.05;
  melodies[index].forEach((n, i) => {
    if (n !== null) playNote(n, t0 + i * beat, beat * 1.5);
  });
}

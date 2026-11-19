// Step 3: tapping a box turns it on or off. An on box loops its melody.
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const colors = ['#e07a5f', '#f2cc8f', '#81b29a', '#6d9dc5', '#b58bd6', '#f28fad'];
const on = colors.map(() => false);

// layout shared by drawing and tapping
const bw = 100, bh = 110, gap = 40;
const startX = (canvas.width - (colors.length * bw + (colors.length - 1) * gap)) / 2;
const boxY = 100;

// --- the beat scheduler (one shared beat, so boxes line up) ---
const beat = 0.3;
let timer = null;
let nextTime = 0;
let step = 0;
let queue = [];      // beats waiting to be shown
let shownStep = -1;  // the beat we are on right now

function anyOn() { return on.some(Boolean); }

function tick() {
  while (nextTime < audioCtx.currentTime + 0.2) {
    const s = step % 8;
    for (let i = 0; i < on.length; i++) {
      const n = melodies[i][s];
      if (on[i] && n !== null) playNote(n, nextTime, beat * 1.5);
    }
    queue.push({ s: s, t: nextTime });
    nextTime += beat;
    step++;
  }
}

function startClock() {
  if (timer) return;
  nextTime = audioCtx.currentTime + 0.05;
  step = 0;
  queue = [];
  tick();
  timer = setInterval(tick, 50);
}

function stopClock() {
  clearInterval(timer);
  timer = null;
  queue = [];
  shownStep = -1;
}

function toggle(i) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  on[i] = !on[i];
  if (anyOn()) startClock(); else stopClock();
  const names = [];
  on.forEach((v, k) => { if (v) names.push((k + 1) + ' (' + melodyNames[k] + ')'); });
  statusEl.textContent = names.length ? 'Playing: box ' + names.join(', box ') : 'All boxes are quiet.';
}

// --- drawing ---
function drawBox(x, y, w, h, color, active) {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x - 4, boxY + h, w + 8, 8);
  ctx.globalAlpha = active ? 1 : 0.55;
  ctx.fillStyle = color;
  ctx.fillRect(x, y + h * 0.25, w, h * 0.75);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x - 3, y + h * 0.15, w + 6, h * 0.12);
  ctx.strokeStyle = '#3d2c1e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + w, y + h * 0.6);
  ctx.lineTo(x + w + 14, y + h * 0.6);
  ctx.lineTo(x + w + 14, y + h * 0.5);
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(x + w * 0.15, y + h * 0.45, w * 0.7, h * 0.3);
  ctx.fillStyle = '#f1e6c8';
  for (let i = 0; i < 6; i++) {
    const tx = x + w * 0.2 + i * (w * 0.6 / 5);
    ctx.fillRect(tx - 1.5, y + h * 0.5, 3, h * (0.08 + 0.03 * i));
  }
  ctx.globalAlpha = 1;
}

// a tiny piano roll showing the box's melody; current beat is lit when playing
function drawRoll(x, i) {
  const top = 250, h = 60, cw = bw / 8;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(x, top, bw, h);
  for (let s = 0; s < 8; s++) {
    const n = melodies[i][s];
    const here = on[i] && s === shownStep;
    if (here) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(x + s * cw, top, cw, h);
    }
    if (n === null) continue;
    const ny = top + h - 6 - (n + 12) / 28 * (h - 12);
    ctx.fillStyle = here ? '#ffffff' : colors[i];
    ctx.globalAlpha = on[i] ? 1 : 0.5;
    ctx.fillRect(x + s * cw + 1, ny - 3, cw - 2, 6);
    ctx.globalAlpha = 1;
  }
}

function draw() {
  if (audioCtx) {
    while (queue.length && queue[0].t <= audioCtx.currentTime) shownStep = queue.shift().s;
  }
  const now = performance.now() / 1000;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(20, boxY + bh + 8, canvas.width - 40, 14);
  ctx.textAlign = 'center';
  for (let i = 0; i < colors.length; i++) {
    const x = startX + i * (bw + gap);
    // playing boxes bob a little on the shelf
    const bob = on[i] && shownStep >= 0 && shownStep % 2 === 0 ? -3 : 0;
    drawBox(x, boxY + bob, bw, bh, colors[i], on[i]);
    ctx.fillStyle = on[i] ? '#f1e6c8' : 'rgba(241,230,200,0.6)';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText('Box ' + (i + 1), x + bw / 2, 52);
    ctx.font = '14px Georgia, serif';
    ctx.fillStyle = on[i] ? colors[i] : 'rgba(241,230,200,0.5)';
    ctx.fillText(on[i] ? '♪ ON' : 'off', x + bw / 2, 76);
    drawRoll(x, i);
    ctx.fillStyle = 'rgba(241,230,200,0.8)';
    ctx.font = '14px Georgia, serif';
    ctx.fillText(melodyNames[i], x + bw / 2, 336);
  }
  requestAnimationFrame(draw);
}

// which box was tapped? (mouse and touch; canvas may be scaled)
canvas.addEventListener('pointerdown', (e) => {
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) * canvas.width / r.width;
  const y = (e.clientY - r.top) * canvas.height / r.height;
  for (let i = 0; i < colors.length; i++) {
    const bx = startX + i * (bw + gap) - 10;
    if (x >= bx && x <= bx + bw + 34 && y >= 30 && y <= 345) {
      toggle(i);
      break;
    }
  }
});

draw();

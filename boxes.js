// Step 5: a soft glow flares around a box each time it sounds a note.
// All boxes still share ONE clock; a box tapped mid-music waits for the next bar.
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const colors = ['#e07a5f', '#f2cc8f', '#81b29a', '#6d9dc5', '#b58bd6', '#f28fad'];
const on = colors.map(() => false);
const waiting = colors.map(() => false);
const glowAt = colors.map(() => -10000); // when each box last sounded a note (ms)
let hover = -1;

const bw = 100, bh = 110, gap = 40;
const startX = (canvas.width - (colors.length * bw + (colors.length - 1) * gap)) / 2;
const boxY = 100;

// --- the shared beat scheduler ---
const beat = 0.3;
let timer = null;
let nextTime = 0;
let step = 0;
let queue = [];
let shownStep = -1;
let shownAct = on.map(() => false);

function anyActive() { return on.some(Boolean) || waiting.some(Boolean); }

function tick() {
  while (nextTime < audioCtx.currentTime + 0.2) {
    const s = step % 8;
    // bar line: waiting boxes join here, all together on beat 1
    if (s === 0) {
      for (let i = 0; i < on.length; i++) if (waiting[i]) { waiting[i] = false; on[i] = true; }
    }
    const sounded = on.map(() => false);
    for (let i = 0; i < on.length; i++) {
      const n = melodies[i][s];
      if (on[i] && n !== null) { playNote(n, nextTime, beat * 1.5); sounded[i] = true; }
    }
    queue.push({ s: s, t: nextTime, act: on.slice(), sounded: sounded });
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
  shownAct = on.map(() => false);
}

function toggle(i) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (on[i] || waiting[i]) {
    on[i] = false; waiting[i] = false;
  } else if (timer) {
    waiting[i] = true;
  } else {
    on[i] = true;
  }
  if (anyActive()) { if (on.some(Boolean) || !timer) startClock(); } else stopClock();
  const names = [];
  on.forEach((v, k) => { if (v) names.push(melodyNames[k]); });
  const w = waiting.filter(Boolean).length;
  let msg = names.length ? 'Playing: ' + names.join(', ') : 'All boxes are quiet. Tap a dashed box to begin.';
  if (w) msg += ' (' + w + ' waiting for the next bar)';
  statusEl.textContent = msg;
}

// --- drawing ---
// the soft glow: a radial gradient that flares on each note and fades away
function drawGlow(x, i, now) {
  const age = now - glowAt[i];
  let k = age < 700 ? Math.exp(-age / 220) : 0;
  if (on[i]) k = Math.max(k, 0.18); // a faint steady warmth while playing
  if (k < 0.01) return;
  const cx = x + bw / 2, cy = boxY + bh * 0.6;
  const r = 110 + 30 * k;
  const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
  g.addColorStop(0, colors[i]);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = Math.min(0.75, k * 0.75);
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
}

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

// piano roll with a playhead column shared by all boxes
function drawRoll(x, i) {
  const top = 250, h = 60, cw = bw / 8;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(x, top, bw, h);
  for (let s = 0; s < 8; s++) {
    const n = melodies[i][s];
    const head = s === shownStep;
    const here = head && shownAct[i];
    if (head) {
      ctx.fillStyle = shownAct[i] ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)';
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

// a row of 8 lamps: the bright one is the current beat, the big first one is the bar line
function drawBeats(pulse) {
  const cy = 378, sp = 44;
  const x0 = canvas.width / 2 - sp * 3.5;
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(241,230,200,0.8)';
  ctx.font = '14px Georgia, serif';
  ctx.fillText('shared beat:', x0 - 24, cy + 5);
  for (let s = 0; s < 8; s++) {
    const cx = x0 + s * sp;
    const cur = s === shownStep;
    const r = s === 0 ? 9 : 6;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = cur ? '#ffe9a8' : 'rgba(241,230,200,0.3)';
    ctx.fill();
    if (cur) {
      ctx.strokeStyle = 'rgba(255,233,168,0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(241,230,200,0.8)';
  ctx.fillText(timer ? 'bar starts at the big lamp' : 'starts when a box plays', x0 + sp * 7 + 24, cy + 5);
  ctx.textAlign = 'center';
}

function draw() {
  const now = performance.now();
  if (audioCtx) {
    while (queue.length && queue[0].t <= audioCtx.currentTime) {
      const q = queue.shift();
      shownStep = q.s; shownAct = q.act;
      for (let i = 0; i < q.sounded.length; i++) if (q.sounded[i]) glowAt[i] = now;
    }
  }
  const pulse = 0.5 + 0.5 * Math.sin(now / 1000 * 3);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(20, boxY + bh + 8, canvas.width - 40, 14);
  ctx.textAlign = 'center';
  for (let i = 0; i < colors.length; i++) {
    const x = startX + i * (bw + gap);
    const live = on[i] || waiting[i];
    drawGlow(x, i, now);
    // tap hint: pulsing dashed frame around boxes that are not playing
    if (!live) {
      ctx.save();
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = 3;
      ctx.strokeStyle = colors[i];
      ctx.globalAlpha = hover === i ? 1 : 0.6 + 0.4 * pulse;
      ctx.strokeRect(x - 10, 30, bw + 34, 315);
      ctx.restore();
    } else if (hover === i) {
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 10, 30, bw + 34, 315);
    }
    const bob = shownAct[i] && on[i] && shownStep % 2 === 0 ? -3 : 0;
    drawBox(x, boxY + bob, bw, bh, colors[i], on[i]);
    ctx.fillStyle = live ? '#f1e6c8' : 'rgba(241,230,200,0.8)';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText('Box ' + (i + 1), x + bw / 2, 56);
    ctx.font = '14px Georgia, serif';
    if (on[i]) {
      ctx.fillStyle = colors[i];
      ctx.fillText('♪ playing', x + bw / 2, 78);
    } else if (waiting[i]) {
      ctx.fillStyle = colors[i];
      ctx.globalAlpha = 0.5 + 0.5 * pulse;
      ctx.fillText('next bar…', x + bw / 2, 78);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = 'rgba(241,230,200,0.85)';
      ctx.fillText('▶ tap to play', x + bw / 2, 78);
    }
    drawRoll(x, i);
    ctx.fillStyle = 'rgba(241,230,200,0.85)';
    ctx.font = '14px Georgia, serif';
    ctx.fillText(melodyNames[i], x + bw / 2, 336);
  }
  drawBeats(pulse);
  requestAnimationFrame(draw);
}

function boxAt(e) {
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) * canvas.width / r.width;
  const y = (e.clientY - r.top) * canvas.height / r.height;
  for (let i = 0; i < colors.length; i++) {
    const bx = startX + i * (bw + gap) - 10;
    if (x >= bx && x <= bx + bw + 34 && y >= 30 && y <= 345) return i;
  }
  return -1;
}

canvas.addEventListener('pointermove', (e) => { hover = boxAt(e); });
canvas.addEventListener('pointerleave', () => { hover = -1; });
canvas.addEventListener('pointerdown', (e) => {
  const i = boxAt(e);
  if (i >= 0) toggle(i);
});

draw();

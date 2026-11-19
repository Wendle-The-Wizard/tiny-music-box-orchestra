// Step 2: boxes now have melodies. Tapping one plays its tune once.
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

const colors = ['#e07a5f', '#f2cc8f', '#81b29a', '#6d9dc5', '#b58bd6', '#f28fad'];

// layout shared by drawing and tapping
const bw = 100, bh = 110, gap = 40;
const startX = (canvas.width - (colors.length * bw + (colors.length - 1) * gap)) / 2;
const boxY = 110;

function drawBox(x, y, w, h, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x - 4, y + h, w + 8, 8);
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
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(20, 220, canvas.width - 40, 14);
  for (let i = 0; i < colors.length; i++) {
    drawBox(startX + i * (bw + gap), boxY, bw, bh, colors[i]);
  }
}

// which box was tapped? (works for mouse and touch, canvas may be scaled)
canvas.addEventListener('pointerdown', (e) => {
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) * canvas.width / r.width;
  const y = (e.clientY - r.top) * canvas.height / r.height;
  for (let i = 0; i < colors.length; i++) {
    const bx = startX + i * (bw + gap);
    if (x >= bx && x <= bx + bw + 14 && y >= boxY && y <= boxY + bh) {
      playMelody(i);
      break;
    }
  }
});

draw();

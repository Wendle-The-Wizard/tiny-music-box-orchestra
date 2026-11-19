// Step 1: just draw a row of music boxes. No sound yet!
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

// each box gets its own color (I'll give them melodies later)
const colors = ['#e07a5f', '#f2cc8f', '#81b29a', '#6d9dc5', '#b58bd6', '#f28fad'];

function drawBox(x, y, w, h, color) {
  // the shelf shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x - 4, y + h, w + 8, 8);
  // body of the box
  ctx.fillStyle = color;
  ctx.fillRect(x, y + h * 0.25, w, h * 0.75);
  // lid, a bit wider than the body
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x - 3, y + h * 0.15, w + 6, h * 0.12);
  // little crank on the side
  ctx.strokeStyle = '#3d2c1e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + w, y + h * 0.6);
  ctx.lineTo(x + w + 14, y + h * 0.6);
  ctx.lineTo(x + w + 14, y + h * 0.5);
  ctx.stroke();
  // front panel with a tiny comb of teeth
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
  const n = colors.length;
  const w = 100, h = 110, gap = 40;
  const total = n * w + (n - 1) * gap;
  const startX = (canvas.width - total) / 2;
  // shelf plank
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(20, 220, canvas.width - 40, 14);
  for (let i = 0; i < n; i++) {
    drawBox(startX + i * (w + gap), 110, w, h, colors[i]);
  }
}

draw();

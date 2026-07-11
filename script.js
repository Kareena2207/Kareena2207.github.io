const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// A lightweight, generative neural field for the hero.
const canvas = document.querySelector('#neural-field');
const ctx = canvas?.getContext('2d');
let nodes = [];
let pointer = { x: innerWidth * 0.72, y: innerHeight * 0.45 };
let frame = 0;

function sizeCanvas() {
  if (!canvas || !ctx) return;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const count = Math.min(58, Math.max(28, Math.floor(rect.width / 23)));
  nodes = Array.from({ length: count }, (_, i) => ({
    x: rect.width * (.48 + Math.random() * .58),
    y: rect.height * (.12 + Math.random() * .78),
    ox: Math.random() * Math.PI * 2,
    oy: Math.random() * Math.PI * 2,
    speed: .18 + Math.random() * .35,
    r: 1.4 + Math.random() * 2.4,
    hue: [183, 78, 260, 330][i % 4]
  }));
}

function drawField(time = 0) {
  if (!canvas || !ctx) return;
  const { width, height } = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, width, height);
  nodes.forEach((node, i) => {
    const x = node.x + Math.sin(time * .0002 * node.speed + node.ox) * 22;
    const y = node.y + Math.cos(time * .00018 * node.speed + node.oy) * 19;
    node.dx = x;
    node.dy = y;
    nodes.slice(i + 1).forEach(other => {
      const ox = other.dx ?? other.x;
      const oy = other.dy ?? other.y;
      const distance = Math.hypot(x - ox, y - oy);
      if (distance < 145) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(ox, oy);
        ctx.strokeStyle = `rgba(17,18,15,${(1 - distance / 145) * .15})`;
        ctx.lineWidth = .7;
        ctx.stroke();
      }
    });
    const pull = Math.max(0, 1 - Math.hypot(pointer.x - x, pointer.y - y) / 240);
    ctx.beginPath();
    ctx.arc(x, y, node.r + pull * 3, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${node.hue}, 95%, ${node.hue === 78 ? 45 : 58}%, ${.38 + pull * .5})`;
    ctx.fill();
  });
  if (!reducedMotion) frame = requestAnimationFrame(drawField);
}

window.addEventListener('resize', sizeCanvas, { passive: true });
window.addEventListener('pointermove', event => { pointer = { x: event.clientX, y: event.clientY }; }, { passive: true });
sizeCanvas();
if (!reducedMotion) drawField(); else drawField(0);

// Custom geometric plus cursor with eased movement.
const cursor = document.querySelector('.cursor');
const dot = document.querySelector('.cursor-dot');
let cursorPos = { x: -50, y: -50 };
let targetPos = { x: -50, y: -50 };
let lastX = -50;

window.addEventListener('pointermove', event => {
  targetPos = { x: event.clientX, y: event.clientY };
  if (dot) dot.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
}, { passive: true });

function moveCursor() {
  cursorPos.x += (targetPos.x - cursorPos.x) * .18;
  cursorPos.y += (targetPos.y - cursorPos.y) * .18;
  const rotation = Math.max(-8, Math.min(8, (targetPos.x - lastX) * .5));
  if (cursor) cursor.style.transform = `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0) rotate(${rotation}deg)`;
  lastX += (targetPos.x - lastX) * .12;
  requestAnimationFrame(moveCursor);
}
moveCursor();

document.querySelectorAll('a, button').forEach(element => {
  element.addEventListener('mouseenter', () => cursor?.classList.add('is-active'));
  element.addEventListener('mouseleave', () => cursor?.classList.remove('is-active'));
});
document.querySelectorAll('.media-reveal').forEach(element => {
  element.addEventListener('mouseenter', () => cursor?.classList.add('is-media'));
  element.addEventListener('mouseleave', () => cursor?.classList.remove('is-media'));
});
window.addEventListener('pointerdown', () => cursor?.classList.add('is-down'));
window.addEventListener('pointerup', () => cursor?.classList.remove('is-down'));

// Natural section entrances.
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: .12, rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.reveal').forEach(element => observer.observe(element));

// Subtle magnetic pull for high-value links.
if (!reducedMotion) {
  document.querySelectorAll('.magnetic').forEach(element => {
    element.addEventListener('pointermove', event => {
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * .13;
      const y = (event.clientY - rect.top - rect.height / 2) * .13;
      element.style.transform = `translate(${x}px, ${y}px)`;
    });
    element.addEventListener('pointerleave', () => { element.style.transform = ''; });
  });
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) cancelAnimationFrame(frame);
  else if (!reducedMotion) frame = requestAnimationFrame(drawField);
});

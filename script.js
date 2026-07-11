document.documentElement.classList.add('js');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-nav');
const navLinks = [...document.querySelectorAll('#primary-nav a')];
const meter = document.querySelector('.scroll-meter span');
const year = document.querySelector('#year');

if (year) year.textContent = String(new Date().getFullYear());

function setMenu(open, returnFocus = false) {
  if (!menuButton || !navigation) return;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.querySelector('span').textContent = open ? 'Close' : 'Menu';
  navigation.classList.toggle('is-open', open);
  document.body.classList.toggle('nav-open', open);
  if (returnFocus) menuButton.focus();
}

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  setMenu(!isOpen);
  if (!isOpen) navigation?.querySelector('a')?.focus();
});

navLinks.forEach(link => {
  link.addEventListener('click', () => setMenu(false));
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    setMenu(false, true);
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 980) setMenu(false);
}, { passive: true });

const reveals = document.querySelectorAll('.reveal');

if (reducedMotion.matches || !('IntersectionObserver' in window)) {
  reveals.forEach(element => element.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

  reveals.forEach(element => revealObserver.observe(element));
}

let scrollTicking = false;

function updateScrollState() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
  if (meter) meter.style.width = `${progress * 100}%`;
  scrollTicking = false;
}

window.addEventListener('scroll', () => {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(updateScrollState);
}, { passive: true });

updateScrollState();

const trackedSections = [...document.querySelectorAll('main section[id]')]
  .filter(section => navLinks.some(link => link.getAttribute('href') === `#${section.id}`));

if ('IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;
    navLinks.forEach(link => {
      const active = link.getAttribute('href') === `#${visible.target.id}`;
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.2, 0.5] });

  trackedSections.forEach(section => navObserver.observe(section));
}

const videos = [...document.querySelectorAll('video[data-play-on-view]')];

function pauseAllVideos() {
  videos.forEach(video => video.pause());
}

if (reducedMotion.matches) {
  pauseAllVideos();
} else if ('IntersectionObserver' in window) {
  const videoObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
  }, { threshold: 0.3, rootMargin: '80px 0px' });

  videos.forEach(video => videoObserver.observe(video));
}

reducedMotion.addEventListener?.('change', event => {
  if (event.matches) pauseAllVideos();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseAllVideos();
});

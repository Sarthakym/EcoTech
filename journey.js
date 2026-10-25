(() => {
  const origin = document.querySelector('.hero-art .orbit');
  if (!origin || document.querySelector('.eco-journey') || !CSS.supports('transform-style', 'preserve-3d')) return;
  const companion = document.createElement('div');
  companion.className = 'eco-journey';
  companion.style.transition = 'none';
  companion.setAttribute('aria-hidden', 'true');
  const leaf = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M20 4C9 2 3 7 5 14c2 7 14 7 15-10ZM4 21 15 10"/></svg>';
  companion.innerHTML = `<div class="journey-object"><div class="journey-shadow"></div><div class="journey-float"><div class="journey-orbit"></div><div class="journey-coin">${Array.from({length: 5}, (_, i) => `<span class="journey-edge" style="--edge:${i * 4 - 8}px"></span>`).join('')}<span class="journey-face journey-front"><img src="logo-mark.png" alt="" width="46" height="46"></span><span class="journey-face journey-back">${leaf}</span></div></div></div><span class="journey-label">A circular future</span>`;
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'journey-toggle';
  toggle.setAttribute('aria-label', 'Pause the floating 3D scroll guide');
  document.body.append(companion, toggle);
  origin.classList.add('journey-origin');

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const labels = {
    home: 'A circular future', about: 'Small steps matter', categories: 'Every device counts',
    guide: 'Rethink. Reuse.', centers: 'Find a better ending', pickup: 'Your next green step',
    rewards: 'Good comes around', machine: 'Recycle smarter', quiz: 'Grow your knowledge',
    dashboard: 'See your impact', contact: 'Better, together', footer: 'Keep the cycle going',
  };
  const elements = [...document.querySelectorAll('main section[id]'), document.querySelector('footer')].filter(Boolean);
  const label = companion.querySelector('.journey-label');
  const coin = companion.querySelector('.journey-coin');
  const home = document.getElementById('home');
  const header = document.querySelector('.topbar');
  const chapters = [...document.querySelectorAll('.experience-index a')];
  const chapterFor = {home:1,about:1,categories:1,guide:2,centers:2,pickup:3,rewards:3,machine:3,quiz:4,dashboard:4,contact:4,footer:4};
  let stops = [];
  let metrics = {};
  let paused = false;
  let frame = 0;
  let pose = null;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const updateFocus = () => {
    companion.classList.toggle('is-tucked', document.activeElement?.matches('input, textarea, select, [contenteditable="true"]'));
  };
  const measure = () => {
    stops = elements.map(el => ({id: el.id || 'footer', top: el.getBoundingClientRect().top + scrollY}));
    metrics = {
      width: document.documentElement.clientWidth,
      height: innerHeight,
      scrollLimit: Math.max(1, document.documentElement.scrollHeight - innerHeight),
      safeTop: (header?.offsetHeight || 92) + 14,
      homeHeight: Math.max(1, home.offsetHeight * .65),
    };
  };
  const render = () => {
    const {width, height, safeTop, scrollLimit, homeHeight} = metrics;
    const progress = clamp(scrollY / scrollLimit, 0, 1);
    let index = 0;
    stops.forEach((stop, i) => { if (stop.top <= scrollY + height * .42) index = i; });
    const section = stops[index]?.id || 'home';
    if (companion.dataset.section !== section) {
      companion.dataset.section = section;
      label.textContent = labels[section] || 'A circular future';
      chapters.forEach(link => {
        if (Number(link.dataset.chapter) === chapterFor[section]) link.setAttribute('aria-current', 'step');
        else link.removeAttribute('aria-current');
      });
    }
    const percent = String(Math.round(progress * 100));
    if (companion.dataset.progress !== percent) companion.dataset.progress = percent;
    updateFocus();

    if (!pose || (!paused && !reduced.matches)) {
      const size = width < 640 ? .63 : width < 1100 ? .8 : .95;
      const right = width - 118 * size - 6;
      const left = 6;
      const bottom = Math.max(safeTop, height - 142 * size - 70);
      const blend = clamp(scrollY / homeHeight, 0, 1);
      const rect = blend < 1 ? origin.getBoundingClientRect() : {left: right, top: safeTop, width: 0, height: 0};
      // Keep the guide at the edge on small screens and beside personal-data forms.
      const dockX = width < 1100 || ['pickup','contact'].includes(section) || index % 2 === 0 ? right : left;
      const dockY = clamp(height * (.39 + .14 * Math.sin(progress * Math.PI * 4)), safeTop, bottom);
      const homeX = rect.left + rect.width / 2 - 59 * size;
      const homeY = rect.top + rect.height / 2 - 56 * size;
      pose = reduced.matches
        ? {x: right, y: clamp(height * .42, safeTop, bottom), turn: -25, size}
        : {
          x: clamp(homeX * (1 - blend) + dockX * blend, 4, right),
          y: clamp(homeY * (1 - blend) + dockY * blend, safeTop, bottom),
          turn: -25 + progress * 720,
          size,
        };
    }
    companion.style.setProperty('--journey-x', `${pose.x}px`);
    companion.style.setProperty('--journey-y', `${pose.y}px`);
    companion.style.setProperty('--journey-size', pose.size);
    companion.style.setProperty('--journey-turn', `${pose.turn}deg`);
  };
  const queue = () => {
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; render(); });
  };
  const sync = () => {
    const stopped = paused || reduced.matches;
    if (paused && !reduced.matches && pose) {
      companion.style.transform = getComputedStyle(companion).transform;
      coin.style.transform = getComputedStyle(coin).transform;
    } else {
      companion.style.removeProperty('transform');
      coin.style.removeProperty('transform');
    }
    companion.classList.toggle('is-paused', stopped);
    companion.dataset.motion = stopped ? 'paused' : 'running';
    toggle.disabled = reduced.matches;
    toggle.textContent = reduced.matches ? '3D motion off' : paused ? 'Resume 3D guide' : 'Pause 3D guide';
    toggle.setAttribute('aria-pressed', String(stopped));
    toggle.setAttribute('aria-label', reduced.matches ? '3D motion disabled by your reduced-motion preference' : `${paused ? 'Resume' : 'Pause'} the floating 3D scroll guide`);
    queue();
  };
  toggle.addEventListener('click', () => { paused = !paused; sync(); });
  reduced.addEventListener('change', () => { pose = null; sync(); });
  window.addEventListener('scroll', queue, {passive: true});
  window.addEventListener('resize', () => { pose = null; measure(); queue(); }, {passive: true});
  document.addEventListener('focusin', updateFocus);
  document.addEventListener('focusout', updateFocus);
  new ResizeObserver(() => { measure(); queue(); }).observe(document.body);
  measure();
  sync();
  render();
  requestAnimationFrame(() => companion.style.removeProperty('transition'));
})();

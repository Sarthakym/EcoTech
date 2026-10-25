(() => {
  const hero = document.getElementById('home');
  if (!hero) return;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;
  canvas.className = 'eco-particles';
  canvas.setAttribute('aria-hidden', 'true');
  hero.prepend(canvas);
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'particle-toggle';
  hero.append(toggle);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const leaf = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M20 4C9 2 3 7 5 14c2 7 14 7 15-10ZM4 21 15 10"/></svg>';
  const color = getComputedStyle(hero).getPropertyValue('--green').trim();
  let width = 0, height = 0, frame = 0, lastTime = 0;
  let visible = false, paused = false, particles = [];
  let covered = document.documentElement.classList.contains('welcome-open');
  const draw = delta => {
    context.clearRect(0, 0, width, height);
    context.strokeStyle = context.fillStyle = color;
    particles.forEach(p => {
      p.y -= p.speed * delta;
      p.x += Math.sin(p.y * .008 + p.phase) * .09 * delta;
      if (p.y < -25) { p.y = height + 25; p.x = Math.random() * width; }
      if (p.x < -25) p.x = width + 25;
      if (p.x > width + 25) p.x = -25;
      context.save();
      context.translate(p.x, p.y);
      context.rotate(p.phase + p.y * .001);
      // Keep particles behind the copy especially quiet.
      context.globalAlpha = p.x < width * .51 && p.y > 65 && p.y < height - 75 ? .08 : .23;
      context.lineWidth = 1;
      context.beginPath();
      if (p.kind === 0) {
        context.ellipse(0, 0, p.size, p.size * .45, -.6, 0, Math.PI * 2);
        context.moveTo(-p.size, p.size * .6);
        context.lineTo(p.size * .7, -p.size * .4);
        context.stroke();
      } else if (p.kind === 1) {
        context.rect(-p.size / 2, -p.size / 2, p.size, p.size);
        for (let i = -1; i <= 1; i++) {
          const offset = i * p.size / 3;
          context.moveTo(offset, -p.size / 2); context.lineTo(offset, -p.size * .8);
          context.moveTo(offset, p.size / 2); context.lineTo(offset, p.size * .8);
          context.moveTo(-p.size / 2, offset); context.lineTo(-p.size * .8, offset);
          context.moveTo(p.size / 2, offset); context.lineTo(p.size * .8, offset);
        }
        context.stroke();
      } else if (p.kind === 2) {
        context.roundRect(-p.size * .35, -p.size * .6, p.size * .7, p.size * 1.2, 2);
        context.moveTo(-2, p.size * .35); context.lineTo(2, p.size * .35);
        context.stroke();
      } else {
        context.arc(0, 0, p.size * .18, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    });
  };
  const animate = time => {
    frame = 0;
    const interval = width < 640 ? 50 : 1000 / 30;
    if (!lastTime || time - lastTime >= interval) {
      const delta = lastTime ? Math.min((time - lastTime) / 16.67, 4) : 1;
      lastTime = time;
      draw(delta);
    }
    frame = requestAnimationFrame(animate);
  };
  const sync = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    const stopped = paused || reduced.matches;
    canvas.dataset.state = reduced.matches ? 'reduced' : paused ? 'paused' : 'running';
    toggle.disabled = reduced.matches;
    toggle.setAttribute('aria-pressed', String(stopped));
    toggle.innerHTML = leaf + (reduced.matches ? 'Reduced motion enabled' : paused ? 'Resume particles' : 'Pause particles');
    if (visible && !document.hidden && !stopped && !covered) frame = requestAnimationFrame(animate);
  };
  const resize = () => {
    width = hero.clientWidth;
    height = hero.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles = Array.from({length: width < 640 ? 8 : 18}, (_, index) => ({
      x: Math.random() * width, y: Math.random() * height,
      size: 5 + Math.random() * 7, speed: .12 + Math.random() * .25,
      phase: Math.random() * Math.PI * 2, kind: index % 4,
    }));
    canvas.dataset.particleCount = String(particles.length);
    canvas.dataset.frameLimit = width < 640 ? '20' : '30';
    draw(0);
    sync();
  };
  toggle.addEventListener('click', () => { paused = !paused; sync(); });
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('ecotech:welcome-visibility', event => {
    covered = event.detail.open;
    sync();
  });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    sync();
  }).observe(hero);
  new ResizeObserver(resize).observe(hero);
  resize();
})();

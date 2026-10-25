(() => {
  const stage = document.querySelector('.hero-art .photo-frame');
  if (!stage || !CSS.supports('transform-style', 'preserve-3d')) return;
  const recycle = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 7 3-5 4 7m-4-7L8 7H4m13 2 5 8h-8m8 0-3-1 1-4M7 21H2l4-7m-4 7 5-1 3 1"/></svg>';
  const rotateIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 8a9 9 0 1 0 1 8M20 3v5h-5"/></svg>';
  const box = (name, front = '', top = '') => `<div class="eco-box ${name}"><div class="eco-face eco-front">${front}</div><div class="eco-face eco-back"></div><div class="eco-face eco-right"></div><div class="eco-face eco-left"></div><div class="eco-face eco-top">${top}</div><div class="eco-face eco-bottom"></div></div>`;
  stage.classList.add('eco3d');
  stage.closest('.hero-art').classList.add('has-3d');
  stage.tabIndex = 0;
  stage.setAttribute('role', 'group');
  stage.setAttribute('aria-label', 'Interactive 3D EcoTech recycling station. Drag horizontally or use arrow keys to rotate. Press Home to reset.');
  stage.innerHTML = `
    <span class="scene-label">CIRCULAR LAB / INTERACTIVE CONCEPT<b>Reuse starts here.</b></span>
    <div class="scene-halo" aria-hidden="true"></div>
    <div class="scene-floor" aria-hidden="true"></div>
    <div class="scene-grid" aria-hidden="true"></div>
    <div class="scene-rotor" aria-hidden="true"><div class="scene-bob">
      ${box('eco-bin', `<span class="bin-logo"><img src="logo-mark.png" alt="" width="68" height="68"></span><span class="bin-brand">EcoTech</span><span class="bin-caption">SMALL DEVICES. BIG CHANGE.</span><span class="bin-indicator"></span><span class="loop-scan"></span>`)}
      ${box('eco-lid', '', '<span class="bin-slot"></span>')}
      ${box('eco-phone', recycle)}
      ${box('eco-chip')}
      <span class="loop-recovered"><img src="logo-mark.png" alt="" width="40" height="40"></span>
    </div></div>
    <span class="scene-spark one" aria-hidden="true"></span><span class="scene-spark two" aria-hidden="true"></span><span class="scene-spark three" aria-hidden="true"></span>
    <span class="scene-coordinate" aria-hidden="true">ECOTECH / CIRCULAR SYSTEM 01</span>
    <p class="loop-status" role="status" aria-live="polite">A device goes in. Useful materials come out.</p>
    <div class="scene-controls">
      <button type="button" class="loop-button" data-scene-action="loop">Run the loop <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m8 5 11 7-11 7Z"/></svg></button>
      <button type="button" data-scene-action="rotate" aria-label="Rotate recycling station 45 degrees">${rotateIcon} Rotate</button>
      <button type="button" data-scene-action="pause" aria-pressed="false">Pause motion</button>
      <button type="button" data-scene-action="reset">Reset</button>
    </div>`;
  const help = document.createElement('span');
  help.className = 'scene-help';
  help.textContent = 'Drag to inspect. Run the loop to explore a device’s next chapter.';
  stage.after(help);

  let loopTimer = 0;
  const loopButton = stage.querySelector('[data-scene-action="loop"]');
  const loopStatus = stage.querySelector('.loop-status');
  const finishLoop = message => {
    clearTimeout(loopTimer);
    stage.classList.remove('is-looping');
    loopButton.disabled = false;
    loopStatus.textContent = message;
  };
  let yaw = -27;
  let pitch = -12;
  let drag = null;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const pause = stage.querySelector('[data-scene-action="pause"]');
  const render = () => {
    stage.style.setProperty('--scene-y', `${yaw}deg`);
    stage.style.setProperty('--scene-x', `${pitch}deg`);
  };
  const setPaused = paused => {
    if (paused && stage.classList.contains('is-looping')) finishLoop('Loop paused. Run it again when you are ready.');
    stage.classList.toggle('is-paused', paused);
    pause.setAttribute('aria-pressed', String(paused));
    pause.textContent = paused ? 'Resume motion' : 'Pause motion';
  };
  setPaused(motion.matches);
  motion.addEventListener('change', e => setPaused(e.matches));
  let visible = false;
  const syncVisibility = () => {
    const resting = !visible || document.hidden || document.documentElement.classList.contains('welcome-open');
    if (resting && stage.classList.contains('is-looping')) finishLoop('Ready when you are. Run the loop again.');
    stage.classList.toggle('is-offscreen', resting);
    stage.closest('.hero').classList.toggle('is-resting', resting);
    stage.dataset.rendering = resting ? 'paused' : 'active';
  };
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    syncVisibility();
  }).observe(stage);
  document.addEventListener('visibilitychange', syncVisibility);
  document.addEventListener('ecotech:welcome-visibility', syncVisibility);
  syncVisibility();
  stage.addEventListener('pointerdown', e => {
    if (e.target.closest('button') || !e.isPrimary || e.button !== 0) return;
    drag = {x: e.clientX, yaw, id: e.pointerId};
    stage.setPointerCapture(e.pointerId);
    stage.classList.add('is-dragging');
  });
  stage.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    yaw = drag.yaw + (e.clientX - drag.x) * .6;
    render();
  });
  const endDrag = () => {
    drag = null;
    stage.classList.remove('is-dragging');
  };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('lostpointercapture', endDrag);
  stage.addEventListener('keydown', e => {
    if (e.target !== stage || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key)) return;
    e.preventDefault();
    if (e.key === 'ArrowLeft') yaw -= 15;
    if (e.key === 'ArrowRight') yaw += 15;
    if (e.key === 'ArrowUp') pitch = Math.max(-35, pitch - 5);
    if (e.key === 'ArrowDown') pitch = Math.min(20, pitch + 5);
    if (e.key === 'Home') { yaw = -27; pitch = -12; }
    render();
  });
  stage.querySelector('[data-scene-action="rotate"]').addEventListener('click', () => { yaw += 45; render(); });
  loopButton.addEventListener('click', () => {
    if (stage.classList.contains('is-looping')) return;
    if (motion.matches) {
      loopStatus.textContent = 'Concept: devices are sorted, useful materials recovered, and resources reused.';
      return;
    }
    setPaused(false);
    stage.classList.add('is-looping');
    loopButton.disabled = true;
    loopStatus.textContent = 'Sorting, recovering, and giving materials another beginning…';
    loopTimer = setTimeout(() => finishLoop('Loop complete. Recovered materials are ready for a new beginning.'), 2200);
  });
  pause.addEventListener('click', () => setPaused(!stage.classList.contains('is-paused')));
  stage.querySelector('[data-scene-action="reset"]').addEventListener('click', () => {
    finishLoop('A device goes in. Useful materials come out.');
    yaw = -27; pitch = -12; render();
  });
})();

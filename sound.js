(() => {
  const audio = new Audio('welcome.mp3');
  audio.preload = 'auto';
  audio.volume = .8;
  audio.loop = false;
  let started = false;
  let pending = false;
  let stopped = false;
  let attempt = 0;
  const gate = document.getElementById('welcomeGate');
  // Use the same welcome-to-homepage flow for local files and hosted visits.
  const publicEntry = gate && typeof gate.showModal === 'function';

  const cleanup = () => {
    document.removeEventListener('click', onInteraction, true);
    document.removeEventListener('keydown', onInteraction, true);
    document.removeEventListener('visibilitychange', onVisibility);
  };
  const stop = () => {
    stopped = true;
    pending = false;
    attempt++;
    audio.pause();
    cleanup();
  };
  const welcome = async (fromInteraction = false) => {
    if (publicEntry && !fromInteraction) return;
    if (stopped || started || document.hidden || (pending && !fromInteraction)) return;
    const request = ++attempt;
    pending = true;
    try {
      await audio.play();
      if (request === attempt && !stopped && !document.hidden) {
        started = true;
        pending = false;
      }
    } catch (error) {
      if (request !== attempt || stopped) return;
      pending = false;
      // Respect autoplay restrictions; retry only after a real user gesture.
      if (publicEntry) {
        stop();
        if (typeof window.toast === 'function') window.toast('The welcome audio could not play. You can still explore EcoTech.');
      } else if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') stop();
    }
  };
  function onInteraction(event) {
    if (!event.isTrusted) return;
    if (event.type === 'keydown' && event.key === 'Escape') {
      stop();
      return;
    }
    if (publicEntry) return;
    if (started || stopped) return;
    if (event.type === 'keydown' && (event.repeat || event.ctrlKey || event.altKey || event.metaKey)) return;
    welcome(true);
  }
  function onVisibility() {
    if (document.hidden) {
      if (started) stop();
      else {
        attempt++;
        pending = false;
        audio.pause();
      }
    } else {
      welcome();
    }
  }
  audio.addEventListener('playing', () => {
    if (stopped || document.hidden) { stop(); return; }
    started = true;
    pending = false;
  });
  audio.addEventListener('ended', () => { started = true; pending = false; cleanup(); });
  audio.addEventListener('error', stop);
  document.addEventListener('keydown', onInteraction, {capture: true});
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', stop, {once: true});
  if (publicEntry) {
    let entered = false;
    let exitTimer = 0;
    const arrivals = [];
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const enterButton = document.getElementById('enterEcoTech');
    const quietButton = document.getElementById('enterQuietly');
    const notify = open => document.dispatchEvent(new CustomEvent('ecotech:welcome-visibility', {detail: {open}}));
    const finishEntry = () => {
      clearTimeout(exitTimer);
      if (gate.open) gate.close();
    };
    const leave = withSound => {
      if (entered) return;
      entered = true;
      // Call play inside the trusted click, before any await or closing animation.
      if (withSound) welcome(true);
      else stop();
      enterButton.disabled = true;
      quietButton.disabled = true;
      if (motion.matches) { finishEntry(); return; }

      const disc = gate.querySelector('.welcome-disc');
      const landing = document.querySelector('.eco-journey .journey-front');
      if (disc) {
        const pose = getComputedStyle(disc).transform;
        const from = disc.getBoundingClientRect();
        // Freeze the current 3D pose so the idle sway never snaps on departure.
        disc.style.animation = 'none';
        disc.style.transform = pose;
        if (landing && innerWidth >= 700 && from.width > 0) {
          const to = landing.getBoundingClientRect();
          gate.style.setProperty('--welcome-flight-x', `${to.left + to.width / 2 - from.left - from.width / 2}px`);
          gate.style.setProperty('--welcome-flight-y', `${to.top + to.height / 2 - from.top - from.height / 2}px`);
          gate.style.setProperty('--welcome-flight-scale', Math.max(.22, Math.min(.65, to.width / from.width)));
        }
      }
      gate.setAttribute('aria-busy', 'true');
      document.documentElement.classList.add('welcome-exiting');
      gate.classList.add('is-leaving');
      ['.hero-text', '.hero-art'].forEach((selector, index) => {
        const element = document.querySelector(selector);
        if (element?.animate) arrivals.push(element.animate(
          [{opacity: .4, transform: 'translateY(16px)'}, {opacity: 1, transform: 'translateY(0)'}],
          {duration: 680 - index * 60, delay: 220 + index * 60, easing: 'cubic-bezier(.22,.8,.22,1)', fill: 'both'}
        ));
      });
      // The timer also releases the modal if an animation event is suppressed.
      exitTimer = setTimeout(finishEntry, 1100);
    };
    enterButton.addEventListener('click', () => leave(true));
    quietButton.addEventListener('click', () => leave(false));
    gate.addEventListener('animationend', event => {
      if (event.animationName === 'welcome-door-left') finishEntry();
    });
    motion.addEventListener('change', () => {
      if (motion.matches && gate.classList.contains('is-leaving')) finishEntry();
    });
    gate.addEventListener('cancel', () => { entered = true; stop(); });
    gate.addEventListener('close', () => {
      clearTimeout(exitTimer);
      arrivals.forEach(animation => animation.cancel());
      if (!entered) { entered = true; stop(); }
      document.documentElement.classList.remove('welcome-open', 'welcome-exiting');
      document.documentElement.style.removeProperty('--welcome-page-width');
      gate.classList.remove('is-leaving');
      gate.removeAttribute('aria-busy');
      notify(false);
      document.querySelector('.brand')?.focus({preventScroll: true});
    });
    document.documentElement.style.setProperty('--welcome-page-width', `${document.body.getBoundingClientRect().width}px`);
    document.documentElement.classList.add('welcome-open');
    gate.showModal();
    notify(true);
    return;
  }
  document.addEventListener('click', onInteraction, {capture: true, passive: true});
  welcome();
})();

// G · Reveal (spec §5 G). The demo window is the real ReplayPlayer.
// Desktop with motion: the intro pins for ~110vh while a scrubbed timeline parts the
// name halves and grows the window between them; the replay starts at 60%.
// Phones and reduced motion: no pinning; the window sits under the name and plays
// once it is 80% visible (reduced motion shows every step instead).

import { ReplayPlayer } from '../../kit/js/replay-player.js';
import { dataUrl, reducedMotion } from './env.js';

const REPLAY = 'replays/etl-schema-drift.json';
const SLIT = 'inset(41.5% 41.4%)';
const OPEN = 'inset(0% 0%)';

export function initReveal({ hasGsap }) {
  const mount = document.getElementById('reveal-player');
  const windowEl = document.querySelector('.reveal__window');
  if (!mount || !windowEl) return null;

  const player = new ReplayPlayer(mount, { heading: 'etl-triage · schema drift' });
  player.load(dataUrl(REPLAY))
    .then(() => mount.querySelector('.reveal__fallback')?.remove())
    .catch(() => player.destroy()); // the fallback link stays

  let started = false;
  const start = () => {
    if (started || reducedMotion) return;
    started = true;
    player.play();
  };

  const wide = window.matchMedia('(min-width: 768px)').matches;
  if (hasGsap && wide && !reducedMotion) {
    document.documentElement.classList.add('reveal-on');
    const { gsap } = window;
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '#intro',
        start: 'top top',
        end: '+=110%',
        pin: true,
        scrub: 0.6,
        onUpdate: (self) => self.progress >= 0.6 && start(),
      },
    });
    // Explicit start values: the timeline is built while the CSS load sequence is
    // still running, so reading the current values would capture its hidden state.
    tl.fromTo('.intro__first', { x: 0, y: 0, opacity: 1 }, { x: '-30vw', opacity: 0.4, duration: 0.5 }, 0)
      .fromTo('.intro__last', { x: 0, y: 0, opacity: 1 }, { x: '30vw', opacity: 0.4, duration: 0.5 }, 0)
      .fromTo(['.intro__tagline', '.intro__bar'], { opacity: 1 }, { opacity: 0, duration: 0.3 }, 0)
      .fromTo(windowEl, { clipPath: SLIT, scale: 0.96, opacity: 0 }, { clipPath: OPEN, scale: 1, opacity: 1, duration: 0.5 }, 0.1)
      .fromTo('.reveal__line', { opacity: 0 }, { opacity: 1, duration: 0.12 }, 0.45)
      .to('.reveal__line', { opacity: 0, duration: 0.15 }, 0.7)
      .to({}, { duration: 0.15 }, 0.85);
  } else {
    new IntersectionObserver(([entry], observer) => {
      if (entry.intersectionRatio >= 0.8) {
        start();
        observer.disconnect();
      }
    }, { threshold: [0.8] }).observe(windowEl);
  }
  return player;
}

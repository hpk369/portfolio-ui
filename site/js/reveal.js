// G · Reveal. Desktop with motion: the intro pins while a scrubbed timeline lifts the
// name to the middle, opens the reel as a thumbnail between the two halves, pushes
// the halves off-screen as the reel grows to fill the screen, shows the line over
// it, then darkens the reel from the bottom up so it hands over to About.
// Phones and reduced motion: no pinning; the reel sits under the name and plays
// while it is on screen (reduced motion shows the poster only).

import { reducedMotion } from './env.js';

export function initReveal({ hasGsap, glow }) {
  const windowEl = document.querySelector('.reveal__window');
  const video = windowEl?.querySelector('.reveal__video');
  if (!windowEl || !video) return;

  let playing = false;
  const setPlaying = (on) => {
    if (reducedMotion || on === playing) return;
    playing = on;
    if (on) video.play().catch(() => { playing = false; });
    else video.pause();
  };

  const wide = window.matchMedia('(min-width: 768px)').matches;
  if (!(hasGsap && wide && !reducedMotion)) {
    new IntersectionObserver(([entry]) => setPlaying(entry.intersectionRatio >= 0.3), { threshold: [0, 0.3] })
      .observe(windowEl);
    return;
  }

  document.documentElement.classList.add('reveal-on');
  const { gsap } = window;
  const intro = document.getElementById('intro');
  const name = intro.querySelector('.intro__name');
  const first = intro.querySelector('.intro__first');
  const last = intro.querySelector('.intro__last');

  // Geometry comes from offsets (relative to .intro__screen, which sits at the top
  // of the intro), so the transforms the timeline applies never skew it. Function
  // values re-run on refresh (resize), so the thumbnail tracks the layout.
  const geo = () => {
    const vw = intro.clientWidth;
    const vh = intro.clientHeight;
    const fRight = first.offsetLeft + first.offsetWidth;
    const lLeft = last.offsetLeft;
    const lift = vh / 2 - (name.offsetTop + name.offsetHeight / 2);
    // One line: the thumbnail fits the gap between the halves. Wrapped onto two
    // lines: it sits in the middle of the screen, behind the name.
    const wrapped = last.offsetTop > first.offsetTop + first.offsetHeight / 2;
    const tw = wrapped ? vw * 0.22 : Math.max(vw * 0.12, Math.min(vw * 0.2, lLeft - fRight - 32));
    const th = Math.min(name.offsetHeight * 0.8, tw * 0.62);
    const cx = wrapped ? vw / 2 : (fRight + lLeft) / 2;
    return { vw, vh, lift, tw, th, cx, fRight, lLeft };
  };
  // The clip is driven through a proxy: browsers shorten inset() when edges match,
  // which would leave GSAP interpolating mismatched value lists.
  const clip = { t: 0, r: 0, b: 0, l: 0 };
  const applyClip = () => { windowEl.style.clipPath = `inset(${clip.t}px ${clip.r}px ${clip.b}px ${clip.l}px)`; };
  const thumb = () => {
    const g = geo();
    const top = (g.vh - g.th) / 2;
    const left = g.cx - g.tw / 2;
    return { t: top, r: g.vw - left - g.tw, b: top, l: left };
  };
  const dot = () => {
    const g = geo();
    return { t: g.vh / 2, r: g.vw - g.cx, b: g.vh / 2, l: g.cx };
  };
  const edge = (fn, key) => () => fn()[key];
  const edges = (fn) => ({ t: edge(fn, 't'), r: edge(fn, 'r'), b: edge(fn, 'b'), l: edge(fn, 'l') });

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: intro,
      start: 'top top',
      end: '+=240%',
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress;
        setPlaying(p > 0.06 && p < 0.97);
        glow.hold(p > 0.5);
      },
      onLeave: () => { setPlaying(false); glow.hold(true); },
      onLeaveBack: () => { setPlaying(false); glow.hold(false); },
    },
  });

  // Explicit start values: the timeline is built while the CSS load sequence may
  // still be running, so reading current values would capture its hidden state.
  tl.fromTo(['.intro__tagline', '.intro__bar'], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.1 }, 0)
    .fromTo([first, last], { y: 0, opacity: 1 }, { y: () => geo().lift, duration: 0.16, ease: 'power1.inOut' }, 0)
    .set(windowEl, { visibility: 'visible' }, 0.1)
    .fromTo(clip, edges(dot), { ...edges(thumb), duration: 0.1, ease: 'power2.out', onUpdate: applyClip }, 0.1)
    .fromTo(first, { x: 0 }, { x: () => { const g = geo(); return -g.fRight - g.vw * 0.04; }, opacity: 0.35, duration: 0.3, ease: 'power2.in' }, 0.2)
    .fromTo(last, { x: 0 }, { x: () => { const g = geo(); return g.vw - g.lLeft + g.vw * 0.04; }, opacity: 0.35, duration: 0.3, ease: 'power2.in' }, 0.2)
    .to(clip, { t: 0, r: 0, b: 0, l: 0, duration: 0.3, ease: 'power2.inOut', onUpdate: applyClip }, 0.2)
    .fromTo('.reveal__line', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.08 }, 0.46)
    .fromTo('.reveal__try', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06 }, 0.5)
    .to('.reveal__line', { opacity: 0, y: -24, duration: 0.1 }, 0.76)
    .to('.reveal__try', { autoAlpha: 0, duration: 0.06 }, 0.76)
    .fromTo('.reveal__shade', { yPercent: 100 }, { yPercent: -50, duration: 0.22 }, 0.7)
    .to({}, { duration: 0.02 }, 0.92);
}

// Intro load sequence (spec §5 F). The CSS animations are switched on by an inline
// script in <head>, before first paint; this only clears the class once they finish
// so later transforms (the reveal) never fight them.

const SEQUENCE_MS = 1200;

export function initIntro() {
  const root = document.documentElement;
  if (!root.classList.contains('intro-anim')) return;
  setTimeout(() => root.classList.remove('intro-anim'), SEQUENCE_MS);
}

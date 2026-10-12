// Intro background. A WebGL field of slow, domain-warped noise, lit like a soft 3D
// surface, mapped onto the glow tokens so it covers the whole first screen evenly.
// The cursor bends the field around it and moves the light, with eased follow so
// it drifts rather than snaps. It renders at a fraction of screen resolution
// (the picture is soft anyway) and pauses when its host is off-screen, the tab is
// hidden, or the reveal covers it. Reduced motion draws one still frame; without
// WebGL the CSS blobs in the markup stay as the fallback.

import { reducedMotion } from './env.js';

const RENDER_SCALE = 0.5;   // share of CSS pixels actually rendered
const FOLLOW = 0.018;       // cursor easing per 60 Hz frame (lower = lazier)
const PUSH_EASE = 0.03;     // how slowly the swirl builds and settles

const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';

const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;      // 0..1, y up
uniform float uPush;      // 0..1, how hard the cursor is moving
uniform float uStrength;  // overall glow strength from --glow-opacity
uniform vec3 uBg, uC3, uC2, uC1;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0., a = .5;
  mat2 r = mat2(.8, .6, -.6, .8);
  for (int i = 0; i < 3; i++) { v += a * noise(p); p = r * p * 2.02 + 7.1; a *= .5; }
  return v;
}
// Height of the "cloth": two levels of domain warp make the soft folds.
float field(vec2 p, float t){
  vec2 q = vec2(fbm(p + vec2(0., t * .06)), fbm(p + vec2(5.2, 1.3) - t * .05));
  vec2 r = vec2(fbm(p + 2.2 * q + vec2(1.7, 9.2) + t * .04), fbm(p + 2.2 * q + vec2(8.3, 2.8) - t * .03));
  return fbm(p + 1.6 * r);
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  vec2 m = vec2(uMouse.x * aspect, uMouse.y);
  float t = uTime;

  // The cursor swirls and pushes the field around it.
  vec2 d = p - m;
  float fall = exp(-dot(d, d) * 1.8);
  float ang = fall * (.55 + .5 * uPush);
  float c = cos(ang), s = sin(ang);
  p = m + mat2(c, -s, s, c) * d * (1. - .18 * fall);

  vec2 sp = p * 0.55;
  float h = field(sp, t);
  // Surface normal from the height field, for the 3D shading.
  float e = .04;
  float hx = field(sp + vec2(e, 0.), t);
  float hy = field(sp + vec2(0., e), t);
  vec3 n = normalize(vec3((h - hx) * 3., (h - hy) * 3., e * 6.));
  vec3 L = normalize(vec3(m - p, .55));
  float diff = max(dot(n, L), 0.);
  float spec = pow(max(dot(reflect(-L, n), vec3(0., 0., 1.)), 0.), 18.);

  // Even coverage, a little heavier up top, plus a soft pool of light at the cursor.
  float v = smoothstep(.2, .68, h);
  v *= .6 + .55 * uv.y;
  v = v * (.55 + .6 * diff) + .16 * fall + .12 * spec;
  v = clamp(v * uStrength, 0., 1.);

  vec3 col = mix(uBg, uC3, smoothstep(0., .3, v));
  col = mix(col, uC2, smoothstep(.25, .6, v));
  col = mix(col, uC1, smoothstep(.55, .92, v));
  col += (hash(gl_FragCoord.xy + t) - .5) / 255.;   // dither against banding
  gl_FragColor = vec4(col, 1.);
}`;

function rgb(value) {
  const probe = document.createElement('span');
  probe.style.color = value;
  document.body.append(probe);
  const [r, g, b] = getComputedStyle(probe).color.match(/[\d.]+/g).map(Number);
  probe.remove();
  return [r / 255, g / 255, b / 255];
}

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
  return sh;
}

export function initGlow() {
  // On the home page the field sits in the intro; on Info and Contact it is a
  // fixed layer behind the whole page. Either way it runs while its host is visible.
  const glow = document.querySelector('.glow');
  const host = glow?.closest('section') || glow;
  if (!glow) return { hold() {} };

  const canvas = document.createElement('canvas');
  canvas.className = 'glow__canvas';
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return { hold() {} };

  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (error) {
    console.warn('Glow shader unavailable, using the CSS fallback:', error.message);
    return { hold() {} };
  }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const u = (name) => gl.getUniformLocation(prog, name);
  const U = { res: u('uRes'), time: u('uTime'), mouse: u('uMouse'), push: u('uPush'), strength: u('uStrength'), bg: u('uBg'), c3: u('uC3'), c2: u('uC2'), c1: u('uC1') };

  glow.prepend(canvas);
  glow.classList.add('glow--gl');

  // Colours come from the tokens, so light and dark mode both work.
  function readColors() {
    const css = getComputedStyle(document.documentElement);
    const get = (name) => rgb(css.getPropertyValue(name).trim());
    gl.uniform3fv(U.bg, get('--bg'));
    gl.uniform3fv(U.c3, get('--glow-3'));
    gl.uniform3fv(U.c2, get('--glow-2'));
    gl.uniform3fv(U.c1, get('--glow-1'));
    const opacity = parseFloat(css.getPropertyValue('--glow-opacity')) || 0.55;
    gl.uniform1f(U.strength, Math.min(1.25, opacity * 2.3));
  }

  function resize() {
    const w = Math.max(1, Math.round(glow.clientWidth * RENDER_SCALE));
    const h = Math.max(1, Math.round(glow.clientHeight * RENDER_SCALE));
    if (canvas.width === w && canvas.height === h) return;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(U.res, w, h);
  }

  // Cursor target (0..1, y up) and the eased position the shader sees.
  const target = { x: 0.62, y: 0.7 };
  const eased = { x: 0.62, y: 0.7 };
  let push = 0;
  let lastMove = -1e9;
  window.addEventListener('pointermove', (event) => {
    const rect = glow.getBoundingClientRect();
    target.x = (event.clientX - rect.left) / rect.width;
    target.y = 1 - (event.clientY - rect.top) / rect.height;
    lastMove = performance.now();
  }, { passive: true });

  const start = performance.now();
  let last = start;
  function draw(now) {
    const t = (now - start) / 1000;
    // With no recent pointer (touch, keyboard, idle), the light wanders on its own.
    if (now - lastMove > 4000) {
      target.x = 0.55 + 0.3 * Math.sin(t * 0.13);
      target.y = 0.62 + 0.22 * Math.cos(t * 0.17);
    }
    // Easing scaled by frame time, so 120 Hz screens don't react twice as fast.
    const frames = Math.min(4, (now - last) / (1000 / 60));
    last = now;
    const follow = 1 - (1 - FOLLOW) ** frames;
    const dx = target.x - eased.x;
    const dy = target.y - eased.y;
    eased.x += dx * follow;
    eased.y += dy * follow;
    push += (Math.min(1, Math.hypot(dx, dy) * 3) - push) * (1 - (1 - PUSH_EASE) ** frames);
    gl.uniform1f(U.time, t);
    gl.uniform2f(U.mouse, eased.x, eased.y);
    gl.uniform1f(U.push, push);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  resize();
  readColors();
  new ResizeObserver(() => { resize(); if (reducedMotion) draw(start); }).observe(glow);
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    readColors();
    if (reducedMotion) draw(start);
  });

  if (reducedMotion) {
    draw(start);
    return { hold() {} };
  }

  let onScreen = true;
  let held = false;
  let raf = 0;
  const loop = (now) => { draw(now); raf = requestAnimationFrame(loop); };
  const sync = () => {
    const run = onScreen && !held && !document.hidden;
    if (run && !raf) raf = requestAnimationFrame(loop);
    if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
  };
  new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; sync(); }).observe(host);
  document.addEventListener('visibilitychange', sync);
  sync();

  // The reveal calls this while the full-screen video hides the background.
  return { hold(on) { if (held !== on) { held = on; sync(); } } };
}

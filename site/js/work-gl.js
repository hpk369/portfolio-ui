// WebGL drum for the Work page, after the reference recording.
//
// The projects are printed one after another round a cylinder that turns about
// a horizontal axis, seen close up, so each slide narrows towards its top and
// bottom. Each slide is cut to a lens shape: straight top and bottom, sides that
// curve in over the whole height. A gauge ring with tick marks runs round the
// cylinder just inside the screen edges and turns with it.
//
// Every pixel is ray-cast against the cylinder in the fragment shader, so the
// shape, the turn and the gauge come from the same geometry. Slide content is
// two textures per project: the image (or its looping clip) and a text layer
// painted with the 2D canvas API from the HTML slide. The HTML slides stay in
// the page for screen readers and keyboard users; only their links show, on top
// of the canvas, at rest.
//
// createDrumGL() returns null when WebGL is unavailable; work.js then falls back
// to the CSS 3D drum.

const SPLIT = 2 / 3;        // image share of the slide width, as in the CSS grid
const RADIUS = 0.87;        // cylinder radius / window height
const DISTANCE = 2.09;      // camera distance / window height
const INSET = 0.11;         // how far the sides curve in at the top and bottom / width
const GAP = 32;             // px of cylinder between two slides
const TICK_DEG = 1.25;      // gauge: one tick every 1.25°, a long one every 20 ticks

const VERT = `
attribute vec2 aPos;
uniform vec2 uCanvas;
varying vec2 vPx;
void main() {
  vPx = vec2((aPos.x * 0.5 + 0.5) * uCanvas.x, (0.5 - aPos.y * 0.5) * uCanvas.y);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uCenter;
uniform float uHalfH, uW, uArcH, uPitch, uScroll, uR, uD, uInset, uGauge, uTick;
uniform vec2 uIdx, uSide;
uniform vec4 uFit0, uFit1;
uniform sampler2D uMedia0, uOverlay0, uMedia1, uOverlay1;
uniform vec3 uBg, uBase, uInk;
varying vec2 vPx;

const float SPLIT = ${SPLIT.toFixed(6)};

vec3 face(sampler2D media, sampler2D overlay, vec4 fit, float side, vec2 c) {
  vec2 uv = vec2(c.x / uW + 0.5, 0.5 - c.y / uArcH);
  vec4 o = texture2D(overlay, uv);
  float mu = (uv.x - (side < 0.5 ? 0.0 : 1.0 - SPLIT)) / SPLIT;
  if (mu < 0.0 || mu > 1.0) return o.rgb;
  vec2 m = (vec2(mu, uv.y) - fit.xy) / fit.zw;
  vec3 base = uBase;
  if (m.x >= 0.0 && m.x <= 1.0 && m.y >= 0.0 && m.y <= 1.0) {
    vec4 t = texture2D(media, m);
    base = t.rgb + uBase * (1.0 - t.a);
  }
  return base * (1.0 - o.a) + o.rgb;
}

void main() {
  vec2 p = vPx - uCenter;
  vec3 col = uBg;
  // Ray from the eye through this pixel against the cylinder y² + (z + D + R)² = R².
  float a = p.y * p.y + uD * uD;
  float b = -2.0 * uD * (uD + uR);
  float c = uD * uD + 2.0 * uD * uR;
  float disc = b * b - 4.0 * a * c;
  if (disc >= 0.0) {
    float t = (-b - sqrt(disc)) / (2.0 * a);
    float phi = atan(t * p.y, (uD + uR) - t * uD);
    float xc = t * p.x;
    float px = 1.0 / t;                       // screen px per cylinder px

    // Slides: inside the window band, cut to the lens shape.
    float s = uR * phi + uScroll;
    float k = floor(s / uPitch + 0.5);
    float ly = s - k * uPitch;
    float edge = uW * 0.5 - uInset * pow(min(abs(ly) / (uArcH * 0.5), 1.0), 3.5);
    float inside = clamp(0.5 - (abs(xc) - edge) * px, 0.0, 1.0)
                 * clamp(0.5 - (abs(ly) - uArcH * 0.5) * px, 0.0, 1.0)
                 * clamp(0.5 - (abs(p.y) - uHalfH), 0.0, 1.0);
    if (inside > 0.0) {
      vec3 f = col;
      bool hit = true;
      if (abs(k - uIdx.x) < 0.5) f = face(uMedia0, uOverlay0, uFit0, uSide.x, vec2(xc, ly));
      else if (abs(k - uIdx.y) < 0.5) f = face(uMedia1, uOverlay1, uFit1, uSide.y, vec2(xc, ly));
      else hit = false;
      if (hit) {
        float light = mix(0.2, 1.0, smoothstep(0.2, 0.8, cos(phi)));
        col = mix(col, mix(uBg, f, light), inside);
      }
    }

    // Gauge: a ring round the cylinder at x = ±uGauge, ticks pointing outwards.
    float beyond = abs(xc) - uGauge;
    float vis = 1.0 - smoothstep(0.56, 0.68, abs(phi));
    float ring = clamp(1.0 - abs(beyond) * px, 0.0, 1.0) * 0.12;
    float ti = (phi + uScroll / uR) / uTick;
    float n = floor(ti + 0.5);
    float major = mod(n, 20.0) < 0.5 ? 1.0 : 0.0;
    float len = mix(7.0, 16.0, major);
    float dy = abs(ti - n) * uTick * uR * cos(phi) * px;
    float tick = clamp(1.0 - dy, 0.0, 1.0) * step(0.0, beyond) * step(beyond, len) * mix(0.25, 0.5, major);
    col = mix(col, uInk, max(ring, tick) * vis);
  }
  gl_FragColor = vec4(col, 1.0);
}`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

function hexToRgb(value) {
  const m = /^#([0-9a-f]{6})$/i.exec(value.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const unit = (rgb) => rgb.map((c) => c / 255);

// Colours come from the design tokens, so light and dark mode both work.
function readColours() {
  const cs = getComputedStyle(document.documentElement);
  const get = (name) => cs.getPropertyValue(name).trim();
  const glow = hexToRgb(get('--glow-3')) || [42, 5, 0];
  const surface = hexToRgb(get('--surface')) || [17, 17, 17];
  const mix = glow.map((c, i) => Math.round(c * 0.55 + surface[i] * 0.45));
  return {
    panelFrom: get('--surface-2') || '#161616',
    panelTo: `rgb(${mix.join(',')})`,
    glow: get('--glow-2') || '#8C1000',
    line: get('--line-strong') || 'rgba(255,255,255,0.2)',
    gridLine: get('--line') || 'rgba(255,255,255,0.1)',
    muted: get('--muted') || 'rgba(255,255,255,0.5)',
    tile: get('--surface-2') || '#161616',
    bg: unit(hexToRgb(get('--bg')) || [10, 10, 10]),
    base: unit(hexToRgb(get('--surface-2')) || [22, 22, 22]),
    ink: unit(hexToRgb(get('--ink')) || [240, 240, 240]),
  };
}

const FONT = 'Inter, "Inter Fallback", "Helvetica Neue", Arial, sans-serif';

function wrap(ctx, text, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// Cylinder geometry for a window W × Hw (CSS px).
function geometry(W, Hw) {
  const R = RADIUS * Hw;
  const D = DISTANCE * Hw;
  // Screen position of a point on the cylinder, relative to the window centre.
  const toScreen = (xc, arcY) => {
    const phi = arcY / R;
    const depth = D + R - R * Math.cos(phi);
    return [(xc * D) / depth, (R * Math.sin(phi) * D) / depth];
  };
  // Arc position whose screen y is sy (bisection; the map is monotonic here).
  const toArc = (sy) => {
    let lo = -R * 1.5;
    let hi = R * 1.5;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (toScreen(0, mid)[1] < sy) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };
  const arcH = 2 * toArc(Hw / 2);
  return { W, Hw, R, D, arcH, pitch: arcH + GAP, inset: INSET * W, toScreen, toArc };
}

// Text layer geometry for one slide, in slide px from its top-left corner.
// Even slides have the panel on the right, odd ones on the left, as in the reference.
function layout(ctx, slide, index, g) {
  const { W, arcH } = g;
  const panelRight = index % 2 === 0;
  const mw = W * SPLIT;
  const panelX = panelRight ? mw : 0;
  const panelW = W - mw;
  const padSeam = 44;
  const padOuter = g.inset * 0.35 + 40;
  const fs = Math.min(22, Math.max(17, window.innerWidth * 0.0165));
  const lh = Math.round(fs * 1.8);
  ctx.font = `400 ${fs}px ${FONT}`;
  const maxW = Math.min(panelW - padSeam - padOuter, fs * 15);
  const x = panelRight ? panelX + padSeam : panelX + padOuter;
  const pitch = wrap(ctx, slide.querySelector('.work-slide__pitch').textContent, maxW);
  const tagH = 24;
  const linksH = 44;
  const total = pitch.length * lh + 20 + tagH + 28 + linksH;
  const y0 = Math.max(24, (arcH - total) / 2);
  return {
    panelRight, mw, panelX, panelW, x, fs, lh, pitch,
    pitchY: y0, tagY: y0 + pitch.length * lh + 20, linksY: y0 + pitch.length * lh + 20 + tagH + 28,
  };
}

function drawOverlay(slide, index, g, dpr, colours) {
  const { W, arcH, Hw } = g;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(arcH * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const L = layout(ctx, slide, index, g);

  // Title at the top of the image, on the panel side, with a soft scrim behind it.
  const size = Math.min(40, Math.max(26, window.innerWidth * 0.031));
  const titleY = arcH / 2 + g.toArc(-Hw / 2 + Hw * 0.075);
  const mediaX = L.panelRight ? 0 : W - L.mw;
  const scrim = ctx.createLinearGradient(0, titleY - 40, 0, titleY + size * 3);
  scrim.addColorStop(0, 'rgba(0,0,0,0.45)');
  scrim.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(mediaX, 0, L.mw, titleY + size * 3);
  ctx.font = `400 ${size}px ${FONT}`;
  ctx.fillStyle = '#F0F0F0';
  ctx.textBaseline = 'top';
  ctx.textAlign = L.panelRight ? 'right' : 'left';
  const titleX = L.panelRight ? L.mw - 32 : W - L.mw + 32;
  wrap(ctx, slide.querySelector('.work-slide__title').textContent, L.mw - 64)
    .forEach((line, i) => ctx.fillText(line, titleX, titleY + i * size * 1.1));

  // Panel: dark gradient with a red glow at the top, as in the reference.
  const panel = ctx.createLinearGradient(L.panelX, 0, L.panelX + L.panelW, arcH);
  panel.addColorStop(0, colours.panelFrom);
  panel.addColorStop(1, colours.panelTo);
  ctx.fillStyle = panel;
  ctx.fillRect(L.panelX, 0, L.panelW, arcH);
  const glow = ctx.createRadialGradient(L.panelX + L.panelW / 2, 0, 0, L.panelX + L.panelW / 2, 0, arcH * 0.6);
  glow.addColorStop(0, colours.glow);
  glow.addColorStop(1, 'transparent');
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = glow;
  ctx.fillRect(L.panelX, 0, L.panelW, arcH);
  ctx.globalAlpha = 1;

  ctx.textAlign = 'left';
  ctx.fillStyle = colours.muted;
  ctx.font = `400 ${L.fs}px ${FONT}`;
  L.pitch.forEach((line, i) => ctx.fillText(line, L.x, L.pitchY + i * L.lh + (L.lh - L.fs) / 2));

  // Stack placeholder as a tag pill.
  const tag = slide.querySelector('.work-slide__tags').textContent.toUpperCase();
  ctx.font = `500 11px ${FONT}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0.22px';
  const tw = ctx.measureText(tag).width + 14;
  ctx.strokeStyle = colours.line;
  ctx.beginPath();
  ctx.roundRect?.(L.x + 0.5, L.tagY + 0.5, tw, 23, 12);
  ctx.stroke();
  ctx.fillText(tag, L.x + 7, L.tagY + 6.5);
  return canvas;
}

// Projects without an image yet: a plain tile with a faint grid.
function drawTile(colours, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w);
  canvas.height = Math.round(h);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = colours.tile;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = colours.gridLine;
  for (let x = 48; x < w; x += 48) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); ctx.stroke(); }
  for (let y = 48; y < h; y += 48) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke(); }
  ctx.fillStyle = colours.muted;
  ctx.font = `500 14px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('PREVIEW TO COME', w / 2, h / 2);
  return canvas;
}

export function createDrumGL({ stageEl, windowEl, slides, onLost }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'work__gl';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false });
  if (!gl) return null;

  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch (error) {
    console.warn('Work drum: WebGL setup failed, using CSS.', error.message);
    return null;
  }
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const u = {};
  ['uCanvas', 'uCenter', 'uHalfH', 'uW', 'uArcH', 'uPitch', 'uScroll', 'uR', 'uD', 'uInset', 'uGauge', 'uTick',
    'uIdx', 'uSide', 'uFit0', 'uFit1', 'uMedia0', 'uOverlay0', 'uMedia1', 'uOverlay1', 'uBg', 'uBase', 'uInk']
    .forEach((name) => { u[name] = gl.getUniformLocation(program, name); });
  gl.uniform1i(u.uMedia0, 0);
  gl.uniform1i(u.uOverlay0, 1);
  gl.uniform1i(u.uMedia1, 2);
  gl.uniform1i(u.uOverlay1, 3);
  gl.uniform1f(u.uTick, (TICK_DEG * Math.PI) / 180);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);

  const newTexture = () => {
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  };
  // Uploads use their own texture unit so they never disturb the four bound for drawing.
  const upload = (tex, source) => {
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  };

  let g = null;
  let dpr = 1;
  let colours = readColours();
  let lastPos = 0;
  let lost = false;
  const overlays = new Map();   // slide index → texture, most recent last
  const media = slides.map(() => ({ tex: newTexture(), source: null, w: 1, h: 1, poster: null, tile: false }));
  const measure = document.createElement('canvas').getContext('2d');

  // The real links sit over the canvas where the painted panel leaves room.
  function placeLinks() {
    slides.forEach((slide, i) => {
      const L = layout(measure, slide, i, g);
      const [x, y] = g.toScreen(L.x - g.W / 2, L.linksY + 22 - g.arcH / 2);
      const links = slide.querySelector('.work-slide__links');
      links.style.left = `${g.W / 2 + x}px`;
      links.style.top = `${g.Hw / 2 + y - 22}px`;
    });
  }

  function overlay(i) {
    let tex = overlays.get(i);
    if (tex) {
      overlays.delete(i);
      overlays.set(i, tex);
      return tex;
    }
    if (overlays.size >= 4) {
      const [oldest, oldTex] = overlays.entries().next().value;
      overlays.delete(oldest);
      gl.deleteTexture(oldTex);
    }
    tex = newTexture();
    upload(tex, drawOverlay(slides[i], i, g, dpr, colours));
    overlays.set(i, tex);
    return tex;
  }

  // Image, looping clip (re-uploaded every frame), its poster, or the plain tile.
  function mediaFor(i) {
    const m = media[i];
    const video = slides[i].querySelector('video');
    const img = slides[i].querySelector('img.work-slide__img');
    let source = null;
    let tile = false;
    if (video && video.readyState >= 2) source = video;
    else if (video) {
      // Clip not playable yet (or this browser lacks the codec): show its poster.
      if (!m.poster) {
        m.poster = new Image();
        m.poster.onload = () => draw();
        m.poster.src = video.poster;
      }
      if (m.poster.complete && m.poster.naturalWidth) source = m.poster;
    } else if (img?.complete && img.naturalWidth) source = img;
    else if (!img) {
      tile = true;
      source = m.source || drawTile(colours, g.W * SPLIT, g.arcH);
    }
    if (source && (source !== m.source || source === video)) {
      upload(m.tex, source);
      m.source = source;
      m.tile = tile;
      m.w = source.videoWidth || source.naturalWidth || source.width;
      m.h = source.videoHeight || source.naturalHeight || source.height;
    }
    return m;
  }

  // Fit the image inside the image area with room round it (media-area UV, v up).
  function fitFor(m) {
    if (!m.source || m.tile) return [0, 0, 1, 1];
    const areaW = g.W * SPLIT;
    const scale = Math.min((areaW * 0.84) / m.w, (g.arcH * 0.66) / m.h);
    const fw = (m.w * scale) / areaW;
    const fh = (m.h * scale) / g.arcH;
    return [(1 - fw) / 2, (1 - fh) / 2, fw, fh];
  }

  function bindSlot(slot, i) {
    const m = mediaFor(i);
    gl.activeTexture(gl.TEXTURE0 + slot * 2);
    gl.bindTexture(gl.TEXTURE_2D, m.tex);
    gl.activeTexture(gl.TEXTURE1 + slot * 2);
    gl.bindTexture(gl.TEXTURE_2D, overlay(i));
    gl.uniform4f(slot ? u.uFit1 : u.uFit0, ...fitFor(m));
  }

  function draw(pos = lastPos) {
    lastPos = pos;
    if (lost || !g) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    const first = Math.floor(pos);
    const second = Math.min(first + 1, slides.length - 1);
    bindSlot(0, first);
    bindSlot(1, second);
    gl.uniform2f(u.uIdx, first, second === first ? -99 : second);
    gl.uniform2f(u.uSide, first % 2, second % 2);
    gl.uniform1f(u.uScroll, pos * g.pitch);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    watchClip(Math.round(pos));
  }

  // Redraw on each new frame of the front project's clip.
  let watched = null;
  function watchClip(i) {
    const video = slides[i]?.querySelector('video');
    if (video === watched) return;
    watched = video;
    if (!video) return;
    const step = () => {
      if (watched !== video || lost) return;
      if (!video.paused) draw();
      if ('requestVideoFrameCallback' in video) video.requestVideoFrameCallback(step);
      else requestAnimationFrame(step);
    };
    step();
  }

  function resize() {
    // Layout sizes, not getBoundingClientRect: the entrance animation scales the window.
    const cw = stageEl.clientWidth;
    const ch = stageEl.clientHeight;
    if (!cw || !windowEl.clientWidth) return;
    g = geometry(windowEl.clientWidth, windowEl.clientHeight);
    dpr = Math.min(window.devicePixelRatio || 1, 2, maxTex / g.W, maxTex / g.arcH, maxTex / cw);
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    gl.uniform2f(u.uCanvas, cw, ch);
    gl.uniform2f(u.uCenter, windowEl.offsetLeft + g.W / 2, windowEl.offsetTop + g.Hw / 2);
    gl.uniform1f(u.uHalfH, g.Hw / 2);
    gl.uniform1f(u.uW, g.W);
    gl.uniform1f(u.uArcH, g.arcH);
    gl.uniform1f(u.uPitch, g.pitch);
    gl.uniform1f(u.uR, g.R);
    gl.uniform1f(u.uD, g.D);
    gl.uniform1f(u.uInset, g.inset);
    gl.uniform1f(u.uGauge, cw / 2 - 12);
    refresh();
  }

  function refresh() {
    colours = readColours();
    gl.uniform3f(u.uBg, ...colours.bg);
    gl.uniform3f(u.uBase, ...colours.base);
    gl.uniform3f(u.uInk, ...colours.ink);
    overlays.forEach((tex) => gl.deleteTexture(tex));
    overlays.clear();
    media.forEach((m) => { if (m.tile) m.source = null; });
    if (!g) return;
    placeLinks();
    draw();
  }

  const observer = new ResizeObserver(resize);
  const scheme = window.matchMedia('(prefers-color-scheme: light)');
  const onScheme = () => refresh();
  scheme.addEventListener('change', onScheme);
  slides.forEach((slide) => slide.querySelector('img')?.addEventListener('load', () => draw()));
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    if (lost) return;
    lost = true;
    onLost?.();
  });

  stageEl.prepend(canvas);
  observer.observe(stageEl);
  observer.observe(windowEl);
  // Text is painted into textures, so repaint once the web font is in.
  document.fonts?.ready.then(() => { if (!lost) refresh(); });

  return {
    draw,
    destroy() {
      lost = true;
      watched = null;
      observer.disconnect();
      scheme.removeEventListener('change', onScheme);
      canvas.remove();
      slides.forEach((slide) => {
        const links = slide.querySelector('.work-slide__links');
        links.style.left = links.style.top = '';
      });
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}

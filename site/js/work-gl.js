// WebGL drum for the Work page. Each project is one face of a four-sided drum
// seen through a slight lens, like the reference: the image (or its looping clip)
// fills the left of the face and the text panel, drawn with the 2D canvas API,
// fills the right. The HTML slides stay in the page for screen readers and
// keyboard users; only their links show, on top of the canvas, at rest.
//
// createDrumGL() returns null when WebGL is unavailable; work.js then falls back
// to the CSS 3D drum.

const SPLIT = 1.6 / 2.6;   // image width / face width, same as the CSS grid
const LENS = 0.06;         // barrel strength
const DISTANCE = 1800;     // camera distance in CSS px, same as the CSS perspective
const GRID = 40;           // face mesh subdivisions, so the lens bends smoothly
const OVERLAY_CACHE = 4;   // text panels kept on the GPU at once

const VERT = `
precision highp float;
attribute vec2 aPos;
uniform vec2 uSize;
uniform float uAngle;
varying vec2 vUv;
varying float vFacing;
void main() {
  float r = uSize.y * 0.5;
  vec3 p = vec3((aPos.x - 0.5) * uSize.x, (aPos.y - 0.5) * uSize.y, r);
  float c = cos(uAngle);
  float s = sin(uAngle);
  vec3 q = vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c - r);
  float w = (${DISTANCE.toFixed(1)} - q.z) / ${DISTANCE.toFixed(1)};
  vec2 ndc = vec2(q.x / (uSize.x * 0.5), q.y / (uSize.y * 0.5)) / w;
  ndc *= (1.0 + ${LENS}) * (1.0 - ${LENS} * 0.5 * dot(ndc, ndc));
  gl_Position = vec4(ndc, 0.0, 1.0);
  vUv = aPos;
  vFacing = c;
}`;

const FRAG = `
precision mediump float;
uniform sampler2D uMedia;
uniform sampler2D uOverlay;
uniform vec4 uCover;
uniform vec3 uShade;
uniform vec3 uBase;
varying vec2 vUv;
varying float vFacing;
void main() {
  vec4 o = texture2D(uOverlay, vUv);
  vec3 col = o.rgb;
  if (vUv.x < ${SPLIT.toFixed(6)}) {
    vec2 m = vec2(vUv.x / ${SPLIT.toFixed(6)}, vUv.y) * uCover.xy + uCover.zw;
    vec4 t = texture2D(uMedia, m);
    col = (t.rgb + uBase * (1.0 - t.a)) * (1.0 - o.a) + o.rgb;
  }
  gl_FragColor = vec4(mix(uShade, col, mix(0.3, 1.0, vFacing)), 1.0);
}`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

function faceMesh() {
  const v = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const [x0, x1, y0, y1] = [x / GRID, (x + 1) / GRID, y / GRID, (y + 1) / GRID];
      v.push(x0, y0, x1, y0, x1, y1, x0, y0, x1, y1, x0, y1);
    }
  }
  return new Float32Array(v);
}

function hexToRgb(value) {
  const m = /^#([0-9a-f]{6})$/i.exec(value.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Colours come from the design tokens, so light and dark mode both work.
function readColours() {
  const cs = getComputedStyle(document.documentElement);
  const get = (name) => cs.getPropertyValue(name).trim();
  const a = hexToRgb(get('--glow-3')) || [0, 0, 0];
  const b = hexToRgb(get('--surface')) || [17, 17, 17];
  const mix = a.map((c, i) => Math.round(c * 0.55 + b[i] * 0.45));
  return {
    panelFrom: get('--surface-2') || '#161616',
    panelTo: `rgb(${mix.join(',')})`,
    tile: get('--surface-2') || '#161616',
    gridLine: get('--line') || 'rgba(255,255,255,0.1)',
    muted: get('--muted') || 'rgba(255,255,255,0.5)',
    shade: (hexToRgb(get('--bg-deep')) || [0, 0, 0]).map((c) => c / 255),
    base: (hexToRgb(get('--surface-2')) || [22, 22, 22]).map((c) => c / 255),
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

// Text panel geometry, mirroring the CSS panel: 40px left padding, right padding
// that clears the window's rounded corner, content centred vertically.
function layout(ctx, slide, W, H, radius) {
  const mw = W * SPLIT;
  const padL = 40;
  const padR = radius * 0.45 + 24;
  ctx.font = `400 15px ${FONT}`;
  const maxW = Math.min(W - mw - padL - padR, ctx.measureText('0').width * 34);
  const pitch = wrap(ctx, slide.querySelector('.work-slide__pitch').textContent, maxW);
  const pitchH = pitch.length * 24;
  const tagH = 15;
  const linksH = 44;
  const total = pitchH + 12 + 8 + tagH + 12 + 16 + linksH;
  const y0 = Math.max(24, (H - total) / 2);
  return {
    mw, x: mw + padL, pitch, pitchY: y0,
    tagY: y0 + pitchH + 20, linksY: y0 + pitchH + 20 + tagH + 28,
  };
}

function drawOverlay(slide, W, H, dpr, radius, colours) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const L = layout(ctx, slide, W, H, radius);

  // Scrim and title over the image.
  const scrim = ctx.createLinearGradient(0, 0, 0, H * 0.45);
  scrim.addColorStop(0, 'rgba(0,0,0,0.55)');
  scrim.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, L.mw, H * 0.45);
  const size = Math.min(32, Math.max(24, window.innerWidth * 0.026));
  ctx.font = `500 ${size}px ${FONT}`;
  ctx.fillStyle = '#F0F0F0';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  wrap(ctx, slide.querySelector('.work-slide__title').textContent, L.mw - 48)
    .forEach((line, i) => ctx.fillText(line, L.mw - 24, 24 + i * size * 1.1));

  // Panel.
  const panel = ctx.createLinearGradient(L.mw, 0, W, H);
  panel.addColorStop(0, colours.panelFrom);
  panel.addColorStop(1, colours.panelTo);
  ctx.fillStyle = panel;
  ctx.fillRect(L.mw, 0, W - L.mw, H);
  ctx.textAlign = 'left';
  ctx.fillStyle = colours.muted;
  ctx.font = `400 15px ${FONT}`;
  L.pitch.forEach((line, i) => ctx.fillText(line, L.x, L.pitchY + i * 24 + 4));
  ctx.font = `500 12px ${FONT}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0.24px';
  ctx.fillText(slide.querySelector('.work-slide__tags').textContent.toUpperCase(), L.x, L.tagY);
  return canvas;
}

// Projects without an image yet: a plain tile with a faint grid.
function drawTile(colours) {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = colours.tile;
  ctx.fillRect(0, 0, 960, 600);
  ctx.strokeStyle = colours.gridLine;
  for (let x = 48; x < 960; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke(); }
  for (let y = 48; y < 600; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(960, y); ctx.stroke(); }
  ctx.fillStyle = colours.muted;
  ctx.font = `500 22px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('PREVIEW TO COME', 480, 310);
  return canvas;
}

export function createDrumGL({ windowEl, slides, onLost }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'work__gl';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha: false, antialias: true, premultipliedAlpha: false });
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
  const mesh = faceMesh();
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const u = Object.fromEntries(['uSize', 'uAngle', 'uCover', 'uShade', 'uBase', 'uMedia', 'uOverlay']
    .map((name) => [name, gl.getUniformLocation(program, name)]));
  gl.uniform1i(u.uMedia, 0);
  gl.uniform1i(u.uOverlay, 1);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);

  const newTexture = () => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  };
  const upload = (tex, source) => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  };

  let W = 0;
  let H = 0;
  let dpr = 1;
  let radius = 0;
  let colours = readColours();
  let lastPos = 0;
  let lost = false;
  const overlays = new Map();   // slide index → texture, most recent last
  const media = slides.map(() => ({ tex: newTexture(), source: null, w: 1, h: 1 }));
  const measure = document.createElement('canvas').getContext('2d');

  // Where a point on the front face lands once the lens bends it (as in VERT).
  function throughLens(x, y) {
    const nx = (x - W / 2) / (W / 2);
    const ny = (y - H / 2) / (H / 2);
    const f = (1 + LENS) * (1 - LENS * 0.5 * (nx * nx + ny * ny));
    return [W / 2 + nx * f * (W / 2), H / 2 + ny * f * (H / 2)];
  }

  // The real links sit over the canvas where the panel leaves room for them.
  function placeLinks() {
    slides.forEach((slide) => {
      const L = layout(measure, slide, W, H, radius);
      const [x, y] = throughLens(L.x, L.linksY + 22);
      const links = slide.querySelector('.work-slide__links');
      links.style.left = `${x}px`;
      links.style.top = `${y - 22}px`;
    });
  }

  function overlay(i) {
    let tex = overlays.get(i);
    if (tex) {
      overlays.delete(i);
      overlays.set(i, tex);
      return tex;
    }
    if (overlays.size >= OVERLAY_CACHE) {
      const [oldest, oldTex] = overlays.entries().next().value;
      overlays.delete(oldest);
      gl.deleteTexture(oldTex);
    }
    tex = newTexture();
    upload(tex, drawOverlay(slides[i], W, H, dpr, radius, colours));
    overlays.set(i, tex);
    return tex;
  }

  // Image, looping clip, or the plain tile. Clips re-upload every frame.
  function mediaFor(i) {
    const m = media[i];
    const video = slides[i].querySelector('video');
    const img = slides[i].querySelector('img.work-slide__img');
    let source = null;
    if (video && video.readyState >= 2) source = video;
    else if (video) {
      // Clip not playable yet (or this browser lacks the codec): show its poster.
      if (!m.poster) {
        m.poster = new Image();
        m.poster.onload = () => draw();
        m.poster.src = video.poster;
      }
      if (m.poster.complete && m.poster.naturalWidth) source = m.poster;
    }
    else if (img?.complete && img.naturalWidth) source = img;
    else if (!img && !video) source = m.source || drawTile(colours);
    if (source && (source !== m.source || source === video)) {
      upload(m.tex, source);
      m.source = source;
      m.w = source.videoWidth || source.naturalWidth || source.width;
      m.h = source.videoHeight || source.naturalHeight || source.height;
    }
    return m;
  }

  function draw(pos = lastPos) {
    lastPos = pos;
    if (lost || !W) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(...colours.shade, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(u.uSize, W, H);
    gl.uniform3f(u.uShade, ...colours.shade);
    gl.uniform3f(u.uBase, ...colours.base);
    const first = Math.floor(pos);
    for (const i of [first, first + 1]) {
      const d = i - pos;
      if (i < 0 || i >= slides.length || Math.abs(d) >= 1) continue;
      const m = mediaFor(i);
      // Cover the image area without stretching.
      const area = (W * SPLIT) / H;
      const src = m.w / m.h;
      const sx = src > area ? area / src : 1;
      const sy = src > area ? 1 : src / area;
      gl.uniform4f(u.uCover, sx, sy, (1 - sx) / 2, (1 - sy) / 2);
      gl.uniform1f(u.uAngle, (d * Math.PI) / 2);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, m.tex);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, overlay(i));
      gl.drawArrays(gl.TRIANGLES, 0, mesh.length / 2);
    }
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
    // Layout size, not getBoundingClientRect: the entrance animation scales the window.
    if (!windowEl.clientWidth) return;
    W = windowEl.clientWidth;
    H = windowEl.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2, maxTex / W, maxTex / H);
    radius = parseFloat(getComputedStyle(windowEl).borderTopLeftRadius) || 0;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    refresh();
  }

  function refresh() {
    colours = readColours();
    overlays.forEach((tex) => gl.deleteTexture(tex));
    overlays.clear();
    media.forEach((m) => { if (m.source instanceof HTMLCanvasElement) m.source = null; });
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

  windowEl.prepend(canvas);
  observer.observe(windowEl);
  // Text is drawn into textures, so redraw once the web font is in.
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

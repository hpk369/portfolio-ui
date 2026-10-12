# Intro reel

`reel.html` is the shader that renders `site/media/intro-reel.mp4` (8 s, 30 fps, seamless loop: every motion completes a whole cycle per loop). `render.mjs` drives headless Chromium to save one PNG per frame. The page itself never loads these files.

```bash
npm i playwright-core@1.56.0                 # one-off, into this folder (set CHROME=/path/to/chrome if Playwright has no browser installed)
node render.mjs "$PWD/reel.html" frames 240  # writes frames/f0000.png ... f0239.png
ffmpeg -framerate 30 -i frames/f%04d.png -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -movflags +faststart -an ../../site/media/intro-reel.mp4
ffmpeg -i frames/f0000.png -quality 70 ../../site/media/intro-reel.webp
```

Then delete `frames/` and `node_modules/` (neither is committed).

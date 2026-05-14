import fs from 'fs';
import path from 'path';

const CLIENT_DIR = path.resolve('dist/client');
const ASSETS_DIR = path.join(CLIENT_DIR, 'assets');

const files = fs.readdirSync(ASSETS_DIR).filter((file) => file.endsWith('.js'));
if (files.length === 0) {
  throw new Error(`No JS files found in ${ASSETS_DIR}`);
}

const mainJS = files
  .map((file) => ({ file, size: fs.statSync(path.join(ASSETS_DIR, file)).size }))
  .sort((a, b) => b.size - a.size)[0].file;

const html = `<!DOCTYPE html>
<html lang="fr" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="SpectralFlow : un réseau social immersif mêlant flux vidéo YouTube, chat temps réel et esthétique cyberpunk néon." />
    <meta name="theme-color" content="#060b1f" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta property="og:title" content="SpectralFlow" />
    <meta property="og:description" content="Le réseau social cyberpunk pour partager vidéos et idées." />
    <meta property="og:type" content="website" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="icon" type="image/svg+xml" href="/icon.svg" />
    <title>SpectralFlow — Réseau social cyberpunk</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/${mainJS}"></script>
  </body>
</html>
`;

fs.writeFileSync(path.join(CLIENT_DIR, 'index.html'), html);
console.log(`Generated index.html with /assets/${mainJS}`);

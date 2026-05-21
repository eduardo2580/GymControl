#!/usr/bin/env node
// Junta todos os vídeos .webm gerados pelo Playwright human-paced num único
// arquivo .mp4 (test-results/human-e2e.mp4) para revisão humana / compartilhamento.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');

const ROOT = path.join(__dirname, '..');
const RESULTS = path.join(ROOT, 'test-results');
const OUT = path.join(RESULTS, 'human-e2e.mp4');

function findVideos(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findVideos(full));
    else if (entry.name.endsWith('.webm')) out.push(full);
  }
  return out;
}

const videos = findVideos(RESULTS)
  // pula vídeos de retries / traces, mantém apenas os de execução de teste
  .filter(p => !p.includes('-retry'))
  .sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);

if (!videos.length) {
  console.error('Nenhum vídeo encontrado em test-results/. Rode primeiro `npm run test:e2e:human`.');
  process.exit(1);
}

console.log(`Concatenando ${videos.length} clip(s):`);
videos.forEach((v, i) => console.log(`  ${i + 1}. ${path.relative(ROOT, v)}`));

// ffmpeg concat demuxer precisa de um arquivo lista
const listPath = path.join(os.tmpdir(), `e2e-concat-${process.pid}.txt`);
fs.writeFileSync(listPath, videos.map(v => `file '${v.replace(/'/g, "'\\''")}'`).join('\n'));

// re-encoda para mp4/h264 — webms tem timestamps esquisitos que quebram o
// "copy" puro, então re-encoda uma vez aqui para garantir reprodutibilidade.
const args = [
  '-y',
  '-f', 'concat', '-safe', '0',
  '-i', listPath,
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '23',
  '-movflags', '+faststart',
  OUT,
];

console.log('\nffmpeg', args.join(' '));
const r = spawnSync(ffmpeg, args, { stdio: 'inherit' });
fs.unlinkSync(listPath);

if (r.status !== 0) {
  console.error('\nffmpeg falhou.');
  process.exit(r.status || 1);
}

console.log(`\nVídeo final: ${path.relative(ROOT, OUT)}`);

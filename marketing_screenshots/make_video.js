const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegStatic);

const files = [
  { name: 'REELS_01_HOOK.png', duration: 2.0 },
  { name: 'REELS_02_SOLUTION.png', duration: 2.5 },
  { name: 'REELS_03_FEATURE1.png', duration: 2.0 },
  { name: 'REELS_04_FEATURE2.png', duration: 2.0 },
  { name: 'REELS_05_FEATURE3.png', duration: 2.0 },
  { name: 'REELS_06_CTA.png', duration: 3.5 }
];

let txtContent = '';
for (const f of files) {
  txtContent += `file '${f.name}'\n`;
  txtContent += `duration ${f.duration}\n`;
}
// Pelo padrão do FFmpeg concat, o último arquivo precisa ser repetido no fim.
txtContent += `file '${files[files.length - 1].name}'\n`;

fs.writeFileSync('inputs.txt', txtContent);

console.log('🎬 Iniciando a renderização do vídeo (MP4)... isso pode levar uns segundinhos.');

ffmpeg('inputs.txt')
  .inputOptions(['-f', 'concat', '-safe', '0'])
  .outputOptions([
    '-c:v libx264',
    '-pix_fmt yuv420p',
    '-r 30',            // 30 FPS
    '-preset fast',     // Renderização mais rápida
    '-crf 23'           // Qualidade alta
  ])
  .save('anuncio_reels.mp4')
  .on('end', () => {
    console.log('✅ Vídeo "anuncio_reels.mp4" renderizado com sucesso!');
  })
  .on('error', (err) => {
    console.error('❌ Erro ao compilar vídeo:', err.message);
  });

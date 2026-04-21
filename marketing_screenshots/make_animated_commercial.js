const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const fs = require('fs');
const path = require('path');

// Caminhos das imagens capturadas (assets)
const rootBase = 'C:\\Users\\pp\\.gemini\\antigravity\\brain\\f50ee6c1-44ce-4a81-a178-2dd02ccc306a';
const imgBgPath = path.join(rootBase, 'barber_bg_1776398527082.png');
const phoneAppImg = path.join(__dirname, '6_booking_client_ig_portrait.png');
const adminMacImg = path.join(__dirname, '4_admin_settings_ig_square.png');

function fileToBase64(filepath) {
  if (fs.existsSync(filepath)) {
    return 'data:image/png;base64,' + fs.readFileSync(filepath).toString('base64');
  }
  return '';
}

const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Montserrat', sans-serif; }
    body {
      width: 1080px; height: 1920px;
      background: #000; color: white;
      position: relative; overflow: hidden;
      display: flex; flex-direction: column; align-items: center;
    }
    
    /* Background Animado */
    .bg {
      position: absolute; inset: -5%;
      background-image: url('${fileToBase64(imgBgPath)}');
      background-size: cover; background-position: center;
      opacity: 0.4; filter: blur(4px);
      animation: bgPan 15s linear infinite alternate;
    }
    @keyframes bgPan { from { transform: scale(1); } to { transform: scale(1.1) translate(-20px, 10px); } }
    
    .overlay {
      position: absolute; inset: 0;
      background: linear-gradient(180deg, rgba(5,5,5,0.7) 0%, rgba(5,5,5,0.95) 70%);
    }

    /* Container de Cenas */
    .scene {
      position: absolute; inset: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      opacity: 0; pointer-events: none;
    }

    /* Animações Genéricas */
    @keyframes fadeInOut {
      0% { opacity: 0; transform: translateY(50px); }
      10% { opacity: 1; transform: translateY(0); }
      90% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(-50px); }
    }
    @keyframes slideUp {
      0% { opacity: 0; transform: translateY(300px); }
      15% { opacity: 1; transform: translateY(0); }
      85% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(300px); }
    }
    @keyframes pulseGold {
      0% { box-shadow: 0 0 0 0 rgba(212,175,55, 0.7); transform: scale(1); }
      50% { box-shadow: 0 0 0 30px rgba(212,175,55, 0); transform: scale(1.05); }
      100% { box-shadow: 0 0 0 0 rgba(212,175,55, 0); transform: scale(1); }
    }

    /* CENA 1 (0s a 3.5s) */
    .scene-1 { animation: fadeInOut 3.5s ease-in-out forwards; animation-delay: 0.5s; top: -10%; text-align: center; }
    .scene-1 h1 { font-size: 110px; font-weight: 900; line-height: 1.1; text-transform: uppercase; }
    .scene-1 h1 span { color: #D4AF37; }
    
    /* CENA 2 (3.5s a 7.5s) - Celular Aplicativo */
    .scene-2 { animation: slideUp 4s ease-in-out forwards; animation-delay: 3.5s; top: 15%; align-items: center; padding: 0 60px; }
    .scene-2 .text-block { width: 100%; text-align: left; }
    .scene-2 h2 { font-size: 80px; font-weight: 900; color: #fff; line-height: 1.1; margin-bottom: 20px;}
    .scene-2 p  { font-size: 40px; color: #D4AF37; font-weight: 700; margin-bottom: 80px;}
    .phone-mockup {
      width: 500px; height: 1000px; background: #000; border: 16px solid #222; border-radius: 64px;
      overflow: hidden; position: relative; box-shadow: 0 40px 100px rgba(0,0,0,0.9);
      margin-top: -20px;
    }
    .phone-mockup img { width: 100%; height: 100%; object-fit: cover; }
    .notch {
      position: absolute; top:0; left:50%; transform: translateX(-50%);
      width:150px; height: 30px; background: #222; border-bottom-left-radius: 20px; border-bottom-right-radius: 20px;
    }

    /* CENA 3 (7.5s a 11.5s) - Dashboard Mac */
    .scene-3 { animation: slideUp 4s ease-in-out forwards; animation-delay: 7.5s; padding: 0 40px; }
    .scene-3 .text-block { margin-top: -300px; margin-bottom: 80px; text-align: center; }
    .scene-3 h2 { font-size: 70px; font-weight: 900; line-height: 1.1; }
    .scene-3 h2 span { color: #D4AF37; display: block; }
    .mac-mockup {
      width: 900px; background: #1e1e1e; border: 1px solid #333; border-radius: 24px;
      overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,0.9);
    }
    .mac-header { height: 48px; background: #2a2a2a; display: flex; align-items: center; padding: 0 20px; gap: 10px; }
    .mac-dot { width: 14px; height: 14px; border-radius: 50%; background: #555; }
    .mac-content { height: 700px; overflow: hidden; background: #000; }
    .mac-content img { width: 100%; object-fit: cover; object-position: top; }

    /* CENA 4 (11.5s a 15s) - CTA Final */
    .scene-4 { animation: fadeInOut 4s ease-in-out forwards; animation-delay: 11s; animation-fill-mode: forwards; }
    .scene-4 .logo-name { font-size: 150px; font-weight: 900; letter-spacing: -5px; margin-bottom: 60px; color: #fff;}
    .scene-4 .logo-name span { color: #D4AF37; }
    .scene-4 .btn {
      background: #FF3B30; color: white; font-size: 48px; font-weight: 900;
      padding: 40px 80px; border-radius: 24px; text-transform: uppercase;
      animation: pulseGold 2s infinite; margin-top: 40px;
    }

  </style>
</head>
<body>
  <div class="bg"></div>
  <div class="overlay"></div>

  <div class="scene scene-1">
    <h1>AGENDAS<br>LOTADAS?<br><span>AGORA É LEI.</span></h1>
  </div>

  <div class="scene scene-2">
    <div class="text-block">
      <h2>O Seu Cliente<br>Agenda Sozinho.</h2>
      <p>Um link perfeito no seu Insta.</p>
    </div>
    <div class="phone-mockup"><div class="notch"></div><img src="${fileToBase64(phoneAppImg)}"></div>
  </div>

  <div class="scene scene-3">
    <div class="text-block">
      <h2>DINHEIRO NA HORA<br><span>SEM TAXAS OCULTAS.</span></h2>
    </div>
    <div class="mac-mockup">
      <div class="mac-header"><div class="mac-dot" style="background:#FF5E56"></div><div class="mac-dot" style="background:#FFBD2E"></div><div class="mac-dot" style="background:#27C93F"></div></div>
      <div class="mac-content"><img src="${fileToBase64(adminMacImg)}"></div>
    </div>
  </div>

  <div class="scene scene-4">
    <div class="logo-name">Barber<span>Pro</span></div>
    <div style="font-size: 40px; color: #A0A0A0; font-weight: 700; text-align: center;">O SaaS que revolucionou as<br>Barbearias no Brasil.</div>
    <div class="btn">ACESSE O LINK NA BIO</div>
  </div>

</body>
</html>
`;

(async () => {
  console.log('🚀 Inicializando o Estúdio de Gravação (Puppeteer + ScreenRecorder)...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 2 }); // Reels/Stories format

  const recorder = new PuppeteerScreenRecorder(page, {
    fps: 30,
    videoFrame: { width: 1080, height: 1920 },
    videoCrf: 18,     // Alta qualidade
    videoCodec: 'libx264',
    videoPreset: 'ultrafast',
    videoBitrate: 4000, 
    autopad: { color: 'black' }
  });

  console.log('💻 Carregando cenário com animações em CSS...');
  await page.setContent(htmlContent);

  // Inicia gravação imediatamente enquanto a primeira animação de 0.5s começa
  console.log('🎥 GRAVANDO (AGUARDE 15 SEGUNDOS)...');
  await recorder.start('comercial_profissional.mp4');

  // Aguarda 15 segundos exatos que é a duração de todas as cenas na timeline do CSS
  await new Promise(r => setTimeout(r, 15000));

  console.log('🛑 Parando a Gravação...');
  await recorder.stop();
  await browser.close();

  console.log('✅ Comercial "comercial_profissional.mp4" gerado com Sucesso!');
})();

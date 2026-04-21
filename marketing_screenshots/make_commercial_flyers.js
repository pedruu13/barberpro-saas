const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const imgBgPath = 'C:\\Users\\pp\\.gemini\\antigravity\\brain\\f50ee6c1-44ce-4a81-a178-2dd02ccc306a\\barber_bg_1776398527082.png';
const phoneMockupPath = path.join(__dirname, '6_booking_client_ig_portrait.png');

let imgBgBase64 = '';
if (fs.existsSync(imgBgPath)) {
  imgBgBase64 = 'data:image/png;base64,' + fs.readFileSync(imgBgPath).toString('base64');
}

let phoneBase64 = '';
if (fs.existsSync(phoneMockupPath)) {
  phoneBase64 = 'data:image/png;base64,' + fs.readFileSync(phoneMockupPath).toString('base64');
}

const flyers = [
  {
    output: 'FLYER_FEED_SQUARE.png',
    width: 1080,
    height: 1080,
    html: `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Montserrat', sans-serif; }
        body {
          width: 1080px; height: 1080px;
          background: #000; color: white;
          position: relative; overflow: hidden;
        }
        .bg {
          position: absolute; inset: 0;
          background-image: url('${imgBgBase64}');
          background-size: cover; background-position: center;
          opacity: 0.5; filter: blur(3px);
        }
        .overlay {
          position: absolute; inset: 0;
          background: linear-gradient(90deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.8) 50%, transparent 100%);
        }
        .content {
          position: relative; z-index: 10;
          padding: 120px 80px; width: 60%;
        }
        .tag {
          display: inline-block; background: #D4AF37; color: #000;
          font-weight: 900; font-size: 24px; text-transform: uppercase;
          padding: 8px 20px; border-radius: 4px; margin-bottom: 20px;
        }
        h1 {
          font-size: 72px; font-weight: 900; line-height: 1.1; margin-bottom: 30px;
          text-transform: uppercase; text-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        h1 span { color: #D4AF37; }
        .list { display: flex; flex-direction: column; gap: 24px; margin-bottom: 60px; }
        .list-item { display: flex; align-items: center; gap: 20px; font-size: 28px; font-weight: 700; color: #eee; }
        .list-item i { 
          display: flex; align-items: center; justify-content: center;
          width: 48px; height: 48px; background: rgba(212,175,55,0.2); 
          color: #D4AF37; border-radius: 50%; border: 2px solid #D4AF37;
          font-size: 24px; flex-shrink: 0;
        }
        .cta {
          display: inline-block; background: #FF3B30; color: white;
          font-weight: 900; font-size: 32px; text-transform: uppercase;
          padding: 24px 60px; border-radius: 12px;
          box-shadow: 0 16px 40px rgba(255,59,48,0.4);
        }
        
        .mockup {
          position: absolute; right: 40px; top: 120px;
          width: 380px; height: 800px;
          background: #000; border: 12px solid #222; border-radius: 48px;
          box-shadow: -20px 20px 80px rgba(0,0,0,0.9);
          transform: rotate(5deg);
          overflow: hidden; z-index: 5;
        }
        .mockup img { width: 100%; height: 100%; object-fit: cover; }
        .mockup::before {
          content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
          width: 120px; height: 24px; background: #222;
          border-bottom-left-radius: 16px; border-bottom-right-radius: 16px; z-index: 10;
        }
        
        /* Faixa amarela diagonal */
        .ribbon {
          position: absolute; top: 80px; right: -80px; background: #D4AF37; color: #000;
          font-weight: 900; font-size: 24px; padding: 12px 100px;
          transform: rotate(45deg); z-index: 20; text-transform: uppercase;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
      </style>
    </head>
    <body>
      <div class="bg"></div>
      <div class="overlay"></div>
      <div class="mockup"><img src="${phoneBase64}"></div>
      <div class="ribbon">SISTEMA COMPLETO</div>
      <div class="content">
        <div class="tag">Para Barbearias</div>
        <h1>Pare de Perder<br>Dinheiro Com<br><span>Taxas Absurdas!</span></h1>
        
        <div class="list">
          <div class="list-item"><i>✓</i> Seu dinheiro cai na HORA</div>
          <div class="list-item"><i>✓</i> Agendamento Online 24h</div>
          <div class="list-item"><i>✓</i> Lembrete via WhatsApp</div>
        </div>
        
        <div class="cta">TESTE GRÁTIS POR 7 DIAS</div>
      </div>
    </body>
    </html>
    `
  },
  {
    output: 'FLYER_STORY_VERTICAL.png',
    width: 1080,
    height: 1920,
    html: `
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
        .bg {
          position: absolute; inset: 0;
          background-image: url('${imgBgBase64}');
          background-size: cover; background-position: center;
          opacity: 0.6; filter: blur(4px);
        }
        .overlay {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.5) 40%, rgba(10,10,10,0.95) 100%);
        }
        .content {
          position: relative; z-index: 10;
          width: 100%; padding: 120px 60px 0; text-align: center;
        }
        h1 {
          font-size: 86px; font-weight: 900; line-height: 1.05; margin-bottom: 24px;
          text-transform: uppercase; text-shadow: 0 8px 30px rgba(0,0,0,0.8);
        }
        h1 span { color: #D4AF37; display: block; font-size: 96px; }
        
        h2 { font-size: 40px; color: #eee; font-weight: 700; margin-bottom: 60px; }
        
        .mockup {
          position: relative; z-index: 5;
          width: 540px; height: 1100px;
          background: #000; border: 16px solid #222; border-radius: 64px;
          box-shadow: 0 40px 100px rgba(0,0,0,0.9);
          overflow: hidden; margin-bottom: -100px; /* para sobrepor no fundo */
        }
        .mockup img { width: 100%; height: 100%; object-fit: cover; }
        .mockup::before {
          content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
          width: 160px; height: 32px; background: #222;
          border-bottom-left-radius: 20px; border-bottom-right-radius: 20px; z-index: 10;
        }
        
        .bottom-card {
          position: relative; z-index: 20;
          background: rgba(15,15,15,0.95);
          width: 90%; border: 2px solid #D4AF37; border-radius: 32px;
          padding: 60px; text-align: left;
          box-shadow: 0 -20px 60px rgba(0,0,0,0.6);
        }
        .list { display: flex; flex-direction: column; gap: 24px; margin-bottom: 40px; }
        .list-item { display: flex; align-items: center; gap: 24px; font-size: 36px; font-weight: 700; color: #fff; }
        .list-item i { 
          display: flex; align-items: center; justify-content: center;
          width: 56px; height: 56px; background: rgba(212,175,55,0.2); 
          color: #D4AF37; border-radius: 50%; border: 3px solid #D4AF37;
          font-size: 32px; flex-shrink: 0;
        }
        
        .cta {
           display: block; text-align: center; background: #FF3B30; color: white;
           font-weight: 900; font-size: 40px; text-transform: uppercase;
           padding: 32px; border-radius: 20px; width: 100%;
           box-shadow: 0 16px 40px rgba(255,59,48,0.4);
        }
      </style>
    </head>
    <body>
      <div class="bg"></div>
      <div class="overlay"></div>
      
      <div class="content">
        <h1>O Fim das Taxas<br><span>NA SUA BARBEARIA</span></h1>
      </div>
      
      <div class="mockup"><img src="${phoneBase64}"></div>
      
      <div class="bottom-card">
        <div class="list">
          <div class="list-item"><i>✓</i> Clientes Agendam Sozinhos</div>
          <div class="list-item"><i>✓</i> Dinheiro cai na SUA conta</div>
          <div class="list-item"><i>✓</i> Lembretes pelo WhatsApp</div>
        </div>
        <div class="cta">🎯 TESTE AGORA (7 DIAS)</div>
      </div>
      
    </body>
    </html>
    `
  }
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  for (const flyer of flyers) {
    console.log(`Pintando a arte: ${flyer.output}...`);
    await page.setViewport({ width: flyer.width, height: flyer.height, deviceScaleFactor: 2 }); 
    await page.setContent(flyer.html);
    await new Promise(r => setTimeout(r, 2000)); // Aguarda carregar as fontes web 
    await page.screenshot({ path: flyer.output });
    console.log(`✅ ${flyer.output} pronto!`);
  }

  await browser.close();
})();

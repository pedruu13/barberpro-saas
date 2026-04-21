const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Estrutura do Roteiro para o Reels/TikTok (9:16)
const scenes = [
  {
    output: 'REELS_01_HOOK.png',
    title: 'Cansado de perder<br><span style="color: #FF5E56;">15% em taxas</span><br>na sua barbearia?',
    subtitle: 'Pare de deixar dinheiro na mesa todo mês...',
    image: null // Tela apenas de texto forte
  },
  {
    output: 'REELS_02_SOLUTION.png',
    title: 'Conheça o<br><span style="color: #D4AF37;">BarberPro</span>',
    subtitle: 'O único sistema onde você recebe direto na SUA conta.',
    image: '1_landing_hero_ig_portrait.png',
    frameClass: 'phone-frame'
  },
  {
    output: 'REELS_03_FEATURE1.png',
    title: 'O Cliente Agenda<br><span style="color: #D4AF37;">Sozinho</span>',
    subtitle: 'Um link elegante no seu Instagram. Menos tempo no zap, mais tempo cortando.',
    image: '6_booking_client_ig_portrait.png',
    frameClass: 'phone-frame'
  },
  {
    output: 'REELS_04_FEATURE2.png',
    title: 'Sem Intermediários',
    subtitle: 'Dinheiro cai na HORA na sua conta do Mercado Pago. WhatsApp dispara automático 💸',
    image: '4_admin_settings_ig_portrait.png',
    frameClass: 'mac-frame'
  },
  {
    output: 'REELS_05_FEATURE3.png',
    title: 'Gestão Completa',
    subtitle: 'Controle de comissões, faturamento diário e relatórios automáticos.',
    image: '3_admin_dashboard_ig_portrait.png',
    frameClass: 'mac-frame'
  },
  {
    output: 'REELS_06_CTA.png',
    title: 'Faça o Teste<br><span style="color: #D4AF37;">Hoje Mesmo!</span>',
    subtitle: 'Clique no link da nossa BIO e assuma o controle.',
    image: null
  }
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Resolução 4K Vertical para Stories/Reels (1080x1920)
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 2 }); 

  for (const scene of scenes) {
    console.log(`🎬 Gravando cena: ${scene.output}...`);

    let imgBase64 = '';
    if (scene.image) {
      const imgPath = path.join(__dirname, scene.image);
      if (fs.existsSync(imgPath)) {
        imgBase64 = 'data:image/png;base64,' + fs.readFileSync(imgPath).toString('base64');
      }
    }

    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Cormorant+Garamond:wght@600;700&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          width: 1080px; height: 1920px;
          background: #0f0f0f;
          background-image: 
            radial-gradient(circle at 50% 20%, rgba(212, 175, 55, 0.12), transparent 50%),
            linear-gradient(180deg, #111 0%, #050505 100%);
          color: white;
          font-family: 'DM Sans', sans-serif;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          overflow: hidden;
          position: relative;
        }

        .bg-dots {
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.04) 2px, transparent 2px);
          background-size: 32px 32px;
        }

        .content {
          z-index: 10;
          text-align: center;
          padding: 0 60px;
          width: 100%;
          position: absolute;
          /* Deixa o texto na "Safe Zone" de vídeo (top/mid) */
          top: 18%; 
          transform: translateY(-50%);
        }
        
        /* Ajuste do layout quando só tem texto na tela (cenas de hook e cta) */
        .text-only .content {
          top: 50%;
        }

        h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 96px;
          line-height: 1.05;
          margin-bottom: 32px;
          text-shadow: 0 8px 32px rgba(0,0,0,0.8);
        }

        p {
          font-size: 36px;
          color: #A0A0A0;
          max-width: 850px; margin: 0 auto;
          line-height: 1.4;
          background: rgba(0,0,0,0.4);
          padding: 16px 24px;
          border-radius: 16px;
          backdrop-filter: blur(8px);
        }

        .showcase {
          z-index: 10;
          position: absolute;
          top: 38%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Moldura de Mac reajustada para Reel */
        .mac-frame {
          width: 900px;
          background: #1e1e1e;
          border: 1px solid #333;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 40px 100px rgba(0,0,0,0.8);
        }
        .mac-header {
          height: 48px; background: #2a2a2a; border-bottom: 1px solid #333;
          display: flex; align-items: center; padding: 0 20px; gap: 8px;
        }
        .mac-dot { width: 14px; height: 14px; border-radius: 50%; }
        .mac-dot.r { background: #FF5E56; } .mac-dot.y { background: #FFBD2E; } .mac-dot.g { background: #27C93F; }
        .mac-content { height: 900px; overflow: hidden; background: #000; }
        .mac-content img { width: 100%; object-fit: cover; object-position: top; }

        /* Moldura Phone */
        .phone-frame {
          width: 580px; height: 1100px;
          background: #111;
          border: 14px solid #fff;
          border-radius: 64px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 40px 100px rgba(0,0,0,0.9);
        }
        .phone-notch {
          position: absolute; top: 0; left: 50%; transform: translateX(-50%);
          width: 180px; height: 36px;
          background: #fff;
          border-bottom-left-radius: 20px; border-bottom-right-radius: 20px;
          z-index: 20;
        }
        .phone-frame img { width: 100%; height: 100%; object-fit: cover; object-position: top; }

      </style>
    </head>
    <body class="${!scene.image ? 'text-only' : ''}">
      <div class="bg-dots"></div>
      
      <div class="content">
        <h1>${scene.title}</h1>
        <p>${scene.subtitle}</p>
      </div>

      ${scene.image ? 
      '<div class="showcase"><div class="' + scene.frameClass + '">' +
        (scene.frameClass === 'mac-frame' 
          ? '<div class="mac-header"><div class="mac-dot r"></div><div class="mac-dot y"></div><div class="mac-dot g"></div></div><div class="mac-content"><img src="'+imgBase64+'"></div>'
          : '<div class="phone-notch"></div><img src="'+imgBase64+'">') +
      '</div></div>' : ''}

    </body>
    </html>
    `;

    await page.setContent(html);
    await new Promise(r => setTimeout(r, 2000)); 
    await page.screenshot({ path: scene.output });
    console.log(`✅ ${scene.output} pronto!`);
  }

  await browser.close();
})();

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Textos em Alta Conversão para o Carrossel
const posts = [
  {
    output: 'POST_01_CAPA.png',
    title: 'Transforme sua Barbearia<br><span style="color: #D4AF37;">em uma Máquina de Vendas</span>',
    subtitle: 'Nós te ajudamos a Lotar sua Agenda e Profissionalizar o seu Negócio.',
    image: '1_landing_hero_ig_portrait.png',
    frameClass: 'mac-frame'
  },
  {
    output: 'POST_02_GESTAO.png',
    title: 'Gestão Inteligente<br><span style="color: #D4AF37;">na Palma da sua Mão</span>',
    subtitle: 'Acompanhe métricas, faturamento e sua equipe com o Dashboard Admin mais moderno do mercado.',
    image: '3_admin_dashboard_ig_square.png',
    frameClass: 'mac-frame'
  },
  {
    output: 'POST_03_WHATSAPP.png',
    title: 'Notificações via WhatsApp<br><span style="color: #D4AF37;">Automatizadas</span>',
    subtitle: 'Conecte sua própria conta do Mercado Pago e Z-API para parar de gastar com taxas absurdas!',
    image: '4_admin_settings_ig_square.png',
    frameClass: 'mac-frame'
  },
  {
    output: 'POST_04_MOBILE.png',
    title: 'Mais Praticidade<br><span style="color: #D4AF37;">para seu Cliente</span>',
    subtitle: 'Uma tela de agendamento que funciona que nem mágica em qualquer celular.',
    image: '6_booking_client_ig_portrait.png',
    frameClass: 'phone-frame'
  }
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 }); // Portrait IG Feed (Maior retenção)

  for (const post of posts) {
    console.log(`Gerando arte: ${post.output}...`);

    // Converte a imagem base para Base64 para embedar direto no HTML
    const imgPath = path.join(__dirname, post.image);
    let imgBase64 = '';
    if (fs.existsSync(imgPath)) {
      imgBase64 = 'data:image/png;base64,' + fs.readFileSync(imgPath).toString('base64');
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
          width: 1080px; height: 1350px;
          background: #0f0f0f;
          background-image: 
            radial-gradient(ellipse 90% 70% at 50% -20%, rgba(212, 175, 55, 0.15), transparent),
            linear-gradient(180deg, #111 0%, #080808 100%);
          color: white;
          font-family: 'DM Sans', sans-serif;
          display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
          overflow: hidden;
          position: relative;
        }

        /* Estrelas sutis no fundo */
        .bg-dots {
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 24px 24px;
        }

        /* Header Texts */
        .content {
          z-index: 10;
          text-align: center;
          margin-top: 100px;
          padding: 0 80px;
          width: 100%;
        }
        
        .badge {
          display: inline-block;
          background: rgba(212, 175, 55, 0.15);
          color: #D4AF37;
          padding: 8px 24px;
          border-radius: 100px;
          border: 1px solid rgba(212, 175, 55, 0.3);
          font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 30px;
        }

        h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 82px;
          line-height: 1.05;
          margin-bottom: 24px;
          text-shadow: 0 4px 24px rgba(0,0,0,0.5);
        }

        p {
          font-size: 28px;
          color: #9D9D9D;
          max-width: 800px; margin: 0 auto;
          line-height: 1.4;
        }

        /* Presentation Frame */
        .showcase {
          z-index: 10;
          margin-top: 80px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          filter: drop-shadow(0 24px 60px rgba(0,0,0,0.6));
        }

        /* Moldura de Site Dark (Mac) */
        .mac-frame {
          width: 900px;
          background: #1e1e1e;
          border: 1px solid #333;
          border-radius: 16px;
          overflow: hidden;
        }
        .mac-header {
          height: 48px; background: #2a2a2a; border-bottom: 1px solid #333;
          display: flex; align-items: center; padding: 0 20px; gap: 8px;
        }
        .mac-dot { width: 14px; height: 14px; border-radius: 50%; }
        .mac-dot.r { background: #FF5E56; } .mac-dot.y { background: #FFBD2E; } .mac-dot.g { background: #27C93F; }
        .mac-content {
          height: 700px; overflow: hidden; background: #000; display: flex;
        }
        .mac-content img {
          width: 100%; object-fit: cover; object-position: top;
        }

        /* Moldura de Celular */
        .phone-frame {
          width: 440px; height: 860px;
          background: #111;
          border: 12px solid #2a2a2a;
          border-radius: 54px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 0 0 2px #444;
        }
        .phone-notch {
          position: absolute; top: 0; left: 50%; transform: translateX(-50%);
          width: 140px; height: 32px;
          background: #2a2a2a;
          border-bottom-left-radius: 20px; border-bottom-right-radius: 20px;
          z-index: 20;
        }
        .phone-frame img {
          width: 100%; height: 100%; object-fit: cover; object-position: top;
        }

      </style>
    </head>
    <body>
      <div class="bg-dots"></div>
      
      <div class="content">
        <div class="badge">SaaS BARBERPRO</div>
        <h1>${post.title}</h1>
        <p>${post.subtitle}</p>
      </div>

      <div class="showcase">
        <div class="${post.frameClass}">
          ${post.frameClass === 'mac-frame' 
            ? '<div class="mac-header"><div class="mac-dot r"></div><div class="mac-dot y"></div><div class="mac-dot g"></div></div><div class="mac-content"><img src="'+imgBase64+'"></div>'
            : '<div class="phone-notch"></div><img src="'+imgBase64+'">'
          }
        </div>
      </div>
    </body>
    </html>
    `;

    await page.setContent(html);
    // Dá um tempo maior para carregar a fonte web do Google Fonts
    await new Promise(r => setTimeout(r, 2000)); 
    
    await page.screenshot({ path: post.output });
    console.log(`✅ ${post.output} gerado com sucesso!`);
  }

  await browser.close();
})();

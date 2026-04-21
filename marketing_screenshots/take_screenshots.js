const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--hide-scrollbars'] });
  const page = await browser.newPage();

  const baseUrl = 'http://localhost:3000';

  // Configurações de Viewport para Instagram
  const viewports = [
    { name: 'ig_square', width: 1080, height: 1080, deviceScaleFactor: 2 },
    { name: 'ig_portrait', width: 1080, height: 1350, deviceScaleFactor: 2 }
  ];

  async function takeScreenshots(namePrefix, setupCallback = null) {
    for (const vp of viewports) {
      await page.setViewport(vp);
      if (setupCallback) await setupCallback();
      await new Promise(r => setTimeout(r, 500)); // Aguarda renderizar/animar
      await page.screenshot({ path: `${namePrefix}_${vp.name}.png` });
      console.log(`📸 Salvo: ${namePrefix}_${vp.name}.png`);
    }
  }

  // Define um CSS para esconder as barras de scroll sempre
  await page.evaluateOnNewDocument(() => {
    const style = document.createElement('style');
    style.textContent = `
      ::-webkit-scrollbar { display: none !important; }
      * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
    `;
    document.head.appendChild(style);
  });

  console.log('Iniciando captura de telas...');

  // 1. Landing Page - Hero
  await page.goto(`${baseUrl}/barbearia-saas.html`, { waitUntil: 'networkidle0' });
  await takeScreenshots('1_landing_hero');

  // 2. Landing Page - Pricing (Rolando a página)
  await takeScreenshots('2_landing_pricing', async () => {
    await page.evaluate(() => {
      const el = document.querySelector('.pricing');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
  });

  // 3. Criar uma conta via API para logar e acessar Dashboard
  console.log('Gerando conta de testes para as telas do admin...');
  const testEmail = `promo_${Date.now()}@test.com`;
  
  await page.evaluate(async (email) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopName: 'Barbearia Premium', name: 'Admin', email: email, password: 'senha' })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
  }, testEmail);

  // Força atualização da página para entrar direto no Admin com Token
  await page.goto(`${baseUrl}/barbearia-saas.html`, { waitUntil: 'networkidle0' });
  // Passa do Onboarding pulando direto para o click no botão Fechar/Salvar
  await page.evaluate(() => {
    if (typeof obFinish === 'function') obFinish();
    const modal = document.querySelector('.modal-overlay.open');
    if (modal) modal.classList.remove('open');
  });
  
  // 4. Admin - Dashboard
  await takeScreenshots('3_admin_dashboard');

  // 5. Admin - Configurações
  await takeScreenshots('4_admin_settings', async () => {
    await page.evaluate(() => {
      if (typeof adminNav === 'function') adminNav('configuracoes');
    });
  });

  // 6. Admin - Histórico com o CSV
  await takeScreenshots('5_admin_historic', async () => {
    await page.evaluate(() => {
      if (typeof adminNav === 'function') adminNav('history');
    });
  });

  // 7. Booking Público
  console.log('Buscando shopId da loja que criamos...');
  const shopId = await page.evaluate(() => {
    return window.shopId || localStorage.getItem('token') ? JSON.parse(atob(localStorage.getItem('token').split('.')[1])).shopId : null;
  });

  if (shopId) {
    // Apaga token local para simular cliente na página de booking pública
    await page.evaluate(() => localStorage.removeItem('token'));
    await page.goto(`${baseUrl}/barbearia-saas.html?shop=${shopId}`, { waitUntil: 'networkidle0' });
    await takeScreenshots('6_booking_client');
  }

  await browser.close();
  console.log('✅ Capa de prints completa!');

})();

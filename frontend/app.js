/**
 * BARBERPRO - SISTEMA DE GESTÃO E AGENDAMENTO
 * Versão: 2.1.0 "Modern Noir"
 * Logic & UI Controller
 */

// ===================== CONFIGURAÇÃO & ESTADO =====================
const API_BASE_URL = 'https://barberpro-api.vercel.app/api'; // Produção
// const API_BASE_URL = 'http://localhost:3000/api'; // Local

let state = {
  user: null,
  shop: null,
  services: [],
  barbers: [],
  appointments: [],
  clients: [],
  revenueData: [],
  plans: [],
  expenses: [],
  blocks: [],
  coupons: []
};

let bookingState = {
  services: [],
  barber: null,
  date: null,
  time: null,
  total: 0,
  payment: 'shop',
  coupon: null
};

// ===================== CORE UTILS =====================
const $id = (id) => document.getElementById(id);

const api = {
  async get(endpoint, auth = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) headers['Authorization'] = 'Bearer ' + localStorage.getItem('token');
    try {
      const res = await fetch(API_BASE_URL + endpoint, { headers });
      return await res.json();
    } catch (e) { return { error: 'Falha na conexão com servidor.' }; }
  },
  async post(endpoint, data, auth = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) headers['Authorization'] = 'Bearer ' + localStorage.getItem('token');
    try {
      const res = await fetch(API_BASE_URL + endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) { return { error: 'Falha na conexão com servidor.' }; }
  },
  async delete(endpoint, auth = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) headers['Authorization'] = 'Bearer ' + localStorage.getItem('token');
    try {
      const res = await fetch(API_BASE_URL + endpoint, { method: 'DELETE', headers });
      return await res.json();
    } catch (e) { return { error: 'Falha na conexão com servidor.' }; }
  }
};

function showToast(msg) {
  const t = $id('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function sanitize(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===================== NAVIGATION =====================
function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $id(screenId).classList.add('active');
  window.scrollTo(0, 0);
  
  if (screenId === 'booking') initBooking();
  if (screenId === 'admin') loadAdminData();
  if (screenId === 'client-panel') loadClientDashboard();
}

function switchTab(showId, hideId, btn) {
  $id(showId).style.display = 'block';
  $id(hideId).style.display = 'none';
  const tabs = btn.parentElement.querySelectorAll('.auth-tab');
  tabs.forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
}

// Sidebar Mobile
function openSidebar() { 
  $id('admin-sidebar').classList.add('sidebar-visible');
  $id('sidebar-overlay').classList.add('overlay-visible');
}
function closeSidebar() { 
  $id('admin-sidebar').classList.remove('sidebar-visible');
  $id('sidebar-overlay').classList.remove('overlay-visible');
}

function adminNav(view, btn) {
  const views = ['dashboard', 'agenda', 'financeiro', 'services', 'barbers', 'hours', 'history', 'clients', 'plans', 'subscribers', 'discounts', 'expenses', 'configuracoes'];
  views.forEach(v => {
    const el = $id('view-' + v);
    if (el) el.style.display = 'none';
  });
  $id('view-' + view).style.display = 'block';
  
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  btn.classList.add('active');
  
  if (window.innerWidth <= 1024) closeSidebar();

  // Recarrega dados específicos se necessário
  if (view === 'agenda') renderAgenda();
  if (view === 'financeiro') renderFinanceiro();
  if (view === 'services') renderServicesList();
  if (view === 'barbers') renderBarbersList();
  if (view === 'clients') renderClients();
  if (view === 'plans') renderPlans();
  if (view === 'subscribers') renderSubscribers();
  if (view === 'expenses') renderExpenses();
  if (view === 'discounts') renderDiscounts();
}

// ===================== AUTH LOGIC =====================
async function doLogin() {
  const email = $id('login-email').value;
  const password = $id('login-pass').value;
  if (!email || !password) return showToast('Preencha todos os campos.');

  const res = await api.post('/auth/login', { email, password }, false);
  if (res.token) {
    localStorage.setItem('token', res.token);
    state.user = res.user;
    showToast('✓ Login realizado com sucesso!');
    goTo('admin');
  } else {
    showToast('❌ ' + (res.error || 'Credenciais inválidas.'));
  }
}

async function doRegister() {
  const shopName = $id('reg-name').value;
  const email = $id('reg-email').value;
  const password = $id('reg-pass').value;
  if (!shopName || !email || !password) return showToast('Preencha todos os campos.');

  const res = await api.post('/auth/register', { shopName, email, password }, false);
  if (res.token) {
    localStorage.setItem('token', res.token);
    state.user = res.user;
    showToast('✓ Conta criada! Bem-vindo.');
    initOnboarding();
  } else {
    showToast('❌ ' + (res.error || 'Erro ao criar conta.'));
  }
}

function logout() {
  localStorage.removeItem('token');
  state.user = null;
  goTo('landing');
}

// ===================== ONBOARDING =====================
function initOnboarding() {
  $id('modal-onboarding').classList.add('open');
  $id('ob-step-1').style.display = 'block';
}

function obNext(step) {
  document.querySelectorAll('.ob-step').forEach(s => s.style.display = 'none');
  $id('ob-step-' + step).style.display = 'block';
  $id('ob-progress').style.width = (step * 25) + '%';
  document.querySelectorAll('.ob-dot').forEach((d, idx) => {
    if (idx < step) d.classList.add('active');
    else d.classList.remove('active');
  });

  if (step === 4) {
    const slug = state.shop?.slug || 'sua-barbearia';
    $id('ob-link-box').textContent = window.location.origin + '/?shop=' + slug;
  }
}

async function obFinish() {
  // Salva dados iniciais
  const shopName = $id('ob-name').value;
  const svcName = $id('ob-svc-name').value;
  const svcPrice = $id('ob-svc-price').value;
  const barberName = $id('ob-barber-name').value;

  if (shopName) await api.post('/admin/settings', { shopName });
  if (svcName) await api.post('/admin/services', { name: svcName, price: parseFloat(svcPrice), duration: 30 });
  if (barberName) await api.post('/admin/barbers', { name: barberName, role: 'Barbeiro' });

  $id('modal-onboarding').classList.remove('open');
  goTo('admin');
}

// ===================== ADMIN DASHBOARD =====================
async function loadAdminData() {
  const data = await api.get('/admin/dashboard');
  if (data.error) {
    if (data.error.includes('token')) return goTo('login');
    return showToast('Erro ao carregar dados.');
  }

  state.shop = data.shop;
  state.services = data.services || [];
  state.barbers = data.barbers || [];
  state.appointments = data.appointments || [];
  state.clients = data.clients || [];
  state.revenueData = data.revenueData || [];
  state.plans = data.plans || [];
  state.expenses = data.expenses || [];
  state.blocks = data.blocks || [];
  state.coupons = data.coupons || [];

  renderDashboard();
  updateSidebarLinks();
}

function renderDashboard() {
  $id('dashboard-greeting').textContent = 'Bom dia, ' + (state.user?.name || 'Barber') + '!';
  $id('today-date').textContent = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  
  // Stats
  const todayAppts = state.appointments.filter(a => a.date === new Date().toISOString().split('T')[0]);
  $id('stat-today').textContent = todayAppts.length;
  $id('stat-week').textContent = state.appointments.length;
  
  const revenueToday = todayAppts.reduce((acc, a) => acc + (a.status === 'completed' ? a.totalPrice : 0), 0);
  $id('stat-revenue-hoje').textContent = 'R$ ' + revenueToday.toFixed(2);

  // List
  renderAdminAppts(todayAppts);
  renderDashServices();
  initFinanceChart();
  
  const link = window.location.origin + '?s=' + state.shop.slug;
  $id('dash-public-link').textContent = link;
}

function renderAdminAppts(appts) {
  const container = $id('admin-appt-list');
  $id('appt-count').textContent = appts.length + ' agendamentos para hoje';
  
  if (appts.length === 0) {
    container.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-dim);">Nenhum agendamento para hoje.</div>';
    return;
  }

  // Ordenar por horário
  appts.sort((a,b) => a.time.localeCompare(b.time));

  container.innerHTML = appts.map(a => {
    const statusColor = a.status === 'completed' ? 'var(--green)' : (a.status === 'cancelled' ? 'var(--red)' : 'var(--gold)');
    return `
      <div class="appt-item">
        <div class="appt-time">${a.time}</div>
        <div class="appt-dot" style="background:${statusColor}"></div>
        <div class="appt-info">
          <div class="appt-client">${sanitize(a.clientName)} <span class="appt-barber-badge">${sanitize(a.barberName)}</span></div>
          <div class="appt-service">${sanitize(a.serviceName)} • R$ ${a.totalPrice.toFixed(2)}</div>
        </div>
        <div class="appt-actions">
          ${a.status === 'pending' ? `
            <button class="btn-icon status-done" onclick="updateApptStatus('${a.id}', 'completed')" title="Concluir">✓</button>
            <button class="btn-icon status-miss" onclick="updateApptStatus('${a.id}', 'cancelled')" title="Faltou">✕</button>
          ` : `<span style="font-size:10px; color:var(--text-dim); text-transform:uppercase;">${a.status}</span>`}
        </div>
      </div>
    `;
  }).join('');
}

async function updateApptStatus(id, status) {
  const res = await api.post('/admin/appointments/' + id + '/status', { status });
  if (!res.error) {
    showToast('Status atualizado!');
    loadAdminData();
  }
}

function renderDashServices() {
  const container = $id('dash-services-list');
  container.innerHTML = state.services.slice(0, 4).map(s => `
    <div style="display:flex; justify-content:space-between; padding:12px 24px; border-bottom:1px solid rgba(255,255,255,0.03);">
      <span style="color:#fff; font-size:14px;">${sanitize(s.name)}</span>
      <span style="color:var(--gold); font-weight:700;">R$ ${s.price.toFixed(2)}</span>
    </div>
  `).join('');
}

let financeChart = null;
function initFinanceChart() {
  const ctx = $id('financeChart').getContext('2d');
  if (financeChart) financeChart.destroy();

  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const last7 = [];
  for(let i=6; i>=0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7.push(days[d.getDay()]);
  }

  // Simular dados se não houver
  const dataValues = state.revenueData.length > 0 ? state.revenueData : [120, 450, 380, 520, 440, 610, 200];

  financeChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: last7,
      datasets: [{
        label: 'Faturamento R$',
        data: dataValues,
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: '#D4AF37'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#666' } },
        x: { grid: { display: false }, ticks: { color: '#666' } }
      }
    }
  });
}

function updateSidebarLinks() {
  const link = window.location.origin + '?s=' + state.shop.slug;
  const sidebarLink = $id('sidebar-shop-link');
  if (sidebarLink) {
    sidebarLink.href = link;
    sidebarLink.textContent = '🔗 Ver página pública';
  }
}

// ===================== BOOKING ENGINE (PÚBLICO) =====================
let bookingShopId = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

async function initBooking() {
  const urlParams = new URLSearchParams(window.location.search);
  const shopSlug = urlParams.get('s') || urlParams.get('shop') || 'elite-cut';
  
  const res = await api.get('/public/shop/' + shopSlug, false);
  if (res.error) return showToast('Barbearia não encontrada.');

  state.shop = res.shop;
  state.services = res.services;
  state.barbers = res.barbers;
  state.publicPlans = res.plans || [];
  
  $id('shop-name-display').innerHTML = state.shop.name.replace(' ', '<span>') + '</span>';
  $id('shop-address-display').textContent = '✦ ' + state.shop.address;

  renderBookingServices();
  renderPublicPlans();
  renderBookingBarbers();
  renderCalendar();
}

function renderBookingServices() {
  const container = $id('booking-services');
  container.innerHTML = state.services.map(s => `
    <div class="service-card ${bookingState.services.find(i => i.id === s.id) ? 'selected' : ''}" onclick="toggleService('${s.id}')">
      <div class="service-info">
        <h4>${sanitize(s.name)}</h4>
        <p class="service-meta">${s.duration} min • ${sanitize(s.description || 'Serviço premium')}</p>
      </div>
      <div class="service-right">
        <div class="service-price">R$ ${s.price.toFixed(2)}</div>
        <div class="service-check">✓</div>
      </div>
    </div>
  `).join('');
  updateSvcBar();
}

function renderPublicPlans() {
  const container = $id('booking-plans-list');
  const wrapper = $id('booking-plans-container');
  
  if (!state.publicPlans || state.publicPlans.length === 0) {
    wrapper.style.display = 'none';
    return;
  }
  
  wrapper.style.display = 'block';
  container.innerHTML = state.publicPlans.map(p => `
    <div class="glass-card" style="padding: 20px; border: 1px solid var(--gold); position:relative">
      <div style="position:absolute; top:-10px; right:15px; background:var(--gold); color:#000; font-size:10px; font-weight:900; padding:2px 8px; border-radius:10px">RECOMENDADO</div>
      <h4 style="color:#fff; margin-bottom:5px">${sanitize(p.name)}</h4>
      <div style="font-size:24px; font-weight:800; color:var(--gold); margin-bottom:10px">R$ ${p.price.toFixed(2)}<small style="font-size:12px; color:var(--text-dim)">/mês</small></div>
      <ul style="list-style:none; padding:0; margin:0 0 20px 0; font-size:13px; color:var(--text-dim)">
        <li style="margin-bottom:5px">✓ ${p.maxCuts} cortes por mês</li>
        <li style="margin-bottom:5px">✓ Prioridade na agenda</li>
        <li>✓ Lavagem inclusa</li>
      </ul>
      <button class="btn-sm btn-sm-gold" style="width:100%" onclick="goTo('client-login')">Assinar Agora</button>
    </div>
  `).join('');
}

function toggleService(id) {
  const svc = state.services.find(s => s.id === id);
  const idx = bookingState.services.findIndex(i => i.id === id);
  
  if (idx > -1) bookingState.services.splice(idx, 1);
  else bookingState.services.push(svc);
  
  renderBookingServices();
}

function updateSvcBar() {
  const bar = $id('svc-bar');
  const count = bookingState.services.length;
  const total = bookingState.services.reduce((acc, s) => acc + s.price, 0);
  bookingState.total = total;

  if (count > 0) {
    bar.classList.add('visible');
    $id('svc-bar-label').textContent = count + (count === 1 ? ' serviço selecionado' : ' serviços selecionados');
    $id('svc-bar-total').textContent = 'R$ ' + total.toFixed(2);
  } else {
    bar.classList.remove('visible');
  }
}

function nextStep(n) {
  if (n === 2 && bookingState.services.length === 0) return showToast('Selecione ao menos um serviço.');
  if (n === 3 && (!bookingState.barber || !bookingState.date || !bookingState.time)) return showToast('Selecione o profissional e o horário.');

  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  $id('step' + n).classList.add('active');

  document.querySelectorAll('.step-indicator').forEach((ind, i) => {
    if (i+1 < n) { ind.classList.add('done'); ind.classList.remove('active'); ind.textContent = '✓'; }
    else if (i+1 === n) { ind.classList.add('active'); ind.classList.remove('done'); ind.textContent = n; }
    else { ind.classList.remove('active', 'done'); ind.textContent = i+1; }
  });

  if (n === 3) renderSummary();
}

function renderBookingBarbers() {
  const container = $id('booking-barbers');
  container.innerHTML = state.barbers.map(b => `
    <div class="hero-cta-card ${bookingState.barber?.id === b.id ? 'selected' : ''}" style="width:100%; margin-bottom:12px" onclick="selectBarber('${b.id}')">
      <div class="card-icon">${sanitize(b.emoji || '✂️')}</div>
      <div class="card-text">
        <h3>${sanitize(b.name)}</h3>
        <p>${sanitize(b.role)}</p>
      </div>
      <div class="pay-check" style="${bookingState.barber?.id === b.id ? 'opacity:1' : ''}">✓</div>
    </div>
  `).join('');
}

function selectBarber(id) {
  bookingState.barber = state.barbers.find(b => b.id === id);
  renderBookingBarbers();
  if (bookingState.date) loadTimeSlots();
}

// Calendar Logic
function renderCalendar() {
  const grid = $id('cal-grid');
  const label = $id('cal-month-label');
  const now = new Date();
  
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  label.textContent = monthNames[currentMonth] + ' ' + currentYear;
  
  grid.innerHTML = '';
  const weekDays = ['D','S','T','Q','Q','S','S'];
  weekDays.forEach(d => grid.innerHTML += `<div class="cal-day-label">${d}</div>`);
  
  for(let i=0; i<firstDay; i++) grid.innerHTML += '<div class="cal-day empty"></div>';
  
  for(let d=1; d<=daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isPast = new Date(dateStr) < new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const isSelected = bookingState.date === dateStr;
    const isToday = dateStr === now.toISOString().split('T')[0];
    
    grid.innerHTML += `
      <div class="cal-day ${isPast ? 'past' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}" 
           onclick="${isPast ? '' : `selectDate('${dateStr}')`}">
        ${d}
      </div>
    `;
  }
}

function changeMonth(dir) {
  currentMonth += dir;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar();
}

async function selectDate(date) {
  bookingState.date = date;
  renderCalendar();
  $id('time-title').textContent = 'Horários para ' + new Date(date).toLocaleDateString('pt-BR');
  loadTimeSlots();
}

async function loadTimeSlots() {
  if (!bookingState.barber) return;
  
  const container = $id('time-slots');
  container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:20px;">Carregando horários...</div>';
  
  const res = await api.get(`/public/slots?barberId=${bookingState.barber.id}&date=${bookingState.date}`, false);
  
  if (res.slots && res.slots.length > 0) {
    container.innerHTML = res.slots.map(s => `
      <div class="time-slot ${bookingState.time === s ? 'selected' : ''}" onclick="selectTime('${s}')">${s}</div>
    `).join('');
  } else {
    container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:20px; color:var(--red);">Nenhum horário disponível para este dia.</div>';
  }
}

function selectTime(t) {
  bookingState.time = t;
  document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
  event.target.classList.add('selected');
  $id('btn-step2').disabled = false;
}

function selectPayment(m) {
  bookingState.payment = m;
  document.querySelectorAll('.payment-radio').forEach(r => r.classList.remove('selected'));
  $id('pay-' + m).classList.add('selected');
}

function renderSummary() {
  const container = $id('booking-summary');
  const subtotal = bookingState.total;
  const discount = bookingState.coupon ? (bookingState.coupon.type === 'percent' ? subtotal * (bookingState.coupon.value/100) : bookingState.coupon.value) : 0;
  const finalTotal = Math.max(0, subtotal - discount);

  container.innerHTML = `
    <div style="margin-bottom:20px;">
      ${bookingState.services.map(s => `
        <div class="summary-row">
          <span class="label">${sanitize(s.name)}</span>
          <span class="value">R$ ${s.price.toFixed(2)}</span>
        </div>
      `).join('')}
    </div>
    
    <div class="summary-row">
      <span class="label">Profissional</span>
      <span class="value">${sanitize(bookingState.barber.name)}</span>
    </div>
    <div class="summary-row">
      <span class="label">Data e Hora</span>
      <span class="value">${new Date(bookingState.date).toLocaleDateString('pt-BR')} às ${bookingState.time}</span>
    </div>

    ${discount > 0 ? `
      <div class="summary-row" style="color:var(--green)">
        <span class="label">Desconto (${bookingState.coupon.code})</span>
        <span class="value">- R$ ${discount.toFixed(2)}</span>
      </div>
    ` : ''}

    <div class="summary-row total">
      <span class="label">Total</span>
      <span class="value">R$ ${finalTotal.toFixed(2)}</span>
    </div>
  `;
}

async function confirmBooking() {
  const name = $id('client-name').value;
  const phone = $id('client-phone').value;
  if (!name || !phone) return showToast('Por favor, informe seu nome e WhatsApp.');

  const payload = {
    shopId: state.shop.id,
    barberId: bookingState.barber.id,
    serviceIds: bookingState.services.map(s => s.id),
    date: bookingState.date,
    time: bookingState.time,
    clientName: name,
    clientPhone: phone,
    paymentMethod: bookingState.payment,
    couponCode: bookingState.coupon?.code
  };

  const res = await api.post('/public/appointments', payload, false);
  
  if (res.error) {
    showToast('❌ ' + res.error);
  } else {
    // Se for Pix, abre o modal de checkout do Pix
    if (bookingState.payment === 'pix') {
      openPixModal(res);
    } else {
      showSuccess(res);
    }
  }
}

function showSuccess(appt) {
  nextStep(4);
  const container = $id('confirm-details');
  container.innerHTML = `
    <div class="summary-row"><span class="label">Onde:</span> <span class="value">${sanitize(state.shop.name)}</span></div>
    <div class="summary-row"><span class="label">Quando:</span> <span class="value">${new Date(appt.date).toLocaleDateString('pt-BR')} às ${appt.time}</span></div>
    <div class="summary-row"><span class="label">Com:</span> <span class="value">${sanitize(appt.barberName)}</span></div>
    <div class="summary-row"><span class="label">Total:</span> <span class="value">R$ ${appt.totalPrice.toFixed(2)}</span></div>
  `;
  
  // Link para agenda (Google)
  const gLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=Corte na ${state.shop.name}&dates=${appt.date.replace(/-/g,'')}T${appt.time.replace(':','')}00Z&details=Serviço agendado via BarberPro`;
  $id('btn-add-calendar').href = gLink;
}

function resetBooking() {
  bookingState = { services: [], barber: null, date: null, time: null, total: 0, payment: 'shop', coupon: null };
  renderBookingServices();
  nextStep(1);
}

// ===================== CLIENT DASHBOARD =====================
let clientAppointments = [];
let clientPhone = null;

async function doClientLoginScreen() {
  const phone = $id('client-login-phone').value;
  const password = $id('client-login-pwd').value;
  if (!phone || !password) return showToast('Preencha os campos.');

  const res = await api.post('/auth/client/login', { phone, password }, false);
  if (res.token) {
    localStorage.setItem('token', res.token);
    localStorage.setItem('clientPhone', phone);
    showToast('✓ Bem-vindo à sua Área VIP!');
    goTo('client-panel');
  } else {
    showToast('❌ ' + (res.error || 'Login inválido.'));
  }
}

async function doClientRegister() {
  const name = $id('cl-reg-name').value;
  const phone = $id('cl-reg-phone').value;
  const password = $id('cl-reg-pass').value;
  if (!name || !phone || !password) return showToast('Preencha os campos.');

  const res = await api.post('/auth/client/register', { name, phone, password }, false);
  if (res.token) {
    localStorage.setItem('token', res.token);
    localStorage.setItem('clientPhone', phone);
    showToast('✓ Cadastro realizado!');
    goTo('client-panel');
  } else {
    showToast('❌ ' + (res.error || 'Erro ao cadastrar.'));
  }
}

async function loadClientDashboard() {
  clientPhone = localStorage.getItem('clientPhone');
  if (!clientPhone) return goTo('client-login');

  const data = await api.get('/public/client/dashboard?phone=' + clientPhone, true);
  if (data.error) return goTo('client-login');

  state.client = data.client;
  clientAppointments = data.appointments || [];
  
  $id('client-display-name').textContent = state.client.name;
  renderClientDashboard();
}

function renderClientDashboard() {
  const planCard = $id('client-plan-card');
  const noPlanCard = $id('client-no-plan-card');
  
  if (state.client.planId && state.client.plan) {
    planCard.style.display = 'block';
    noPlanCard.style.display = 'none';
    
    $id('client-plan-name').textContent = state.client.plan.name;
    $id('client-plan-expires').textContent = new Date(state.client.planExpiresAt).toLocaleDateString();
    $id('client-plan-used').textContent = state.client.cutsUsed;
    $id('client-plan-total').textContent = state.client.plan.maxCuts;
    
    const pct = (state.client.cutsUsed / state.client.plan.maxCuts) * 100;
    $id('client-plan-progress').style.width = pct + '%';
  } else {
    planCard.style.display = 'none';
    noPlanCard.style.display = 'block';
    renderAvailablePlans();
  }

  const list = $id('client-appointments-list');
  if (clientAppointments.length === 0) {
    list.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-dim)">Você ainda não possui agendamentos.</div>';
  } else {
    list.innerHTML = clientAppointments.map(a => `
      <div class="appt-card" style="display:flex; align-items:center; padding:15px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px; margin-bottom:10px">
        <div style="font-size:24px; margin-right:15px">${a.status === 'completed' ? '✅' : '📅'}</div>
        <div style="flex:1">
          <div style="font-weight:bold; color:#fff">${sanitize(a.serviceName)}</div>
          <div style="font-size:12px; color:var(--text-dim)">${new Date(a.date).toLocaleDateString()} às ${a.time} • Profissional: ${sanitize(a.barberName)}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:12px; font-weight:bold; color:${a.status === 'completed' ? 'var(--green)' : 'var(--gold)'}">${a.status.toUpperCase()}</div>
          ${a.status === 'pending' ? `<button class="btn-sm btn-sm-ghost" style="margin-top:5px; font-size:10px" onclick="cancelClientAppointment('${a.id}')">Cancelar</button>` : ''}
        </div>
      </div>
    `).join('');
  }
}

function renderAvailablePlans() {
  const container = $id('client-available-plans');
  if (!state.publicPlans || state.publicPlans.length === 0) {
    container.innerHTML = '<p style="color:var(--text-dim)">Nenhum plano disponível no momento.</p>';
    return;
  }
  
  container.innerHTML = state.publicPlans.map(p => `
    <div class="glass-card" style="padding:15px; text-align:left; border:1px solid #333">
      <h4 style="color:var(--gold); margin-bottom:5px">${sanitize(p.name)}</h4>
      <div style="font-size:18px; font-weight:bold; color:#fff; margin-bottom:10px">R$ ${p.price.toFixed(2)}</div>
      <button class="btn-sm btn-sm-gold" style="width:100%" onclick="checkoutPlan('${p.id}')">Assinar</button>
    </div>
  `).join('');
}

async function checkoutPlan(planId) {
  const plan = state.publicPlans.find(p => p.id === planId);
  if (!plan) return;
  
  // Se houver chave pix da barbearia, abre modal de pagamento
  if (state.shop.pixKey) {
    openPixModal({
      id: 'plan-' + Date.now(),
      totalPrice: plan.price,
      isPlan: true,
      planId: planId
    });
  } else {
    showToast('A barbearia não configurou pagamentos online.');
  }
}

function openPixModal(data) {
  $id('pix-title').textContent = data.isPlan ? 'Assinar Plano VIP' : 'Confirmar Agendamento';
  $id('pix-value').textContent = 'R$ ' + data.totalPrice.toFixed(2);
  $id('pix-shop-name').textContent = state.shop.name;
  $id('pix-key-display').textContent = state.shop.pixKey || 'barberpro@pix.com';
  
  const modal = $id('modal-pix-checkout');
  modal.classList.add('open');
  
  $id('btn-confirm-pix').onclick = async () => {
    modal.classList.remove('open');
    if (data.isPlan) {
      const res = await api.post('/public/client/subscribe', { planId: data.planId, phone: clientPhone });
      if (!res.error) {
        showToast('✓ Sua solicitação de assinatura foi enviada!');
        loadClientDashboard();
      }
    } else {
      showSuccess(data);
    }
  };
}

// ===================== FUNÇÕES DE ADMINISTRAÇÃO =====================

function openModal(id) { $id(id).classList.add('open'); }
function closeModal(id) { $id(id).classList.remove('open'); }

// --- Serviços ---
function renderServicesList() {
  const list = $id('view-services');
  if(!list) return;
  
  // Vamos criar um container para a lista se não existir dentro da view
  let container = list.querySelector('.section-card');
  if (!container) {
    list.innerHTML = `
      <div class="admin-topbar">
        <div class="topbar-left"><button class="hamburger-btn" onclick="openSidebar()">☰</button><h2>Serviços</h2></div>
        <div class="topbar-right"><button class="btn-sm btn-sm-gold" onclick="openModal('modal-new-service')">+ Novo Serviço</button></div>
      </div>
      <div class="admin-content"><div class="section-card"><div class="admin-appt-list" id="services-admin-list"></div></div></div>
    `;
    container = $id('services-admin-list');
  } else {
    container = $id('services-admin-list');
  }

  if (state.services.length === 0) {
    container.innerHTML = '<div class="empty-state">Nenhum serviço cadastrado.</div>';
    return;
  }

  container.innerHTML = state.services.map(s => `
    <div class="appt-item">
      <div class="appt-info">
        <div class="appt-client">${sanitize(s.name)} <span style="font-size:12px; color:var(--text-dim); margin-left:10px;">${s.duration} min</span></div>
        <div class="appt-service">${sanitize(s.description || '')}</div>
      </div>
      <div style="font-weight:800; color:var(--gold); margin-right:20px;">R$ ${s.price.toFixed(2)}</div>
      <div class="appt-actions">
        <button class="btn-icon" onclick="openEditService('${s.id}')">✎</button>
        <button class="btn-icon danger" onclick="deleteService('${s.id}')">✕</button>
      </div>
    </div>
  `).join('');
}

async function addService() {
  const name = $id('svc-name').value;
  const price = parseFloat($id('svc-price').value);
  const duration = parseInt($id('svc-duration').value);
  const description = $id('svc-desc').value;

  if (!name || isNaN(price)) return showToast('Preencha nome e preço.');

  const res = await api.post('/admin/services', { name, price, duration, description });
  if (!res.error) {
    showToast('✓ Serviço adicionado!');
    closeModal('modal-new-service');
    loadAdminData().then(() => renderServicesList());
  }
}

async function deleteService(id) {
  if (!confirm('Excluir este serviço?')) return;
  const res = await api.delete('/admin/services/' + id);
  if (!res.error) {
    showToast('Serviço removido.');
    loadAdminData().then(() => renderServicesList());
  }
}

// --- Barbeiros ---
function renderBarbersList() {
  const list = $id('view-barbers');
  let container = $id('barbers-admin-list');
  
  if (!container) {
    list.innerHTML = `
      <div class="admin-topbar">
        <div class="topbar-left"><button class="hamburger-btn" onclick="openSidebar()">☰</button><h2>Equipe (Barbeiros)</h2></div>
        <div class="topbar-right"><button class="btn-sm btn-sm-gold" onclick="openModal('modal-new-barber')">+ Novo Profissional</button></div>
      </div>
      <div class="admin-content"><div class="section-card"><div class="admin-appt-list" id="barbers-admin-list"></div></div></div>
    `;
    container = $id('barbers-admin-list');
  }

  container.innerHTML = state.barbers.map(b => `
    <div class="appt-item">
      <div class="sidebar-avatar" style="margin-right:15px">${sanitize(b.emoji || '✂️')}</div>
      <div class="appt-info">
        <div class="appt-client">${sanitize(b.name)}</div>
        <div class="appt-service">${sanitize(b.role)} • Comissão: ${b.commission || 0}%</div>
      </div>
      <div class="appt-actions">
        <button class="btn-icon" onclick="openEditBarber('${b.id}')">✎</button>
        <button class="btn-icon danger" onclick="deleteBarber('${b.id}')">✕</button>
      </div>
    </div>
  `).join('');
}

async function addBarber() {
  const name = $id('barber-name').value;
  const role = $id('barber-role').value;
  const emoji = $id('barber-emoji').value;
  const commission = parseInt($id('barber-commission').value);

  if (!name) return showToast('O nome é obrigatório.');

  const res = await api.post('/admin/barbers', { name, role, emoji, commission });
  if (!res.error) {
    showToast('✓ Barbeiro adicionado!');
    closeModal('modal-new-barber');
    loadAdminData().then(() => renderBarbersList());
  }
}

// ===================== INICIALIZAÇÃO =====================
window.onload = () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('s') || urlParams.has('shop')) {
    goTo('booking');
  } else {
    // Se tiver token, tenta ir pro admin direto
    if (localStorage.getItem('token')) {
      // Pequeno check se é barbeiro ou cliente
      if (localStorage.getItem('clientPhone')) goTo('client-panel');
      else goTo('admin');
    }
  }
};

// Toggle mobile dropdown
function toggleMobileNav() {
  $id('nav-mobile-dropdown').classList.toggle('open');
}
function closeMobileNav() {
  $id('nav-mobile-dropdown').classList.remove('open');
}

// Funções para Modais de Edição (exemplo simplificado)
function openEditService(id) {
  const s = state.services.find(i => i.id === id);
  if (!s) return;
  $id('edit-svc-id').value = s.id;
  $id('edit-svc-name').value = s.name;
  $id('edit-svc-price').value = s.price;
  $id('edit-svc-duration').value = s.duration;
  $id('edit-svc-desc').value = s.description || '';
  openModal('modal-edit-service');
}

async function saveEditService() {
  const id = $id('edit-svc-id').value;
  const payload = {
    name: $id('edit-svc-name').value,
    price: parseFloat($id('edit-svc-price').value),
    duration: parseInt($id('edit-svc-duration').value),
    description: $id('edit-svc-desc').value
  };
  const res = await api.post('/admin/services/' + id, payload);
  if (!res.error) {
    showToast('✓ Alterações salvas!');
    closeModal('modal-edit-service');
    loadAdminData().then(() => renderServicesList());
  }
}

// --- AGENDA VIEW DINÂMICA ---
let agendaFilter = 'hoje';
let agendaBarberId = 'all';

function setAgendaFilter(f, btn) {
  agendaFilter = f;
  document.querySelectorAll('.schedule-filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAgenda();
}

function renderAgenda() {
  const container = $id('agenda-list');
  if (!container) return;

  // Filtros por barbeiro
  const barberFilterContainer = $id('agenda-barber-filters');
  barberFilterContainer.innerHTML = '<button class="btn-sm '+(agendaBarberId==='all'?'btn-sm-gold':'')+'" onclick="agendaBarberId=\'all\'; renderAgenda()">Todos</button>' + 
    state.barbers.map(b => `<button class="btn-sm ${agendaBarberId===b.id?'btn-sm-gold':''}" onclick="agendaBarberId='${b.id}'; renderAgenda()">${sanitize(b.name)}</button>`).join('');

  let filtered = [...state.appointments];
  const today = new Date().toISOString().split('T')[0];
  
  if (agendaFilter === 'hoje') filtered = filtered.filter(a => a.date === today);
  if (agendaFilter === 'amanha') {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const tStr = tomorrow.toISOString().split('T')[0];
    filtered = filtered.filter(a => a.date === tStr);
  }
  
  if (agendaBarberId !== 'all') filtered = filtered.filter(a => a.barberId === agendaBarberId);

  filtered.sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  if (filtered.length === 0) {
    container.innerHTML = '<div style="padding:60px; text-align:center; color:var(--text-dim);">Nenhum agendamento encontrado para este filtro.</div>';
    return;
  }

  container.innerHTML = filtered.map(a => {
    const statusColor = a.status === 'completed' ? 'var(--green)' : (a.status === 'cancelled' ? 'var(--red)' : 'var(--gold)');
    return `
      <div class="appt-item">
        <div style="min-width:100px">
          <div class="appt-time">${a.time}</div>
          <div style="font-size:11px; color:var(--text-dim)">${new Date(a.date).toLocaleDateString()}</div>
        </div>
        <div class="appt-dot" style="background:${statusColor}"></div>
        <div class="appt-info">
          <div class="appt-client">${sanitize(a.clientName)} <span class="appt-barber-badge">${sanitize(a.barberName)}</span></div>
          <div class="appt-service">${sanitize(a.serviceName)} • R$ ${a.totalPrice.toFixed(2)}</div>
        </div>
        <div class="appt-actions">
           <button class="btn-icon" title="Ver detalhes" onclick="showApptDetails('${a.id}')">👁</button>
           <button class="btn-icon danger" title="Excluir" onclick="deleteAppt('${a.id}')">✕</button>
        </div>
      </div>
    `;
  }).join('');
}

// --- FINANCEIRO VIEW DINÂMICA ---
function renderFinanceiro() {
  const container = $id('financeiro-list');
  if(!container) return;

  const statusFilter = $id('fin-filter-status').value;
  let filtered = [...state.appointments];
  if (statusFilter !== 'all') filtered = filtered.filter(a => a.status === statusFilter);

  // Stats
  const pago = filtered.filter(a => a.status === 'completed').reduce((acc, a) => acc + a.totalPrice, 0);
  const pend = filtered.filter(a => a.status === 'pending').reduce((acc, a) => acc + a.totalPrice, 0);
  
  $id('tot-pago').textContent = 'R$ ' + pago.toFixed(2);
  $id('tot-pend').textContent = 'R$ ' + pend.toFixed(2);
  $id('tot-geral').textContent = 'R$ ' + (pago + pend).toFixed(2);

  if (filtered.length === 0) {
    container.innerHTML = '<div style="padding:60px; text-align:center; color:var(--text-dim);">Nenhum registro financeiro encontrado.</div>';
    return;
  }

  container.innerHTML = `
    <table style="width:100%; border-collapse:collapse; color:var(--text-dim); font-size:13px;">
      <thead>
        <tr style="text-align:left; border-bottom:1px solid #333;">
          <th style="padding:15px;">Data</th>
          <th>Cliente</th>
          <th>Serviço</th>
          <th>Valor</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(a => `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.02);">
            <td style="padding:15px; color:#fff;">${new Date(a.date).toLocaleDateString()}</td>
            <td>${sanitize(a.clientName)}</td>
            <td>${sanitize(a.serviceName)}</td>
            <td style="color:#fff; font-weight:bold;">R$ ${a.totalPrice.toFixed(2)}</td>
            <td><span class="badge" style="background:${a.status==='completed'?'var(--green)':'var(--gold)'}; color:#000;">${a.status}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ===================== CLIENTES E DESPESAS E BLOQUEIOS =====================

function renderPlans() {
  var list = $id('plans-list');
  if(!list) return;
  if(!state.plans || state.plans.length === 0) {
    list.innerHTML = '<div class="empty-state">Nenhum plano cadastrado.</div>';
    return;
  }
  list.innerHTML = state.plans.map(function(p) {
    var price = parseFloat(p.price) || 0;
    return '<div class="appt-card"><div class="appt-time" style="font-size:24px">⭐</div><div class="appt-info">' +
      '<div class="appt-client">' + sanitize(p.name) + '</div>' +
      '<div class="appt-service">' + p.maxCuts + ' cortes por mês</div>' +
      '</div><div class="appt-price">R$ ' + price.toFixed(2).replace('.', ',') + ' /mês</div>' +
      '<div class="appt-actions"><button class="btn-icon danger" onclick="deletePlan(\'' + p.id + '\')" title="Excluir">✕</button></div></div>';
  }).join('');
}

async function addPlan() {
  var name = $id('plan-name').value.trim();
  var price = parseFloat($id('plan-price').value);
  var maxCuts = parseInt($id('plan-cuts').value) || 4;
  if(!name || !price) { showToast('Preencha os campos obrigatórios'); return; }
  
  var res = await api.post('/admin/plans', { name, price, maxCuts });
  if(!res.error) {
    if (!state.plans) state.plans = [];
    state.plans.push(res);
    
    // Sincroniza com os planos públicos se estivermos na mesma sessão
    if (!state.publicPlans) state.publicPlans = [];
    state.publicPlans.push(res);
    
    closeModal('modal-new-plan');
    showToast('✅ Plano criado com sucesso!');
    renderPlans();
    if (typeof renderPublicPlans === 'function') renderPublicPlans();
  } else {
    showToast('❌ Erro: ' + res.error);
  }
}

function openAssignPlanModal(clientId) {
  $id('assign-client-id').value = clientId;
  var select = $id('assign-plan-select');
  select.innerHTML = '<option value="">Nenhum Plano (Remover)</option>' + state.plans.map(function(p) {
    return '<option value="'+p.id+'">'+sanitize(p.name)+' - R$'+p.price.toFixed(2)+'</option>';
  }).join('');
  openModal('modal-assign-plan');
}

async function saveClientPlan() {
  var clientId = $id('assign-client-id').value;
  var planId = $id('assign-plan-select').value;
  var res = await api.post('/admin/clients/assign-plan', { clientId, planId });
  if(!res.error) {
    showToast('Plano atualizado!');
    closeModal('modal-assign-plan');
    // Reload admin data for simplicity
    loadAdminData();
  }
}

function renderClients() {
  var list = $id('clients-list');
  if(!list) return;
  if(state.clients.length === 0) {
    list.innerHTML = '<div class="empty-state">Nenhum cliente cadastrado ainda.</div>';
    return;
  }
  list.innerHTML = state.clients.map(function(c) {
    var planBadge = c.planId ? '<span style="background:var(--gold);color:#000;padding:2px 6px;border-radius:4px;font-size:10px;margin-left:6px;font-weight:bold">⭐ ' + (c.plan ? c.plan.name : 'VIP') + '</span>' : '';
    return '<div class="appt-card"><div class="appt-time" style="font-size:24px">👥</div><div class="appt-info">' +
      '<div class="appt-client">' + sanitize(c.name) + planBadge + ' <span style="font-size:12px;color:var(--text-dim)">' + sanitize(c.phone) + '</span></div>' +
      '<div class="appt-service">Visitas: ' + c.totalVisits + ' · Gasto Total: R$' + c.totalSpent.toFixed(2) + '</div>' +
      '</div><div style="margin-left:auto"><button class="btn-sm btn-sm-gold" style="padding:6px 10px;font-size:12px" onclick="openAssignPlanModal(\''+c.id+'\')">⭐ Assinar</button></div></div>';
  }).join('');
}

function renderSubscribers() {
  var list = $id('subscribers-list');
  if(!list) return;
  
  var subscribers = state.clients.filter(function(c) { return c.planId !== null; });
  
  if(subscribers.length === 0) {
    list.innerHTML = '<div class="empty-state">Nenhum assinante VIP no momento.</div>';
    return;
  }
  
  list.innerHTML = subscribers.map(function(c) {
    var plan = c.plan || { name: 'VIP', maxCuts: 4 };
    var maxCuts = plan.maxCuts || 1; // Guard against division by zero
    var usagePct = Math.min(100, (c.cutsUsed / maxCuts) * 100);
    var dateStr = c.planExpiresAt ? new Date(c.planExpiresAt).toLocaleDateString() : 'Sem data';
    
    return '<div class="appt-card"><div class="appt-time" style="font-size:24px">💎</div><div class="appt-info">' +
      '<div class="appt-client">' + sanitize(c.name) + ' <span style="font-size:12px;color:var(--text-dim)">' + sanitize(c.phone) + '</span></div>' +
      '<div class="appt-service">Plano: <strong>' + sanitize(plan.name) + '</strong> · Expira em: ' + dateStr + '</div>' +
      '<div style="margin-top:8px; width:100%; background:rgba(255,255,255,0.05); height:6px; border-radius:10px; overflow:hidden">' +
      '<div style="width:'+usagePct+'%; background:var(--gold); height:100%"></div>' +
      '</div>' +
      '<div style="font-size:11px; color:var(--white-dim); margin-top:4px">Uso: ' + c.cutsUsed + ' de ' + plan.maxCuts + ' cortes</div>' +
      '</div><div class="appt-actions" style="display:flex;gap:8px">' +
      '<button class="btn-sm btn-sm-gold" onclick="updateUsage(\''+c.id+'\', 1)" title="Lançar Corte">+ Corte</button>' +
      '<button class="btn-sm btn-sm-ghost" onclick="resetUsage(\''+c.id+'\')" title="Zerar Uso">↺</button>' +
      '</div></div>';
  }).join('');
}

async function updateUsage(clientId, delta) {
  var client = state.clients.find(function(c) { return c.id === clientId; });
  if(!client) return;
  
  var newVal = (client.cutsUsed || 0) + delta;
  if(newVal < 0) newVal = 0;
  
  var res = await api.post('/admin/clients/' + clientId + '/cuts', { cutsUsed: newVal });
  if(!res.error) {
    client.cutsUsed = newVal;
    showToast('Uso atualizado!');
    renderSubscribers();
  } else {
    showToast('Erro: ' + res.error);
  }
}

async function resetUsage(clientId) {
  if(!confirm('Deseja zerar o uso de cortes deste assinante?')) return;
  var res = await api.post('/admin/clients/' + clientId + '/cuts', { cutsUsed: 0 });
  if(!res.error) {
    var client = state.clients.find(function(c) { return c.id === clientId; });
    if(client) client.cutsUsed = 0;
    showToast('Uso zerado!');
    renderSubscribers();
  }
}

function renderExpenses() {
  var list = $id('expenses-list');
  if(!list) return;
  var totalMes = 0;
  var currentMonth = new Date().toISOString().substring(0, 7);
  
  var html = state.expenses.map(function(e) {
    if(e.date.startsWith(currentMonth)) totalMes += e.value;
    var p = e.date.split('-');
    return '<div class="appt-card"><div class="appt-time" style="font-size:24px;color:var(--red)">📉</div><div class="appt-info">' +
      '<div class="appt-client">' + sanitize(e.description) + '</div>' +
      '<div class="appt-service">' + p[2] + '/' + p[1] + '/' + p[0] + '</div>' +
      '</div><div class="appt-price" style="color:var(--red)">-R$' + e.value.toFixed(2) + '</div></div>';
  }).join('');
  
  if(state.expenses.length === 0) html = '<div class="empty-state">Nenhuma despesa lançada.</div>';
  list.innerHTML = html;
  
  if($id('exp-mes')) $id('exp-mes').textContent = 'R$ ' + totalMes.toFixed(2);
}

async function addExpense() {
  var desc = $id('exp-desc').value.trim();
  var value = parseFloat($id('exp-value').value);
  var date = $id('exp-date').value;
  if(!desc || !value || !date) { showToast('Preencha todos os campos'); return; }
  
  state.expenses.unshift({ id: 'exp-'+Date.now(), description: desc, value: value, date: date });
  renderExpenses();
  closeModal('modal-new-expense');
  showToast('Despesa lançada!');
}

async function addBlockTime() {
  var barber = $id('block-barber').value;
  var date = $id('block-date').value;
  var start = $id('block-start').value;
  var end = $id('block-end').value;
  var reason = $id('block-reason').value;
  
  if(!barber || !date || !start || !end) { showToast('Preencha data, início e fim'); return; }
  
  var res = await api.post('/admin/blocks', { barberName: barber, date: date, startTime: start, endTime: end, reason: reason });
  if(!res.error) {
    state.blocks.push(res);
    closeModal('modal-new-block');
    showToast('Agenda bloqueada!');
    renderAgenda(); // refresh
  } else {
    showToast('Erro: ' + res.error);
  }
}
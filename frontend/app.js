
// Detecta automaticamente a URL da API:
// - Se servido pelo Express (localhost:3000), usa URL relativa
// - Se servido via file:// ou outro servidor, usa localhost:3000
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000/api'
  : '/api';

// shopId vem da URL (?shop=xxx). Se não existir, a landing page vai exibir normalmente.
let shopId = new URLSearchParams(window.location.search).get('shop');

// ===================== API CLIENT =====================
const api = {
  getHeaders: () => ({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }),
  handleResponse: async (res) => {
    // Commented out to fix user blocking issue
    // if (res.status === 402) { showPaywall(); return { error: 'Assinatura necessária.' }; }
    if (res.status === 429) return { error: 'Muitas tentativas. Aguarde alguns minutos.' };
    
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || 'Erro inesperado no servidor.' };
    }
    return data;
  },
  post: async (path, body, auth = true) => {
    try {
      const opts = {
        method: 'POST',
        headers: auth ? api.getHeaders() : { 'Content-Type': 'application/json' }
      };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(API_URL + path, opts);
      return await api.handleResponse(res);
    } catch (e) {
      return { error: 'OFFLINE' };
    }
  },
  put: async (path, body) => {
    try {
      const res = await fetch(API_URL + path, { method: 'PUT', headers: api.getHeaders(), body: JSON.stringify(body) });
      return await api.handleResponse(res);
    } catch (e) { return { error: 'OFFLINE' }; }
  },
  del: async (path) => {
    try {
      const res = await fetch(API_URL + path, { method: 'DELETE', headers: api.getHeaders() });
      return await api.handleResponse(res);
    } catch (e) { return { error: 'OFFLINE' }; }
  },
  get: async (path, auth = true) => {
    try {
      const res = await fetch(API_URL + path, { headers: auth ? api.getHeaders() : {} });
      return await api.handleResponse(res);
    } catch (e) { return { error: 'OFFLINE' }; }
  }
};

function showPaywall() {
  return; // Disabled to fix user blocking issue
  const modal = $id('paywall-modal');
  if (modal) modal.classList.add('open');
}

// ===================== HELPERS =====================
function $id(id) { return document.getElementById(id); }

// Proteção contra XSS — sempre usar em valores vindos do servidor antes de inserir no innerHTML
function sanitize(str) {
  var d = document.createElement('div');
  d.textContent = str != null ? String(str) : '';
  return d.innerHTML;
}

// Normaliza agendamento da API (campos DB) para o formato interno do frontend
function normalizeAppt(a) {
  return {
    id:            a.id,
    client:        a.clientName  || a.client  || '',
    service:       a.serviceNames || a.service || '',
    barber:        a.barberName  || a.barber  || '',
    date:          a.date        || '',
    time:          a.time        || '',
    status:        a.status      || 'confirmed',
    paymentStatus: a.paymentStatus || 'pendente',
    payment:       a.paymentMethod || a.payment || 'Na barbearia',
    price:         a.price       || 0,
    archived:      a.archived    || false
  };
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = window.location.pathname;
}

// ===================== TOAST =====================
function showToast(msg) {
  var t = $id('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function () { t.classList.remove('show'); }, 3000);
}

function openModal(id) { $id(id).classList.add('open'); }
function closeModal(id) { $id(id).classList.remove('open'); }

// ===================== INIT =====================
window.onload = async () => {
  // 1. Prioridade Total: Se houver shopId na URL
  if (shopId) {
    const data = await api.get('/public/shop/' + shopId, false);
    if (data && !data.error) {
      if (data.shopId) shopId = data.shopId;
      state.services  = data.services;
      state.barbers   = data.barbers;
      state.discounts = data.discounts;
      state.hours     = data.hours || state.hours;
      const nameEl = document.querySelector('.booking-shop-name');
      if (nameEl) nameEl.innerHTML = sanitize(data.shopName);
    }
    goTo('booking');
    return;
  }

  // 2. Login automático
  const token = localStorage.getItem('token');
  if (token) {
    const data = await api.get('/admin/data');
    if (data && !data.error) {
      applyAdminData(data);
      updateSidebarUser(data.shopName);
      goTo('admin');
      return;
    } else {
      localStorage.removeItem('token');
    }
  }

  // 3. Caso contrário, mostra a Landing Page
  goTo('landing');
};

function applyAdminData(data) {
  state.services     = data.services     || [];
  state.barbers      = data.barbers      || [];
  state.discounts    = data.discounts    || [];
  state.appointments = (data.appointments || []).map(normalizeAppt);
  if (data.hours && data.hours.length > 0) state.hours = data.hours;
  state.shopName     = data.shopName     || '';
  state.shopId       = data.shopId;
  state.shopSlug     = data.shopSlug;

  // Atualiza os links de visualização pública
  const shopIdOrSlug = data.shopSlug || data.shopId;
  const pubLink = getPublicLink(shopIdOrSlug);
  const dashLinkEl = document.getElementById('dash-public-link');
  if (dashLinkEl) dashLinkEl.innerText = pubLink;

  const sidebarLink = document.getElementById('sidebar-shop-link');
  if (sidebarLink) {
    sidebarLink.href = pubLink;
    sidebarLink.innerText = pubLink.replace(/^https?:\/\//, '');
  }

  renderAdminAppts(); // Nome correto: renderAdminAppts (sem parâmetros, usa o state)
  renderAdminServicesList(); // Nome correto: renderAdminServicesList
}

function getPublicLink(sid) {
  const currentPath = window.location.pathname;
  const baseUrl = window.location.origin + currentPath;
  return baseUrl + '?shop=' + sid;
}

function openPublicPage() {
  const link = getPublicLink(state.shopSlug || state.shopId);
  window.open(link, '_blank');
}

function copyPublicLink() {
  const link = getPublicLink(state.shopSlug || state.shopId);
  if (navigator.clipboard) {
    navigator.clipboard.writeText(link).then(() => {
      showToast('📋 Link copiado com sucesso!');
    });
  } else {
    showToast('Link: ' + link);
  }
}

// ===================== STATE =====================
var state = {
  booking: { services: [], barber: 0, date: null, time: null, payment: 'Na barbearia' },
  cal: { year: new Date().getFullYear(), month: new Date().getMonth() },
  services: [
    { id: 's1', name: 'Corte Tradicional', price: 35, duration: 30, desc: 'Tesoura e máquina' },
    { id: 's2', name: 'Corte Degradê',     price: 45, duration: 40, desc: 'Degradê moderno' },
    { id: 's3', name: 'Corte + Barba',     price: 65, duration: 60, desc: 'Combo completo' },
    { id: 's4', name: 'Barba Completa',    price: 35, duration: 30, desc: 'Navalha e toalha quente' },
    { id: 's5', name: 'Pigmentação',       price: 80, duration: 45, desc: 'Disfarce e pigmentação' }
  ],
  barbers: [
    { id: 'b1', name: 'João Silva',    role: 'Proprietário · Degradê',  emoji: '✂️' },
    { id: 'b2', name: 'Carlos Mendes', role: 'Especialista em Barba',   emoji: '🪒' },
    { id: 'b3', name: 'Rafael Souza',  role: 'Corte e Penteado',        emoji: '💇' }
  ],
  appointments: [],
  hours: [
    { day: 'Segunda', open: true,  start: '08:00', end: '20:00' },
    { day: 'Terça',   open: true,  start: '08:00', end: '20:00' },
    { day: 'Quarta',  open: true,  start: '08:00', end: '20:00' },
    { day: 'Quinta',  open: true,  start: '08:00', end: '20:00' },
    { day: 'Sexta',   open: true,  start: '08:00', end: '21:00' },
    { day: 'Sábado',  open: true,  start: '08:00', end: '18:00' },
    { day: 'Domingo', open: false, start: '09:00', end: '14:00' }
  ],
  discounts: [],
  shopName: ''
};

// Horários marcados como ocupados (carregados da API ao selecionar data)
var busySlots = [];

// ===================== NAVIGATION =====================
var sidebarOpen = false;

function openSidebar() {
  sidebarOpen = true;
  var sidebar = $id('admin-sidebar');
  var overlay = $id('sidebar-overlay');
  if (sidebar) sidebar.classList.add('sidebar-visible');
  if (overlay) {
    overlay.style.display = 'block';
    requestAnimationFrame(function () { overlay.classList.add('overlay-visible'); });
  }
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  sidebarOpen = false;
  var sidebar = $id('admin-sidebar');
  var overlay = $id('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('sidebar-visible');
  if (overlay) {
    overlay.classList.remove('overlay-visible');
    setTimeout(function () { overlay.style.display = 'none'; }, 300);
  }
  document.body.style.overflow = '';
}

function toggleSidebar() { if (sidebarOpen) closeSidebar(); else openSidebar(); }

// ── Landing mobile nav ──────────────────────────
function toggleMobileNav() {
  var dd = $id('nav-mobile-dropdown');
  if (!dd) return;
  dd.classList.toggle('open');
}
function closeMobileNav() {
  var dd = $id('nav-mobile-dropdown');
  if (dd) dd.classList.remove('open');
}

function goTo(screen) {
  closeMobileNav();
  
  // Se estiver tentando ir para o agendamento mas não houver link de barbearia, 
  // tenta usar a do usuário logado se disponível.
  if (screen === 'booking' && !shopId && state.shopId) {
    shopId = state.shopId;
  }

  document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
  $id(screen).classList.add('active');
  
  // Se ainda estiver sem shopId ao entrar no booking, avisa o usuário (UX)
  if (screen === 'booking' && !shopId) {
    showToast('💡 Crie sua conta para ter seu próprio link de agendamento!');
    // Renderiza com serviços padrão apenas para demonstração visual
  }

  $id('main-nav').style.display = (screen === 'admin') ? 'none' : '';
  if (screen === 'booking') renderBooking();
  if (screen === 'admin')   { renderAdmin(); closeSidebar(); }
}


function switchTab(showId, hideId, btn) {
  $id(showId).style.display = 'block';
  $id(hideId).style.display = 'none';
  document.querySelectorAll('.form-tab').forEach(function (t) { t.classList.remove('active'); });
  btn.classList.add('active');
}

// ===================== AUTH =====================
function setButtonLoading(btnEl, loading, label) {
  if (!btnEl) return;
  btnEl.disabled = loading;
  btnEl.textContent = loading ? '⏳ Aguarde...' : label;
}

async function doLogin() {
  const email    = $id('login-email').value.trim();
  const password = $id('login-pass').value;
  const btn      = document.querySelector('#login-tab .btn-full');
  if (!email || !password) { showToast('⚠️ Preencha e-mail e senha'); return; }
  setButtonLoading(btn, true, 'Entrar no Dashboard');
  
  try {
    const res = await api.post('/auth/login', { email, password }, false);
    if (res.error) {
      showToast(res.error === 'OFFLINE' ? '❌ Backend offline ou inacessível' : '❌ ' + res.error);
      return;
    }
    
    localStorage.setItem('token', res.token);
    const data = await api.get('/admin/data');
    if (data.error) {
      showToast('❌ Erro ao carregar dados do painel.');
      return;
    }
    
    applyAdminData(data);
    updateSidebarUser(data.shopName);
    goTo('admin');
  } catch (e) {
    showToast('❌ Erro inesperado ao tentar logar.');
    console.error(e);
  } finally {
    setButtonLoading(btn, false, 'Entrar no Dashboard');
  }
}

async function doRegister() {
  const name     = $id('reg-name').value.trim();
  const email    = $id('reg-email') ? $id('reg-email').value.trim() : '';
  const password = $id('reg-pass')  ? $id('reg-pass').value  : '123456';
  const btn      = document.querySelector('#register-tab .btn-full');
  if (!name || !email || !password) { showToast('⚠️ Preencha todos os campos'); return; }
  setButtonLoading(btn, true, 'Criar conta grátis →');
  
  try {
    const res = await api.post('/auth/register', { name, email, password }, false);
    if (res.error) {
      showToast(res.error === 'OFFLINE' ? '❌ Backend offline ou inacessível' : '❌ ' + res.error);
      return;
    }
    
    localStorage.setItem('token', res.token);
    const data = await api.get('/admin/data');
    if (!data.error) {
      applyAdminData(data);
      updateSidebarUser(data.shopName || name);
      goTo('admin');
      showToast('✅ Conta criada! Bem-vindo!');
      setTimeout(function() { maybeShowOnboarding(data); }, 400);
    } else {
      showToast('❌ Erro ao carregar dados após registro.');
    }
  } catch (e) {
    showToast('❌ Erro inesperado ao tentar criar conta.');
    console.error(e);
  } finally {
    setButtonLoading(btn, false, 'Criar conta grátis →');
  }
}

function updateSidebarUser(name) {
  state.shopName = name || state.shopName;
  var nameEl = document.querySelector('.sidebar-user-name');
  if (nameEl) nameEl.textContent = state.shopName;
  var topbarName = document.querySelector('.topbar-user-pill span');
  if (topbarName) topbarName.textContent = state.shopName.split(' ')[0];
  // Atualiza link da barbearia no sidebar
  var linkEl = document.querySelector('.sidebar-link-row a');
  var sid = state.shopSlug || shopId;
  if (linkEl && sid) {
    var baseUrl = window.location.origin + window.location.pathname;
    linkEl.href  = baseUrl + '?shop=' + sid;
    linkEl.textContent = '🔗 Seu link de agendamento';
  }
}

// ===================== BOOKING =====================
function renderBooking() { renderBookingServices(); renderBookingBarbers(); renderCalendar(); }

function renderBookingServices() {
  $id('booking-services').innerHTML = state.services.map(function (s) {
    var sel = state.booking.services.indexOf(s.id) !== -1;
    return '<div class="service-card' + (sel ? ' selected' : '') + '" id="bsvc-' + s.id + '" onclick="selectService(\'' + s.id + '\')">' +
      '<div class="service-info"><h4>' + sanitize(s.name) + '</h4>' +
      '<div class="service-meta">⏱ ' + sanitize(s.duration) + ' min · ' + sanitize(s.desc) + '</div></div>' +
      '<div class="service-right"><div class="service-price">R$' + sanitize(s.price) + '</div>' +
      '<div class="service-check">' + (sel ? '✓' : '') + '</div></div></div>';
  }).join('');
  updateServiceBar();
}

function updateServiceBar() {
  var ids  = state.booking.services;
  var bar  = $id('svc-bar');
  var lbl  = $id('svc-bar-label');
  var tot  = $id('svc-bar-total');
  var next = $id('btn-step1');
  if (!ids.length) { bar.classList.remove('visible'); next.disabled = true; return; }
  var price = 0, dur = 0;
  ids.forEach(function (id) {
    var s = state.services.filter(function (x) { return x.id === id; })[0];
    if (s) { price += s.price; dur += s.duration; }
  });
  lbl.textContent = ids.length + ' serviço' + (ids.length > 1 ? 's' : '') + ' · ' + dur + ' min';
  tot.textContent = 'R$' + price;
  bar.classList.add('visible');
  next.disabled = false;
}

function selectService(id) {
  var realService = state.services.filter(function (s) { return String(s.id) === String(id); })[0];
  if (!realService) return;
  var idx = state.booking.services.indexOf(realService.id);
  if (idx === -1) state.booking.services.push(realService.id);
  else state.booking.services.splice(idx, 1);
  renderBookingServices();
}

function renderBookingBarbers() {
  var html = '<div class="barber-card selected" id="bbar-0" onclick="selectBarber(0)">' +
    '<div class="barber-avatar">🎲</div><div class="barber-name">Qualquer</div>' +
    '<div class="barber-role">Próximo disponível</div></div>';
  html += state.barbers.map(function (b) {
    return '<div class="barber-card" id="bbar-' + b.id + '" onclick="selectBarber(\'' + b.id + '\')">' +
      '<div class="barber-avatar">' + sanitize(b.emoji) + '</div>' +
      '<div class="barber-name">' + sanitize(b.name) + '</div>' +
      '<div class="barber-role">' + sanitize(b.role) + '</div></div>';
  }).join('');
  $id('booking-barbers').innerHTML = html;
  state.booking.barber = 0;
}

function selectBarber(id) {
  if (id === 0 || id === '0') {
    state.booking.barber = 0;
  } else {
    var realBarber = state.barbers.filter(function (b) { return String(b.id) === String(id); })[0];
    if (realBarber) state.booking.barber = realBarber.id;
  }
  document.querySelectorAll('.barber-card').forEach(function (c) { c.classList.remove('selected'); });
  var sel = $id('bbar-' + (state.booking.barber || id));
  if (sel) sel.classList.add('selected');
}

function renderCalendar() {
  var y = state.cal.year, m = state.cal.month;
  var months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  $id('cal-month-label').textContent = months[m] + ' ' + y;
  var days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  var firstDay = new Date(y, m, 1).getDay();
  var total    = new Date(y, m + 1, 0).getDate();
  var today    = new Date();
  var html = days.map(function (d) { return '<div class="cal-day-label">' + d + '</div>'; }).join('');
  for (var i = 0; i < firstDay; i++) html += '<div class="cal-day empty"></div>';
  for (var d = 1; d <= total; d++) {
    var dt   = new Date(y, m, d);
    var past = dt < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    // Bloquear dias fechados com base nos horários cadastrados
    var dayNames = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
    var dayName  = dayNames[dt.getDay()];
    var hourInfo = state.hours.find(function(h) { return h.day === dayName; });
    var closed   = hourInfo && !hourInfo.open;
    var isToday  = dt.toDateString() === today.toDateString();
    var isSel    = state.booking.date === (y + '-' + (m + 1) + '-' + d);
    var disabled = past || closed;
    var cls = 'cal-day' + (disabled ? ' past' : '') + (closed && !past ? ' closed' : '') + (isToday ? ' today' : '') + (isSel ? ' selected' : '');
    html += '<div class="' + cls + '"' + (!disabled ? ' onclick="selectDate(' + y + ',' + (m + 1) + ',' + d + ')"' : '') + '>' + d + '</div>';
  }
  $id('cal-grid').innerHTML = html;
}

function changeMonth(dir) {
  state.cal.month += dir;
  if (state.cal.month > 11) { state.cal.month = 0; state.cal.year++; }
  if (state.cal.month < 0)  { state.cal.month = 11; state.cal.year--; }
  renderCalendar();
}

async function selectDate(y, m, d) {
  state.booking.date = y + '-' + m + '-' + d;
  state.booking.time = null;
  renderCalendar();
  $id('btn-step2').disabled = true;
  $id('time-title').textContent = '⏳ Carregando horários...';
  $id('time-slots').innerHTML = '<div class="skeleton-loading" style="height:44px;border-radius:8px"></div>';

  // Busca horários ocupados do backend
  busySlots = [];
  if (shopId) {
    try {
      const dateStr = y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const res = await api.get('/public/busy-slots/' + shopId + '?date=' + dateStr, false);
      if (res.busySlots) busySlots = res.busySlots;
    } catch (e) { /* offline — sem busy slots */ }
  }
  $id('time-title').textContent = 'Horários disponíveis';
  renderTimeSlots();
}

var appliedDiscount = null;

function renderTimeSlots() {
  // Determina horário de funcionamento do dia selecionado
  var endOfDayMin = 20 * 60;
  var startOfDayMin = 8 * 60;
  if (state.booking.date) {
    var parts = state.booking.date.split('-');
    var selDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    var dayNames = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
    var dayName  = dayNames[selDate.getDay()];
    var hInfo    = state.hours.find(function(h) { return h.day === dayName; });
    if (hInfo) {
      var ep = hInfo.end.split(':');   endOfDayMin   = parseInt(ep[0]) * 60 + parseInt(ep[1]);
      var sp = hInfo.start.split(':'); startOfDayMin = parseInt(sp[0]) * 60 + parseInt(sp[1]);
    }
  }

  // Gera slots a cada 30 min dentro do horário de funcionamento
  var slots = [];
  for (var min = startOfDayMin; min < endOfDayMin; min += 30) {
    var hh = Math.floor(min / 60), mm = min % 60;
    slots.push((hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm);
  }

  var totalDur = state.booking.services.reduce(function (sum, id) {
    var s = state.services.filter(function (x) { return x.id === id; })[0];
    return sum + (s ? s.duration : 0);
  }, 0);

  $id('time-slots').innerHTML = slots.map(function (t) {
    var busy    = busySlots.indexOf(t) !== -1;
    var sel     = state.booking.time === t;
    var parts2  = t.split(':');
    var slotMin = parseInt(parts2[0]) * 60 + parseInt(parts2[1]);
    var endMin  = slotMin + totalDur;
    var tooLate = totalDur > 0 && endMin > endOfDayMin;
    var endH    = Math.floor(endMin / 60), endM = endMin % 60;
    var endLabel = (totalDur > 0 && !busy && !tooLate)
      ? '<br><span class="slot-end">até ' + endH + ':' + (endM < 10 ? '0' : '') + endM + '</span>' : '';
    var disabled = busy || tooLate;
    var cls = 'time-slot' + (disabled ? (tooLate ? ' too-late' : ' busy') : '') + (sel ? ' selected' : '');
    return '<div class="' + cls + '"' + (!disabled ? ' onclick="selectTime(\'' + t + '\')"' : '') + '>' + t + endLabel + '</div>';
  }).join('');
}

function selectTime(t) {
  state.booking.time = t;
  renderTimeSlots();
  $id('btn-step2').disabled = false;
}

function nextStep(n) {
  document.querySelectorAll('.step-panel').forEach(function (p) { p.classList.remove('active'); });
  $id('step' + n).classList.add('active');
  document.querySelectorAll('.step-indicator').forEach(function (el, i) {
    el.classList.remove('active', 'done');
    if (i + 1 < n) el.classList.add('done');
    if (i + 1 === n) el.classList.add('active');
  });
  if (n === 3) renderSummary();
}

function getSelectedServices() {
  return state.booking.services.map(function (id) {
    return state.services.filter(function (s) { return s.id === id; })[0];
  }).filter(Boolean);
}

function renderSummary() {
  var svcs = getSelectedServices();
  var bar  = state.booking.barber === 0
    ? { name: 'Próximo disponível' }
    : state.barbers.filter(function (b) { return b.id === state.booking.barber; })[0];
  var p = state.booking.date.split('-');
  var totalPrice = svcs.reduce(function (a, s) { return a + s.price; }, 0);
  var totalDur   = svcs.reduce(function (a, s) { return a + s.duration; }, 0);
  var discountAmount = calcDiscount(totalPrice);
  var finalPrice = totalPrice - discountAmount;
  var paymentLabel = state.booking.payment || 'Na barbearia';
  var payMethodsIcons = { 'Na barbearia': '🏪', 'Pix Antecipado': '💠', 'Cartão de Crédito': '💳' };
  var payIcon = payMethodsIcons[paymentLabel] || '💳';

  var svcRows = svcs.map(function (s) {
    return '<div class="summary-row"><span class="label">✂️ ' + sanitize(s.name) + '</span><span class="value">R$' + sanitize(s.price) + ' · ' + sanitize(s.duration) + 'min</span></div>';
  }).join('');
  var discRow = discountAmount > 0
    ? '<div class="summary-row"><span class="label" style="color:var(--green)">🏷️ Desconto (' + sanitize(appliedDiscount.code) + ')</span><span class="value" style="color:var(--green)">-R$' + discountAmount + '</span></div>'
    : '';
  $id('booking-summary').innerHTML =
    svcRows + discRow +
    '<div class="summary-row"><span class="label">Barbeiro</span><span class="value">' + sanitize(bar.name) + '</span></div>' +
    '<div class="summary-row"><span class="label">Data</span><span class="value">' + sanitize(p[2]) + '/' + sanitize(p[1]) + '/' + sanitize(p[0]) + '</span></div>' +
    '<div class="summary-row"><span class="label">Horário</span><span class="value">' + sanitize(state.booking.time) + '</span></div>' +
    '<div class="summary-row"><span class="label">Duração total</span><span class="value">' + sanitize(totalDur) + ' min</span></div>' +
    '<div class="summary-row"><span class="label">' + payIcon + ' Pagamento</span><span class="value">' + sanitize(paymentLabel) + '</span></div>' +
    '<div class="summary-row total"><span class="label">Total</span><span class="value">R$' + finalPrice + '</span></div>';
}

function calcDiscount(totalPrice) {
  if (!appliedDiscount) return 0;
  return appliedDiscount.type === 'percent'
    ? Math.round(totalPrice * appliedDiscount.value / 100)
    : Math.min(appliedDiscount.value, totalPrice);
}

async function confirmBooking() {
  var name  = $id('client-name').value.trim();
  var phone = $id('client-phone').value.trim();
  if (!name || !phone) { showToast('⚠️ Preencha seu nome e WhatsApp'); return; }

  var svcs  = getSelectedServices();
  var bar   = state.booking.barber === 0
    ? { name: 'Próximo disponível' }
    : state.barbers.filter(function (b) { return b.id === state.booking.barber; })[0];
  var p          = state.booking.date.split('-');
  var totalPrice = svcs.reduce(function (a, s) { return a + s.price; }, 0);
  var discAmount = calcDiscount(totalPrice);
  var finalPrice = totalPrice - discAmount;
  var svcNames   = svcs.map(function (s) { return s.name; }).join(', ');
  var paymentLabel = state.booking.payment || 'Na barbearia';

  var confirmBtn = document.querySelector('#step3 .btn-step-next');
  setButtonLoading(confirmBtn, true, '✔ Confirmar Agendamento');

  // Formata data como YYYY-MM-DD para o backend
  var dateFormatted = p[0] + '-' + String(p[1]).padStart(2, '0') + '-' + String(p[2]).padStart(2, '0');

  $id('confirm-details').innerHTML =
    '<div class="summary-row"><span class="label">👤 Cliente</span><span class="value">' + sanitize(name) + '</span></div>' +
    svcs.map(function (s) { return '<div class="summary-row"><span class="label">✂️ ' + sanitize(s.name) + '</span><span class="value">R$' + s.price + '</span></div>'; }).join('') +
    (discAmount > 0 ? '<div class="summary-row"><span class="label" style="color:var(--green)">🏷️ Desconto</span><span class="value" style="color:var(--green)">-R$' + discAmount + '</span></div>' : '') +
    '<div class="summary-row"><span class="label">👨 Barbeiro</span><span class="value">' + sanitize(bar.name) + '</span></div>' +
    '<div class="summary-row"><span class="label">📅 Data</span><span class="value">' + sanitize(p[2]) + '/' + sanitize(p[1]) + '/' + sanitize(p[0]) + ' às ' + sanitize(state.booking.time) + '</span></div>' +
    '<div class="summary-row"><span class="label">💳 Pagamento</span><span class="value">' + sanitize(paymentLabel) + '</span></div>' +
    '<div class="summary-row total"><span class="label">💰 Total</span><span class="value">R$' + finalPrice + '</span></div>';

  try {
    // Identifica o shopId (prioriza o da URL, senão o do estado se logado)
    const activeShopId = shopId || state.shopId;
    if (!activeShopId) {
      showToast('❌ Erro: Link da barbearia inválido. Use seu link oficial.');
      setButtonLoading(confirmBtn, false, '✔ Confirmar Agendamento');
      return;
    }

    const res = await api.post('/public/appointments', {
      shopId:        activeShopId,
      clientName:    name,
      clientPhone:   phone,
      serviceNames:  svcNames,
      barberName:    bar.name,
      date:          dateFormatted,
      time:          state.booking.time,
      paymentMethod: paymentLabel,
      price:         finalPrice
    }, false);
    if (res.error) { showToast('❌ ' + res.error); return; }
    if (res.appointment) state.appointments.push(normalizeAppt(res.appointment));
    nextStep(4);
    document.querySelectorAll('.step-indicator').forEach(function (el) { el.classList.add('done'); });
  } catch (e) {
    showToast('❌ O servidor backend está offline ou inacessível.');
  } finally {
    setButtonLoading(confirmBtn, false, '✔ Confirmar Agendamento');
  }
}

function sendWhatsApp() {
  var svcs = getSelectedServices();
  var names     = svcs.map(function (s) { return s.name; }).join(', ');
  var totalPrice = svcs.reduce(function (a, s) { return a + s.price; }, 0);
  var finalPrice = totalPrice - calcDiscount(totalPrice);
  var payment   = state.booking.payment || 'Na barbearia';
  var msg = '✅ Agendado!\nServiços: ' + names + '\nTotal: R$' + finalPrice + '\nPagamento: ' + payment + '\nData: ' + state.booking.date + '\nHorário: ' + state.booking.time;
  window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
}

function resetBooking() {
  state.booking = { services: [], barber: 0, date: null, time: null, payment: 'Na barbearia' };
  appliedDiscount = null;
  busySlots = [];
  if ($id('coupon-code'))    $id('coupon-code').value = '';
  if ($id('coupon-applied')) $id('coupon-applied').style.display = 'none';
  nextStep(1);
  renderBooking();
}

function applyCoupon() {
  var code = ($id('coupon-code') ? $id('coupon-code').value : '').trim().toUpperCase();
  if (!code) { showToast('⚠️ Digite um código de cupom'); return; }
  var disc = state.discounts.filter(function (d) { return d.code === code && d.active; })[0];
  if (!disc) {
    showToast('❌ Cupom inválido ou inativo');
    appliedDiscount = null;
    if ($id('coupon-applied')) $id('coupon-applied').style.display = 'none';
    return;
  }
  appliedDiscount = disc;
  disc.uses++;
  var val = disc.type === 'percent' ? disc.value + '%' : 'R$' + disc.value;
  if ($id('coupon-applied')) {
    $id('coupon-applied').textContent = '🏷️ Cupom "' + disc.code + '" aplicado! Desconto de ' + val;
    $id('coupon-applied').style.display = 'block';
  }
  renderSummary();
  showToast('🎉 Cupom aplicado com sucesso!');
}

function selectPayment(method) {
  document.querySelectorAll('.payment-radio').forEach(function (el) { el.classList.remove('selected'); });
  var selectedEl = $id('pay-' + method);
  if (selectedEl) selectedEl.classList.add('selected');
  var labels = { shop: 'Na barbearia', pix: 'Pix Antecipado', card: 'Cartão de Crédito' };
  state.booking.payment = labels[method] || 'Na barbearia';
  renderSummary();
}

// ===================== ADMIN =====================
function renderAdmin() {
  // Atualiza nome do usuário no sidebar
  updateSidebarUser(state.shopName);

  $id('today-date').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  $id('stat-today').textContent = getTodayAppts().length;
  if ($id('stat-revenue-hoje')) $id('stat-revenue-hoje').textContent = 'R$' + getDailyRevenue();

  // Stats dinâmicos
  updateWeekStats();

  $id('appt-service').innerHTML = state.services.map(function (s) { return '<option value="' + s.id + '">' + sanitize(s.name) + ' — R$' + s.price + '</option>'; }).join('');
  $id('appt-barber').innerHTML  = state.barbers.map(function (b) { return '<option value="' + b.id + '">' + sanitize(b.name) + '</option>'; }).join('');
  $id('appt-date').value = new Date().toISOString().split('T')[0];
  renderAdminAppts(); renderDashServices(); renderAdminServicesList();
  renderAdminBarbers(); renderHours(); renderHistory(); renderAgenda();
  renderRevenueChart(); renderDiscounts();
}

function getTodayAppts() {
  var todayStr = new Date().toISOString().split('T')[0];
  return state.appointments.filter(function (a) {
    return (a.date === 'hoje' || a.date === todayStr) && !a.archived;
  });
}

function updateWeekStats() {
  // Calcula agendamentos da semana
  var weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  var todayStr = new Date().toISOString().split('T')[0];
  var weekCount = state.appointments.filter(function(a) {
    if (a.archived) return false;
    if (a.date === 'hoje') return true;
    var aDate = new Date(a.date);
    return aDate >= weekAgo;
  }).length;
  var semEl = document.querySelector('.stat-card:nth-child(2) .stat-card-value');
  if (semEl) semEl.textContent = weekCount;

  // Taxa de presença: completed / (completed + no-show)
  var completed = state.appointments.filter(function(a) { return a.status === 'completed'; }).length;
  var noShow    = state.appointments.filter(function(a) { return a.status === 'no-show'; }).length;
  var total     = completed + noShow;
  var taxa      = total > 0 ? Math.round((completed / total) * 100) : 100;
  var taxaEl    = document.querySelector('.stat-card:nth-child(4) .stat-card-value');
  if (taxaEl) taxaEl.textContent = taxa + '%';
}

function adminNav(view, el) {
  // Fecha a sidebar automaticamente em mobile após clicar em um item
  if (window.innerWidth <= 768) closeSidebar();

  var views = ['dashboard','financeiro','agenda','services','barbers','hours','history','discounts','configuracoes'];
  views.forEach(function (v) {
    var el2 = $id('view-' + v); if (el2) el2.style.display = (v === view) ? 'block' : 'none';
  });
  document.querySelectorAll('.nav-item').forEach(function (i) { i.classList.remove('active'); });
  var sideItems = document.querySelectorAll('.nav-item');
  var idx = views.indexOf(view);
  if (sideItems[idx]) sideItems[idx].classList.add('active');
  document.querySelectorAll('.admin-bnav-item').forEach(function (i) { i.classList.remove('active'); });
  var bItems = document.querySelectorAll('.admin-bnav-item');
  if (bItems[idx]) bItems[idx].classList.add('active');

  // Rerenderiza a seção ativa para garantir dados atualizados
  if (view === 'financeiro')  renderFinanceiro();
  if (view === 'agenda')      renderAgenda();
  if (view === 'services')    renderAdminServicesList();
  if (view === 'barbers')     renderAdminBarbers();
  if (view === 'hours') {
    // Se ainda não tem hours carregados, busca da API antes de renderizar
    if (state.hours.length === 0) {
      api.get('/admin/hours').then(function(res) {
        if (res && res.length > 0) state.hours = res;
        renderHours();
      }).catch(function() { renderHours(); });
    } else {
      renderHours();
    }
  }
  if (view === 'history')       renderHistory();
  if (view === 'discounts')     renderDiscounts();
  if (view === 'dashboard')     { renderAdminAppts(); renderDashServices(); renderRevenueChart(); }
  if (view === 'configuracoes') loadSettings();
}


function renderDiscounts() {
  var el = $id('discounts-list');
  if (!el) return;
  el.innerHTML = state.discounts.length
    ? state.discounts.map(function (d) {
        var val = d.type === 'percent' ? d.value + '%' : 'R$' + d.value;
        return '<div class="discount-row">' +
          '<div class="discount-code">' + sanitize(d.code) + '</div>' +
          '<div class="discount-info">' + sanitize(d.desc) + ' · <strong>' + sanitize(val) + '</strong> · ' + sanitize(d.uses) + ' uso(s)</div>' +
          '<div class="discount-actions">' +
          '<label class="toggle"><input type="checkbox"' + (d.active ? ' checked' : '') + ' onchange="toggleDiscount(\'' + d.id + '\',this.checked)"><span class="toggle-slider"></span></label>' +
          '<button class="btn-icon danger" onclick="deleteDiscount(\'' + d.id + '\')">✕</button>' +
          '</div></div>';
      }).join('')
    : '<div class="empty-state"><div class="empty-icon">🎫</div><p>Nenhum cupom criado</p></div>';
}

function toggleDiscount(id, active) {
  var d = state.discounts.filter(function (x) { return String(x.id) === String(id); })[0];
  if (d) { d.active = active; api.put('/admin/discounts/' + id, { active }).catch(e => console.log(e)); showToast(active ? '✅ Cupom ativado' : '⏸ Cupom desativado'); }
}

async function deleteDiscount(id) {
  if (!confirm('Remover este cupom?')) return;
  await api.del('/admin/discounts/' + id);
  state.discounts = state.discounts.filter(function (d) { return d.id != id; });
  renderDiscounts();
  showToast('🗑 Cupom removido');
}

async function addDiscount() {
  var code  = ($id('disc-code').value || '').trim().toUpperCase();
  var type  = $id('disc-type').value;
  var value = parseFloat($id('disc-value').value);
  var desc  = ($id('disc-desc').value || '').trim() || 'Desconto especial';
  if (!code || !value) { showToast('⚠️ Preencha o código e o valor'); return; }
  if (state.discounts.filter(function (d) { return d.code === code; }).length) { showToast('⚠️ Já existe um cupom com esse código'); return; }
  const res = await api.post('/admin/discounts', { code, type, value, desc });
  state.discounts.push(res);
  closeModal('modal-new-discount');
  ['disc-code','disc-value','disc-desc'].forEach(function (i) { $id(i).value = ''; });
  renderDiscounts();
  showToast('✅ Cupom criado!');
}

// ===================== FINANCEIRO =====================
async function updatePaymentStatus(id, newStatus) {
  for (var i = 0; i < state.appointments.length; i++) {
    if (String(state.appointments[i].id) === String(id)) {
      const updated = await api.put('/admin/appointments/' + state.appointments[i].id, { paymentStatus: newStatus });
      state.appointments[i] = normalizeAppt(updated);
      break;
    }
  }
  renderFinanceiro(); renderRevenueChart(); updateFaturamentoUI();
  showToast('✅ Pagamento atualizado para: ' + newStatus);
}

let financeChartInstance = null;

function renderRevenueChart() {
  const ctx = document.getElementById('financeChart');
  if (!ctx || typeof Chart === 'undefined') return;

  const now = new Date();
  const last7Days = [];
  const earnings = { pago: [], pendente: [] };

  for (let i = 6; i >= 0; i--) {
    let d = new Date(now);
    d.setDate(d.getDate() - i);
    let ds = d.toISOString().split('T')[0];
    last7Days.push(d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }));
    
    // Sum
    let sumPago = 0, sumPendente = 0;
    state.appointments.forEach(a => {
      if (a.date === ds && !a.archived) {
        let p = getApptPrice(a);
        if (a.paymentStatus === 'pago') sumPago += p;
        if (a.paymentStatus === 'pendente') sumPendente += p;
      }
    });
    earnings.pago.push(sumPago);
    earnings.pendente.push(sumPendente);
  }

  if (financeChartInstance) financeChartInstance.destroy();

  financeChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: last7Days,
      datasets: [
        { label: 'Recebido (R$)', data: earnings.pago, backgroundColor: '#c8a97e', borderRadius: 4 },
        { label: 'Pendente (R$)', data: earnings.pendente, backgroundColor: '#333', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#bbb' } }
      },
      scales: {
        y: { ticks: { color: '#777' }, grid: { color: '#222' }, beginAtZero: true },
        x: { ticks: { color: '#777' }, grid: { display: false } }
      }
    }
  });
}

function updateFaturamentoUI() {
  var totHoje = 0, totSem = 0, totMes = 0;
  var countPago = 0, totPago = 0;
  var todayStr = new Date().toISOString().split('T')[0];
  var weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  var monthPrefix = todayStr.substring(0, 7);

  state.appointments.forEach(function (a) {
    if (a.archived) return;
    var p = getApptPrice(a);
    if (a.paymentStatus === 'pago') {
      totPago += p;
      countPago++;
      if (a.date === todayStr || a.date === 'hoje') totHoje += p;
      
      var ad = new Date(a.date);
      if (ad >= weekAgo) totSem += p;

      if (a.date.startsWith(monthPrefix) || a.date === 'hoje') totMes += p;
    }
  });

  if ($id('fat-hoje')) $id('fat-hoje').textContent = 'R$ ' + totHoje.toFixed(2).replace('.', ',');
  if ($id('fat-semana')) $id('fat-semana').textContent = 'R$ ' + totSem.toFixed(2).replace('.', ',');
  if ($id('fat-mes')) $id('fat-mes').textContent = 'R$ ' + totMes.toFixed(2).replace('.', ',');
  var ticket = countPago > 0 ? (totPago / countPago) : 0;
  if ($id('fat-ticket')) $id('fat-ticket').textContent = 'R$ ' + ticket.toFixed(2).replace('.', ',');
}

function renderFinanceiro() {
  var el = $id('financeiro-list');
  if (!el) return;
  var filterVal = $id('fin-filter-status') ? $id('fin-filter-status').value : 'all';
  var list = state.appointments.slice().sort(function (a, b) { return String(b.id).localeCompare(String(a.id)); });
  if (filterVal !== 'all') list = list.filter(function (a) { return a.paymentStatus === filterVal; });

  var totPago = 0, totPendente = 0, totGeral = 0;
  state.appointments.forEach(function (a) {
    var p = getApptPrice(a);
    if (a.paymentStatus === 'pago')     totPago     += p;
    if (a.paymentStatus === 'pendente') totPendente += p;
    totGeral += p;
  });
  if ($id('tot-pago'))  $id('tot-pago').textContent  = 'R$ ' + totPago.toFixed(2).replace('.', ',');
  if ($id('tot-pend'))  $id('tot-pend').textContent  = 'R$ ' + totPendente.toFixed(2).replace('.', ',');
  if ($id('tot-geral')) $id('tot-geral').textContent = 'R$ ' + totGeral.toFixed(2).replace('.', ',');

  el.innerHTML = '<div class="skeleton-loading" style="height:60px;margin-bottom:10px;border-radius:12px"></div>';
  setTimeout(function () {
    el.innerHTML = list.length ? list.map(function (a) {
      var pStatus = a.paymentStatus || 'pendente';
      var formPgt = a.payment || 'Não def.';
      var cor = pStatus === 'pago' ? 'var(--green)' : pStatus === 'cancelado' ? 'var(--red)' : 'var(--gold)';
      return '<div class="appt-item" style="display:flex;flex-wrap:wrap;align-items:center;padding:14px;background:var(--bg-elevated);border-left:4px solid ' + cor + ';margin-bottom:8px;border-radius:12px">' +
             '<div style="flex:1;min-width:200px"><strong>' + sanitize(a.client) + '</strong><div style="color:var(--text-dim);font-size:13px">' + sanitize(a.service) + ' · ' + sanitize(a.date) + ' ' + sanitize(a.time) + '</div></div>' +
             '<div style="flex:1;min-width:120px;font-weight:600">R$ ' + getApptPrice(a).toFixed(2).replace('.', ',') + '<div style="font-size:12px;font-weight:normal;color:var(--text-dim)">' + sanitize(formPgt) + '</div></div>' +
             '<div style="flex:1;min-width:60px"><span class="badge" style="background:transparent;border:1px solid ' + cor + ';color:' + cor + '">' + pStatus.toUpperCase() + '</span></div>' +
             '<div class="fin-actions" style="display:flex;flex-wrap:wrap;gap:6px;width:100%;margin-top:10px;justify-content:flex-end">' +
               '<button class="btn-sm" style="background:var(--bg-card);border:1px solid var(--border-color);color:var(--green)" onclick="updatePaymentStatus(\'' + a.id + '\', \'pago\')" title="Marcar Pago">✔ Pago</button>' +
               '<button class="btn-sm" style="background:var(--bg-card);border:1px solid var(--border-color);color:var(--gold)" onclick="updatePaymentStatus(\'' + a.id + '\', \'pendente\')" title="Marcar Pendente">⏳ Pendente</button>' +
               '<button class="btn-sm" style="background:var(--bg-card);border:1px solid var(--border-color);color:var(--red)" onclick="updatePaymentStatus(\'' + a.id + '\', \'cancelado\')" title="Cancelar">❌ Cancelado</button>' +
             '</div></div>';
    }).join('') : '<div class="empty-state"><p>Nenhum registro financeiro encontrado.</p></div>';
  }, 200);
}

function apptRow(a, showBarberFull) {
  var dotColor = a.status === 'completed' ? 'var(--green)' : a.status === 'no-show' ? 'var(--red)' : a.status === 'pending' ? 'var(--gold)' : 'var(--green)';
  return '<div class="appt-item">' +
    '<span class="appt-time">' + sanitize(a.time) + '</span>' +
    '<div class="appt-dot" style="background:' + dotColor + '"></div>' +
    '<div class="appt-info"><div class="appt-client">' + sanitize(a.client) + '</div><div class="appt-service">' + sanitize(a.service) + '</div></div>' +
    '<span class="appt-barber-badge">' + sanitize(showBarberFull ? a.barber : a.barber.split(' ')[0]) + '</span>' +
    '<div class="appt-actions">' +
    '<button class="btn-icon status-done" onclick="updateApptStatus(\'' + a.id + '\',\'completed\')" title="Concluído">✓</button>' +
    '<button class="btn-icon status-miss" onclick="updateApptStatus(\'' + a.id + '\',\'no-show\')"  title="Faltou">✗</button>' +
    '<button class="btn-icon danger"      onclick="deleteAppt(\'' + a.id + '\')"                   title="Cancelar">✕</button>' +
    '</div></div>';
}

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function renderAdminAppts() {
  $id('admin-appt-list').innerHTML = '<div class="skeleton-loading" style="height:60px;margin-bottom:10px;border-radius:12px"></div><div class="skeleton-loading" style="height:60px;border-radius:12px"></div>';
  setTimeout(function () {
    var todayStr = getTodayString();
    var list = state.appointments.filter(function (a) {
      return (a.date === 'hoje' || a.date === todayStr) && !a.archived;
    }).sort(function (a, b) { return a.time.localeCompare(b.time); });
    $id('appt-count').textContent = list.length + ' agendamentos';
    $id('admin-appt-list').innerHTML = list.length
      ? list.map(function (a) { return apptRow(a, false); }).join('')
      : '<div class="empty-state animate-in"><div class="empty-icon">📅</div><p>Nenhum agendamento hoje</p></div>';
  }, 300);
}

// Filtros de agenda
var agendaDateFilter = 'hoje';
var agendaBarberFilter = 0;

function setAgendaFilter(filter, btn) {
  agendaDateFilter = filter;
  if (btn) {
    document.querySelectorAll('.schedule-filter').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
  }
  renderAgenda();
}

function filterAgendaByBarber(barberId) {
  agendaBarberFilter = barberId;
  renderAgenda();
}

function renderAgenda() {
  var filtersEl = $id('agenda-barber-filters');
  if (filtersEl) {
    var fHtml = '<button class="barber-filter-btn' + (agendaBarberFilter == 0 ? ' active' : '') + '" onclick="filterAgendaByBarber(0)">Todos</button>';
    state.barbers.forEach(function (b) {
      fHtml += '<button class="barber-filter-btn' + (agendaBarberFilter == b.id ? ' active' : '') + '" onclick="filterAgendaByBarber(\'' + b.id + '\')">' + sanitize(b.emoji) + ' ' + sanitize(b.name.split(' ')[0]) + '</button>';
    });
    filtersEl.innerHTML = fHtml;
  }

  $id('agenda-list').innerHTML = '<div class="skeleton-loading" style="height:70px;margin-bottom:10px;border-radius:12px"></div><div class="skeleton-loading" style="height:70px;border-radius:12px"></div>';
  setTimeout(function () {
    var todayStr    = getTodayString();
    var tomorrowStr = (function() { var d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })();
    var weekEnd     = (function() { var d = new Date(); d.setDate(d.getDate() + 7); return d; })();
    var nextWeekStart = (function() { var d = new Date(); d.setDate(d.getDate() + 7); return d; })();
    var nextWeekEnd   = (function() { var d = new Date(); d.setDate(d.getDate() + 14); return d; })();

    var list = state.appointments.filter(function (a) {
      if (a.archived) return false;
      var dateMatch = false;
      if (agendaDateFilter === 'hoje') {
        dateMatch = a.date === 'hoje' || a.date === todayStr;
      } else if (agendaDateFilter === 'amanha') {
        dateMatch = a.date === tomorrowStr;
      } else if (agendaDateFilter === 'semana') {
        var d = a.date === 'hoje' ? new Date() : new Date(a.date);
        dateMatch = d >= new Date(todayStr) && d <= weekEnd;
      } else if (agendaDateFilter === 'proxsemana') {
        var d2 = new Date(a.date);
        dateMatch = d2 >= nextWeekStart && d2 <= nextWeekEnd;
      } else {
        dateMatch = true;
      }
      if (!dateMatch) return false;
      if (agendaBarberFilter == 0 || !agendaBarberFilter) return true;
      var bar = state.barbers.filter(function (b) { return b.id == agendaBarberFilter; })[0];
      if (!bar) return true; 
      
      var apptBarber = a.barber.trim().toLowerCase();
      var targetBarber = bar.name.trim().toLowerCase();
      return apptBarber === targetBarber || apptBarber.includes(targetBarber) || targetBarber.includes(apptBarber);
    }).sort(function (a, b) { return a.time.localeCompare(b.time); });

    $id('agenda-list').innerHTML = list.length
      ? list.map(function (a) { return apptRow(a, true); }).join('')
      : '<div class="empty-state animate-in"><div class="empty-icon">📅</div><p>Nenhum agendamento</p></div>';
  }, 250);
}

async function deleteAppt(id) {
  if (!confirm('Cancelar este agendamento?')) return;
  await api.del('/admin/appointments/' + id);
  state.appointments = state.appointments.filter(function (a) { return a.id != id; });
  renderAdminAppts(); renderAgenda(); renderHistory(); renderRevenueChart();
  if ($id('stat-revenue-hoje')) $id('stat-revenue-hoje').textContent = 'R$' + getDailyRevenue();
  showToast('🗑 Agendamento cancelado');
}

async function updateApptStatus(id, newStatus) {
  for (var i = 0; i < state.appointments.length; i++) {
    if (String(state.appointments[i].id) === String(id)) {
      const updated = await api.put('/admin/appointments/' + state.appointments[i].id, { status: newStatus, archived: true });
      state.appointments[i] = normalizeAppt(updated);
      break;
    }
  }
  renderAdminAppts(); renderAgenda(); renderHistory(); renderRevenueChart();
  if ($id('stat-revenue-hoje')) $id('stat-revenue-hoje').textContent = 'R$' + getDailyRevenue();
  if ($id('stat-today')) $id('stat-today').textContent = getTodayAppts().length;
  showToast(newStatus === 'completed' ? '✅ Atendimento concluído — movido para Histórico!' : '❌ Cliente faltou — movido para Histórico!');
}

function getApptPrice(appt) {
  if (!appt) return 0;
  if (appt.status !== 'confirmed' && appt.status !== 'completed' && appt.status !== 'pending') return 0;
  if (appt.price !== undefined && appt.price !== null) return Number(appt.price);
  var svc = state.services.filter(function (s) { return s.name === appt.service; })[0];
  return svc ? svc.price : 0;
}

function calculateBilling() {
  var todayStr  = getTodayString();
  var weekAgo   = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  var monthAgo  = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
  var stats     = { today: 0, week: 0, month: 0, clients: 0 };

  state.appointments.forEach(function (a) {
    if (a.paymentStatus !== 'pago') return; // Conta apenas o que já foi pago
    var price = getApptPrice(a);
    if (price === 0) return;
    stats.clients++;
    var isToday = (a.date === 'hoje' || a.date === todayStr);
    if (isToday) stats.today += price;
    var aDate = a.date === 'hoje' ? new Date() : new Date(a.date);
    if (aDate >= weekAgo)  stats.week  += price;
    if (aDate >= monthAgo) stats.month += price;
  });
  var totalRev = state.appointments.reduce(function (sum, a) { return sum + getApptPrice(a); }, 0);
  stats.ticket = stats.clients > 0 ? (totalRev / stats.clients) : 0;
  return stats;
}

function getDailyRevenue() { return calculateBilling().today; }

function updateFaturamentoUI() {
  var s = calculateBilling();
  if ($id('fat-hoje'))   $id('fat-hoje').textContent   = 'R$ ' + s.today.toFixed(2).replace('.', ',');
  if ($id('fat-semana')) $id('fat-semana').textContent = 'R$ ' + s.week.toFixed(2).replace('.', ',');
  if ($id('fat-mes'))    $id('fat-mes').textContent    = 'R$ ' + s.month.toFixed(2).replace('.', ',');
  if ($id('fat-ticket')) $id('fat-ticket').textContent = 'R$ ' + s.ticket.toFixed(2).replace('.', ',');
}

function renderRevenueChart() {
  var el = $id('revenue-chart');
  if (!el) return;
  var days = [], weekData = [];
  var todayStr = getTodayString();

  for (var i = 6; i >= 0; i--) {
    var d = new Date(); d.setDate(d.getDate() - i);
    var dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' });
    var dStr    = d.toISOString().split('T')[0];
    days.push(dayName.charAt(0).toUpperCase() + dayName.slice(1, 3));
    var sum = 0;
    state.appointments.forEach(function (a) {
      if (a.paymentStatus !== 'pago') return;
      if ((i === 0 && (a.date === 'hoje' || a.date === todayStr)) || a.date === dStr) sum += getApptPrice(a);
    });
    weekData.push(sum);
  }

  var max = Math.max.apply(null, weekData) || 1;
  el.innerHTML = '<div class="chart-bars">' + days.map(function (day, i) {
    var pct      = Math.round((weekData[i] / max) * 100);
    var isActive = (i === 6);
    return '<div class="chart-bar-wrap">' +
      '<div class="chart-bar-value">' + (weekData[i] ? 'R$' + weekData[i] : '') + '</div>' +
      '<div class="chart-bar-track"><div class="chart-bar-fill' + (isActive ? ' active' : '') + '" style="height:' + pct + '%"></div></div>' +
      '<div class="chart-bar-label' + (isActive ? ' active' : '') + '">' + day + '</div></div>';
  }).join('') + '</div>';
  updateFaturamentoUI();
}

function searchHistory(query) {
  $id('history-list').innerHTML = '<div class="skeleton-loading" style="height:60px;margin-bottom:10px;border-radius:12px"></div><div class="skeleton-loading" style="height:60px;border-radius:12px"></div>';
  setTimeout(function () {
    var q    = (query || '').toLowerCase().trim();
    var list = state.appointments.slice().sort(function (a, b) { return String(b.id).localeCompare(String(a.id)); }).filter(function (a) {
      if (!q) return true;
      return a.client.toLowerCase().indexOf(q) !== -1 || a.service.toLowerCase().indexOf(q) !== -1 || a.barber.toLowerCase().indexOf(q) !== -1;
    });
    var statusMap = { completed: 'Concluído', 'no-show': 'Faltou', pending: 'Pendente', confirmed: 'Confirmado' };
    $id('history-list').innerHTML = list.length
      ? list.map(function (a) {
          var dotColor = a.status === 'completed' ? 'var(--green)' : a.status === 'no-show' ? 'var(--red)' : a.status === 'pending' ? 'var(--gold)' : 'var(--green)';
          var cls = a.status === 'no-show' ? 'no-show' : (a.status || 'confirmed');
          var lbl = statusMap[a.status] || 'Confirmado';
          return '<div class="appt-item">' +
            '<span class="appt-time">' + sanitize(a.time) + '</span>' +
            '<div class="appt-dot" style="background:' + dotColor + '"></div>' +
            '<div class="appt-info"><div class="appt-client">' + sanitize(a.client) + '</div><div class="appt-service">' + sanitize(a.service) + '</div></div>' +
            '<span class="appt-barber-badge">' + sanitize(a.barber) + '</span>' +
            '<span class="status-badge ' + cls + '">' + lbl + '</span></div>';
        }).join('')
      : '<div class="empty-state animate-in"><div class="empty-icon">🔍</div><p>Nenhum resultado encontrado</p></div>';
  }, 200);
}

function renderDashServices() {
  $id('dash-services-list').innerHTML = state.services.slice(0, 5).map(function (s) {
    return '<div class="service-row"><div class="service-color"></div>' +
      '<div class="service-row-info"><div class="service-row-name">' + sanitize(s.name) + '</div><div class="service-row-meta">⏱ ' + sanitize(s.duration) + ' min</div></div>' +
      '<div class="service-row-price">R$' + sanitize(s.price) + '</div></div>';
  }).join('');
}

function renderAdminServicesList() {
  $id('admin-services-list').innerHTML = state.services.map(function (s) {
    return '<div class="service-row"><div class="service-color"></div>' +
      '<div class="service-row-info"><div class="service-row-name">' + sanitize(s.name) + '</div><div class="service-row-meta">' + sanitize(s.desc) + ' · ⏱ ' + sanitize(s.duration) + ' min</div></div>' +
      '<div class="service-row-price">R$' + sanitize(s.price) + '</div>' +
      '<div class="appt-actions">' +
      '<button class="btn-icon edit-btn" onclick="openEditService(\'' + s.id + '\')" title="Editar">✎</button>' +
      '<button class="btn-icon danger"   onclick="deleteService(\'' + s.id + '\')" title="Excluir">✕</button>' +
      '</div></div>';
  }).join('');
}

function openEditService(id) {
  var s = state.services.filter(function (x) { return String(x.id) === String(id); })[0];
  if (!s) return;
  $id('edit-svc-id').value      = s.id;
  $id('edit-svc-name').value    = s.name;
  $id('edit-svc-price').value   = s.price;
  $id('edit-svc-duration').value= s.duration;
  $id('edit-svc-desc').value    = s.desc;
  openModal('modal-edit-service');
}

async function saveEditService() {
  var id       = $id('edit-svc-id').value;
  var name     = $id('edit-svc-name').value.trim();
  var price    = parseInt($id('edit-svc-price').value);
  var duration = parseInt($id('edit-svc-duration').value);
  var desc     = $id('edit-svc-desc').value.trim() || 'Serviço profissional';
  if (!name || !price || !duration) { showToast('⚠️ Preencha todos os campos'); return; }
  const res = await api.put('/admin/services/' + id, { name, price, duration, desc });
  var idx = state.services.findIndex(function (s) { return String(s.id) === String(id); });
  if (idx !== -1) state.services[idx] = res;
  closeModal('modal-edit-service');
  renderAdminServicesList(); renderDashServices(); renderBookingServices();
  showToast('✅ Serviço atualizado!');
}

async function addService() {
  var name     = $id('svc-name').value.trim();
  var price    = parseInt($id('svc-price').value);
  var duration = parseInt($id('svc-duration').value);
  var desc     = $id('svc-desc').value.trim() || 'Serviço profissional';
  if (!name || !price || !duration) { showToast('⚠️ Preencha todos os campos'); return; }
  const res = await api.post('/admin/services', { name, price, duration, desc });
  state.services.push(res);
  closeModal('modal-new-service');
  renderAdminServicesList(); renderDashServices();
  ['svc-name','svc-price','svc-duration','svc-desc'].forEach(function (i) { $id(i).value = ''; });
  showToast('✅ Serviço adicionado!');
}

async function deleteService(id) {
  if (!confirm('Remover este serviço?')) return;
  await api.del('/admin/services/' + id);
  state.services = state.services.filter(function (s) { return s.id != id; });
  renderAdminServicesList(); renderDashServices();
  showToast('🗑 Serviço removido');
}

function renderAdminBarbers() {
  $id('admin-barbers-grid').innerHTML = state.barbers.map(function (b) {
    return '<div class="barber-admin-card"><div class="avatar">' + sanitize(b.emoji) + '</div>' +
      '<h4>' + sanitize(b.name) + '</h4><p>' + sanitize(b.role) + '</p>' +
      '<div class="barber-card-actions">' +
      '<button class="btn-icon edit-btn" onclick="openEditBarber(\'' + b.id + '\')" title="Editar">✎</button>' +
      '<button class="btn-icon danger"   onclick="deleteBarber(\'' + b.id + '\')">✕</button>' +
      '</div></div>';
  }).join('');
}

async function addBarber() {
  var name  = $id('barber-name').value.trim();
  var role  = $id('barber-role').value.trim()  || 'Barbeiro';
  var emoji = $id('barber-emoji').value.trim() || '✂️';
  if (!name) { showToast('⚠️ Informe o nome'); return; }
  const res = await api.post('/admin/barbers', { name, role, emoji });
  state.barbers.push(res);
  closeModal('modal-new-barber');
  renderAdminBarbers();
  ['barber-name','barber-role','barber-emoji'].forEach(function (i) { $id(i).value = ''; });
  showToast('✅ Barbeiro adicionado!');
}

async function deleteBarber(id) {
  if (!confirm('Remover este barbeiro?')) return;
  await api.del('/admin/barbers/' + id);
  state.barbers = state.barbers.filter(function (b) { return b.id != id; });
  renderAdminBarbers();
  showToast('🗑 Barbeiro removido');
}

function openEditBarber(id) {
  var b = state.barbers.filter(function (x) { return String(x.id) === String(id); })[0];
  if (!b) return;
  $id('edit-barber-id').value    = b.id;
  $id('edit-barber-name').value  = b.name;
  $id('edit-barber-role').value  = b.role;
  $id('edit-barber-emoji').value = b.emoji;
  openModal('modal-edit-barber');
}

async function saveEditBarber() {
  var id    = $id('edit-barber-id').value;
  var name  = $id('edit-barber-name').value.trim();
  var role  = $id('edit-barber-role').value.trim()  || 'Barbeiro';
  var emoji = $id('edit-barber-emoji').value.trim() || '✂️';
  if (!name) { showToast('⚠️ Informe o nome'); return; }
  const res = await api.put('/admin/barbers/' + id, { name, role, emoji });
  var idx = state.barbers.findIndex(function (b) { return String(b.id) === String(id); });
  if (idx !== -1) state.barbers[idx] = res;
  closeModal('modal-edit-barber');
  renderAdminBarbers();
  showToast('✅ Barbeiro atualizado!');
}

async function addManualAppt() {
  var client    = $id('appt-client').value.trim();
  var svcId     = $id('appt-service').value;
  var barId     = $id('appt-barber').value;
  var date      = $id('appt-date').value;
  var time      = $id('appt-time').value;
  var payMethod = $id('appt-pay') ? $id('appt-pay').value : 'Na barbearia';
  if (!client || !date || !time) { showToast('⚠️ Preencha todos os campos'); return; }
  var svc = state.services.filter(function (s) { return s.id === svcId; })[0];
  var bar = state.barbers.filter(function (b) { return b.id === barId; })[0];
  if (!svc || !bar) { showToast('⚠️ Selecione o serviço e o barbeiro'); return; }

  try {
    const res = await api.post('/admin/appointments', {
      clientName:    client,
      clientPhone:   '',
      serviceNames:  svc.name,
      barberName:    bar.name,
      date,
      time,
      paymentMethod: payMethod,
      price:         svc.price
    });
    if (res.error) { showToast('❌ ' + res.error); return; }
    state.appointments.push(normalizeAppt(res));
    closeModal('modal-new-appt');
    renderAdminAppts(); renderAgenda();
    renderFinanceiro(); renderRevenueChart(); updateFaturamentoUI();
    $id('appt-client').value = '';
    showToast('✅ Agendamento criado!');
  } catch (e) {
    showToast('❌ Erro ao criar agendamento. Backend offline?');
  }
}

function renderHours() {
  $id('hours-list').innerHTML = state.hours.map(function (h, i) {
    return '<div class="hours-row"><div class="hours-day">' + sanitize(h.day) + '</div>' +
      '<label class="toggle"><input type="checkbox"' + (h.open ? ' checked' : '') + ' onchange="state.hours[' + i + '].open=this.checked"><span class="toggle-slider"></span></label>' +
      '<div class="hours-time"><input type="time" value="' + h.start + '" onchange="state.hours[' + i + '].start=this.value"> <span>até</span> <input type="time" value="' + h.end + '" onchange="state.hours[' + i + '].end=this.value"></div></div>';
  }).join('');
}

async function saveHours() {
  try {
    await api.post('/admin/hours', state.hours);
    showToast('✅ Horários salvos com sucesso!');
  } catch (e) {
    showToast('❌ Erro ao salvar horários. Backend offline?');
  }
}

function renderHistory() {
  searchHistory($id('history-search-input') ? $id('history-search-input').value : '');
}

// ===================== INIT DOM =====================
document.addEventListener('DOMContentLoaded', function () {
  renderCalendar();

  // Conecta os botões de filtro da agenda ao filtro real
  document.querySelectorAll('.schedule-filter').forEach(function (btn) {
    var filterMap = { 'Hoje': 'hoje', 'Amanhã': 'amanha', 'Esta semana': 'semana', 'Próxima semana': 'proxsemana' };
    btn.addEventListener('click', function () {
      document.querySelectorAll('.schedule-filter').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      setAgendaFilter(filterMap[btn.textContent] || 'hoje');
    });
  });

  // Fecha modais ao clicar no overlay
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
  });

  // Fecha modais e sidebar com Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(function (m) { m.classList.remove('open'); });
      if (sidebarOpen) closeSidebar();
    }
  });
});

// ===================== CONFIGURAÇÕES =====================
async function loadSettings() {
  try {
    const [shop, plan] = await Promise.all([
      api.get('/admin/shop'),
      api.get('/admin/plan')
    ]);

    // Preenche campos de dados da loja
    if ($id('cfg-name'))  $id('cfg-name').value  = shop.name  || '';
    if ($id('cfg-email')) $id('cfg-email').value  = shop.email || '';
    if ($id('cfg-pass'))  $id('cfg-pass').value   = '';

    // Tokens (exibem apenas placeholder, nunca o valor real por segurança)
    if ($id('cfg-mp-token'))      $id('cfg-mp-token').placeholder      = shop.mpAccessToken   ? '••••••• (configurado)' : 'APP_USR-...';
    if ($id('cfg-zapi-instance')) $id('cfg-zapi-instance').value        = shop.zapiInstance   || '';
    if ($id('cfg-zapi-token'))    $id('cfg-zapi-token').placeholder     = shop.zapiToken      ? '••••••• (configurado)' : 'Token gerado no painel Z-API';

    // Card do plano
    var planEl = $id('cfg-plan-info');
    if (planEl && plan) {
      var planLabel   = { trial: '🎁 Trial', basic: '⭐ Basic', pro: '🚀 Pro' }[plan.plan] || plan.plan;
      var statusColor = plan.status === 'active' ? 'var(--green)' : 'var(--red)';
      var expiraInfo  = plan.isTrialActive
        ? 'Trial expira em: <strong>' + new Date(plan.trialEndsAt).toLocaleDateString('pt-BR') + '</strong>'
        : plan.isPlanActive
          ? 'Plano ativo até: <strong>' + new Date(plan.planPaidUntil).toLocaleDateString('pt-BR') + '</strong>'
          : '<span style="color:var(--red)">⚠️ Plano expirado ou inativo</span>';
      planEl.innerHTML =
        '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">' +
        '  <div style="font-size:28px;font-weight:700;color:var(--gold)">' + sanitize(planLabel) + '</div>' +
        '  <div>' +
        '    <div style="font-size:13px;color:var(--text-dim);margin-bottom:4px">Status: <span style="color:' + statusColor + ';font-weight:600">' + sanitize(plan.status.toUpperCase()) + '</span></div>' +
        '    <div style="font-size:13px;color:var(--text-dim)">' + expiraInfo + '</div>' +
        '  </div>' +
        '</div>';
    }
  } catch (e) {
    console.error('loadSettings error:', e);
    showToast('❌ Não foi possível carregar as configurações');
  }
}

async function saveSettings() {
  var btn = $id('btn-save-settings');
  setButtonLoading(btn, true, '✓ Salvar');
  try {
    var body = {};
    var nameVal  = ($id('cfg-name')  ? $id('cfg-name').value.trim()  : '');
    var emailVal = ($id('cfg-email') ? $id('cfg-email').value.trim() : '');
    var passVal  = ($id('cfg-pass')  ? $id('cfg-pass').value         : '');
    var mpVal    = ($id('cfg-mp-token')      ? $id('cfg-mp-token').value.trim()      : '');
    var zapiInst = ($id('cfg-zapi-instance') ? $id('cfg-zapi-instance').value.trim() : '');
    var zapiTok  = ($id('cfg-zapi-token')    ? $id('cfg-zapi-token').value.trim()    : '');

    if (nameVal)  body.name  = nameVal;
    if (emailVal) body.email = emailVal;
    if (passVal)  body.password = passVal;
    // Só envia tokens se o usuário digitou algo (campos password ficam vazios por padrão)
    if (mpVal)    body.mpAccessToken = mpVal;
    if (zapiInst) body.zapiInstance  = zapiInst;
    if (zapiTok)  body.zapiToken     = zapiTok;

    if (Object.keys(body).length === 0) {
      showToast('⚠️ Nenhuma alteração para salvar');
      return;
    }

    const res = await api.put('/admin/shop', body);
    if (res.error) { showToast('❌ ' + res.error); return; }

    // Atualiza nome no sidebar se foi alterado
    if (res.name) updateSidebarUser(res.name);

    // Limpa campo de senha após salvar
    if ($id('cfg-pass')) $id('cfg-pass').value = '';

    showToast('✅ Configurações salvas com sucesso!');
  } catch (e) {
    console.error('saveSettings error:', e);
    showToast('❌ Erro ao salvar configurações');
  } finally {
    setButtonLoading(btn, false, '✓ Salvar');
  }
}

// ===================== EXPORTAÇÃO CSV =====================
function getCurrentMonth() {
  var now = new Date();
  return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
}

function exportCSV(month) {
  var token = localStorage.getItem('token');
  if (!token) { showToast('⚠️ Você precisa estar logado'); return; }
  var url = API_URL + '/admin/appointments/export';
  if (month) url += '?month=' + encodeURIComponent(month);
  // Cria link temporário para download autenticado via token na URL
  // O midaware do backend já aceita o token pelo header, então
  // usamos fetch + blob para contornar a limitação de auth em links diretos
  showToast('⏳ Gerando planilha...');
  fetch(url, { headers: { 'Authorization': 'Bearer ' + token } })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.blob();
    })
    .then(function (blob) {
      var filename = month ? ('agendamentos_' + month + '.csv') : 'agendamentos_todos.csv';
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      showToast('✅ Planilha baixada: ' + filename);
    })
    .catch(function (e) {
      console.error('exportCSV error:', e);
      showToast('❌ Erro ao exportar CSV');
    });
}

// ===================== ONBOARDING WIZARD =====================
var _obCurrentStep = 1;

/**
 * Dispara o onboarding se for o primeiro acesso (sem serviços reais cadastrados).
 * Chamado após doRegister() com sucesso.
 */
function maybeShowOnboarding(data) {
  // Só mostra se o barbeiro ainda não tem serviços reais (ou tem apenas os de exemplo do seed)
  var hasRealServices = data.services && data.services.some(function(s) { return s.id && s.id.length > 5; });
  if (!hasRealServices || (data.appointments && data.appointments.length === 0)) {
    // Pré-preenche o nome da barbearia
    if ($id('ob-name')) $id('ob-name').value = data.shopName || '';
    _obCurrentStep = 1;
    obGoToStep(1);
    $id('modal-onboarding').classList.add('open');
  }
}

function obGoToStep(n) {
  // Esconde todos os steps
  [1,2,3,4].forEach(function (i) {
    var el = $id('ob-step-' + i);
    if (el) el.style.display = (i === n) ? '' : 'none';
    var dot = $id('ob-dot-' + i);
    if (dot) dot.classList.toggle('active', i <= n);
  });
  // Atualiza barra de progresso
  var prog = $id('ob-progress');
  if (prog) prog.style.width = (n * 25) + '%';
  _obCurrentStep = n;

  // Se chegou na tela final, monta o link
  if (n === 4) {
    var sid = state.shopSlug || shopId;
    if (sid) {
      var link = window.location.origin + window.location.pathname + '?shop=' + sid;
      if ($id('ob-link-box')) $id('ob-link-box').textContent = link;
      // Atualiza shopId global para que o sidebar use o link correto
      shopId = sid;
    }
  }
}

async function obNext(targetStep) {
  // Valida e salva o step atual antes de avançar
  if (_obCurrentStep === 1) {
    var name = $id('ob-name') ? $id('ob-name').value.trim() : '';
    if (!name) { showToast('⚠️ Informe o nome da barbearia'); return; }
    try {
      await api.put('/admin/shop', { name });
      updateSidebarUser(name);
    } catch(e) { /* não bloquear se der erro */ }
  }

  if (_obCurrentStep === 2) {
    var svcName  = $id('ob-svc-name')  ? $id('ob-svc-name').value.trim()     : '';
    var svcPrice = $id('ob-svc-price') ? parseFloat($id('ob-svc-price').value) : 0;
    var svcDur   = $id('ob-svc-dur')   ? parseInt($id('ob-svc-dur').value)    : 30;
    if (svcName && svcPrice > 0) {
      try {
        const res = await api.post('/admin/services', { name: svcName, price: svcPrice, duration: svcDur || 30, desc: '' });
        if (res && res.id) state.services.push(res);
      } catch(e) { /* não bloquear */ }
    }
    // Permite pular sem preencher se for para step anterior
    if (targetStep > _obCurrentStep && !svcName) {
      showToast('⚠️ Informe pelo menos o nome e preço do serviço');
      return;
    }
  }

  if (_obCurrentStep === 3) {
    var barberName = $id('ob-barber-name') ? $id('ob-barber-name').value.trim() : '';
    var barberRole = $id('ob-barber-role') ? $id('ob-barber-role').value.trim() : 'Barbeiro';
    if (barberName) {
      try {
        const res = await api.post('/admin/barbers', { name: barberName, role: barberRole || 'Barbeiro', emoji: '✂️' });
        if (res && res.id) state.barbers.push(res);
      } catch(e) { /* não bloquear */ }
    }
    if (targetStep > _obCurrentStep && !barberName) {
      showToast('⚠️ Informe o nome do barbeiro');
      return;
    }
  }

  obGoToStep(targetStep);
}

function obCopyLink() {
  var el = $id('ob-link-box');
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(function() {
    showToast('📋 Link copiado!');
  }).catch(function() {
    showToast('📋 Selecione e copie o link manualmente');
  });
}

function obFinish() {
  $id('modal-onboarding').classList.remove('open');
  // Atualiza o link no sidebar com o shopId correto
  updateSidebarUser(state.shopName);
  renderAdmin();
  showToast('🚀 Barbearia configurada! Bem-vindo ao BarberPro!');
}

// ===================== CLIENT PANEL =====================
let clientPhone = '';
let clientAppointments = [];

async function doClientLogin() {
  const phoneInput = $id('client-login-phone').value.trim();
  if (!phoneInput) {
    showToast('⚠️ Por favor, informe seu WhatsApp.');
    return;
  }
  
  const btn = document.querySelector('#client-login .btn-full');
  setButtonLoading(btn, true, 'Verificando...');
  
  try {
    let url = '/public/client/appointments/' + encodeURIComponent(phoneInput);
    if (shopId && shopId !== 'null') {
      url += '?shopId=' + shopId;
    }
    const res = await api.get(url, false);
    if (res && res.error) {
      showToast('❌ ' + res.error);
    } else {
      clientPhone = phoneInput;
      clientAppointments = res || [];
      renderClientDashboard();
      goTo('client-panel');
    }
  } catch(e) {
    showToast('❌ Erro ao buscar agendamentos.');
  } finally {
    setButtonLoading(btn, false, 'Entrar');
  }
}

function renderClientDashboard() {
  const listEl = $id('client-appointments-list');
  if (!listEl) return;
  
  if (clientAppointments.length === 0) {
    listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><p>Você ainda não tem agendamentos nesta barbearia.</p></div>';
    return;
  }

  listEl.innerHTML = clientAppointments.map(a => {
    const isCancelled = a.status === 'cancelled';
    const numPrice = parseFloat(a.price) || 0;
    let badgeColor = '';
    let badgeText = '';
    
    if (isCancelled) {
      badgeColor = 'var(--red)'; badgeText = 'CANCELADO';
    } else if (a.status === 'completed') {
      badgeColor = 'var(--text-dim)'; badgeText = 'CONCLUÍDO';
    } else {
      badgeColor = 'var(--gold)'; badgeText = 'AGENDADO';
    }

    const cancelHtml = (!isCancelled && a.status !== 'completed') 
      ? '<button class="btn-sm btn-sm-ghost" style="color:var(--red);border-color:var(--red);margin-top:10px" onclick="cancelClientAppointment(\'' + a.id + '\')">Cancelar Agendamento</button>'
      : '';

    const shopLabel = (!shopId && a.shop) 
      ? '<div style="color:var(--text-dim);font-size:12px;margin-bottom:4px">🏪 ' + sanitize(a.shop.name) + '</div>' 
      : '';

    return '<div class="appt-item" style="border-left: 4px solid ' + badgeColor + '; padding: 14px; background: var(--bg-elevated); margin-bottom: 12px; border-radius: 12px;">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:8px">' +
        '<span style="font-size:13px;font-weight:600;color:' + badgeColor + '">' + badgeText + '</span>' +
        '<strong style="font-size:15px">' + sanitize(a.date) + ' às ' + sanitize(a.time) + '</strong>' +
      '</div>' +
      shopLabel +
      '<div style="color:var(--white-dim);margin-bottom:4px">✂️ ' + sanitize(a.serviceNames) + '</div>' +
      '<div style="color:var(--text-dim);font-size:13px;margin-bottom:8px">👨 ' + sanitize(a.barberName) + ' · 💳 ' + sanitize(a.paymentMethod) + ' (R$' + numPrice.toFixed(2).replace('.', ',') + ')</div>' +
      cancelHtml +
    '</div>';
  }).join('');
}

function logoutClient() {
  clientPhone = '';
  clientAppointments = [];
  $id('client-login-phone').value = '';
  goTo('landing');
}

async function cancelClientAppointment(apptId) {
  if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
  
  try {
    const res = await api.post('/public/client/cancel', {
      phone: clientPhone,
      appointmentId: apptId
    }, false);
    
    if (res.error) {
      showToast('❌ ' + res.error);
    } else {
      showToast('✅ Agendamento cancelado com sucesso!');
      // Atualiza a lista localmente
      clientAppointments = clientAppointments.map(a => a.id === apptId ? { ...a, status: 'cancelled' } : a);
      renderClientDashboard();
    }
  } catch(e) {
    showToast('❌ Erro ao tentar cancelar.');
  }
}
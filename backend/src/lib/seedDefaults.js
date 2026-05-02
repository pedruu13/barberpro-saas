/**
 * Retorna os dados padrão para uma nova barbearia.
 * Inclui serviços iniciais, barbeiros de exemplo e horários de funcionamento.
 */
function getDefaultShopData() {
  return {
    services: {
      create: [
        { name: 'Corte Degradê', price: 45, duration: 40, desc: 'Corte moderno com acabamento impecável' },
        { name: 'Barboterapia', price: 35, duration: 30, desc: 'Barba feita com toalha quente e massagem' },
        { name: 'Combo: Corte + Barba', price: 75, duration: 70, desc: 'O pacote completo para o seu visual' },
        { name: 'Sobrancelha', price: 15, duration: 15, desc: 'Alinhamento preciso na navalha' }
      ]
    },
    barbers: {
      create: [
        { name: 'Barbeiro Exemplo', role: 'Cortes e Barba', emoji: '💈', commissionPct: 50 }
      ]
    },
    hours: {
      create: [
        { day: 'Segunda', open: true, start: '08:00', end: '20:00' },
        { day: 'Terça',   open: true, start: '08:00', end: '20:00' },
        { day: 'Quarta',  open: true, start: '08:00', end: '20:00' },
        { day: 'Quinta',  open: true, start: '08:00', end: '20:00' },
        { day: 'Sexta',   open: true, start: '08:00', end: '20:00' },
        { day: 'Sábado',  open: true, start: '08:00', end: '18:00' },
        { day: 'Domingo', open: false, start: '09:00', end: '13:00' }
      ]
    }
  };
}

module.exports = { getDefaultShopData };

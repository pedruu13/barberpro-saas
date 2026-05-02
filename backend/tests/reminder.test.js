const { processReminders } = require('../src/jobs/scheduler');
const prisma = require('../src/lib/prisma');
const notificationService = require('../src/services/notificationService');
const { format, addMinutes, addHours } = require('date-fns');

jest.mock('../src/lib/prisma', () => ({
  appointment: {
    findMany: jest.fn(),
    update: jest.fn()
  }
}));

jest.mock('../src/services/notificationService', () => ({
  sendWhatsAppMessage: jest.fn()
}));

describe('scheduler - processReminders', () => {
  let now;

  beforeEach(() => {
    now = new Date();
    jest.clearAllMocks();
  });

  it('should send reminder for appointment in 1 hour', async () => {
    const apptTime = addMinutes(now, 60);
    const mockAppt = {
      id: 'appt-1',
      clientName: 'João',
      clientPhone: '5511999990000',
      date: format(apptTime, 'yyyy-MM-dd'),
      time: format(apptTime, 'HH:mm'),
      serviceNames: 'Corte',
      shop: { name: 'Barbearia do João' }
    };

    prisma.appointment.findMany.mockResolvedValue([mockAppt]);
    notificationService.sendWhatsAppMessage.mockResolvedValue(true);

    const result = await processReminders();

    expect(notificationService.sendWhatsAppMessage).toHaveBeenCalled();
    expect(prisma.appointment.update).toHaveBeenCalledWith({
      where: { id: 'appt-1' },
      data: { reminded: true }
    });
    expect(result.sent).toBe(1);
  });

  it('should NOT send reminder for appointment in 3 hours (out of horizon)', async () => {
    const apptTime = addHours(now, 3);
    const mockAppt = {
      id: 'appt-2',
      clientName: 'Maria',
      clientPhone: '5511999990000',
      date: format(apptTime, 'yyyy-MM-dd'),
      time: format(apptTime, 'HH:mm'),
      serviceNames: 'Barba',
      shop: { name: 'Barbearia da Maria' }
    };

    prisma.appointment.findMany.mockResolvedValue([mockAppt]);

    const result = await processReminders();

    expect(notificationService.sendWhatsAppMessage).not.toHaveBeenCalled();
    expect(result.sent).toBe(0);
  });

  it('should NOT send reminder for past appointment', async () => {
    const apptTime = addMinutes(now, -30);
    const mockAppt = {
      id: 'appt-3',
      clientName: 'Pedro',
      clientPhone: '5511999990000',
      date: format(apptTime, 'yyyy-MM-dd'),
      time: format(apptTime, 'HH:mm'),
      serviceNames: 'Cabelo',
      shop: { name: 'Barbearia do Pedro' }
    };

    prisma.appointment.findMany.mockResolvedValue([mockAppt]);

    const result = await processReminders();

    expect(notificationService.sendWhatsAppMessage).not.toHaveBeenCalled();
    expect(result.sent).toBe(0);
  });
});

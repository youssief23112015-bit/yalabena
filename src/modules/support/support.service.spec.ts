import { NotFoundException } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportTicketStatus } from '../../common/enums/support-ticket-status.enum';

describe('SupportService', () => {
  let service: SupportService;
  let ticketRepo: any;
  let replyRepo: any;
  let userRepo: any;
  let notificationService: any;

  const ticketId = 'ticket-1';
  const adminUserId = 'admin-1';
  const dto = { body: 'Thank you for reaching out.' };

  const ticket = {
    id: ticketId,
    user_id: 'student-1',
    status: SupportTicketStatus.OPEN,
    subject: 'Login issue',
    admin_reply: null,
    replied_by: null,
    replied_at: null,
    replies: [],
  };
  const user = { id: adminUserId, first_name: 'Jane', last_name: 'Doe' };

  beforeEach(() => {
    jest.clearAllMocks();
    ticketRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (x: any) => x),
      update: jest.fn(async () => ({ affected: 1 })),
    };
    replyRepo = {
      create: jest.fn((x: any) => x),
      save: jest.fn(async (x: any) => ({ id: 'reply-1', ...x })),
    };
    userRepo = { findOne: jest.fn() };
    notificationService = {
      notify: jest.fn(async (x: any) => x),
    };
    service = new SupportService(
      ticketRepo,
      replyRepo,
      userRepo,
      notificationService,
    );
  });

  describe('replyTicket', () => {
    it('creates a reply explicitly linked to its parent ticket and updates the ticket without cascading', async () => {
      ticketRepo.findOne.mockResolvedValue(ticket);
      userRepo.findOne.mockResolvedValue(user);

      await service.replyTicket(ticketId, dto, adminUserId);

      expect(ticketRepo.findOne).toHaveBeenCalledWith({
        where: { id: ticketId },
        relations: ['replies'],
      });
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: adminUserId },
      });

      const createArg = replyRepo.create.mock.calls[0][0];
      // The reply must carry the explicit NOT NULL foreign key. No parent
      // relation object should be required for the insert to succeed.
      expect(createArg.ticket_id).toBe(ticketId);
      expect(createArg.ticket).toBeUndefined();
      expect(createArg.body).toBe(dto.body);
      expect(createArg.created_by).toBe(adminUserId);

      // Reply is persisted explicitly first.
      expect(replyRepo.save).toHaveBeenCalled();

      // Ticket is updated via a direct UPDATE (no entity cascade), not save().
      expect(ticketRepo.update).toHaveBeenCalledWith(ticketId, {
        admin_reply: dto.body,
        replied_by: adminUserId,
        replied_at: expect.any(Date),
        status: SupportTicketStatus.IN_PROGRESS,
      });
      expect(ticketRepo.save).not.toHaveBeenCalled();

      // Notification is sent to the ticket creator.
      expect(notificationService.notify).toHaveBeenCalledWith(ticket.user_id, {
        type: 'support_reply',
        title: 'New reply on your support ticket',
        body: `An admin replied to your issue: ${ticket.subject}`,
        action_url: '/support',
        data: { ticket_id: ticket.id },
      });
    });

    it('does not send a notification when the ticket has no user_id', async () => {
      ticketRepo.findOne.mockResolvedValue({ ...ticket, user_id: null });
      userRepo.findOne.mockResolvedValue(user);

      await service.replyTicket(ticketId, dto, adminUserId);

      expect(replyRepo.save).toHaveBeenCalled();
      expect(ticketRepo.update).toHaveBeenCalled();
      expect(notificationService.notify).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the ticket does not exist', async () => {
      ticketRepo.findOne.mockResolvedValue(null);

      await expect(
        service.replyTicket(ticketId, dto, adminUserId),
      ).rejects.toThrow(NotFoundException);
      expect(replyRepo.create).not.toHaveBeenCalled();
      expect(replyRepo.save).not.toHaveBeenCalled();
      expect(ticketRepo.update).not.toHaveBeenCalled();
    });
  });
});

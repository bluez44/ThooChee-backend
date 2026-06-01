import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../prisma/prisma.service';

const mockTxRow = {
  id: 'tx-1',
  title: 'Lunch',
  amount: 50000,
  type: 'expense' as const,
  category: 'Food',
  date: '2026-06-01',
  notes: null,
  userId: 'default-user',
  createdAt: new Date('2026-06-01'),
  updatedAt: new Date('2026-06-01'),
};

const p2025 = () => Object.assign(new Error('Record not found'), { code: 'P2025' });

describe('TransactionsService', () => {
  let service: TransactionsService;
  let db: {
    findMany: jest.Mock;
    count: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    db = {
      findMany:   jest.fn().mockResolvedValue([]),
      count:      jest.fn().mockResolvedValue(0),
      findUnique: jest.fn(),
      create:     jest.fn(),
      update:     jest.fn(),
      delete:     jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: { transaction: db } },
      ],
    }).compile();

    service = module.get(TransactionsService);
  });

  // ─── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('defaults to page 1 and pageSize 20', async () => {
      await service.findAll({});
      expect(db.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 20 }));
    });

    it('computes the correct skip for page 2', async () => {
      await service.findAll({ page: 2, pageSize: 10 });
      expect(db.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10 }));
    });

    it('caps pageSize at 100', async () => {
      await service.findAll({ pageSize: 999 });
      expect(db.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
    });

    it('applies a case-insensitive title search', async () => {
      await service.findAll({ search: 'lunch' });
      expect(db.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { title: { contains: 'lunch', mode: 'insensitive' } } }),
      );
    });

    it('filters by transaction type', async () => {
      await service.findAll({ type: 'expense' });
      expect(db.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { type: 'expense' } }),
      );
    });

    it('filters by category', async () => {
      await service.findAll({ category: 'Food' });
      expect(db.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { category: 'Food' } }),
      );
    });

    it('applies a date range filter', async () => {
      await service.findAll({ startDate: '2026-06-01', endDate: '2026-06-30' });
      expect(db.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { date: { gte: '2026-06-01', lte: '2026-06-30' } } }),
      );
    });

    it('applies only startDate when endDate is omitted', async () => {
      await service.findAll({ startDate: '2026-06-01' });
      expect(db.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { date: { gte: '2026-06-01' } } }),
      );
    });

    it('returns the correct response envelope', async () => {
      db.findMany.mockResolvedValue([mockTxRow]);
      db.count.mockResolvedValue(1);

      const result = await service.findAll({});
      expect(result).toEqual({ transactions: [mockTxRow], totalCount: 1, page: 1, pageSize: 20, totalPages: 1 });
    });

    it('returns totalPages of at least 1 when there are no results', async () => {
      const result = await service.findAll({});
      expect(result.totalPages).toBe(1);
    });

    it('sorts by createdAt descending', async () => {
      await service.findAll({});
      expect(db.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
      );
    });
  });

  // ─── findOne ────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the transaction when it exists', async () => {
      db.findUnique.mockResolvedValue(mockTxRow);
      await expect(service.findOne('tx-1')).resolves.toEqual(mockTxRow);
    });

    it('throws NotFoundException when the record does not exist', async () => {
      db.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = { title: 'Lunch', amount: 50000, type: 'expense' as const, category: 'Food', date: '2026-06-01' };

    beforeEach(() => db.create.mockResolvedValue(mockTxRow));

    it('sets userId to "default-user"', async () => {
      await service.create(dto);
      expect(db.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'default-user' }) }),
      );
    });

    it('defaults notes to null when not provided', async () => {
      await service.create(dto);
      expect(db.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ notes: null }) }),
      );
    });

    it('preserves notes when explicitly provided', async () => {
      await service.create({ ...dto, notes: 'card payment' });
      expect(db.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ notes: 'card payment' }) }),
      );
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('returns the updated transaction', async () => {
      const updated = { ...mockTxRow, title: 'Dinner' };
      db.update.mockResolvedValue(updated);
      await expect(service.update('tx-1', { title: 'Dinner' })).resolves.toEqual(updated);
    });

    it('throws NotFoundException on Prisma P2025 error', async () => {
      db.update.mockRejectedValue(p2025());
      await expect(service.update('missing', { title: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('re-throws non-P2025 errors unchanged', async () => {
      db.update.mockRejectedValue(new Error('Connection lost'));
      await expect(service.update('tx-1', {})).rejects.toThrow('Connection lost');
    });
  });

  // ─── remove ─────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('returns { success: true } after deletion', async () => {
      db.delete.mockResolvedValue(mockTxRow);
      await expect(service.remove('tx-1')).resolves.toEqual({ success: true });
    });

    it('throws NotFoundException on Prisma P2025 error', async () => {
      db.delete.mockRejectedValue(p2025());
      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });

    it('re-throws non-P2025 errors unchanged', async () => {
      db.delete.mockRejectedValue(new Error('Disk full'));
      await expect(service.remove('tx-1')).rejects.toThrow('Disk full');
    });
  });
});

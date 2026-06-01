import { Test } from '@nestjs/testing';
import { BudgetService } from './budget.service';
import { PrismaService } from '../prisma/prisma.service';

const mockBudget = {
  id: 'budget-id',
  userId: 'default-user',
  monthlyLimit: 5_000_000,
  currency: 'VND',
  updatedAt: new Date('2026-06-01'),
};

describe('BudgetService', () => {
  let service: BudgetService;
  let db: { upsert: jest.Mock; deleteMany: jest.Mock };

  beforeEach(async () => {
    db = {
      upsert:     jest.fn().mockResolvedValue(mockBudget),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    };

    const module = await Test.createTestingModule({
      providers: [
        BudgetService,
        { provide: PrismaService, useValue: { budget: db } },
      ],
    }).compile();

    service = module.get(BudgetService);
  });

  describe('findOne', () => {
    it('calls upsert with the default create values and an empty update clause', async () => {
      const result = await service.findOne();

      expect(db.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where:  { userId: 'default-user' },
          create: expect.objectContaining({ userId: 'default-user', monthlyLimit: 5_000_000, currency: 'VND' }),
          update: {},
        }),
      );
      expect(result).toEqual(mockBudget);
    });
  });

  describe('update', () => {
    it('upserts the new monthlyLimit in both create and update', async () => {
      const updated = { ...mockBudget, monthlyLimit: 10_000_000 };
      db.upsert.mockResolvedValue(updated);

      const result = await service.update({ monthlyLimit: 10_000_000 });

      expect(db.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where:  { userId: 'default-user' },
          create: expect.objectContaining({ monthlyLimit: 10_000_000 }),
          update: { monthlyLimit: 10_000_000 },
        }),
      );
      expect(result.monthlyLimit).toBe(10_000_000);
    });
  });

  describe('reset', () => {
    it('deletes the current record before re-initialising', async () => {
      await service.reset();
      expect(db.deleteMany).toHaveBeenCalledWith({ where: { userId: 'default-user' } });
    });

    it('calls findOne (upsert with empty update) after deletion', async () => {
      await service.reset();
      expect(db.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: {} }));
    });

    it('returns the re-initialised budget', async () => {
      const result = await service.reset();
      expect(result).toEqual(mockBudget);
    });
  });
});

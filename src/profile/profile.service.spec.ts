import { Test } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import { PrismaService } from '../prisma/prisma.service';

const mockProfile = {
  id: 'default-user',
  email: 'user@example.com',
  name: 'Default User',
  notificationsEnabled: true,
  biometricsEnabled: false,
  localSyncEnabled: true,
  createdAt: new Date('2026-06-01'),
};

describe('ProfileService', () => {
  let service: ProfileService;
  let db: { upsert: jest.Mock; deleteMany: jest.Mock };

  beforeEach(async () => {
    db = {
      upsert:     jest.fn().mockResolvedValue(mockProfile),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    };

    const module = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: PrismaService, useValue: { userProfile: db } },
      ],
    }).compile();

    service = module.get(ProfileService);
  });

  describe('findOne', () => {
    it('calls upsert with the default create values and an empty update clause', async () => {
      const result = await service.findOne();

      expect(db.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where:  { id: 'default-user' },
          create: expect.objectContaining({
            id: 'default-user',
            email: 'user@example.com',
            name: 'Default User',
          }),
          update: {},
        }),
      );
      expect(result).toEqual(mockProfile);
    });
  });

  describe('update', () => {
    it('passes the DTO directly as the update clause', async () => {
      const dto = { name: 'Tom' };
      await service.update(dto);

      const call = db.upsert.mock.calls[0][0];
      expect(call.update).toEqual(dto);
    });

    it('merges the DTO into the create clause so a first-time write also uses the new values', async () => {
      const dto = { name: 'Tom', notificationsEnabled: false };
      await service.update(dto);

      const call = db.upsert.mock.calls[0][0];
      expect(call.create).toMatchObject({ name: 'Tom', notificationsEnabled: false });
    });

    it('returns the updated profile', async () => {
      const updated = { ...mockProfile, name: 'Tom' };
      db.upsert.mockResolvedValue(updated);

      const result = await service.update({ name: 'Tom' });
      expect(result.name).toBe('Tom');
    });

    it('only sends the provided fields in the update clause', async () => {
      await service.update({ biometricsEnabled: true });
      const call = db.upsert.mock.calls[0][0];
      expect(call.update).toEqual({ biometricsEnabled: true });
    });
  });

  describe('reset', () => {
    it('deletes the current record before re-initialising', async () => {
      await service.reset();
      expect(db.deleteMany).toHaveBeenCalledWith({ where: { id: 'default-user' } });
    });

    it('calls findOne (upsert with empty update) after deletion', async () => {
      await service.reset();
      expect(db.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: {} }));
    });

    it('returns the re-initialised profile', async () => {
      const result = await service.reset();
      expect(result).toEqual(mockProfile);
    });
  });
});

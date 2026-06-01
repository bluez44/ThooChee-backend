import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

const DEFAULT_USER_ID = 'default-user';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne() {
    const profile = await this.prisma.userProfile.findUnique({ where: { id: DEFAULT_USER_ID } });
    if (!profile) {
      return {
        id: DEFAULT_USER_ID,
        email: 'user@example.com',
        name: 'Default User',
        notificationsEnabled: true,
        biometricsEnabled: false,
        localSyncEnabled: true,
        createdAt: new Date(),
      };
    }
    return profile;
  }

  async update(dto: UpdateUserProfileDto) {
    return this.prisma.userProfile.upsert({
      where: { id: DEFAULT_USER_ID },
      create: {
        id: DEFAULT_USER_ID,
        email: 'user@example.com',
        name: dto.name ?? 'Default User',
        notificationsEnabled: dto.notificationsEnabled ?? true,
        biometricsEnabled: dto.biometricsEnabled ?? false,
        localSyncEnabled: dto.localSyncEnabled ?? true,
      },
      update: dto,
    });
  }
}

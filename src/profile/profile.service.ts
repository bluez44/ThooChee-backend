import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

const DEFAULT_USER_ID = 'default-user';
const DEFAULTS = {
  id: DEFAULT_USER_ID,
  email: 'user@example.com',
  name: 'Default User',
  notificationsEnabled: true,
  biometricsEnabled: false,
  localSyncEnabled: true,
};

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  findOne() {
    // Creates the record with defaults on first access, returns existing on subsequent calls
    return this.prisma.userProfile.upsert({
      where: { id: DEFAULT_USER_ID },
      create: DEFAULTS,
      update: {},
    });
  }

  update(dto: UpdateUserProfileDto) {
    return this.prisma.userProfile.upsert({
      where: { id: DEFAULT_USER_ID },
      create: { ...DEFAULTS, ...dto },
      update: dto,
    });
  }

  async reset() {
    await this.prisma.userProfile.deleteMany({ where: { id: DEFAULT_USER_ID } });
    return this.findOne();
  }
}

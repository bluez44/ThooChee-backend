import { Injectable } from '@nestjs/common';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  notificationsEnabled: boolean;
  biometricsEnabled: boolean;
  localSyncEnabled: boolean;
  createdAt: string;
}

@Injectable()
export class ProfileService {
  private profile: UserProfile = {
    id: 'default-user',
    email: 'user@example.com',
    name: 'Default User',
    notificationsEnabled: true,
    biometricsEnabled: false,
    localSyncEnabled: true,
    createdAt: new Date().toISOString(),
  };

  findOne(): UserProfile {
    return this.profile;
  }

  update(dto: UpdateUserProfileDto): UserProfile {
    this.profile = { ...this.profile, ...dto };
    return this.profile;
  }
}

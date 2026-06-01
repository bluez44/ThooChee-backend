import { Controller, Get, Put, Body } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  findOne() {
    return this.profileService.findOne();
  }

  @Put()
  update(@Body() dto: UpdateUserProfileDto) {
    return this.profileService.update(dto);
  }
}

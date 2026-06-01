import { Controller, Get, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@ApiTags('profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get the user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile and preferences.' })
  findOne() {
    return this.profileService.findOne();
  }

  @Put()
  @ApiOperation({ summary: 'Update user profile preferences' })
  @ApiResponse({ status: 200, description: 'Updated user profile.' })
  update(@Body() dto: UpdateUserProfileDto) {
    return this.profileService.update(dto);
  }
}

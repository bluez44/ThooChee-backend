import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VoiceService } from './voice.service';
import { VoiceParseRequestDto } from './dto/voice-parse-request.dto';

@ApiTags('voice')
@Controller('voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Post('parse')
  @ApiOperation({
    summary: 'Parse a voice transcript',
    description: 'Extracts transaction fields (amount, type, category, date, title) from free-text voice input.',
  })
  @ApiResponse({ status: 201, description: 'Parse result with confidence score and suggested categories.' })
  parse(@Body() dto: VoiceParseRequestDto) {
    return this.voiceService.parse(dto);
  }
}

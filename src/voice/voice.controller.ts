import { Controller, Post, Body } from '@nestjs/common';
import { VoiceService } from './voice.service';
import { VoiceParseRequestDto } from './dto/voice-parse-request.dto';

@Controller('voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Post('parse')
  parse(@Body() dto: VoiceParseRequestDto) {
    return this.voiceService.parse(dto);
  }
}

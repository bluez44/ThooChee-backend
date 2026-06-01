import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VoiceParseRequestDto {
  @ApiProperty({ example: 'I spent 50000 on lunch yesterday' })
  text: string;

  @ApiPropertyOptional({
    example: -420,
    description: 'Browser timezone offset in minutes (from Date.getTimezoneOffset()). UTC+7 = -420.',
  })
  timezoneOffset?: number;
}

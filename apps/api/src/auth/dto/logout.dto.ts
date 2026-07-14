import { ApiProperty } from '@nestjs/swagger';
import { IsJWT } from 'class-validator';

export class LogoutDto {
  @ApiProperty({
    description: 'Refresh token for the session being terminated',
  })
  @IsJWT()
  refreshToken!: string;
}

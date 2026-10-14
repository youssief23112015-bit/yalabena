import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TwoFactorCodeDto, TwoFactorLoginDto } from './dto/two-factor.dto';
import { ResetPasswordDto, ResetPasswordRequestDto } from './dto/password-reset.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  // ─── Two-factor authentication (SRS 7.2) ─────────────────────

  @Public()
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete a 2FA-gated login with a TOTP code' })
  @ApiResponse({ status: 200, description: 'Tokens issued.' })
  @ApiResponse({ status: 401, description: 'Invalid temp token or code.' })
  verify2fa(@Body() dto: TwoFactorLoginDto) {
    return this.authService.verify2fa(dto);
  }

  @Post('2fa/setup')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a pending TOTP secret + QR code' })
  @ApiResponse({ status: 200, description: 'Returns secret, otpauth URL and QR data URL.' })
  setup2fa(@CurrentUser() user: { userId: string }) {
    return this.authService.setup2fa(user.userId);
  }

  @Post('2fa/enable')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable 2FA after confirming a TOTP code' })
  @ApiResponse({ status: 200, description: '2FA enabled.' })
  enable2fa(@CurrentUser() user: { userId: string }, @Body() dto: TwoFactorCodeDto) {
    return this.authService.enable2fa(user.userId, dto.code);
  }

  @Post('2fa/disable')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable 2FA after verifying a TOTP code' })
  @ApiResponse({ status: 200, description: '2FA disabled.' })
  disable2fa(@CurrentUser() user: { userId: string }, @Body() dto: TwoFactorCodeDto) {
    return this.authService.disable2fa(user.userId, dto.code);
  }

  @Post('forgot-password')
  @Public()
  @ApiOperation({ summary: 'Request a password reset link' })
  @ApiResponse({ status: 200, description: 'Reset link sent to email' })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  forgotPassword(@Body() dto: ResetPasswordRequestDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  @Public()
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }
}

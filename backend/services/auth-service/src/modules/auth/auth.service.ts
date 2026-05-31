import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../users/user.entity';
import { OtpEntity } from './entities/otp.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { WalletEntity } from '../wallets/wallet.entity';
import {
  SendOtpDto,
  VerifyOtpDto,
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  AuthResponseDto,
  TokenPayloadDto,
} from '@ride/shared';
import { generateOTP, generateReferralCode, sanitizePhone } from '@ride/shared';
import { v4 as uuidv4 } from 'uuid';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly REFRESH_TOKEN_EXPIRY_DAYS = 30;
  private readonly MAX_OTP_ATTEMPTS = 5;

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(OtpEntity)
    private otpRepository: Repository<OtpEntity>,
    @InjectRepository(RefreshTokenEntity)
    private refreshTokenRepository: Repository<RefreshTokenEntity>,
    @InjectRepository(WalletEntity)
    private walletRepository: Repository<WalletEntity>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async getDevOtp(phone: string): Promise<string | null> {
    const sanitized = sanitizePhone(phone);
    const record = await this.otpRepository.findOne({
      where: { phone: sanitized, isUsed: false },
      order: { createdAt: 'DESC' },
    });
    return record?.otp || null;
  }

  async sendOtp(dto: SendOtpDto): Promise<{ success: boolean; message: string }> {
    const phone = sanitizePhone(dto.phone);
    await this.otpRepository.update(
      { phone, isUsed: false },
      { isUsed: true },
    );

    const otp = generateOTP(6);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    await this.otpRepository.save({
      phone,
      otp,
      expiresAt,
      purpose: 'login',
    });

    this.logger.log(`OTP sent to ${phone}: ${otp}`);

    return {
      success: true,
      message: 'OTP sent successfully',
    };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<AuthResponseDto> {
    const phone = sanitizePhone(dto.phone);
    const otpRecord = await this.otpRepository.findOne({
      where: { phone, otp: dto.otp, isUsed: false },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord) {
      throw new BadRequestException({
        success: false,
        error: { code: 'AUTH_006', message: 'Invalid OTP' },
      });
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new BadRequestException({
        success: false,
        error: { code: 'AUTH_007', message: 'OTP has expired' },
      });
    }

    otpRecord.isUsed = true;
    otpRecord.verifiedAt = new Date();
    await this.otpRepository.save(otpRecord);

    let user = await this.userRepository.findOne({ where: { phone } });
    if (user) {
      user.isPhoneVerified = true;
      user.lastLoginAt = new Date();
      await this.userRepository.save(user);
    }

    const tokens = await this.generateTokens(user!);
    return {
      user: this.sanitizeUser(user!),
      tokens,
    };
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const phone = sanitizePhone(dto.phone);
    const existingUser = await this.userRepository.findOne({ where: { phone } });

    if (existingUser) {
      throw new ConflictException({
        success: false,
        error: { code: 'USR_003', message: 'Phone number already registered' },
      });
    }

    if (dto.email) {
      const emailUser = await this.userRepository.findOne({ where: { email: dto.email } });
      if (emailUser) {
        throw new ConflictException({
          success: false,
          error: { code: 'USR_004', message: 'Email already registered' },
        });
      }
    }

    let referredByUser: UserEntity | null = null;
    if (dto.referralCode) {
      referredByUser = await this.userRepository.findOne({
        where: { referralCode: dto.referralCode },
      });
    }

    const hashedPassword = dto.password
      ? await bcrypt.hash(dto.password, 12)
      : null;

    const user = await this.userRepository.save({
      phone,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      passwordHash: hashedPassword,
      isPhoneVerified: true,
      referralCode: generateReferralCode(),
      referredBy: referredByUser?.id || null,
    } as UserEntity);

    const wallet = this.walletRepository.create({ userId: user.id });
    await this.walletRepository.save(wallet);

    const tokens = await this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const phone = sanitizePhone(dto.phone);
    const user = await this.userRepository.findOne({ where: { phone } });

    if (!user) {
      throw new UnauthorizedException({
        success: false,
        error: { code: 'AUTH_001', message: 'Invalid credentials' },
      });
    }

    if (user.isBlocked) {
      throw new UnauthorizedException({
        success: false,
        error: { code: 'AUTH_009', message: 'Account has been blocked' },
      });
    }

    if (!user.passwordHash) {
      throw new BadRequestException({
        success: false,
        error: { code: 'AUTH_001', message: 'Please use OTP to login' },
      });
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        success: false,
        error: { code: 'AUTH_001', message: 'Invalid credentials' },
      });
    }

    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    const tokens = await this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async refresh(dto: RefreshTokenDto): Promise<TokenPayloadDto> {
    const tokenHash = this.hashToken(dto.refreshToken);
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash, isRevoked: false },
      relations: ['user'],
    });

    if (!storedToken) {
      throw new UnauthorizedException({
        success: false,
        error: { code: 'AUTH_008', message: 'Invalid refresh token' },
      });
    }

    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException({
        success: false,
        error: { code: 'AUTH_008', message: 'Refresh token has expired' },
      });
    }

    storedToken.isRevoked = true;
    storedToken.revokedAt = new Date();
    await this.refreshTokenRepository.save(storedToken);

    return this.generateTokens(storedToken.user);
  }

  async logout(refreshToken: string, deviceId?: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.refreshTokenRepository.update(
      { tokenHash, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() },
    );
  }

  private async generateTokens(user: UserEntity): Promise<TokenPayloadDto> {
    const payload = {
      sub: user.id,
      role: user.role,
      phone: user.phone,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = randomBytes(40).toString('hex');
    const refreshTokenHash = this.hashToken(refreshToken);

    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(
      refreshTokenExpiry.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS,
    );

    await this.refreshTokenRepository.save({
      user: { id: user.id },
      tokenHash: refreshTokenHash,
      expiresAt: refreshTokenExpiry,
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private sanitizeUser(user: UserEntity) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}

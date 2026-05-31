import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { UserEntity } from '../users/user.entity';
import { OtpEntity } from './entities/otp.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { WalletEntity } from '../wallets/wallet.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<UserEntity>;
  let otpRepository: Repository<OtpEntity>;
  let jwtService: JwtService;

  const mockUser = {
    id: 'test-uuid',
    phone: '9876543210',
    firstName: 'Test',
    lastName: 'User',
    role: 'rider',
    isPhoneVerified: true,
    isActive: true,
    isBlocked: false,
    referralCode: 'TEST123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(OtpEntity),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(RefreshTokenEntity),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(WalletEntity),
          useValue: mockRepository,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-access-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                JWT_ACCESS_SECRET: 'test-secret',
                JWT_ACCESS_EXPIRY: '15m',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
    otpRepository = module.get<Repository<OtpEntity>>(getRepositoryToken(OtpEntity));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendOtp', () => {
    it('should send OTP successfully', async () => {
      mockRepository.save.mockResolvedValue({ phone: '9876543210', otp: '123456' });
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.sendOtp({ phone: '+919876543210' });
      expect(result.success).toBe(true);
      expect(result.message).toBe('OTP sent successfully');
    });
  });

  describe('verifyOtp', () => {
    it('should throw error for invalid OTP', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.verifyOtp({ phone: '+919876543210', otp: '000000' }),
      ).rejects.toThrow();
    });

    it('should verify OTP and return tokens for existing user', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce({ phone: '9876543210', otp: '123456', isUsed: false, expiresAt: new Date(Date.now() + 300000) })
        .mockResolvedValueOnce(mockUser);

      mockRepository.save.mockResolvedValue({});
      mockRepository.create.mockReturnValue({});

      const result = await service.verifyOtp({ phone: '+919876543210', otp: '123456' });
      expect(result).toBeDefined();
      expect(result.tokens.tokenType).toBe('Bearer');
    });
  });

  describe('register', () => {
    it('should create new user and return tokens', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.register({
        phone: '+919876543210',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result).toBeDefined();
      expect(result.user.firstName).toBe('Test');
    });

    it('should throw error for existing phone', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.register({ phone: '+919876543210', firstName: 'Test' }),
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should throw error for non-existent user', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({ phone: '+919876543210', password: 'password' }),
      ).rejects.toThrow();
    });

    it('should throw error for user without password', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockUser, passwordHash: null });

      await expect(
        service.login({ phone: '+919876543210', password: 'password' }),
      ).rejects.toThrow();
    });
  });

  describe('refresh', () => {
    it('should throw error for invalid refresh token', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.refresh({ refreshToken: 'invalid-token' }),
      ).rejects.toThrow();
    });
  });
});

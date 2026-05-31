import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { PaymentEntity } from './entities/payment.entity';
import { WalletEntity } from './entities/wallet.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { WithdrawalRequestEntity } from './entities/withdrawal-request.entity';

describe('PaymentService', () => {
  let service: PaymentService;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: getRepositoryToken(PaymentEntity), useValue: mockRepository },
        { provide: getRepositoryToken(WalletEntity), useValue: mockRepository },
        { provide: getRepositoryToken(TransactionEntity), useValue: mockRepository },
        { provide: getRepositoryToken(WithdrawalRequestEntity), useValue: mockRepository },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                RAZORPAY_KEY_ID: 'test-key',
                RAZORPAY_KEY_SECRET: 'test-secret',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getWallet', () => {
    it('should return rider wallet', async () => {
      mockRepository.findOne.mockResolvedValue({
        id: 'wallet-uuid',
        userId: 'user-uuid',
        balance: 500,
        currency: 'INR',
      });

      const result = await service.getRiderWallet('user-uuid');
      expect(result).toBeDefined();
      expect(result.balance).toBe(500);
    });
  });

  describe('getTransactionHistory', () => {
    it('should return paginated transactions', async () => {
      mockRepository.findAndCount.mockResolvedValue([
        [{ id: 'txn-1', amount: 100, type: 'credit' }],
        1,
      ]);

      const result = await service.getTransactionHistory('wallet-uuid', 1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });
});

import { ConfigService } from '@nestjs/config';

export interface ProxyRoute {
  path: string;
  target: string;
}

export function getProxyConfig(configService: ConfigService): ProxyRoute[] {
  return [
    {
      path: 'auth',
      target: configService.get<string>('AUTH_SERVICE_URL', 'http://auth-service:3001'),
    },
    {
      path: 'users',
      target: configService.get<string>('USER_SERVICE_URL', 'http://user-service:3002'),
    },
    {
      path: 'rides',
      target: configService.get<string>('RIDE_SERVICE_URL', 'http://ride-service:3003'),
    },
    {
      path: 'drivers',
      target: configService.get<string>('DRIVER_SERVICE_URL', 'http://driver-service:3004'),
    },
    {
      path: 'payments',
      target: configService.get<string>('PAYMENT_SERVICE_URL', 'http://payment-service:3005'),
    },
    {
      path: 'notifications',
      target: configService.get<string>('NOTIFICATION_SERVICE_URL', 'http://notification-service:3006'),
    },
    {
      path: 'locations',
      target: configService.get<string>('LOCATION_SERVICE_URL', 'http://location-service:3007'),
    },
    {
      path: 'admin',
      target: configService.get<string>('ADMIN_SERVICE_URL', 'http://admin-service:3008'),
    },
  ];
}

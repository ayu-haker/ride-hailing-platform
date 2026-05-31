import { FactoryProvider, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export interface FirebaseMessaging {
  send(message: admin.messaging.TokenMessage): Promise<string>;
  sendMulticast(message: admin.messaging.MulticastMessage, dryRun?: boolean): Promise<admin.messaging.BatchResponse>;
}

function getFirebaseApp(config: ConfigService): FirebaseMessaging {
  const logger = new Logger('FirebaseProvider');

  try {
    const projectId = config.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = config.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = config.get<string>('FIREBASE_PRIVATE_KEY');

    if (projectId && clientEmail && privateKey) {
      const app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      return app.messaging();
    }

    if (admin.apps.length === 0) {
      admin.initializeApp({ projectId: config.get<string>('FIREBASE_PROJECT_ID', 'ride-hailing') });
    }
    return admin.messaging();
  } catch (error: any) {
    logger.warn(`Firebase init failed, using mock: ${error.message}`);
  }

  return {
    async send(message: admin.messaging.TokenMessage) {
      logger.log(`[FCM Mock] Sending to ${message.token}: ${message.notification?.title}`);
      return `mock-msg-${Date.now()}`;
    },
    async sendMulticast(message: admin.messaging.MulticastMessage) {
      logger.log(`[FCM Mock] Sending multicast to ${message.tokens.length} devices`);
      return { successCount: message.tokens.length, failureCount: 0, responses: [] };
    },
  };
}

export const FIREBASE_MESSAGING = 'FIREBASE_MESSAGING';

export const firebaseProvider: FactoryProvider = {
  provide: FIREBASE_MESSAGING,
  inject: [ConfigService],
  useFactory: (config: ConfigService): FirebaseMessaging => getFirebaseApp(config),
};

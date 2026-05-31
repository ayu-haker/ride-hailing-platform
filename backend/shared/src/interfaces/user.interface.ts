export enum UserRole {
  RIDER = 'rider',
  DRIVER = 'driver',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
}

export interface IUser {
  id: string;
  phone: string;
  email?: string;
  firstName: string;
  lastName?: string;
  avatarUrl?: string;
  role: UserRole;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isActive: boolean;
  isBlocked: boolean;
  referralCode?: string;
  referredBy?: string;
  fcmToken?: string;
  preferredLanguage: string;
  darkMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserCreate {
  phone: string;
  firstName: string;
  lastName?: string;
  email?: string;
  password?: string;
  referralCode?: string;
}

export interface IUserUpdate {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  preferredLanguage?: string;
  darkMode?: boolean;
  fcmToken?: string;
}

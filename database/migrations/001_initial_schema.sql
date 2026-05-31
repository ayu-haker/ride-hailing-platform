-- ============================================================
-- RIDE-HAILING PLATFORM - COMPLETE POSTGRESQL SCHEMA
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('rider', 'driver', 'admin', 'superadmin');
CREATE TYPE ride_status AS ENUM (
  'pending', 'searching', 'driver_assigned', 'arrived',
  'in_progress', 'completed', 'cancelled', 'scheduled'
);
CREATE TYPE ride_type AS ENUM ('bike', 'auto', 'cab', 'premium', 'suv');
CREATE TYPE payment_status AS ENUM (
  'pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'
);
CREATE TYPE payment_method AS ENUM (
  'wallet', 'cash', 'card', 'upi', 'razorpay', 'cod'
);
CREATE TYPE transaction_type AS ENUM (
  'credit', 'debit', 'refund', 'bonus', 'referral', 'withdrawal', 'commission'
);
CREATE TYPE transaction_status AS ENUM (
  'pending', 'success', 'failed', 'reversed'
);
CREATE TYPE vehicle_type AS ENUM ('bike', 'auto', 'cab', 'suv', 'premium');
CREATE TYPE vehicle_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE driver_status AS ENUM ('online', 'offline', 'busy', 'blocked');
CREATE TYPE kyc_status AS ENUM ('not_submitted', 'pending', 'verified', 'rejected');
CREATE TYPE kyc_type AS ENUM ('aadhar', 'pan', 'driving_license', 'rc', 'bank_account', 'photo');
CREATE TYPE coupon_type AS ENUM ('percentage', 'fixed', 'free_ride', 'referral');
CREATE TYPE notification_type AS ENUM ('push', 'email', 'sms', 'in_app');
CREATE TYPE notification_channel AS ENUM ('ride_update', 'promotion', 'payment', 'kyc', 'system');

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  email CITEXT UNIQUE,
  password_hash VARCHAR(255),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'rider',
  is_phone_verified BOOLEAN DEFAULT FALSE,
  is_email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_blocked BOOLEAN DEFAULT FALSE,
  referral_code VARCHAR(20) UNIQUE,
  referred_by UUID REFERENCES users(id),
  fcm_token TEXT,
  device_id VARCHAR(255),
  device_type VARCHAR(20),
  app_version VARCHAR(20),
  last_login_at TIMESTAMPTZ,
  last_latitude DECIMAL(10,7),
  last_longitude DECIMAL(10,7),
  preferred_language VARCHAR(10) DEFAULT 'en',
  dark_mode BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_phone ON users(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_referral ON users(referral_code);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created ON users(created_at);

-- ============================================================
-- OTP TABLE
-- ============================================================
CREATE TABLE otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  phone VARCHAR(15) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  purpose VARCHAR(50) NOT NULL DEFAULT 'login',
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otps_phone ON otps(phone, purpose);
CREATE INDEX idx_otps_user ON otps(user_id);

-- ============================================================
-- REFRESH TOKENS TABLE
-- ============================================================
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  token_hash VARCHAR(255) NOT NULL,
  device_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  is_revoked BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- ============================================================
-- DRIVERS TABLE
-- ============================================================
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  phone VARCHAR(15) NOT NULL,
  email CITEXT,
  avatar_url TEXT,
  rating DECIMAL(3,2) DEFAULT 5.00,
  rating_count INTEGER DEFAULT 0,
  total_rides INTEGER DEFAULT 0,
  total_earnings DECIMAL(12,2) DEFAULT 0.00,
  wallet_balance DECIMAL(12,2) DEFAULT 0.00,
  status driver_status NOT NULL DEFAULT 'offline',
  kyc_status kyc_status NOT NULL DEFAULT 'not_submitted',
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  commission_rate DECIMAL(5,2) DEFAULT 20.00,
  current_latitude DECIMAL(10,7),
  current_longitude DECIMAL(10,7),
  current_zone_id UUID,
  last_heartbeat TIMESTAMPTZ,
  total_earnings_all_time DECIMAL(14,2) DEFAULT 0.00,
  total_withdrawn DECIMAL(14,2) DEFAULT 0.00,
  incentive_earned DECIMAL(12,2) DEFAULT 0.00,
  acceptance_rate DECIMAL(5,2) DEFAULT 100.00,
  cancellation_rate DECIMAL(5,2) DEFAULT 0.00,
  online_duration_seconds INTEGER DEFAULT 0,
  fcm_token TEXT,
  device_id VARCHAR(255),
  device_type VARCHAR(20),
  app_version VARCHAR(20),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_drivers_user ON drivers(user_id);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_location ON drivers(current_latitude, current_longitude);
CREATE INDEX idx_drivers_kyc ON drivers(kyc_status);
CREATE INDEX idx_drivers_rating ON drivers(rating DESC);

-- ============================================================
-- VEHICLES TABLE
-- ============================================================
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  vehicle_type vehicle_type NOT NULL,
  registration_number VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  make VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  color VARCHAR(50),
  chassis_number VARCHAR(100),
  engine_number VARCHAR(100),
  insurance_expiry DATE,
  fitness_expiry DATE,
  permit_expiry DATE,
  image_url TEXT,
  status vehicle_status NOT NULL DEFAULT 'pending',
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_vehicles_driver ON vehicles(driver_id);
CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);
CREATE INDEX idx_vehicles_reg ON vehicles(registration_number);

-- ============================================================
-- KYC DOCUMENTS TABLE
-- ============================================================
CREATE TABLE kyc_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  kyc_type kyc_type NOT NULL,
  document_number VARCHAR(100),
  document_url TEXT NOT NULL,
  back_document_url TEXT,
  selfie_url TEXT,
  status kyc_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  expires_at DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kyc_driver ON kyc_documents(driver_id);
CREATE INDEX idx_kyc_status ON kyc_documents(status);

-- ============================================================
-- RIDES TABLE
-- ============================================================
CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rider_id UUID NOT NULL REFERENCES users(id),
  driver_id UUID REFERENCES drivers(id),
  vehicle_id UUID REFERENCES vehicles(id),
  ride_type ride_type NOT NULL,
  status ride_status NOT NULL DEFAULT 'pending',
  pickup_location GEOGRAPHY(POINT) NOT NULL,
  pickup_address TEXT NOT NULL,
  pickup_place_id VARCHAR(255),
  pickup_latitude DECIMAL(10,7) NOT NULL,
  pickup_longitude DECIMAL(10,7) NOT NULL,
  dropoff_location GEOGRAPHY(POINT),
  dropoff_address TEXT,
  dropoff_place_id VARCHAR(255),
  dropoff_latitude DECIMAL(10,7),
  dropoff_longitude DECIMAL(10,7),
  current_latitude DECIMAL(10,7),
  current_longitude DECIMAL(10,7),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_by VARCHAR(20),
  cancellation_reason TEXT,
  estimated_distance_meters DECIMAL(10,2),
  actual_distance_meters DECIMAL(10,2),
  estimated_duration_seconds INTEGER,
  actual_duration_seconds INTEGER,
  estimated_fare DECIMAL(10,2),
  actual_fare DECIMAL(10,2),
  base_fare DECIMAL(10,2),
  distance_fare DECIMAL(10,2),
  time_fare DECIMAL(10,2),
  surge_multiplier DECIMAL(4,2) DEFAULT 1.00,
  waiting_charge DECIMAL(10,2) DEFAULT 0.00,
  toll_charge DECIMAL(10,2) DEFAULT 0.00,
  service_tax DECIMAL(10,2) DEFAULT 0.00,
  gst DECIMAL(10,2) DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  coupon_id UUID,
  coupon_discount DECIMAL(10,2) DEFAULT 0.00,
  final_fare DECIMAL(10,2),
  driver_commission DECIMAL(10,2),
  driver_payout DECIMAL(10,2),
  payment_status payment_status DEFAULT 'pending',
  payment_method payment_method,
  is_sos_triggered BOOLEAN DEFAULT FALSE,
  sos_triggered_at TIMESTAMPTZ,
  is_rated_by_rider BOOLEAN DEFAULT FALSE,
  is_rated_by_driver BOOLEAN DEFAULT FALSE,
  rider_rating INTEGER,
  driver_rating INTEGER,
  tracking_url TEXT,
  is_scheduled BOOLEAN DEFAULT FALSE,
  timeout_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rides_rider ON rides(rider_id);
CREATE INDEX idx_rides_driver ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_type ON rides(ride_type);
CREATE INDEX idx_rides_created ON rides(created_at);
CREATE INDEX idx_rides_pickup ON rides(pickup_latitude, pickup_longitude);
CREATE INDEX idx_rides_scheduled ON rides(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- ============================================================
-- RIDE LOCATIONS (GPS Track)
-- ============================================================
CREATE TABLE ride_locations (
  id BIGSERIAL PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES rides(id),
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  speed DECIMAL(6,2),
  heading DECIMAL(5,2),
  accuracy DECIMAL(5,2),
  altitude DECIMAL(8,2),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ride_locations_ride ON ride_locations(ride_id);
CREATE INDEX idx_ride_locations_time ON ride_locations(timestamp);

-- ============================================================
-- PAYMENTS TABLE
-- ============================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES rides(id),
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  status payment_status NOT NULL DEFAULT 'pending',
  payment_method payment_method,
  razorpay_payment_id VARCHAR(100),
  razorpay_order_id VARCHAR(100),
  razorpay_signature VARCHAR(255),
  gateway_response JSONB,
  gateway_fees DECIMAL(10,2) DEFAULT 0.00,
  gateway_tax DECIMAL(10,2) DEFAULT 0.00,
  refund_amount DECIMAL(12,2) DEFAULT 0.00,
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_ride ON payments(ride_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================================
-- WALLETS TABLE
-- ============================================================
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  driver_id UUID REFERENCES drivers(id),
  balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_credited DECIMAL(14,2) DEFAULT 0.00,
  total_debited DECIMAL(14,2) DEFAULT 0.00,
  total_withdrawn DECIMAL(14,2) DEFAULT 0.00,
  bonus_earned DECIMAL(12,2) DEFAULT 0.00,
  referral_earned DECIMAL(12,2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'INR',
  is_active BOOLEAN DEFAULT TRUE,
  last_transaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(driver_id)
);

CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_wallets_driver ON wallets(driver_id);

-- ============================================================
-- TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  ride_id UUID REFERENCES rides(id),
  amount DECIMAL(12,2) NOT NULL,
  balance_before DECIMAL(12,2) NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL,
  type transaction_type NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending',
  description TEXT,
  reference_type VARCHAR(50),
  reference_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX idx_transactions_ride ON transactions(ride_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

-- ============================================================
-- RATINGS TABLE
-- ============================================================
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES rides(id),
  rater_id UUID NOT NULL REFERENCES users(id),
  ratee_id UUID NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  ride_type ride_type,
  categories JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ride_id, rater_id, ratee_id)
);

CREATE INDEX idx_ratings_ride ON ratings(ride_id);
CREATE INDEX idx_ratings_rater ON ratings(rater_id);
CREATE INDEX idx_ratings_ratee ON ratings(ratee_id);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  type notification_type DEFAULT 'push',
  channel notification_channel DEFAULT 'system',
  is_read BOOLEAN DEFAULT FALSE,
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  image_url TEXT,
  deep_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================================
-- COUPONS TABLE
-- ============================================================
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  type coupon_type NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  max_discount DECIMAL(10,2),
  min_order_amount DECIMAL(10,2),
  max_uses INTEGER DEFAULT 1,
  max_uses_per_user INTEGER DEFAULT 1,
  total_uses INTEGER DEFAULT 0,
  applicable_ride_types ride_type[],
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active) WHERE is_active = TRUE;

-- ============================================================
-- USER COUPONS TABLE
-- ============================================================
CREATE TABLE user_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  coupon_id UUID NOT NULL REFERENCES coupons(id),
  used_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, coupon_id)
);

-- ============================================================
-- DRIVER ZONES TABLE
-- ============================================================
CREATE TABLE driver_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  boundary GEOGRAPHY(POLYGON) NOT NULL,
  base_fare_multiplier DECIMAL(4,2) DEFAULT 1.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RIDE PRICING TABLE
-- ============================================================
CREATE TABLE ride_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_type ride_type NOT NULL,
  base_fare DECIMAL(10,2) NOT NULL,
  per_km_rate DECIMAL(10,2) NOT NULL,
  per_minute_rate DECIMAL(10,2) NOT NULL,
  minimum_fare DECIMAL(10,2) NOT NULL,
  cancellation_fee DECIMAL(10,2) DEFAULT 0.00,
  waiting_charge_per_min DECIMAL(10,2) DEFAULT 0.00,
  night_charge_multiplier DECIMAL(4,2) DEFAULT 1.00,
  surge_multiplier DECIMAL(4,2) DEFAULT 1.00,
  commission_rate DECIMAL(5,2) DEFAULT 20.00,
  service_tax_percent DECIMAL(5,2) DEFAULT 0.00,
  gst_percent DECIMAL(5,2) DEFAULT 0.00,
  free_waiting_minutes INTEGER DEFAULT 5,
  max_waiting_minutes INTEGER DEFAULT 15,
  is_active BOOLEAN DEFAULT TRUE,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ride_pricing_type ON ride_pricing(ride_type);

-- ============================================================
-- INCENTIVES TABLE
-- ============================================================
CREATE TABLE incentives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  type VARCHAR(50) NOT NULL,
  description TEXT,
  target_rides INTEGER,
  target_earnings DECIMAL(12,2),
  target_hours INTEGER,
  reward_amount DECIMAL(12,2) NOT NULL,
  progress_rides INTEGER DEFAULT 0,
  progress_earnings DECIMAL(12,2) DEFAULT 0.00,
  progress_hours INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  is_paid BOOLEAN DEFAULT FALSE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_incentives_driver ON incentives(driver_id);
CREATE INDEX idx_incentives_status ON incentives(is_completed, is_paid);

-- ============================================================
-- AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  request_method VARCHAR(10),
  request_path TEXT,
  status_code INTEGER,
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================================
-- DRIVER WITHDRAWAL REQUESTS
-- ============================================================
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  amount DECIMAL(12,2) NOT NULL,
  account_holder_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  ifsc_code VARCHAR(20) NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  upi_id VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_withdrawal_driver ON withdrawal_requests(driver_id);
CREATE INDEX idx_withdrawal_status ON withdrawal_requests(status);

-- ============================================================
-- SYSTEM CONFIG TABLE
-- ============================================================
CREATE TABLE system_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS FOR updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_drivers_updated_at
  BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_vehicles_updated_at
  BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_rides_updated_at
  BEFORE UPDATE ON rides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_wallets_updated_at
  BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_coupons_updated_at
  BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_system_config_updated_at
  BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

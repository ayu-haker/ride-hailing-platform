import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  async getDashboardStats() {
    try {
      const [
        userStats,
        driverStats,
        rideStats,
        revenueStats,
        activeRides,
      ] = await Promise.all([
        this.dataSource.query(`
          SELECT
            COUNT(*)::int AS total_users,
            COUNT(*) FILTER (WHERE is_active = true)::int AS active_users,
            COUNT(*) FILTER (WHERE is_blocked = true)::int AS blocked_users,
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::int AS new_today
          FROM users
        `),
        this.dataSource.query(`
          SELECT
            COUNT(*)::int AS total_drivers,
            COUNT(*) FILTER (WHERE is_active = true)::int AS active_drivers,
            COUNT(*) FILTER (WHERE status = 'online')::int AS online_drivers,
            COUNT(*) FILTER (WHERE kyc_status = 'verified')::int AS verified_drivers,
            COUNT(*) FILTER (WHERE kyc_status = 'pending')::int AS kyc_pending,
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::int AS joined_today
          FROM drivers
        `),
        this.dataSource.query(`
          SELECT
            COUNT(*)::int AS total_rides,
            COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_rides,
            COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled_rides,
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::int AS rides_today,
            ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60) FILTER (WHERE status = 'completed' AND started_at IS NOT NULL AND completed_at IS NOT NULL), 2)::float AS avg_ride_duration_minutes
          FROM rides
        `),
        this.dataSource.query(`
          SELECT
            ROUND(COALESCE(SUM(actual_fare), 0), 2)::float AS total_revenue,
            ROUND(COALESCE(SUM(actual_fare) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours'), 0), 2)::float AS revenue_today,
            ROUND(COALESCE(SUM(actual_fare) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())), 0), 2)::float AS revenue_this_month,
            ROUND(COALESCE(AVG(actual_fare) FILTER (WHERE status = 'completed'), 0), 2)::float AS avg_ride_value
          FROM rides
          WHERE status = 'completed'
        `),
        this.dataSource.query(`
          SELECT COUNT(*)::int AS active_rides_count
          FROM rides
          WHERE status IN ('searching', 'driver_assigned', 'arrived', 'in_progress')
        `),
      ]);

      return {
        users: userStats[0],
        drivers: driverStats[0],
        rides: rideStats[0],
        revenue: revenueStats[0],
        activeRides: activeRides[0].active_rides_count,
      };
    } catch (error) {
      this.logger.error('Failed to fetch dashboard stats', error);
      throw error;
    }
  }

  async getUserManagement(
    page: number = 1,
    limit: number = 20,
    search?: string,
    status?: string,
  ) {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(
        `(u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.phone ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`,
      );
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status === 'active') {
      conditions.push('u.is_active = true AND u.is_blocked = false');
    } else if (status === 'blocked') {
      conditions.push('u.is_blocked = true');
    } else if (status === 'inactive') {
      conditions.push('u.is_active = false');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
      const countResult = await this.dataSource.query(
        `SELECT COUNT(*)::int AS total FROM users u ${whereClause}`,
        params,
      );
      const total = countResult[0].total;

      const users = await this.dataSource.query(
        `SELECT
          u.id, u.phone, u.email, u.first_name AS "firstName", u.last_name AS "lastName",
          u.avatar_url AS "avatarUrl", u.role, u.is_phone_verified AS "isPhoneVerified",
          u.is_email_verified AS "isEmailVerified", u.is_active AS "isActive",
          u.is_blocked AS "isBlocked", u.referral_code AS "referralCode",
          u.created_at AS "createdAt", u.updated_at AS "updatedAt"
        FROM users u
        ${whereClause}
        ORDER BY u.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset],
      );

      return {
        users,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch users', error);
      throw error;
    }
  }

  async getDriverManagement(
    page: number = 1,
    limit: number = 20,
    search?: string,
    status?: string,
    kycStatus?: string,
  ) {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(
        `(d.first_name ILIKE $${paramIndex} OR d.last_name ILIKE $${paramIndex} OR d.phone ILIKE $${paramIndex} OR d.email ILIKE $${paramIndex})`,
      );
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      conditions.push(`d.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (kycStatus) {
      conditions.push(`d.kyc_status = $${paramIndex}`);
      params.push(kycStatus);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
      const countResult = await this.dataSource.query(
        `SELECT COUNT(*)::int AS total FROM drivers d ${whereClause}`,
        params,
      );
      const total = countResult[0].total;

      const drivers = await this.dataSource.query(
        `SELECT
          d.id, d.user_id AS "userId", d.first_name AS "firstName", d.last_name AS "lastName",
          d.phone, d.email, d.avatar_url AS "avatarUrl", d.rating, d.rating_count AS "ratingCount",
          d.total_rides AS "totalRides", d.total_earnings AS "totalEarnings",
          d.wallet_balance AS "walletBalance", d.status, d.kyc_status AS "kycStatus",
          d.is_verified AS "isVerified", d.is_active AS "isActive",
          d.commission_rate AS "commissionRate", d.created_at AS "createdAt",
          d.updated_at AS "updatedAt",
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', v.id,
              'vehicle_type', v.vehicle_type,
              'registration_number', v.registration_number,
              'model', v.model,
              'make', v.make,
              'year', v.year,
              'color', v.color,
              'status', v.status
            )) FROM vehicles v WHERE v.driver_id = d.id AND v.is_active = true),
            '[]'::json
          ) AS vehicles
        FROM drivers d
        ${whereClause}
        ORDER BY d.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset],
      );

      return {
        drivers,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch drivers', error);
      throw error;
    }
  }

  async getRideMonitoring(
    page: number = 1,
    limit: number = 20,
    status?: string,
  ) {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`r.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
      const countResult = await this.dataSource.query(
        `SELECT COUNT(*)::int AS total FROM rides r ${whereClause}`,
        params,
      );
      const total = countResult[0].total;

      const rides = await this.dataSource.query(
        `SELECT
          r.id, r.rider_id AS "riderId", r.driver_id AS "driverId",
          r.ride_type AS "rideType", r.status,
          r.pickup_location AS "pickupLocation",
          r.dropoff_location AS "dropoffLocation",
          r.estimated_distance_meters AS "estimatedDistanceMeters",
          r.actual_distance_meters AS "actualDistanceMeters",
          r.estimated_duration_seconds AS "estimatedDurationSeconds",
          r.actual_duration_seconds AS "actualDurationSeconds",
          r.estimated_fare AS "estimatedFare", r.actual_fare AS "actualFare",
          r.payment_status AS "paymentStatus", r.payment_method AS "paymentMethod",
          r.is_sos_triggered AS "isSOSTriggered",
          r.started_at AS "startedAt", r.completed_at AS "completedAt",
          r.cancelled_at AS "cancelledAt", r.cancelled_by AS "cancelledBy",
          r.cancellation_reason AS "cancellationReason",
          r.created_at AS "createdAt",
          json_build_object(
            'id', u.id, 'firstName', u.first_name, 'lastName', u.last_name,
            'phone', u.phone, 'avatarUrl', u.avatar_url
          ) AS rider,
          CASE WHEN d.id IS NOT NULL THEN
            json_build_object(
              'id', d.id, 'firstName', d.first_name, 'lastName', d.last_name,
              'phone', d.phone, 'avatarUrl', d.avatar_url
            ) ELSE NULL END AS driver
        FROM rides r
        LEFT JOIN users u ON u.id = r.rider_id
        LEFT JOIN drivers d ON d.id = r.driver_id
        ${whereClause}
        ORDER BY r.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset],
      );

      return {
        rides,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch rides', error);
      throw error;
    }
  }

  async getRevenueAnalytics(startDate?: string, endDate?: string) {
    const conditions: string[] = ["r.status = 'completed'"];
    const params: any[] = [];
    let paramIndex = 1;

    if (startDate) {
      conditions.push(`r.created_at >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`r.created_at <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    try {
      const [summary, dailyBreakdown, rideTypeBreakdown, paymentMethodBreakdown] =
        await Promise.all([
          this.dataSource.query(
            `SELECT
              COUNT(*)::int AS total_rides,
              ROUND(COALESCE(SUM(r.actual_fare), 0), 2)::float AS total_revenue,
              ROUND(COALESCE(AVG(r.actual_fare), 0), 2)::float AS avg_ride_value,
              ROUND(COALESCE(SUM(r.actual_fare) - SUM(d.commission_rate * r.actual_fare / 100), 0), 2)::float AS net_revenue,
              ROUND(COALESCE(SUM(r.actual_distance_meters) / 1000.0, 0), 2)::float AS total_distance_km,
              ROUND(COALESCE(SUM(r.actual_duration_seconds) / 3600.0, 0), 2)::float AS total_duration_hours
            FROM rides r
            LEFT JOIN drivers d ON d.id = r.driver_id
            ${whereClause}`,
            params,
          ),
          this.dataSource.query(
            `SELECT
              DATE(r.created_at) AS date,
              COUNT(*)::int AS rides,
              ROUND(COALESCE(SUM(r.actual_fare), 0), 2)::float AS revenue,
              ROUND(COALESCE(AVG(r.actual_fare), 0), 2)::float AS avg_ride_value
            FROM rides r
            ${whereClause}
            GROUP BY DATE(r.created_at)
            ORDER BY date ASC`,
            params,
          ),
          this.dataSource.query(
            `SELECT
              r.ride_type AS ride_type,
              COUNT(*)::int AS rides,
              ROUND(COALESCE(SUM(r.actual_fare), 0), 2)::float AS revenue,
              ROUND(COALESCE(AVG(r.actual_fare), 0), 2)::float AS avg_ride_value
            FROM rides r
            ${whereClause}
            GROUP BY r.ride_type`,
            params,
          ),
          this.dataSource.query(
            `SELECT
              COALESCE(r.payment_method, 'unknown') AS payment_method,
              COUNT(*)::int AS transactions,
              ROUND(COALESCE(SUM(r.actual_fare), 0), 2)::float AS amount
            FROM rides r
            ${whereClause}
            GROUP BY r.payment_method`,
            params,
          ),
        ]);

      return {
        summary: summary[0],
        dailyBreakdown,
        rideTypeBreakdown,
        paymentMethodBreakdown,
      };
    } catch (error) {
      this.logger.error('Failed to fetch revenue analytics', error);
      throw error;
    }
  }

  async updateCommissionRate(driverId: string, rate: number) {
    if (rate < 0 || rate > 100) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Commission rate must be between 0 and 100',
        },
      });
    }

    try {
      const result = await this.dataSource.query(
        `UPDATE drivers SET commission_rate = $1, updated_at = NOW() WHERE id = $2 RETURNING
          id, commission_rate AS "commissionRate", updated_at AS "updatedAt"`,
        [rate, driverId],
      );

      if (result.length === 0) {
        throw new NotFoundException({
          success: false,
          error: { code: 'DRV_001', message: 'Driver not found' },
        });
      }

      this.logger.log(`Commission rate updated for driver ${driverId} to ${rate}%`);
      return { driver: result[0] };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to update commission rate', error);
      throw error;
    }
  }

  async processKYC(
    driverId: string,
    documentId: string,
    status: string,
    rejectionReason?: string,
  ) {
    if (!['verified', 'rejected'].includes(status)) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'VAL_001',
          message: 'KYC status must be "verified" or "rejected"',
        },
      });
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const document = await queryRunner.query(
        `SELECT * FROM kyc_documents WHERE id = $1 AND driver_id = $2`,
        [documentId, driverId],
      );

      if (document.length === 0) {
        throw new NotFoundException({
          success: false,
          error: { code: 'KYC_002', message: 'KYC document not found' },
        });
      }

      await queryRunner.query(
        `UPDATE kyc_documents SET status = $1, rejection_reason = $2, reviewed_at = NOW(), updated_at = NOW() WHERE id = $3`,
        [status, rejectionReason || null, documentId],
      );

      if (status === 'verified') {
        const allVerified = await queryRunner.query(
          `SELECT COUNT(*)::int = 0 AS has_pending FROM kyc_documents
           WHERE driver_id = $1 AND status != 'verified'`,
          [driverId],
        );

        if (allVerified[0].has_pending) {
          await queryRunner.query(
            `UPDATE drivers SET kyc_status = 'verified', is_verified = true, updated_at = NOW() WHERE id = $1`,
            [driverId],
          );
        }
      } else {
        await queryRunner.query(
          `UPDATE drivers SET kyc_status = 'rejected', updated_at = NOW() WHERE id = $1`,
          [driverId],
        );
      }

      await queryRunner.commitTransaction();

      this.logger.log(`KYC ${status} for driver ${driverId}, document ${documentId}`);
      return {
        success: true,
        message: `KYC document ${status} successfully`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to process KYC', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createCoupon(data: any) {
    try {
      const existing = await this.dataSource.query(
        `SELECT id FROM coupons WHERE code = $1`,
        [data.code],
      );

      if (existing.length > 0) {
        throw new ConflictException({
          success: false,
          error: { code: 'CPN_001', message: 'Coupon code already exists' },
        });
      }

      const result = await this.dataSource.query(
        `INSERT INTO coupons (code, description, type, value, max_discount, min_order_amount, max_uses, max_uses_per_user, applicable_ride_types, is_active, starts_at, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING
           id, code, description, type, value, max_discount AS "maxDiscount",
           min_order_amount AS "minOrderAmount", max_uses AS "maxUses",
           max_uses_per_user AS "maxUsesPerUser", applicable_ride_types AS "applicableRideTypes",
           is_active AS "isActive", starts_at AS "startsAt", expires_at AS "expiresAt",
           created_at AS "createdAt"`,
        [
          data.code,
          data.description || null,
          data.type,
          data.value,
          data.maxDiscount || null,
          data.minOrderAmount || null,
          data.maxUses || null,
          data.maxUsesPerUser || 1,
          data.applicableRideTypes ? JSON.stringify(data.applicableRideTypes) : null,
          data.isActive !== undefined ? data.isActive : true,
          data.startsAt || new Date(),
          data.expiresAt || null,
        ],
      );

      this.logger.log(`Coupon created: ${data.code}`);
      return { coupon: result[0] };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Failed to create coupon', error);
      throw error;
    }
  }

  async updateCoupon(couponId: string, data: any) {
    const fields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      description: 'description',
      type: 'type',
      value: 'value',
      maxDiscount: 'max_discount',
      minOrderAmount: 'min_order_amount',
      maxUses: 'max_uses',
      maxUsesPerUser: 'max_uses_per_user',
      applicableRideTypes: 'applicable_ride_types',
      isActive: 'is_active',
      startsAt: 'starts_at',
      expiresAt: 'expires_at',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        fields.push(`${column} = $${paramIndex}`);
        params.push(key === 'applicableRideTypes' ? JSON.stringify(data[key]) : data[key]);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      throw new BadRequestException({
        success: false,
        error: { code: 'VAL_001', message: 'No fields to update' },
      });
    }

    fields.push(`updated_at = NOW()`);
    params.push(couponId);

    try {
      const result = await this.dataSource.query(
        `UPDATE coupons SET ${fields.join(', ')} WHERE id = $${paramIndex}
         RETURNING
           id, code, description, type, value, max_discount AS "maxDiscount",
           min_order_amount AS "minOrderAmount", max_uses AS "maxUses",
           max_uses_per_user AS "maxUsesPerUser", applicable_ride_types AS "applicableRideTypes",
           is_active AS "isActive", starts_at AS "startsAt", expires_at AS "expiresAt",
           created_at AS "createdAt", updated_at AS "updatedAt"`,
        params,
      );

      if (result.length === 0) {
        throw new NotFoundException({
          success: false,
          error: { code: 'CPN_001', message: 'Coupon not found' },
        });
      }

      this.logger.log(`Coupon ${couponId} updated`);
      return { coupon: result[0] };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to update coupon', error);
      throw error;
    }
  }

  async deleteCoupon(couponId: string) {
    try {
      const result = await this.dataSource.query(
        `DELETE FROM coupons WHERE id = $1 RETURNING id`,
        [couponId],
      );

      if (result.length === 0) {
        throw new NotFoundException({
          success: false,
          error: { code: 'CPN_001', message: 'Coupon not found' },
        });
      }

      this.logger.log(`Coupon ${couponId} deleted`);
      return { success: true, message: 'Coupon deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to delete coupon', error);
      throw error;
    }
  }

  async getCoupons(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    try {
      const countResult = await this.dataSource.query(
        `SELECT COUNT(*)::int AS total FROM coupons`,
      );
      const total = countResult[0].total;

      const coupons = await this.dataSource.query(
        `SELECT
          id, code, description, type, value, max_discount AS "maxDiscount",
          min_order_amount AS "minOrderAmount", max_uses AS "maxUses",
          max_uses_per_user AS "maxUsesPerUser", total_uses AS "totalUses",
          applicable_ride_types AS "applicableRideTypes", is_active AS "isActive",
          starts_at AS "startsAt", expires_at AS "expiresAt",
          created_at AS "createdAt", updated_at AS "updatedAt"
        FROM coupons
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2`,
        [limit, offset],
      );

      return {
        coupons,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch coupons', error);
      throw error;
    }
  }

  async createSystemConfig(key: string, value: string, description?: string) {
    try {
      const existing = await this.dataSource.query(
        `SELECT id FROM system_config WHERE key = $1`,
        [key],
      );

      if (existing.length > 0) {
        throw new ConflictException({
          success: false,
          error: {
            code: 'CONFLICT',
            message: `System config key "${key}" already exists`,
          },
        });
      }

      const result = await this.dataSource.query(
        `INSERT INTO system_config (key, value, description)
         VALUES ($1, $2, $3)
         RETURNING id, key, value, description, created_at AS "createdAt", updated_at AS "updatedAt"`,
        [key, value, description || null],
      );

      this.logger.log(`System config created: ${key}`);
      return { config: result[0] };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Failed to create system config', error);
      throw error;
    }
  }

  async getSystemConfig(key: string) {
    try {
      const result = await this.dataSource.query(
        `SELECT id, key, value, description, created_at AS "createdAt", updated_at AS "updatedAt"
         FROM system_config WHERE key = $1`,
        [key],
      );

      if (result.length === 0) {
        throw new NotFoundException({
          success: false,
          error: { code: 'INT_003', message: `Config key "${key}" not found` },
        });
      }

      return { config: result[0] };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to get system config', error);
      throw error;
    }
  }

  async getAuditLogs(
    page: number = 1,
    limit: number = 20,
    entityType?: string,
    action?: string,
  ) {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (entityType) {
      conditions.push(`al.entity_type = $${paramIndex}`);
      params.push(entityType);
      paramIndex++;
    }

    if (action) {
      conditions.push(`al.action = $${paramIndex}`);
      params.push(action);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
      const countResult = await this.dataSource.query(
        `SELECT COUNT(*)::int AS total FROM audit_logs al ${whereClause}`,
        params,
      );
      const total = countResult[0].total;

      const logs = await this.dataSource.query(
        `SELECT
          al.id, al.entity_type AS "entityType", al.entity_id AS "entityId",
          al.action, al.performed_by AS "performedBy", al.performer_role AS "performerRole",
          al.changes, al.ip_address AS "ipAddress", al.user_agent AS "userAgent",
          al.created_at AS "createdAt"
        FROM audit_logs al
        ${whereClause}
        ORDER BY al.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset],
      );

      return {
        logs,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch audit logs', error);
      throw error;
    }
  }
}

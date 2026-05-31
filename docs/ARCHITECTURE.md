# Ride-Hailing Platform — Complete System Architecture

---

## 1. SYSTEM ARCHITECTURE DIAGRAM

```
                           ┌─────────────────────────────────────────────────────────────────────────┐
                           │                           INTERNET                                      │
                           └──────────┬──────────────────────────────────┬───────────────────────────┘
                                      │                                  │
                            HTTPS/WSS │                          HTTPS   │
                                      │                                  │
               ┌──────────────────────▼──────────────────────┐  ┌────────▼───────────────┐
               │              RIDER APP (Flutter)            │  │   DRIVER APP (Flutter)  │
               │  - Auth, Booking, Tracking, Wallet, SOS     │  │  - Auth, Earnings,      │
               │  - Socket.IO Client, Razorpay, FCM          │  │    Ride Accept/Reject   │
               └──────────────────────┬──────────────────────┘  │    Socket.IO Client     │
                                      │                         └────────┬───────────────┘
                                      │                                  │
                          ┌───────────▼───────────────────────────────────▼───────────┐
                          │                  CDN / CloudFront                         │
                          │           (Static assets, Map tiles, Images)               │
                          └───────────────────────────────────────────────────────────┘
                                      │                                  │
                          ┌───────────▼───────────────────────────────────▼───────────┐
                          │               NGINX Reverse Proxy / Load Balancer         │
                          │  - SSL Termination, Rate Limiting, WebSocket Upgrade      │
                          │  - Static File Serving (Admin Panel)                       │
                          └───────────────────────────┬───────────────────────────────┘
                                                      │
                          ┌───────────────────────────▼───────────────────────────────┐
                          │                    API GATEWAY (NestJS)                   │
                          │  - JWT Auth Guard, Role Guard, Throttling                │
                          │  - Request Validation, Response Enrichment                │
                          │  - Swagger Documentation, Request Logging                 │
                          │  - Route: /api/v1/{auth,users,rides,drivers,...}         │
                          └──┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┘
                             │      │      │      │      │      │      │      │
              ┌──────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────────────┐
              │              │      │      │      │      │      │      │      │              │
              ▼              ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼              │
   ┌────────────────┐ ┌─────────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐ │
   │   Auth Service │ │ User   │ │Ride  │ │Driver│ │Pay   │ │Notif │ │Loc   │ │ Admin    │ │
   │   (NestJS)     │ │Service │ │Service│ │Service│ │Service│ │Service│ │Service│ │ Service  │ │
   │   Port 3001    │ │3002    │ │3003  │ │3004  │ │3005  │ │3006  │ │3007  │ │ 3008     │ │
   └────────┬───────┘ └───┬────┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └────┬─────┘ │
            │             │        │        │        │        │        │          │       │
            └─────────────┴────────┴────────┴────────┴────────┴────────┴──────────┘       │
                              │              │                                            │
                              ▼              ▼                                            │
                    ┌────────────────┐ ┌────────────┐                                     │
                    │   PostgreSQL   │ │   Redis    │                                     │
                    │   (PostGIS)    │ │  Cache +   │                                     │
                    │   Primary DB   │ │  Pub/Sub   │                                     │
                    └────────────────┘ └──────┬─────┘                                     │
                                              │                                           │
                                    ┌─────────▼─────────┐                               │
                                    │  Socket.IO Server  │◄──────────────────────────────┘
                                    │  (via Ride Service)│
                                    │  Namespace:/tracking│
                                    └─────────┬─────────┘
                                              │
                                    ┌─────────▼─────────┐
                                    │  WS Connections    │
                                    │  Rider ←→ Driver   │
                                    │  Live Location     │
                                    │  Ride Status       │
                                    │  SOS Alerts        │
                                    └───────────────────┘
```

---

## 2. SERVICE COMMUNICATION FLOW

### 2.1 Inter-Service Communication Matrix

```
┌──────────────────┬───────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│     FROM \ TO    │ Auth  │User  │Ride  │Driver│Pay   │Notif │Loc   │Admin │
├──────────────────┼───────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│ API Gateway      │  R    │  R   │  R   │  R   │  R   │  R   │  R   │  R   │
│ Auth Service     │  *    │  RW  │  -   │  RW  │  -   │  -   │  -   │  -   │
│ User Service     │  -    │  *   │  R   │  -   │  -   │  -   │  -   │  -   │
│ Ride Service     │  R    │  R   │  *   │  RW  │  RW  │  RW  │  RW  │  R   │
│ Driver Service   │  R    │  -   │  RW  │  *   │  -   │  -   │  RW  │  R   │
│ Payment Service  │  R    │  R   │  RW  │  R   │  *   │  RW  │  -   │  R   │
│ Notification Svc │  R    │  -   │  R   │  R   │  R   │  *   │  -   │  -   │
│ Location Service │  -    │  -   │  RW  │  RW  │  -   │  -   │  *   │  R   │
│ Admin Service    │  R    │  RW  │  RW  │  RW  │  RW  │  -   │  R   │  *   │
└──────────────────┴───────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
  Legend: R=Read  W=Write  RW=ReadWrite  *=Self  -=No communication
```

### 2.2 Communication Protocols

```
┌────────────────────────────────────────────────────────────────────┐
│                    SERVICE COMMUNICATION LAYERS                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Layer 1: Synchronous HTTP (REST)                                  │
│  ───────────────────────────────────────────                       │
│  API Gateway → All Services (Proxied requests)                    │
│  Auth Service → User/Driver Service (User creation)               │
│  Ride Service → Payment Service (Payment processing)              │
│  Admin Service → All Services (Management queries)                │
│                                                                    │
│  Layer 2: WebSocket (Real-time)                                    │
│  ───────────────────────────────────────                           │
│  Ride Service (Socket.IO) ↔ Rider App (Live tracking)             │
│  Ride Service (Socket.IO) ↔ Driver App (Ride requests)            │
│  Location Service → Redis Pub/Sub → Ride Service (Location)       │
│                                                                    │
│  Layer 3: Redis Pub/Sub (Async Events)                             │
│  ──────────────────────────────────────────                       │
│  Channel: ride:events        → {ride_id}:status_changed           │
│  Channel: rider:notifications → {user_id}:new_notification        │
│  Channel: driver:location     → driver_location_updates           │
│  Channel: payment:events      → payment_completed, refund         │
│                                                                    │
│  Layer 4: Database (Shared)                                        │
│  ───────────────────────────────────                               │
│  All services share PostgreSQL (each with isolated schema access) │
│  Redis shared for cache, rate limiting, session store             │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 2.3 Ride Booking Flow — Complete Sequence

```
RIDER APP              API GATEWAY          RIDE SERVICE          MATCHING ENGINE       DRIVER APP
    │                       │                    │                     │                    │
    │  1. POST /rides       │                    │                     │                    │
    │  {pickup,dropoff,     │                    │                     │                    │
    │   rideType}           │                    │                     │                    │
    ├──────────────────────►│                    │                     │                    │
    │                       │  2. Create Ride    │                     │                    │
    │                       ├───────────────────►│                     │                    │
    │                       │                    │  3. Calc Fare       │                    │
    │                       │                    │  (PricingService)   │                    │
    │                       │                    │       │             │                    │
    │                       │                    │  4. Save Ride       │                    │
    │                       │                    │  Status: SEARCHING  │                    │
    │                       │                    │       │             │                    │
    │                       │                    │  5. Find Drivers    │                    │
    │  {rideId,status:      │                    ├────────────────────►│                    │
    │   searching}          │                    │                     │  6. GEO Search     │
    │  ◄────────────────────┼────────────────────┤                     │  Redis GEO: NEARBY │
    │                       │                    │                     │       │             │
    │                       │                    │                     │  7. Notify Drivers │
    │                       │                    │                     ├───────────────────►│
    │                       │                    │                     │  {rideId,pickup,   │
    │                       │                    │                     │   fare, distance}  │
    │                       │                    │                     │                    │
    │                       │                    │                     │  8. Accept Ride    │
    │                       │                    │                     │◄───────────────────┤
    │                       │                    │                     │                    │
    │                       │                    │  9. Assign Driver   │                    │
    │                       │                    │◄────────────────────┤                    │
    │                       │                    │       │             │                    │
    │  WS: ride:status      │                    │  10. Update Status  │                    │
    │  update               │                    │  ASSIGNED           │                    │
    │◄──────────────────────────────────────────◄┤       │             │                    │
    │                       │                    │                     │                    │
    │                       │                    │  11. Payment: Create│                    │
    │                       │                    │  Order (Razorpay)   │                    │
    │  WS: ride:driver-     │                    ├────────────────────►│                    │
    │  location             │                    │  (Payment Service)  │                    │
    │◄──────────────────────────────────────────◄┤       │             │                    │
    │                       │                    │                     │                    │
    │                       │                    │  12. Driver Arrived │                    │
    │                       │                    │◄────────────────────────────────────────┤
    │                       │                    │       │             │                    │
    │  WS: ride:status      │                    │  13. Status: ARRIVED│                    │
    │  arrived              │                    │       │             │                    │
    │◄──────────────────────────────────────────◄┤       │             │                    │
    │                       │                    │                     │                    │
    │                       │                    │  14. Start Ride     │                    │
    │                       │                    │◄────────────────────────────────────────┤
    │                       │                    │       │             │                    │
    │  WS: ride:driver-     │                    │  15. Status: IN_    │                    │
    │  location (every 5s)  │                    │  PROGRESS           │                    │
    │◄──────────────────────────────────────────◄┤       │             │                    │
    │                       │                    │       │             │                    │
    │                       │                    │  16. Complete Ride  │                    │
    │                       │                    │◄────────────────────────────────────────┤
    │                       │                    │       │             │                    │
    │                       │                    │  17. Calc Final Fare│                    │
    │                       │                    │  18. Process Payment│                    │
    │                       │                    │  19. Driver Payout  │                    │
    │                       │                    │       │             │                    │
    │  {status:completed,   │                    │                     │                    │
    │   finalFare,          │                    │                     │                    │
    │   payment}            │                    │                     │                    │
    │  ◄────────────────────┼────────────────────┤                     │                    │
    │                       │                    │                     │                    │
```

---

## 3. API GATEWAY DESIGN

### 3.1 Route Table

```
METHOD  PATH                              AUTH       RATE LIMIT    SERVICE           NOTES
──────  ────                              ────       ──────────    ──────────         ─────
POST    /api/v1/auth/send-otp             Public     10/min        Auth Service       Phone number required
POST    /api/v1/auth/verify-otp           Public     10/min        Auth Service       OTP verification
POST    /api/v1/auth/register             Public     5/min          Auth Service       New user creation
POST    /api/v1/auth/login                Public     10/min        Auth Service       Password login
POST    /api/v1/auth/refresh              Public     20/min        Auth Service       Refresh JWT
POST    /api/v1/auth/logout               JWT        20/min        Auth Service       Revoke tokens
POST    /api/v1/auth/forgot-password      Public     5/min          Auth Service       Send reset OTP
POST    /api/v1/auth/reset-password       Public     5/min          Auth Service       Reset with OTP

GET     /api/v1/users/profile             JWT        30/min        User Service       Get current user
PUT     /api/v1/users/profile             JWT        20/min        User Service       Update profile
PUT     /api/v1/users/fcm-token           JWT        30/min        User Service       Update FCM token
GET     /api/v1/users/addresses           JWT        30/min        User Service       Saved addresses
POST    /api/v1/users/addresses           JWT        20/min        User Service       Save address

POST    /api/v1/rides/estimate            JWT        30/min        Ride Service       Fare estimation
POST    /api/v1/rides                     JWT        10/min        Ride Service       Book a ride
GET     /api/v1/rides                     JWT        30/min        Ride Service       Ride history
GET     /api/v1/rides/active              JWT        20/min        Ride Service       Current ride
GET     /api/v1/rides/nearby-drivers      JWT        60/min        Ride Service       Nearby drivers
GET     /api/v1/rides/:id                 JWT        30/min        Ride Service       Ride details
PUT     /api/v1/rides/:id/status          JWT        30/min        Ride Service       Status update
POST    /api/v1/rides/:id/cancel          JWT        10/min        Ride Service       Cancel ride
POST    /api/v1/rides/:id/rate            JWT        10/min        Ride Service       Rate ride
POST    /api/v1/rides/:id/sos             JWT        5/min         Ride Service       SOS alert

GET     /api/v1/drivers/profile           JWT        30/min        Driver Service     Driver profile
PUT     /api/v1/drivers/location          JWT        60/min        Driver Service     Location update
PUT     /api/v1/drivers/status            JWT        30/min        Driver Service     Online/Offline
GET     /api/v1/drivers/earnings          JWT        20/min        Driver Service     Earnings
GET     /api/v1/drivers/dashboard         JWT        20/min        Driver Service     Dashboard data
POST    /api/v1/drivers/vehicle           JWT        10/min        Driver Service     Register vehicle
POST    /api/v1/drivers/kyc              JWT        10/min        Driver Service     Upload KYC
POST    /api/v1/drivers/rides/:id/accept  JWT        30/min        Driver Service     Accept ride
POST    /api/v1/drivers/rides/:id/reject  JWT        30/min        Driver Service     Reject ride

POST    /api/v1/payments/create-order     JWT        10/min        Payment Service    Create Razorpay order
POST    /api/v1/payments/verify           JWT        10/min        Payment Service    Verify payment
GET     /api/v1/payments/wallet           JWT        20/min        Payment Service    Get wallet
POST    /api/v1/payments/wallet/add       JWT        10/min        Payment Service    Add money
GET     /api/v1/payments/wallet/transact  JWT        20/min        Payment Service    Transactions
POST    /api/v1/payments/withdrawal       JWT        10/min        Payment Service    Withdraw
POST    /api/v1/payments/razorpay-webhook Public      100/min      Payment Service    Razorpay webhook

GET     /api/v1/notifications             JWT        30/min        Notification Svc   Get notifications
GET     /api/v1/notifications/unread     JWT        20/min        Notification Svc   Unread count
PUT     /api/v1/notifications/:id/read    JWT        30/min        Notification Svc   Mark read

GET     /api/v1/location/driver/:id       JWT        60/min        Location Service   Driver location
GET     /api/v1/location/nearby-drivers   JWT        60/min        Location Service   GEO search
GET     /api/v1/location/geocode/reverse  JWT        30/min        Location Service   Reverse geocode
GET     /api/v1/location/geocode/search   JWT        30/min        Location Service   Place search
GET     /api/v1/location/route            JWT        30/min        Location Service   Route polyline
GET     /api/v1/location/heatmap          JWT        20/min        Location Service   Heatmap data

GET     /api/v1/admin/dashboard           JWT+Admin  20/min        Admin Service      Stats
GET     /api/v1/admin/users               JWT+Admin  20/min        Admin Service      User list
GET     /api/v1/admin/drivers             JWT+Admin  20/min        Admin Service      Driver list
GET     /api/v1/admin/rides               JWT+Admin  20/min        Admin Service      Ride list
GET     /api/v1/admin/revenue             JWT+Admin  20/min        Admin Service      Revenue analytics
PUT     /api/v1/admin/kyc/:id/process     JWT+Admin  10/min        Admin Service      KYC approve/reject
POST    /api/v1/admin/coupons             JWT+Admin  10/min        Admin Service      Create coupon
PUT     /api/v1/admin/coupons/:id         JWT+Admin  10/min        Admin Service      Update coupon
DELETE  /api/v1/admin/coupons/:id         JWT+Admin  10/min        Admin Service      Delete coupon
POST    /api/v1/admin/config              JWT+Admin  10/min        Admin Service      System config
GET     /api/v1/admin/config/:key         JWT+Admin  20/min        Admin Service      Get config

GET     /api/v1/health                    Public     100/min       -                  Health check
```

### 3.2 API Gateway Middleware Pipeline

```
Incoming Request
       │
       ▼
┌──────────────────┐
│  Rate Limiter     │  ThrottlerModule (100 req/min general, 10 req/min auth)
│  (ThrottlerGuard) │  429 Too Many Requests if exceeded
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Helmet           │  Security headers (X-Frame-Options, CSP, HSTS, etc.)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Compression      │  Gzip/Brotli compression for responses
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Cookie Parser    │  Parse cookies for refresh token support
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  CORS             │  Configurable origins, credentials, methods
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  JWT Auth Guard   │  Validates Bearer token, populates req.user
│  (JwtAuthGuard)   │  {id, role, phone} from JWT payload
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Roles Guard      │  Checks user.role against @Roles() metadata
│  (RolesGuard)     │  Used for admin endpoints
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Validation Pipe  │  whitelist=true, forbidNonWhitelisted=true
│  (ValidationPipe) │  Auto-transform payloads to DTO instances
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Proxy / Route    │  Forward to appropriate microservice
│  Handler          │  HTTP → HTTP proxy or direct NestJS call
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Response         │  Unified response format:
│  Formatter        │  { success, data, error, meta, timestamp }
└────────┬─────────┘
         │
         ▼
   Response Sent
```

### 3.3 Response Format

```json
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "timestamp": "2026-05-31T10:30:00.000Z"
}

// Error
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "Invalid credentials provided",
    "details": { "field": "phone", "reason": "not_found" }
  },
  "timestamp": "2026-05-31T10:30:00.000Z",
  "path": "/api/v1/auth/login"
}
```

---

## 4. DATABASE RELATIONSHIPS (ERD)

### 4.1 Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────────┐       ┌─────────────────┐
│    users     │       │     riders        │       │    drivers       │
├──────────────┤       ├──────────────────┤       ├─────────────────┤
│ PK id (UUID) │1────N│ ride_locations    │       │ PK id (UUID)    │
│ phone (UNQ)  │       └──────────────────┘       │ FK user_id (UQ) │
│ email (UNQ)  │                                   │ phone            │
│ first_name   │       ┌──────────────────┐       │ status           │
│ last_name    │       │    rides          │       │ kyc_status       │
│ role (ENUM)  │1──N  ├──────────────────┤       │ commission_rate  │
│ referral_code│1──N  │ PK id (UUID)      │1──N  │ current_lat/lng  │
│ created_at   │       │ FK rider_id       │       │ rating           │
└──────┬───────┘       │ FK driver_id      │       │ total_rides      │
       │               │ FK vehicle_id     │       │ total_earnings   │
       │               │ ride_type (ENUM)  │       │ created_at       │
       │               │ status (ENUM)     │       └────────┬────────┘
       │               │ pickup_location   │                │
       │               │ pickup_address    │                │
       │               │ dropoff_location  │                │
       │               │ estimated_fare    │                │
       │1              │ actual_fare       │           ┌────┴────┐
       │               │ final_fare        │           │         │
       │               │ payment_status    │           │         │
       │               │ is_sos_triggered  │    ┌──────┴──┐ ┌────┴──────┐
       │               │ created_at        │    │ vehicles │ │kyc_docs  │
       │               └───────┬───────────┘    ├─────────┤ ├──────────┤
       │                       │                │PK id    │ │PK id     │
       │                       │                │FK driver│ │FK driver │
       │                       │                │reg_no   │ │type(ENUM)│
       │                       │                │type     │ │status    │
       │                       │                │model    │ │url       │
       │                       │                │status   │ │expires   │
       │                       │                └─────────┘ └──────────┘
       │              ┌────────┴─────────┐
       │              │                  │
       │        ┌─────┴──────┐    ┌──────┴────────┐
       │        │payments    │    │ride_locations │
       │        ├────────────┤    ├───────────────┤
       │        │PK id       │    │PK id (BIGINT) │
       │        │FK ride_id  │    │FK ride_id     │
       └────────┤FK user_id  │    │latitude       │
                │amount      │    │longitude      │
                │razorpay_id │    │speed          │
                │status      │    │heading        │
                │paid_at     │    │timestamp      │
                └──────┬─────┘    └───────────────┘
                       │
                  ┌────┴────┐
                  │         │
          ┌───────┴──┐ ┌────┴─────────┐
          │ wallets  │ │transactions  │
          ├──────────┤ ├──────────────┤
          │PK id     │ │PK id         │
          │FK user_id│ │FK wallet_id  │
          │FK driver │ │FK ride_id    │
          │balance   │ │amount        │
          │currency  │ │type (ENUM)   │
          └──────────┘ │status        │
                       │description   │
                       │created_at    │
                       └──────────────┘

┌────────────────┐     ┌────────────────┐     ┌──────────────────┐
│  coupons       │     │  ratings       │     │  notifications   │
├────────────────┤     ├────────────────┤     ├──────────────────┤
│ PK id          │     │ PK id          │     │ PK id            │
│ code (UNQ)     │     │ FK ride_id     │     │ FK user_id       │
│ type (ENUM)    │     │ FK rater_id    │     │ title            │
│ value          │     │ FK ratee_id    │     │ body             │
│ max_uses       │     │ rating (1-5)   │     │ type (ENUM)      │
│ is_active      │     │ comment        │     │ channel (ENUM)   │
│ expires_at     │     │ created_at     │     │ is_read          │
│ created_at     │     │ UNIQUE(ride,    │     │ created_at       │
└────────────────┘     │  rater,ratee)  │     └──────────────────┘
                       └────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   ride_pricing   │  │  incentives      │  │  driver_zones    │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ PK id            │  │ PK id            │  │ PK id            │
│ ride_type (ENUM) │  │ FK driver_id     │  │ name             │
│ base_fare        │  │ type             │  │ boundary (POLY)  │
│ per_km_rate      │  │ target_rides     │  │ base_fare_mult   │
│ per_minute_rate  │  │ reward_amount    │  │ is_active        │
│ commission_rate  │  │ is_completed     │  └──────────────────┘
│ gst_percent      │  │ is_paid          │
└──────────────────┘  │ starts_at        │
                      │ ends_at          │
                      └──────────────────┘

┌──────────────────┐  ┌──────────────────┐
│  audit_logs      │  │ system_config    │
├──────────────────┤  ├──────────────────┤
│ PK id (BIGINT)   │  │ PK id            │
│ FK user_id       │  │ key (UNQ)        │
│ action           │  │ value (JSONB)    │
│ entity_type      │  │ description      │
│ entity_id        │  │ is_public        │
│ old_values (J)   │  └──────────────────┘
│ new_values (J)   │
│ ip_address       │  ┌──────────────────┐
│ created_at       │  │ withdrawal_req   │
└──────────────────┘  ├──────────────────┤
                      │ PK id            │
                      │ FK driver_id     │
                      │ amount           │
                      │ account_number   │
                      │ ifsc_code        │
                      │ status           │
                      │ processed_at     │
                      └──────────────────┘
```

### 4.2 Key Relationships Summary

```
users ──1:N──> rides (as rider)
users ──1:1──> drivers
drivers ──1:N──> rides (as driver)
drivers ──1:N──> vehicles
drivers ──1:N──> kyc_documents
drivers ──1:N──> incentives
drivers ──1:N──> withdrawal_requests
rides ──1:N──> ride_locations
rides ──1:1──> payments
rides ──1:1──> ratings (by rider)
rides ──1:1──> ratings (by driver)
users ──1:1──> wallets (rider)
drivers ──1:1──> wallets (driver)
wallets ──1:N──> transactions
users ──1:N──> notifications
users ──1:N──> user_coupons
coupons ──1:N──> user_coupons
users ──1:N──> refresh_tokens
users ──1:N──> audit_logs
```

### 4.3 Index Strategy

```
Table              Indexes                                                      Type
─────              ───────                                                      ────
users              phone (WHERE deleted_at IS NULL)                             UNIQUE BTREE
                   email (WHERE deleted_at IS NULL)                             UNIQUE BTREE
                   referral_code                                                BTREE
                   role                                                         BTREE
                   created_at                                                   BTREE DESC

drivers            user_id                                                      UNIQUE BTREE
                   status                                                       BTREE
                   current_latitude, current_longitude                          GIST (PostGIS)
                   kyc_status                                                   BTREE
                   rating                                                       BTREE DESC

rides              rider_id                                                     BTREE
                   driver_id                                                    BTREE
                   status                                                       BTREE
                   ride_type                                                    BTREE
                   created_at                                                   BTREE DESC
                   pickup_latitude, pickup_longitude                            GIST (PostGIS)
                   scheduled_at (WHERE scheduled_at IS NOT NULL)                BTREE

ride_locations     ride_id                                                      BTREE
                   timestamp                                                    BTREE

payments           ride_id                                                      BTREE
                   user_id                                                      BTREE
                   status                                                       BTREE

transactions       wallet_id                                                    BTREE
                   ride_id                                                      BTREE
                   type                                                         BTREE
                   created_at                                                   BTREE DESC

notifications      user_id                                                      BTREE
                   user_id, is_read                                             COMPOSITE BTREE
                   created_at                                                   BTREE DESC

coupons            code                                                         UNIQUE BTREE
                   is_active (WHERE is_active = TRUE)                           PARTIAL BTREE
```

---

## 5. EVENT FLOW

### 5.1 Event Bus Architecture

```
                    ┌───────────────────────────────────────┐
                    │          REDIS PUB/SUB                │
                    ├───────────────────────────────────────┤
                    │  ride:status_changed                  │
                    │  driver:location_updated              │
                    │  payment:completed                    │
                    │  notification:send                    │
                    │  rider:sos_triggered                  │
                    │  driver:ride_assigned                 │
                    └──────┬──────────────┬─────────────────┘
                           │              │
              ┌────────────┴────┐  ┌──────┴──────────────┐
              │  Publishers     │  │  Subscribers         │
              │  (Services)     │  │  (Services + Apps)   │
              └─────────────────┘  └──────────────────────┘
```

### 5.2 Event Catalog

```
Event                          Publisher         Subscribers         Payload
─────                          ─────────         ──────────          ───────
ride.created                   Ride Service      Matching Svc        {rideId, pickup, rideType}
                                                  Notification Svc
                                                  Admin Svc

ride.status_changed            Ride Service      TrackingGateway     {rideId, status, driverId}
                                                  Payment Svc
                                                  Notification Svc

driver.location_updated        Location Service  Ride Service        {driverId, lat, lng,
                                                  Matching Svc         speed, heading}
                                                  Rider App (WS)

payment.completed              Payment Service   Ride Service        {rideId, paymentId,
                                                  Notification Svc     amount, status}
                                                  Wallet Svc

payment.failed                 Payment Service   Ride Service        {rideId, error,
                                                  Notification Svc     paymentMethod}

driver.ride_accepted           Driver Service    Ride Service        {rideId, driverId,
                                                  Matching Svc         vehicleId}

driver.ride_arrived            Driver Service    Ride Service        {rideId, driverId}

ride.completed                 Ride Service      Payment Svc         {rideId, finalFare,
                                                  Notification Svc     distance, duration}
                                                  Rating Svc
                                                  Admin Svc

user.registered                Auth Service      Wallet Svc          {userId, referralCode}
                                                  Notification Svc
                                                  Coupon Svc

sos.triggered                  Ride Service      Admin Svc           {rideId, riderId,
                                                  Notification Svc     location}
                                                  Emergency Svc

driver.kyc_submitted           Driver Service    Admin Svc           {driverId, documentType}
                                                  Notification Svc

driver.kyc_approved            Admin Service     Driver Svc          {driverId, documentId}
                                                  Notification Svc

coupon.applied                 Coupon Service    Ride Svc            {couponId, rideId,
                                                  Payment Svc          discountAmount}

incentive.earned               Incentive Svc     Wallet Svc          {driverId, incentiveId,
                                                  Notification Svc     amount}
```

### 5.3 Ride Status State Machine

```
                    ┌──────────┐
                    │  PENDING │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │ SEARCHING│◄────────────────┐
                    └────┬─────┘                  │
                         │                        │
              ┌──────────┼──────────┐             │
              │          │          │             │
         ┌────▼───┐  ┌──▼──────┐   │             │
         │CANCELLED│  │DRIVER   │   │             │
         │(rider)  │  │ASSIGNED │   │             │
         └─────────┘  └──┬──────┘   │             │
                         │          │             │
                    ┌────▼─────┐    │             │
                    │  ARRIVED │    │             │
                    └────┬─────┘    │             │
                         │          │             │
                    ┌────▼──────┐   │             │
                    │IN_PROGRESS│   │             │
                    └────┬──────┘   │             │
                         │          │             │
                    ┌────▼──────┐   │             │
                    │ COMPLETED │   │             │
                    └────┬──────┘   │             │
                         │          │             │
                    ┌────▼──────┐   │             │
                    │CANCELLED  │   │             │
                    │(post-     │   │             │
                    │ completion)│  │             │
                    └───────────┘   │             │
                                    │             │
Valid Transitions:                  │             │
  pending      → searching, cancelled             │
  searching    → driver_assigned, cancelled        │
  driver_assigned → arrived, cancelled            │
  arrived      → in_progress, cancelled           │
  in_progress  → completed                        │
  scheduled    → searching, cancelled             │
```

---

## 6. DEPLOYMENT ARCHITECTURE

### 6.1 Environment Matrix

```
┌────────────────┬─────────────────┬─────────────────┬─────────────────┐
│                │ Development      │ Staging          │ Production      │
├────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ Instances      │ Local Docker    │ K8s (3 nodes)    │ K8s (10+ nodes) │
│ Database       │ Local PgSQL     │ RDS PostgreSQL   │ RDS Multi-AZ    │
│ Redis          │ Local Redis     │ ElastiCache      │ ElastiCache CC  │
│ Storage        │ Local FS        │ S3 Bucket        │ S3 + CDN        │
│ Monitoring     │ -               │ Prometheus+Graf  │ Full stack      │
│ CI/CD          │ Manual          │ Auto on develop  │ Auto on main    │
│ SSL            │ Self-signed     │ Let's Encrypt    │ AWS ACM         │
│ Domain         │ localhost       │ staging.api.x    │ api.rideshare.x │
└────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

### 6.2 Kubernetes Cluster Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          KUBERNETES CLUSTER                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Node Pool  │  │  Node Pool  │  │  Node Pool  │  │  Node Pool  │    │
│  │  (Services)  │  │  (Services) │  │  (Data)     │  │  (Spot)     │    │
│  │              │  │             │  │             │  │             │    │
│  │ api-gateway  │  │ ride-service│  │ postgres    │  │ worker-pool │    │
│  │ auth-service │  │ pay-service │  │ redis       │  │ bg-jobs     │    │
│  │ user-service │  │ notif-svc   │  │             │  │ batch-proc  │    │
│  │ driver-svc   │  │ admin-svc   │  │             │  │             │    │
│  │ admin-panel  │  │ loc-svc     │  │             │  │             │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    INGRESS CONTROLLER (NGINX)                    │    │
│  │         api.ridesharing.com  │  admin.ridesharing.com            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      CERT-MANAGER                                │    │
│  │                    Let's Encrypt ClusterIssuer                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────────┐ │
│  │ Prometheus │  │  Grafana   │  │  Loki      │  │  ELK Stack       │ │
│  │ (Metrics)  │  │ (Dashboards)│  │ (Logs)     │  │  (Search)        │ │
│  └────────────┘  └────────────┘  └────────────┘  └──────────────────┘ │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                   CLUSTER AUTOSCALER                             │    │
│  │       min: 3 nodes  │  max: 20 nodes  │  target: 70% CPU         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Horizontal Pod Autoscaling Configuration

```
Service           Min  Max  CPU Target  Memory Target
────────────────  ───  ───  ──────────  ─────────────
api-gateway        3    15   70%         80%
auth-service       2    10   70%         80%
ride-service       3    20   70%         80%
driver-service     2    10   70%         80%
payment-service    2    10   60%         75%
notification-svc   2     8   70%         80%
location-service   2    10   70%         80%
admin-service      1     5   70%         80%
admin-panel        1     3   80%         85%
```

### 6.4 CI/CD Pipeline Stages

```
                    ┌─────────────────────────────────────────────────┐
                    │              GITHUB ACTIONS WORKFLOW             │
                    ├─────────────────────────────────────────────────┤
                    │                                                  │
                    │  CODE PUSH (main / develop)                      │
                    │       │                                          │
                    │       ▼                                          │
                    │  ┌──────────┐                                    │
                    │  │  Lint    │  ESLint + Prettier                 │
                    │  └────┬─────┘                                    │
                    │       ▼                                          │
                    │  ┌──────────┐                                    │
                    │  │   Test   │  Jest (unit + integration)         │
                    │  └────┬─────┘                                    │
                    │       ▼                                          │
                    │  ┌──────────────────┐                            │
                    │  │  Security Scan   │  Snyk + Trivy             │
                    │  └───────┬──────────┘                            │
                    │          ▼                                       │
                    │  ┌──────────────────┐                            │
                    │  │  Docker Build    │  10 images in parallel     │
                    │  └───────┬──────────┘                            │
                    │          ▼                                       │
                    │  ┌──────────────────┐                            │
                    │  │  Push to Registry│  ghcr.io                   │
                    │  └───────┬──────────┘                            │
                    │          │                                       │
                    │     ┌────┴────┐                                  │
                    │     │         │                                  │
                    │  ┌──▼────┐ ┌──▼──────────┐                      │
                    │  │Staging│ │ Production   │                      │
                    │  │(develop) │ (main)      │                      │
                    │  └────────┘ │             │                      │
                    │             │ K8s Apply   │                      │
                    │             │ Rollout Ver.│                      │
                    │             │ Smoke Test  │                      │
                    │             └─────────────┘                      │
                    │                                                  │
                    └─────────────────────────────────────────────────┘
```

---

## 7. FOLDER STRUCTURE

```
ride-hailing/
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml                          # Complete CI/CD pipeline
│
├── backend/
│   ├── api-gateway/
│   │   ├── src/
│   │   │   ├── main.ts                        # Bootstrap with Swagger, Helmet, CORS
│   │   │   ├── app.module.ts                  # Root module with Throttler, Router
│   │   │   ├── config/
│   │   │   │   └── proxy.config.ts            # Service routing table
│   │   │   ├── middleware/
│   │   │   │   ├── jwt-auth.guard.ts          # JWT validation guard
│   │   │   │   └── roles.guard.ts             # Role-based access control
│   │   │   ├── decorators/
│   │   │   │   ├── public.decorator.ts        # @Public() route marker
│   │   │   │   └── roles.decorator.ts         # @Roles('admin') decorator
│   │   │   └── routes/
│   │   │       ├── auth.module.ts             # Auth proxy controller
│   │   │       ├── user.module.ts             # User proxy controller
│   │   │       ├── ride.module.ts             # Ride proxy controller
│   │   │       ├── driver.module.ts           # Driver proxy controller
│   │   │       ├── payment.module.ts          # Payment proxy controller
│   │   │       ├── admin.module.ts            # Admin proxy controller
│   │   │       └── health.module.ts           # Health check endpoints
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── services/
│   │   ├── auth-service/                      # PORT: 3001
│   │   │   └── src/
│   │   │       ├── main.ts
│   │   │       ├── config/
│   │   │       │   └── database.config.ts
│   │   │       ├── modules/
│   │   │       │   ├── auth/
│   │   │       │   │   ├── auth.module.ts
│   │   │       │   │   ├── auth.service.ts
│   │   │       │   │   ├── auth.controller.ts
│   │   │       │   │   ├── auth.service.spec.ts
│   │   │       │   │   ├── strategies/
│   │   │       │   │   │   └── jwt.strategy.ts
│   │   │       │   │   └── entities/
│   │   │       │   │       ├── otp.entity.ts
│   │   │       │   │       └── refresh-token.entity.ts
│   │   │       │   ├── users/
│   │   │       │   │   └── user.entity.ts
│   │   │       │   └── wallets/
│   │   │       │       └── wallet.entity.ts
│   │   │       └── common/
│   │   │           └── guards/
│   │   │               └── jwt-auth.guard.ts
│   │   │
│   │   ├── user-service/                      # PORT: 3002
│   │   │   └── src/
│   │   │       ├── main.ts
│   │   │       ├── config/
│   │   │       │   └── database.config.ts
│   │   │       └── modules/
│   │   │           ├── users/
│   │   │           │   ├── user.module.ts
│   │   │           │   ├── user.service.ts
│   │   │           │   └── user.controller.ts
│   │   │           └── addresses/
│   │   │               ├── address.entity.ts
│   │   │               ├── address.service.ts
│   │   │               └── address.controller.ts
│   │   │
│   │   ├── ride-service/                      # PORT: 3003
│   │   │   └── src/
│   │   │       ├── main.ts
│   │   │       ├── config/
│   │   │       │   └── database.config.ts
│   │   │       └── modules/
│   │   │           ├── rides/
│   │   │           │   ├── ride-service.module.ts
│   │   │           │   ├── ride.service.ts
│   │   │           │   ├── ride.service.spec.ts
│   │   │           │   ├── ride.controller.ts
│   │   │           │   └── entities/
│   │   │           │       ├── ride.entity.ts
│   │   │           │       └── ride-location.entity.ts
│   │   │           ├── pricing/
│   │   │           │   ├── pricing.module.ts
│   │   │           │   ├── pricing.service.ts
│   │   │           │   └── entities/
│   │   │           │       └── pricing.entity.ts
│   │   │           ├── matching/
│   │   │           │   ├── matching.module.ts
│   │   │           │   └── matching.service.ts
│   │   │           └── tracking/
│   │   │               ├── tracking.module.ts
│   │   │               └── tracking.gateway.ts    # Socket.IO gateway
│   │   │
│   │   ├── driver-service/                    # PORT: 3004
│   │   │   └── src/
│   │   │       ├── main.ts
│   │   │       └── modules/
│   │   │           ├── drivers/
│   │   │           │   ├── driver.module.ts
│   │   │           │   ├── driver.service.ts
│   │   │           │   ├── driver.controller.ts
│   │   │           │   └── driver.entity.ts
│   │   │           ├── vehicles/
│   │   │           │   ├── vehicle.entity.ts
│   │   │           │   ├── vehicle.service.ts
│   │   │           │   └── vehicle.controller.ts
│   │   │           └── documents/
│   │   │               ├── kyc.entity.ts
│   │   │               ├── kyc.service.ts
│   │   │               └── kyc.controller.ts
│   │   │
│   │   ├── payment-service/                   # PORT: 3005
│   │   │   └── src/
│   │   │       ├── main.ts
│   │   │       ├── config/
│   │   │       │   └── database.config.ts
│   │   │       └── modules/
│   │   │           └── payments/
│   │   │               ├── payment.module.ts
│   │   │               ├── payment.service.ts
│   │   │               ├── payment.service.spec.ts
│   │   │               ├── payment.controller.ts
│   │   │               ├── razorpay.provider.ts
│   │   │               ├── strategies/
│   │   │               │   └── jwt.strategy.ts
│   │   │               └── entities/
│   │   │                   ├── payment.entity.ts
│   │   │                   ├── wallet.entity.ts
│   │   │                   ├── transaction.entity.ts
│   │   │                   └── withdrawal-request.entity.ts
│   │   │
│   │   ├── notification-service/              # PORT: 3006
│   │   │   └── src/
│   │   │       ├── main.ts
│   │   │       ├── config/
│   │   │       │   └── database.config.ts
│   │   │       └── modules/
│   │   │           └── notifications/
│   │   │               ├── notification.module.ts
│   │   │               ├── notification.service.ts
│   │   │               ├── notification.controller.ts
│   │   │               ├── firebase.provider.ts
│   │   │               ├── mail.provider.ts
│   │   │               ├── strategies/
│   │   │               │   └── jwt.strategy.ts
│   │   │               └── entities/
│   │   │                   └── notification.entity.ts
│   │   │
│   │   ├── location-service/                  # PORT: 3007
│   │   │   └── src/
│   │   │       ├── main.ts
│   │   │       ├── config/
│   │   │       │   └── database.config.ts
│   │   │       ├── modules/
│   │   │       │   └── location/
│   │   │       │       ├── location.module.ts
│   │   │       │       ├── location.service.ts
│   │   │       │       └── location.controller.ts
│   │   │       ├── redis/
│   │   │       │   └── redis.provider.ts
│   │   │       └── common/
│   │   │           └── guards/
│   │   │               └── jwt-auth.guard.ts
│   │   │
│   │   └── admin-service/                     # PORT: 3008
│   │       └── src/
│   │           ├── main.ts
│   │           ├── config/
│   │           │   └── database.config.ts
│   │           ├── modules/
│   │           │   └── admin/
│   │           │       ├── admin.module.ts
│   │           │       ├── admin.service.ts
│   │           │       └── admin.controller.ts
│   │           └── common/
│   │               └── guards/
│   │                   ├── jwt-auth.guard.ts
│   │                   └── roles.guard.ts
│   │
│   └── shared/                                 # Shared library (@ride/shared)
│       └── src/
│           ├── index.ts
│           ├── interfaces/
│           │   ├── index.ts
│           │   ├── user.interface.ts
│           │   ├── driver.interface.ts
│           │   ├── ride.interface.ts
│           │   ├── payment.interface.ts
│           │   ├── notification.interface.ts
│           │   ├── location.interface.ts
│           │   └── coupon.interface.ts
│           ├── dto/
│           │   ├── index.ts
│           │   ├── auth.dto.ts
│           │   ├── ride.dto.ts
│           │   ├── payment.dto.ts
│           │   ├── driver.dto.ts
│           │   └── user.dto.ts
│           ├── constants/
│           │   ├── index.ts
│           │   ├── errors.constant.ts
│           │   └── ride.constant.ts
│           ├── types/
│           │   └── index.ts
│           └── utils/
│               ├── index.ts
│               ├── helpers.ts
│               ├── distance.ts
│               └── geocoding.ts
│
├── rider-app/                                  # Flutter Rider Mobile App
│   ├── lib/
│   │   ├── main.dart
│   │   └── src/
│   │       ├── core/
│   │       │   ├── config/
│   │       │   │   └── app_config.dart
│   │       │   ├── theme/
│   │       │   │   └── app_theme.dart
│   │       │   ├── network/
│   │       │   │   └── api_client.dart          # Dio + Auth interceptor
│   │       │   ├── routes/
│   │       │   │   └── app_router.dart          # GoRouter
│   │       │   ├── services/
│   │       │   │   ├── socket_service.dart
│   │       │   │   ├── location_service.dart
│   │       │   │   └── firebase_service.dart
│   │       │   ├── storage/
│   │       │   │   └── secure_storage.dart
│   │       │   └── widgets/
│   │       │       ├── ride_type_selector.dart
│   │       │       ├── map_view.dart
│   │       │       ├── driver_card.dart
│   │       │       └── loading_shimmer.dart
│   │       ├── features/
│   │       │   ├── auth/
│   │       │   │   ├── pages/
│   │       │   │   │   ├── login_page.dart
│   │       │   │   │   ├── otp_page.dart
│   │       │   │   │   └── register_page.dart
│   │       │   │   └── providers/
│   │       │   │       └── auth_provider.dart
│   │       │   ├── home/
│   │       │   │   ├── pages/
│   │       │   │   │   └── home_page.dart
│   │       │   │   └── providers/
│   │       │   │       └── home_provider.dart
│   │       │   ├── booking/
│   │       │   │   ├── pages/
│   │       │   │   │   ├── pickup_page.dart
│   │       │   │   │   └── dropoff_page.dart
│   │       │   │   └── providers/
│   │       │   │       └── booking_provider.dart
│   │       │   ├── ride/
│   │       │   │   ├── pages/
│   │       │   │   │   └── ride_tracking_page.dart
│   │       │   │   └── providers/
│   │       │   │       └── ride_provider.dart
│   │       │   ├── wallet/
│   │       │   │   ├── pages/
│   │       │   │   │   ├── wallet_page.dart
│   │       │   │   │   └── add_money_page.dart
│   │       │   │   └── providers/
│   │       │   │       └── wallet_provider.dart
│   │       │   ├── history/
│   │       │   │   ├── pages/
│   │       │   │   │   ├── ride_history_page.dart
│   │       │   │   │   └── ride_detail_page.dart
│   │       │   │   └── providers/
│   │       │   │       └── history_provider.dart
│   │       │   ├── profile/
│   │       │   │   ├── pages/
│   │       │   │   │   └── profile_page.dart
│   │       │   │   └── providers/
│   │       │   │       └── profile_provider.dart
│   │       │   ├── coupons/
│   │       │   │   ├── pages/
│   │       │   │   │   └── coupons_page.dart
│   │       │   │   └── providers/
│   │       │   │       └── coupon_provider.dart
│   │       │   ├── ratings/
│   │       │   │   ├── pages/
│   │       │   │   │   └── rate_ride_page.dart
│   │       │   │   └── providers/
│   │       │   │       └── rating_provider.dart
│   │       │   ├── sos/
│   │       │   │   ├── pages/
│   │       │   │   │   └── sos_page.dart
│   │       │   │   └── providers/
│   │       │   │       └── sos_provider.dart
│   │       │   └── notifications/
│   │       │       ├── pages/
│   │       │       │   └── notifications_page.dart
│   │       │       └── providers/
│   │       │           └── notification_provider.dart
│   │       ├── models/
│   │       │   ├── user_model.dart
│   │       │   ├── ride_model.dart
│   │       │   ├── driver_model.dart
│   │       │   ├── payment_model.dart
│   │       │   └── coupon_model.dart
│   │       ├── providers/
│   │       │   └── app_providers.dart
│   │       └── repositories/
│   │           ├── auth_repository.dart
│   │           ├── ride_repository.dart
│   │           ├── payment_repository.dart
│   │           └── user_repository.dart
│   ├── assets/
│   │   ├── images/
│   │   ├── fonts/
│   │   └── animations/
│   ├── test/
│   ├── pubspec.yaml
│   ├── android/
│   ├── ios/
│   └── web/
│
├── driver-app/                                 # Flutter Driver Mobile App
│   ├── lib/
│   │   ├── main.dart
│   │   └── src/
│   │       ├── core/
│   │       │   ├── config/
│   │       │   │   └── app_config.dart
│   │       │   ├── theme/
│   │       │   │   └── app_theme.dart
│   │       │   ├── network/
│   │       │   │   └── api_client.dart
│   │       │   ├── routes/
│   │       │   │   └── app_router.dart
│   │       │   ├── services/
│   │       │   │   ├── socket_service.dart
│   │       │   │   ├── location_service.dart
│   │       │   │   └── audio_service.dart
│   │       │   └── widgets/
│   │       │       ├── ride_request_card.dart
│   │       │       ├── earnings_card.dart
│   │       │       └── online_toggle.dart
│   │       ├── features/
│   │       │   ├── auth/
│   │       │   │   └── pages/
│   │       │   │       └── login_page.dart
│   │       │   ├── home/
│   │       │   │   ├── pages/
│   │       │   │   │   └── home_page.dart
│   │       │   │   └── providers/
│   │       │   │       └── home_provider.dart
│   │       │   ├── earnings/
│   │       │   │   ├── pages/
│   │       │   │   │   ├── earnings_page.dart
│   │       │   │   │   ├── daily_report_page.dart
│   │       │   │   │   └── weekly_report_page.dart
│   │       │   │   └── providers/
│   │       │   │       └── earnings_provider.dart
│   │       │   ├── ride/
│   │       │   │   ├── pages/
│   │       │   │   │   ├── ride_request_page.dart
│   │       │   │   │   └── ride_tracking_page.dart
│   │       │   │   └── providers/
│   │       │   │       └── ride_provider.dart
│   │       │   ├── wallet/
│   │       │   │   ├── pages/
│   │       │   │   │   ├── wallet_page.dart
│   │       │   │   │   └── withdrawal_page.dart
│   │       │   │   └── providers/
│   │       │   │       └── wallet_provider.dart
│   │       │   ├── profile/
│   │       │   │   ├── pages/
│   │       │   │   │   └── profile_page.dart
│   │       │   │   └── providers/
│   │       │   │       └── profile_provider.dart
│   │       │   ├── history/
│   │       │   │   ├── pages/
│   │       │   │   │   └── ride_history_page.dart
│   │       │   │   └── providers/
│   │       │   │       └── history_provider.dart
│   │       │   ├── documents/
│   │       │   │   ├── pages/
│   │       │   │   │   ├── documents_page.dart
│   │       │   │   │   └── vehicle_registration_page.dart
│   │       │   │   └── providers/
│   │       │   │       └── document_provider.dart
│   │       │   ├── notifications/
│   │       │   │   ├── pages/
│   │       │   │   │   └── notifications_page.dart
│   │       │   │   └── providers/
│   │       │   ├── incentives/
│   │       │   │   ├── pages/
│   │       │   │   │   └── incentives_page.dart
│   │       │   │   └── providers/
│   │       │   │       └── incentive_provider.dart
│   │       │   └── navigation/
│   │       │       └── services/
│   │       │           └── navigation_service.dart
│   │       ├── models/
│   │       │   ├── driver_model.dart
│   │       │   ├── earning_model.dart
│   │       │   └── ride_model.dart
│   │       ├── providers/
│   │       │   └── app_providers.dart
│   │       └── repositories/
│   │           ├── auth_repository.dart
│   │           ├── ride_repository.dart
│   │           ├── earning_repository.dart
│   │           └── document_repository.dart
│   ├── assets/
│   ├── test/
│   ├── pubspec.yaml
│   ├── android/
│   ├── ios/
│   └── web/
│
├── admin-panel/                                # React Admin Dashboard
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                              # Routes, QueryClient, Theme
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── AdminLayout.tsx              # Sidebar + AppBar
│   │   │   ├── dashboard/
│   │   │   │   ├── StatsCard.tsx
│   │   │   │   ├── RevenueChart.tsx
│   │   │   │   └── RecentActivity.tsx
│   │   │   ├── users/
│   │   │   │   ├── UserTable.tsx
│   │   │   │   └── UserDetail.tsx
│   │   │   ├── drivers/
│   │   │   │   ├── DriverTable.tsx
│   │   │   │   └── DriverDetail.tsx
│   │   │   ├── rides/
│   │   │   │   ├── RideTable.tsx
│   │   │   │   └── RideDetail.tsx
│   │   │   ├── kyc/
│   │   │   │   ├── KYCQueue.tsx
│   │   │   │   └── KYCDetail.tsx
│   │   │   ├── coupons/
│   │   │   │   ├── CouponTable.tsx
│   │   │   │   └── CouponForm.tsx
│   │   │   └── common/
│   │   │       ├── DataTable.tsx
│   │   │       ├── StatusBadge.tsx
│   │   │       └── ConfirmDialog.tsx
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── UsersPage.tsx
│   │   │   ├── DriversPage.tsx
│   │   │   ├── RidesPage.tsx
│   │   │   ├── RevenuePage.tsx
│   │   │   ├── KYCPage.tsx
│   │   │   ├── CouponsPage.tsx
│   │   │   └── LoginPage.tsx
│   │   ├── services/
│   │   │   └── api.service.ts
│   │   ├── store/
│   │   │   └── auth.store.ts
│   │   ├── utils/
│   │   │   ├── formatters.ts
│   │   │   └── validators.ts
│   │   ├── hooks/
│   │   │   ├── useDebounce.ts
│   │   │   └── usePagination.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── styles/
│   │   │   └── global.css
│   │   └── config/
│   │       └── app.config.ts
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── database/
│   ├── migrations/
│   │   └── 001_initial_schema.sql              # Complete PostgreSQL schema
│   ├── seeds/
│   │   ├── 001_admin_user.sql
│   │   ├── 002_ride_pricing.sql
│   │   └── 003_test_data.sql
│   └── scripts/
│       ├── migrate.sh
│       └── seed.sh
│
├── docker/
│   ├── docker-compose.yml                      # Full stack Docker Compose
│   ├── Dockerfile.node                         # Multi-stage Node.js build
│   ├── Dockerfile.admin                        # Admin panel build + nginx
│   ├── nginx/
│   │   ├── nginx.conf                          # Main nginx config
│   │   └── default.conf                        # Route config

│   └── postgres/
│       └── init.sql
│
├── kubernetes/
│   ├── base/
│   │   ├── namespace.yaml                      # ride-hailing namespace
│   │   ├── configmap.yaml                      # Shared config
│   │   ├── secrets.yaml                        # DB + JWT + API keys
│   │   ├── postgres.yaml                       # StatefulSet + Service
│   │   ├── redis.yaml                          # Deployment + PVC + Service
│   │   ├── api-gateway.yaml                    # Deployment + HPA + Service
│   │   ├── microservice-template.yaml          # Template for all services
│   │   └── ingress.yaml                        # NGINX Ingress + TLS
│   └── overlays/
│       ├── production/
│       │   ├── kustomization.yaml
│       │   └── production-patches.yaml
│       └── staging/
│           ├── kustomization.yaml
│           └── staging-patches.yaml
│
├── helm/
│   └── ride-hailing/
│       ├── Chart.yaml
│       ├── values.yaml
│       ├── values-production.yaml
│       └── templates/
│           ├── _helpers.tpl
│           ├── deployment.yaml
│           ├── service.yaml
│           ├── ingress.yaml
│           ├── hpa.yaml
│           ├── configmap.yaml
│           └── secrets.yaml
│
├── monitoring/
│   ├── prometheus/
│   │   ├── prometheus.yml                      # Scrape configs
│   │   └── alerts.yml                          # Alerting rules
│   └── grafana/
│       ├── datasources/
│       │   └── prometheus.yml
│       └── dashboards/
│           ├── service-metrics.json
│           └── business-metrics.json
│
├── logs/
│   └── .gitkeep
│
├── .env.example                                # Environment template
├── .gitignore
├── package.json                                # Root workspace
└── README.md
```

---

## 8. TECHNOLOGY VERSION MATRIX

```
Component              Version       Purpose
─────────              ───────       ───────
Node.js                20 LTS        Runtime
NestJS                 10.3          Backend framework
TypeScript             5.4           Language
PostgreSQL             16 + PostGIS  Primary database
Redis                  7             Cache + Pub/Sub
Socket.IO              4.7           Real-time communication
Flutter                3.16+         Mobile framework
Dart                   3.2+          Mobile language
React                  18.2          Admin panel UI
MUI                    5.15          Component library
TypeORM                0.3           ORM
Passport               0.7           Authentication
JWT                    10.2          Token management
Razorpay               2.0+          Payment gateway
Firebase Admin         12+           Push notifications
Firebase FCM           14+           Client push
Docker                 24+           Containerization
Kubernetes             1.28+         Orchestration
GitHub Actions         -             CI/CD
Prometheus             2.50+         Metrics
Grafana                10+           Visualization
Helm                   3+            K8s package manager
NGINX                  1.24+         Reverse proxy
```

---

## 9. SECURITY ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Layer 1: Network Security                                          │
│  ├── TLS 1.3 (SSL termination at NGINX/Ingress)                    │
│  ├── VPC with private subnets for services                          │
│  ├── Security Groups limiting inter-service traffic                 │
│  └── WAF (AWS WAF or Cloudflare) for DDoS protection               │
│                                                                     │
│  Layer 2: API Security                                              │
│  ├── Rate Limiting (100/min general, 10/min auth)                  │
│  ├── Helmet security headers (CSP, HSTS, X-Frame-Options)          │
│  ├── CORS whitelist                                                 │
│  ├── Request size limits (10MB max)                                 │
│  └── API key validation for service-to-service calls               │
│                                                                     │
│  Layer 3: Authentication & Authorization                            │
│  ├── JWT Access Token (15min expiry, RS256 signed)                  │
│  ├── Refresh Token (30day expiry, stored hashed in DB)             │
│  ├── Role-Based Access Control (rider, driver, admin, superadmin)  │
│  ├── OTP-based login (6-digit, 5min expiry)                        │
│  └── Account lockout after 5 failed attempts                       │
│                                                                     │
│  Layer 4: Data Security                                             │
│  ├── Password hashing with bcrypt (12 rounds)                      │
│  ├── Sensitive fields encrypted at rest (AES-256)                  │
│  ├── SQL injection prevention via parameterized queries             │
│  ├── Input validation via class-validator DTOs                     │
│  └── Audit logging for all mutation operations                     │
│                                                                     │
│  Layer 5: Payment Security                                          │
│  ├── Razorpay webhook signature verification                        │
│  ├── PCI compliance via Razorpay (no card data stored)             │
│  ├── Idempotency keys for payment operations                       │
│  └── Transaction amount validation                                  │
│                                                                     │
│  Layer 6: Secrets Management                                        │
│  ├── Environment variables (never in code)                         │
│  ├── Kubernetes Secrets (base64 encoded at rest)                   │
│  ├── Vault or AWS Secrets Manager for production                   │
│  └── GitHub Actions secrets for CI/CD                              │
│                                                                     │
│  Layer 7: Monitoring & Auditing                                     │
│  ├── All admin actions logged to audit_logs table                  │
│  ├── Prometheus metrics for anomaly detection                      │
│  ├── ELK stack for centralized logging                             │
│  └── Alertmanager for real-time incident notification              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

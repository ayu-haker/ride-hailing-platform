# Ride-Hailing Platform

Production-ready ride-hailing platform similar to Rapido/Uber built with microservice architecture.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        NGINX Reverse Proxy                       │
├─────────────────────────────────────────────────────────────────┤
│                         API Gateway                              │
├──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬─────────┤
│ Auth │ User │ Ride │Driv'r│ Pay  │ Notif│ Loc  │Admin │         │
│ Svc  │ Svc  │ Svc  │ Svc  │ Svc  │ Svc  │ Svc  │ Svc  │  Redis  │
├──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴─────────┤
│                       PostgreSQL + PostGIS                        │
├─────────────────────────────────────────────────────────────────┤
│                    S3 Compatible Storage                          │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Node.js + NestJS (TypeScript) |
| Frontend (Mobile) | Flutter (Rider + Driver) |
| Admin Panel | React + TypeScript + MUI |
| Database | PostgreSQL 16 + PostGIS |
| Cache | Redis 7 |
| Realtime | Socket.IO |
| Maps | OpenStreetMap + Mapbox |
| Auth | JWT + Refresh Tokens |
| Payments | Razorpay |
| Storage | S3 Compatible |
| Notifications | Firebase FCM |
| Container | Docker + Docker Compose |
| Orchestration | Kubernetes |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana |

## Project Structure

```
ride-hailing/
├── backend/
│   ├── api-gateway/          # API Gateway (NestJS)
│   └── services/
│       ├── auth-service/     # Authentication & Authorization
│       ├── user-service/     # User management
│       ├── driver-service/    # Driver management
│       ├── ride-service/     # Ride booking & matching
│       ├── payment-service/  # Payments, wallets, transactions
│       ├── notification-svc/ # Push, email, SMS notifications
│       ├── location-service/ # GPS tracking, geocoding, heatmaps
│       └── admin-service/    # Admin operations, analytics
├── rider-app/                # Rider Flutter App
├── driver-app/               # Driver Flutter App
├── admin-panel/              # React Admin Dashboard
├── database/
│   └── migrations/           # SQL migration files
├── docker/                   # Docker & Nginx configs
├── kubernetes/               # K8s manifests
├── monitoring/               # Prometheus, Grafana configs
└── .github/workflows/        # CI/CD pipelines
```

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Flutter 3.16+
- PostgreSQL 16

### Local Development

```bash
# 1. Start infrastructure
docker-compose -f docker/docker-compose.yml up -d postgres redis

# 2. Install dependencies
cd backend && npm install

# 3. Run database migrations
cd database && npm run migrate

# 4. Start services (in separate terminals)
cd services/auth-service && npm run start:dev
cd services/ride-service && npm run start:dev
cd services/payment-service && npm run start:dev

# 5. Start API Gateway
cd api-gateway && npm run start:dev

# 6. Run Flutter apps
cd rider-app && flutter run
cd driver-app && flutter run

# 7. Run Admin Panel
cd admin-panel && npm run dev
```

### Docker Deployment

```bash
# Start all services
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f
```

### Kubernetes Deployment

```bash
# Create namespace and apply manifests
kubectl apply -f kubernetes/base/

# Check status
kubectl get pods -n ride-hailing
kubectl get services -n ride-hailing
```

## API Documentation

Once running, access Swagger docs at:
- http://localhost:3000/api/docs

## Environment Variables

Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

## Testing

```bash
# Run all tests
cd backend && npm test

# Run specific service tests
cd services/auth-service && npm test
cd services/ride-service && npm test
cd services/payment-service && npm test
```

## Database Schema

Complete PostgreSQL schema with PostGIS extensions including:
- users, drivers, vehicles, rides, ride_locations
- payments, wallets, transactions
- ratings, notifications, coupons
- kyc_documents, audit_logs, system_config
- driver_zones, ride_pricing, incentives
- withdrawal_requests

## Features

### Rider App
- OTP Authentication, Profile Management
- Live Map with Ride Type Selection (Bike/Auto/Cab)
- Fare Estimation, Ride Booking
- Real-time Driver Tracking
- SOS Button, Ride History
- Wallet, Coupons, Ratings
- Push Notifications, Dark Mode

### Driver App
- KYC Upload, Vehicle Registration
- Online/Offline Toggle
- Ride Request Accept/Reject
- Navigation, Earnings Dashboard
- Wallet with Withdrawals
- Ratings, Ride History, Heat Map

### Admin Panel
- Dashboard with Analytics
- User/Driver/Ride Management
- Revenue Analytics
- KYC Approval System
- Coupon Management
- System Configuration

## Security

- JWT with refresh token rotation
- Rate limiting (API + auth)
- Helmet security headers
- Input validation (class-validator)
- Role-based access control
- SQL injection prevention
- Audit logging
- Encrypted secrets

## License

MIT

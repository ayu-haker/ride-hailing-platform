import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RideEntity } from '../rides/entities/ride.entity';

interface LocationUpdate {
  rideId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/tracking',
  transports: ['websocket', 'polling'],
})
export class TrackingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);
  private connectedClients: Map<string, { userId: string; role: string; socketId: string }> = new Map();

  handleConnection(client: Socket) {
    const { userId, role } = client.handshake.query as any;
    if (userId) {
      this.connectedClients.set(client.id, { userId, role, socketId: client.id });
      client.join(`user:${userId}`);
      this.logger.log(`Client connected: ${userId} (${role})`);
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('track:driver-location')
  handleDriverLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: LocationUpdate,
  ) {
    this.server.to(`ride:${data.rideId}`).emit('ride:driver-location', data);
  }

  @SubscribeMessage('ride:join')
  handleJoinRide(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { rideId: string },
  ) {
    client.join(`ride:${data.rideId}`);
    this.logger.log(`Client joined ride room: ${data.rideId}`);
  }

  @SubscribeMessage('ride:leave')
  handleLeaveRide(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { rideId: string },
  ) {
    client.leave(`ride:${data.rideId}`);
  }

  broadcastRideUpdate(ride: RideEntity) {
    this.server.to(`ride:${ride.id}`).emit('ride:status-update', {
      rideId: ride.id,
      status: ride.status,
      driverId: ride.driverId,
      timestamp: new Date(),
    });
  }

  broadcastSOSAlert(ride: RideEntity) {
    this.server.to(`ride:${ride.id}`).emit('ride:sos-alert', {
      rideId: ride.id,
      riderId: ride.riderId,
      driverId: ride.driverId,
      latitude: Number(ride.pickupLatitude),
      longitude: Number(ride.pickupLongitude),
      timestamp: new Date(),
    });

    this.server.to('admin').emit('admin:sos-alert', {
      rideId: ride.id,
      riderId: ride.riderId,
      driverId: ride.driverId,
      timestamp: new Date(),
    });
  }

  broadcastNearbyDrivers(
    riderId: string,
    drivers: Array<{
      driverId: string;
      latitude: number;
      longitude: number;
      distanceMeters: number;
      etaSeconds: number;
    }>,
  ) {
    this.server.to(`user:${riderId}`).emit('ride:nearby-drivers', drivers);
  }

  @SubscribeMessage('driver:location-update')
  handleDriverLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      rideId: string;
      latitude: number;
      longitude: number;
      speed?: number;
      heading?: number;
    },
  ) {
    this.server.to(`ride:${data.rideId}`).emit('ride:driver-location', {
      ...data,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('rider:location-update')
  handleRiderLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      rideId: string;
      latitude: number;
      longitude: number;
    },
  ) {
    this.server.to(`ride:${data.rideId}`).emit('ride:rider-location', {
      ...data,
      timestamp: new Date(),
    });
  }
}

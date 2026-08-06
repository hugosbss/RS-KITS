import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  handleConnection() {
    // Fase 7: broadcast de entregas em tempo real
  }

  broadcastDeliveryUpdate(payload: unknown) {
    this.server.emit('delivery:updated', payload);
  }
}

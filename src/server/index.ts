import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { Client, Socket } from './client';

export function startServer(port: number): void {
  const server = createServer();

  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    const socket = new Socket(ws);
    const client = new Client(socket);

    ws.on('error', console.error);
  });

  server.listen(port);
}

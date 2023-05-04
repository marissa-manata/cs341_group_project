/*
app.ts
Initialize and expose the express and socket.io servers
*/

import express from 'express';
import http from 'http';
import { Server as SocketIoServer } from 'socket.io';

const app = express();

app.use(express.json());
app.use(express.static('../frontend/build'));

export const server = http.createServer(app);
export const io = new SocketIoServer(server);

export default app;

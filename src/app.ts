import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import { initializeDatabase } from './config/database';
import { handleChat } from './socketHandlers/chatHandler';
import {authenticateSocket} from "./middleware/jwtMiddleware";

// .env 파일 로드
dotenv.config();

// 애플리케이션 설정
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware 설정
app.use(cors());
app.use(express.json());

// 라우터 설정
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// HTTP 서버 생성
const httpServer = createServer(app);

// Socket.IO 서버 설정 브라우저 cors 모두 허용
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 소켓 이벤트 핸들링
io.use(authenticateSocket);
io.on('connection', (socket) => handleChat(io, socket));

// 데이터베이스 초기화 및 서버 시작
initializeDatabase().then(() => {
  httpServer.listen(PORT, () => {
    // console.log(`Server is running on port ${PORT}`);
  });
}).catch((error) => {
  console.error("Database connection error", error);
  process.exit(1); // 데이터베이스 연결 실패 시 서버 종료
});

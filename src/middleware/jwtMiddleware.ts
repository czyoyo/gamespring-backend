import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Socket } from "socket.io";
import {AppDataSource} from "../config/database";
const userRepository = AppDataSource.getRepository(User);


// 일반 rest api 에서 사용자 인증 미들웨어
export const authenticateJwt = async (req: any, res: any, next: any) => {
  // console.log("헤더", req.headers)
  const JWT_SECRET = process.env.SECRET_KEY as string;
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

  if (token) {
    jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // 토큰에서 사용자 ID 추출
      const userId = decoded.userId;

      // 사용자 정보 조회
      try {
        const user = await userRepository.findOne({ where: { id: userId } });
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        // 사용자 정보를 요청에 저장
        req.decodedUser = user;
        next();
      } catch (error) {
        res.status(500).json({ message: 'User lookup failed' });
      }
    });
  } else {
    res.status(401).json({ message: 'No token provided' });
  }
};



// 토큰 검증 및 사용자 정보 추출 함수
export const authenticateSocket = (socket: Socket, next: (err?: any) => void) => {
  const JWT_SECRET = process.env.SECRET_KEY as string;
  const token = socket.handshake.auth.token;

  // console.log('User authenticated tokennnnnn:', token);

  if (token) {

    // console.log("토큰 검증부 진입")

    // console.log("준비된 시크릿 키", JWT_SECRET)

    jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {

      // console.log("토큰 검증부 진입2")

      if (err) {
        // console.log("토큰 검증부 진입 에러발생")
        // console.log(err)
        return next(new Error('Authentication error'));
      }

      console.log(decoded)

      console.log("토큰 검증부 진입3")

      // 토큰에서 사용자 ID 추출
      const userId = decoded.userId;
      console.log('User authenticated44:', userId);

      // 사용자 정보 조회
      try {
        const user = await userRepository.findOne({ where: { id: userId } });
        if (!user) {
          return next(new Error('User not found'));
        }

        console.log('User authenticated99999999:', user);
        // 사용자 정보를 소켓에 저장
        socket.data.decodedUser = user;
        console.log('User authenticated2:', socket.data.decodedUser?.username);
        next();
      } catch (error) {
        next(new Error('User lookup failed'));
      }
    });
  } else {
    next(new Error('No token provided'));
  }
};

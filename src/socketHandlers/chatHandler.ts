import { Server, Socket } from 'socket.io';
import { AppDataSource } from '../config/database';
import { Message } from '../models/Message';
import { User } from '../models/User';
import { CreateMessageDto, MessageResponseDto } from '../dtos/MessageDto';

const userRepository = AppDataSource.getRepository(User);
const messageRepository = AppDataSource.getRepository(Message);

// 소켓 방 맵
const roomSocketMap = new Map<string, Set<string>>();

export const handleChat = (io: Server, socket: Socket) => {

  // 방 입장
  socket.on('enter', async (data: CreateMessageDto) => {

    // 유저 정보 가져오기
    // 해당 방에 소켓 입장
    const {roomId} = data;


    const message: string = `${socket.data.decodedUser.username} 님이 입장`;

    // id 는 랜덤 생성
    const id: number = Math.floor(Math.random() * 1000);

    const messageResponse: MessageResponseDto = {
      id: id,
      content: message,
      sender: {id: socket.data.decodedUser.id, username: socket.data.decodedUser.username},
      type: 'system',
      createdAt: new Date(),
      roomId: roomId,
    };

    // 방에 소켓 ID 추가
    if (!roomSocketMap.has(roomId)) {
      roomSocketMap.set(roomId, new Set())
    }
    roomSocketMap.get(roomId)?.add(socket.data.decodedUser.username);


    // 해당 방에 소켓 입장
    socket.join(roomId);

    // 방의 현재 소켓 접속자 목록을 프론트로 보내기
    const users = Array.from(roomSocketMap.get(roomId) || []);
    io.to(roomId).emit('roomUsers', users);

    // 소켓에 방 정보 추가
    socket.data.roomId = roomId;

    // 전송하기 전에 메시지 저장
    const senderEntity: User = socket.data.decodedUser;
    const messageEntity = messageRepository.create({
      content: message,
      sender: senderEntity,
      type: 'system',
      roomId: roomId
    });
    await messageRepository.save(messageEntity);

    // 방에 입장한 유저 모두에게 메시지 전송
    io.to(roomId).emit('userEntered', messageResponse);
  });



  // public 메시지 전송
  socket.on('message', async (data: CreateMessageDto) => {

    // console.log("메시지 전송 이벤트 발생", data)

    const { content, roomId } = data;

    try {
      // 메시지 보낸 사람 정보 조회
      if (!socket.data.decodedUser) {
        throw new Error('Sender not found');
      }

      socket.join(roomId);

      const sender:User = socket.data.decodedUser;

      // 메시지 저장
      const message = messageRepository.create({
        content,
        sender,
        type: 'public',
        roomId
      });
      await messageRepository.save(message);

      // 프론트로 보낼 메시지 데이터
      const messageResponse: MessageResponseDto = {
        id: message.id,
        content: message.content,
        sender: { id: sender.id, username: sender.username },
        type: message.type,
        createdAt: message.createdAt,
        roomId: message.roomId,
      };

      if(roomId) {
        // 해당 방에 메시지 전송
        // console.log("해당 방에 메시지 전송", roomId, messageResponse)
        io.to(roomId).emit('message', messageResponse);
      }/* else {
        // 모든 방에 메시지 전송 (public)
        io.emit('message', messageResponse);
      }*/

    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('privateMessage', async (data: CreateMessageDto) => {
    // privateMessage 이벤트로 전달된 데이터
    const { content, receiverId } = data;

    console.log("privateMessage 이벤트 발생", data)
    if(!receiverId) {
      console.error('Receiver not found');
      return;
    }
    // receiverId 는 string 이므로 number 로 변환
    const receiverIdNumber = parseInt(receiverId);

    try {
      // 메시지 보낸 사람, 받는 사람 정보 조회
      const sender:User = socket.data.decodedUser;
      // console.log("sender", sender)
      const receiver = await userRepository.findOne({ where: { id: receiverIdNumber } });
      if(!receiver) {
        throw new Error('Receiver not found');
      }
      // console.log("receiver", receiver)

      const dmRoomId = [sender.id, receiver.id].sort().join('_');
      // 해당 방에 소켓 입장
      socket.join(dmRoomId);

      if (!sender || !receiver) {
        throw new Error('Sender or receiver not found');
      }

      // 메시지 생성
      const message = messageRepository.create({
        content,
        sender,
        receiver,
        roomId: dmRoomId,
        type: 'private',
      });

      // 보낸 메시지 저장
      await messageRepository.save(message);

      // 프론트로 보낼 메시지 데이터
      const messageResponse: MessageResponseDto = {
        id: message.id,
        content: message.content,
        sender: { id: sender.id, username: sender.username },
        receiver: { id: receiver.id, username: receiver.username },
        type: message.type,
        roomId: message.roomId,
        createdAt: message.createdAt
      };


      io.to(dmRoomId).emit('privateMessage', messageResponse);
    } catch (error) {
      console.error('Error saving private message:', error);
    }
  });

  // 소켓 연결 해제 이벤트
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    const {roomId} = socket.data;

    // 방에서 나가고 유저의 접속 리스트에서 제거
    for(const [key, value] of roomSocketMap) {
      if(value.has(socket.data.decodedUser.username)) {
        value.delete(socket.data.decodedUser.username);
        io.to(key).emit('roomUsers', Array.from(value));
      }
    }

    console.log("방 퇴장 이벤트 발생", roomId)

    const message:string = `${socket.data.decodedUser.username} 님이 퇴장`;

    const id:number = Math.floor(Math.random() * 1000);

    const messageResponse: MessageResponseDto = {
      id: id,
      content: message,
      sender: { id: socket.data.decodedUser.id, username: socket.data.decodedUser.username },
      type: 'system',
      createdAt: new Date(),
      roomId: roomId
    };

    // 방에 퇴장한 유저 모두에게 메시지 전송
    io.to(roomId).emit('userLeft', messageResponse);
    // 방에서 나가기
    socket.leave(roomId);

    // 방이 비어있으면 맵에서 방 삭제
    if(roomSocketMap.has(roomId) && roomSocketMap.get(roomId)?.size === 0) {
      roomSocketMap.delete(roomId);
    }

  });
};

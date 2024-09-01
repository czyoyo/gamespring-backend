import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Message } from '../models/Message';
import { UserResponseDto } from '../dtos/UserDto';
import { MessageResponseDto } from '../dtos/MessageDto';
import { CommonResponse } from '../utils/CommonResponse';

const userRepository = AppDataSource.getRepository(User);
const messageRepository = AppDataSource.getRepository(Message);


export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await userRepository.find({ select: ['id', 'username', 'createdAt'] });
    const userResponses: UserResponseDto[] = users.map(user => ({
      id: user.id,
      username: user.username,
      createdAt: user.createdAt
    }));
    res.json(CommonResponse.success('Users fetched successfully', userResponses));
  } catch (error) {
    res.status(500).json(CommonResponse.error('Error fetching users'));
  }
};

export const getUserMessages = async (req: Request, res: Response) => {
  try {
    const {roomId} = req.body;

    const messages = await messageRepository.find({
      where: { roomId: roomId },
      relations: ['sender', 'receiver'],
      order: { createdAt: 'ASC' }
    });



    // // get user from request
    // const currentUser = req.decodedUser as User;
    //
    // // get target user id
    // const targetUserId:string = req.query.userId as string;
    // // string to number
    // const targetUser = await userRepository.findOne({ where: { id: parseInt(targetUserId) } });
    // if(!targetUser) {
    //   return res.status(404).json(CommonResponse.error('User not found'));
    // }
    //
    // let messages;
    //
    // // chat room Id 가 있는 공개방일 경우
    // if(req.query.roomId) {
    //   const roomId:string = req.query.roomId as string;
    //   messages = await messageRepository.find({
    //     where: { roomId: roomId },
    //     relations: ['sender', 'receiver'],
    //     order: { createdAt: 'ASC' }
    //   });
    // } else {
    //   // DM 일 경우 sender 와 receiver 가 일치하는 메시지만 조회
    //   messages = await messageRepository.find({
    //     where: [
    //       { sender: currentUser, receiver: targetUser },
    //       { sender: targetUser, receiver: currentUser }
    //     ],
    //     relations: ['sender', 'receiver'],
    //     order: { createdAt: 'ASC' }
    //   });
    // }

    // const messageResponses: MessageResponseDto[] = messages.map(message => ({
    //   id: message.id,
    //   content: message.content,
    //   sender: { id: message.sender.id, username: message.sender.username },
    //   receiver: message.receiver ? { id: message.receiver.id, username: message.receiver.username } : undefined,
    //   type: message.type,
    //   createdAt: message.createdAt
    // }));

    const messageResponses: MessageResponseDto[] = messages.map(message => ({
      id: message.id,
      content: message.content,
      sender: { id: message.sender.id, username: message.sender.username },
      receiver: message.receiver ? { id: message.receiver.id, username: message.receiver.username } : undefined,
      type: message.type,
      createdAt: message.createdAt
    }));

    res.json(CommonResponse.success('Messages fetched successfully', messageResponses));
  } catch (error) {
    res.status(500).json(CommonResponse.error('Error fetching messages'));
  }
};

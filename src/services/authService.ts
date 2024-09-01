import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { CreateUserDto, LoginUserDto, UserResponseDto } from '../dtos/UserDto';
import { CommonResponse } from '../utils/CommonResponse';

const userRepository = AppDataSource.getRepository(User);

export const getUser = async (req: Request, res: Response) => {
  // console.log('@@@@@@@@@@@@@@@@@:', req.decodedUser);
  try {
    const user = req.decodedUser as User;
    const userResponse: UserResponseDto = {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt
    };
    res.json(CommonResponse.success('User fetched successfully', userResponse));
  } catch (error) {
    res.status(500).json(CommonResponse.error('Error fetching user'));
  }
}


export const register = async (req: Request, res: Response) => {
  try {
    const { username, password }: CreateUserDto = req.body;

    const getUser = await userRepository.findOne({ where: { username } });
    if (getUser) {
      return res.status(400).json(CommonResponse.error('Username already exists'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = userRepository.create({ username, password: hashedPassword });
    await userRepository.save(user);

    const userResponse: UserResponseDto = {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt
    };

    res.status(201).json(CommonResponse.success('User registered successfully', userResponse));
  } catch (error) {
    res.status(500).json(CommonResponse.error('Error registering user'));
  }
};

export const login = async (req: Request, res: Response) => {
  const JWT_SECRET = process.env.SECRET_KEY as string;
  try {
    const { username, password }: LoginUserDto = req.body;

    const user = await userRepository.findOne({ where: { username } });
    if (!user) {
      return res.status(400).json(CommonResponse.error('Invalid credentials'));
    }

    // console.log(user);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json(CommonResponse.error('Invalid credentials'));
    }

    // console.log(JWT_SECRET);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

    // console.log(token);

    res.json(CommonResponse.success('Login successful', { token }));
  } catch (error) {
    res.status(500).json(CommonResponse.error('Error logging in'));
  }
};

export const logout = (req: Request, res: Response) => {
  res.json(CommonResponse.success('Logged out successfully'));
};

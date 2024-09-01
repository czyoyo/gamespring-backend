import express from 'express';
import { getUsers, getUserMessages } from '../services/chatService';
import {authenticateJwt} from "../middleware/jwtMiddleware";

const router = express.Router();

router.use(authenticateJwt);

router.get('/users', getUsers);
router.get('/messages/:roomId', getUserMessages);

export default router;

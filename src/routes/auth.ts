import express from 'express';
import {register, login, logout, getUser} from '../services/authService';
import {Router} from "express";
import {authenticateJwt} from "../middleware/jwtMiddleware";

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/current-user',authenticateJwt, getUser)

export default router;

import { getPublishedImages, getUser, loginUser, registerUser } from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";
import User from "../models/user.js";
import express from 'express'

const userRouter = express.Router();
userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.get('/data', protect, getUser);
userRouter.get('/published-image', getPublishedImages)

export default userRouter;
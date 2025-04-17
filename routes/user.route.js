import express from "express";
import {
  getProfile,
  loginUser,
  registerUser,
  verifyUser,
} from "../controllers/user.controller.js";
import isLoggedIn from "../middlewares/isLoggedIn.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.get("/verify/:token", verifyUser);
userRouter.post("/login", loginUser);
userRouter.get("/profile", isLoggedIn, getProfile);

export default userRouter;

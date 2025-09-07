import express from "express";
import { register, login, logout, acceptInvitation } from "../controllers/auth.controller.js";


const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/accept-invitation", acceptInvitation);



  router.post("/logout",logout);
  

export default router;

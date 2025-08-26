import express from "express";
import { register, login, logout, acceptInvitation } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/authmiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/accept-invitation", acceptInvitation);

// router.get("/admin", authenticateToken, authorizeRoles("admin"), (req, res) => {
//     res.json({ message: "Welcome Admin!", user: req.user });
//   });
  
//   router.get("/editor", authenticateToken, authorizeRoles("editor", "admin"), (req, res) => {
//     res.json({ message: "Editor Access Granted", user: req.user });
//   });
  
//   router.get("/user", authenticateToken, authorizeRoles("user", "editor", "admin"), (req, res) => {
//     res.json({ message: "User Access Granted", user: req.user });
//   });

  router.post("/logout",logout);
  

export default router;

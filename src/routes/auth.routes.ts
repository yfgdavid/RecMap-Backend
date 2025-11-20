import express from "express";
import { registerUser, loginUser, forgotPassword, resetPassword, validateToken } from "../controllers/authController";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/validate", validateToken); // Validação de token/sessão
router.get("/me", validateToken); // Alias para /validate

export default router;

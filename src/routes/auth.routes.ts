import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/client"; // <-- removi o .js

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "chave_secreta";

// Cadastro
router.post("/register", async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    const existingUser = await prisma.usuario.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email já cadastrado." });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    const newUser = await prisma.usuario.create({
      data: { nome, email, senha: hashedPassword },
    });

    res.status(201).json({ message: "Usuário criado com sucesso", newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao criar usuário" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    const user = await prisma.usuario.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const valid = await bcrypt.compare(senha, user.senha);
    if (!valid) {
      return res.status(401).json({ message: "Senha incorreta." });
    }

    const token = jwt.sign({ id: user.id_usuario, email: user.email }, SECRET, { expiresIn: "7d" });

    res.json({ message: "Login realizado com sucesso", token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao fazer login" });
  }
});

export default router;

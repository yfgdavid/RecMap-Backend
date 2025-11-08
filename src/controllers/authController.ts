import { Request, Response } from "express"; // <--- ADICIONE ISSO
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../prisma/client";
import { enviarEmail } from "../services/emailService";

const SECRET = process.env.JWT_SECRET || "qwertyuiopasdfghjklzxcvbnm123456";

// ======================= REGISTER =======================
export async function registerUser(req: Request, res: Response) {
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

        return res.status(201).json({ message: "Usuário criado com sucesso", newUser });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao criar usuário" });
    }
}

// ======================= LOGIN =======================
export async function loginUser(req: Request, res: Response) {
    try {
        const { email, senha } = req.body;

        const user = await prisma.usuario.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ message: "Usuário não encontrado." });

        const valid = await bcrypt.compare(senha, user.senha);
        if (!valid) return res.status(401).json({ message: "Senha incorreta." });

        const token = jwt.sign(
            { id: user.id_usuario, email: user.email },
            SECRET,
            { expiresIn: "7d" }
        );

        return res.json({ message: "Login feito com sucesso", token, user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao fazer login" });
    }
}

// ======================= FORGOT PASSWORD =======================
export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;

    // Verifica se o usuário existe
    const user = await prisma.usuario.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Usuário não encontrado." });
    }

    // Gera token e expiração
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

    // Atualiza usuário com token
    await prisma.usuario.update({
      where: { email },
      data: { resetToken: token, resetTokenExpira: expires },
    });

    // Link para redefinir senha
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const link = `${appUrl}/?resetToken=${token}`;

    // Envia email via Brevo
    await enviarEmail(
      email,
      "Recuperação de Senha",
      `
        <p>Olá, ${user.nome}, Obrigado por utlizar o RecMap!</p>
        <p>Para redefinir sua senha, clique no link abaixo:</p>
        <a href="${link}">${link}</a>
        <p>Este link expira em 1 hora.</p>
      `
    );

    return res.json({ message: "Email enviado com sucesso." });
  } catch (error) {
    console.error("Erro ao recuperar senha:", error);
    return res.status(500).json({ message: "Erro ao recuperar senha" });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, novaSenha } = req.body;

    if (!token || !novaSenha) {
      return res.status(400).json({ message: "Token e nova senha são obrigatórios." });
    }

    // Busca usuário pelo token
    const user = await prisma.usuario.findFirst({
      where: {
        resetToken: token,
        resetTokenExpira: {
          gte: new Date(), // token ainda válido
        },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Token inválido ou expirado." });
    }

    // Criptografa a nova senha
    const hashedPassword = await bcrypt.hash(novaSenha, 10);

    // Atualiza usuário e limpa token
    await prisma.usuario.update({
      where: { id_usuario: user.id_usuario },
      data: {
        senha: hashedPassword,
        resetToken: null,
        resetTokenExpira: null,
      },
    });

    return res.json({ message: "Senha redefinida com sucesso." });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return res.status(500).json({ message: "Erro ao redefinir senha." });
  }
}
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../prisma/client";
import { enviarEmail } from "../services/emailService";
import { successResponse, errorResponse, validationResponse, notFoundResponse } from "../utils/responseHelper";

const SECRET = process.env.JWT_SECRET || "qwertyuiopasdfghjklzxcvbnm123456";

// ======================= REGISTER =======================
export async function registerUser(req: Request, res: Response) {
    try {
        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return validationResponse(res, "Campos obrigatórios: nome, email e senha.");
        }

        const existingUser = await prisma.usuario.findUnique({ where: { email } });
        if (existingUser) {
            return validationResponse(res, "Este email já está cadastrado. Tente fazer login ou use outro email.");
        }

        const hashedPassword = await bcrypt.hash(senha, 10);

        const newUser = await prisma.usuario.create({
            data: { nome, email, senha: hashedPassword },
            select: {
                id_usuario: true,
                nome: true,
                email: true,
                tipo_usuario: true,
                data_cadastro: true,
            },
        });

        return successResponse(res, newUser, "Usuário criado com sucesso! Faça login para continuar.", 201);
    } catch (error) {
        console.error("Erro ao registrar usuário:", error);
        return errorResponse(res, "Não foi possível criar sua conta. Tente novamente mais tarde.");
    }
}

// ======================= LOGIN =======================
export async function loginUser(req: Request, res: Response) {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return validationResponse(res, "Email e senha são obrigatórios.");
        }

        const user = await prisma.usuario.findUnique({ where: { email } });
        if (!user) {
            return notFoundResponse(res, "Email ou senha incorretos. Verifique suas credenciais.");
        }

        const valid = await bcrypt.compare(senha, user.senha);
        if (!valid) {
            return validationResponse(res, "Email ou senha incorretos. Verifique suas credenciais.", 401);
        }

        const token = jwt.sign(
            { id: user.id_usuario, email: user.email },
            SECRET,
            { expiresIn: "7d" }
        );

        const userData = {
            id_usuario: user.id_usuario,
            id: user.id_usuario, // Compatibilidade
            nome: user.nome,
            email: user.email,
            tipo_usuario: user.tipo_usuario,
        };

        // Retornar no formato que o frontend espera (compatibilidade)
        return res.json({
            success: true,
            message: "Login realizado com sucesso! Bem-vindo de volta.",
            type: "success",
            token,
            user: userData,
            data: {
                token,
                user: userData,
            },
        });
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        return errorResponse(res, "Não foi possível fazer login. Tente novamente mais tarde.");
    }
}

// ======================= FORGOT PASSWORD =======================
export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return validationResponse(res, "Email é obrigatório para recuperação de senha.");
    }

    // Verifica se o usuário existe
    const user = await prisma.usuario.findUnique({ where: { email } });
    if (!user) {
      // Por segurança, não revelamos se o email existe ou não
      return successResponse(res, null, "Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.");
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
      "Recuperação de Senha - RecMap",
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #143D60;">Olá, ${user.nome}!</h2>
          <p>Você solicitou a recuperação de senha no RecMap.</p>
          <p>Clique no botão abaixo para redefinir sua senha:</p>
          <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #143D60; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Redefinir Senha</a>
          <p style="color: #666; font-size: 12px;">Ou copie e cole este link no seu navegador:</p>
          <p style="color: #666; font-size: 12px; word-break: break-all;">${link}</p>
          <p style="color: #999; font-size: 11px; margin-top: 30px;">Este link expira em 1 hora. Se você não solicitou esta recuperação, ignore este email.</p>
        </div>
      `
    );

    return successResponse(res, null, "Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.");
  } catch (error) {
    console.error("Erro ao recuperar senha:", error);
    return errorResponse(res, "Não foi possível processar a recuperação de senha. Tente novamente mais tarde.");
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, novaSenha } = req.body;

    if (!token || !novaSenha) {
      return validationResponse(res, "Token e nova senha são obrigatórios.");
    }

    if (novaSenha.length < 6) {
      return validationResponse(res, "A senha deve ter pelo menos 6 caracteres.");
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
      return validationResponse(res, "Token inválido ou expirado. Solicite uma nova recuperação de senha.");
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

    return successResponse(res, null, "Senha redefinida com sucesso! Você já pode fazer login com sua nova senha.");
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return errorResponse(res, "Não foi possível redefinir a senha. Tente novamente mais tarde.");
  }
}
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/client";
import { unauthorizedResponse, errorResponse } from "../utils/responseHelper";

const SECRET = process.env.JWT_SECRET || "qwertyuiopasdfghjklzxcvbnm123456";

/**
 * Middleware para verificar token JWT
 */
export async function verifyToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return unauthorizedResponse(res, "Token de autenticação não fornecido.");
    }

    const decoded = jwt.verify(token, SECRET) as { id: number; email: string };
    
    const user = await prisma.usuario.findUnique({
      where: { id_usuario: decoded.id },
      select: { id_usuario: true, email: true, tipo_usuario: true },
    });

    if (!user) {
      return unauthorizedResponse(res, "Usuário não encontrado.");
    }

    // Adiciona informações do usuário na requisição
    (req as any).user = user;
    next();
  } catch (error) {
    return unauthorizedResponse(res, "Token inválido ou expirado. Faça login novamente.");
  }
}

/**
 * Middleware para verificar se o usuário é governamental
 */
export async function verifyGovernmental(req: Request, res: Response, next: NextFunction) {
  try {
    await verifyToken(req, res, () => {
      const user = (req as any).user;
      
      if (user.tipo_usuario !== "GOVERNAMENTAL") {
        return res.status(403).json({
          success: false,
          message: "Acesso negado. Apenas usuários governamentais podem acessar este recurso.",
          type: "forbidden",
        });
      }
      
      next();
    });
  } catch (error) {
    return errorResponse(res, "Erro ao verificar permissões.");
  }
}


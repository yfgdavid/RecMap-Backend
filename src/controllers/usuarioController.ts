import { prisma } from "../prisma/client";
import { Request, Response } from "express";

export async function listarUsuarios(req: Request, res: Response) {
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { id_usuario: "asc" }, // ordena para consistência
      select: {
        id_usuario: true,
        nome: true,
        email: true,
      },
    });
    res.json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar usuários." });
  }
}

export async function buscarUsuario(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: id },
      select: {
        id_usuario: true,
        nome: true,
        email: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar usuário." });
  }
}


export async function atualizarUsuario(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { nome, email, senha } = req.body;

    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: id },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id_usuario: id },
      data: { nome, email, senha },
    });

    res.json(usuarioAtualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar usuário." });
  }
}

export async function deletarUsuario(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: id },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    await prisma.usuario.delete({
      where: { id_usuario: id },
    });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao deletar usuário." });
  }
}

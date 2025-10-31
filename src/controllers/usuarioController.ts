import { prisma } from "../prisma/client";
import { Request, Response } from "express";


export async function listarUsuarios(req: Request, res: Response) {
  try {
    const usuarios = await prisma.usuario.findMany();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar usuários." });
  }
}


export async function buscarUsuario(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: Number(id) },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar usuário." });
  }
}

export async function criarUsuario(req: Request, res: Response) {
  try {
    const { nome, email, senha } = req.body;

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email },
    });

    if (usuarioExistente) {
      return res.status(400).json({ error: "E-mail já cadastrado." });
    }

    const novoUsuario = await prisma.usuario.create({
      data: { nome, email, senha },
    });

    res.status(201).json(novoUsuario);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar usuário." });
  }
}


export async function atualizarUsuario(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { nome, email, senha } = req.body;

    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: Number(id) },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id_usuario: Number(id) },
      data: { nome, email, senha },
    });

    res.json(usuarioAtualizado);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar usuário." });
  }
}

export async function deletarUsuario(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: Number(id) },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    await prisma.usuario.delete({
      where: { id_usuario: Number(id) },
    });

    res.status(204).send(); // Sem corpo, sucesso
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar usuário." });
  }
}

import { prisma } from "../prisma/client";
import { Request, Response } from "express";


export async function listarDenuncias(req: Request, res: Response) {
  try {
    const denuncias = await prisma.denuncia.findMany({
      include: { usuario: true, validacoes: true }, // opcional: traz o relacionamento
    });
    res.json(denuncias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar denúncias." });
  }
}


export async function buscarDenuncia(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    const denuncia = await prisma.denuncia.findUnique({
      where: { id_denuncia: id },
      include: { usuario: true, validacoes: true },
    });

    if (!denuncia) {
      return res.status(404).json({ error: "Denúncia não encontrada." });
    }

    res.json(denuncia);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar denúncia." });
  }
}


export async function criarDenuncia(req: Request, res: Response) {
  try {
    const {
      id_usuario,
      titulo,
      descricao,
      localizacao,
      latitude,
      longitude,
      foto,
      status,
    } = req.body;

    // Verifica se o usuário existe
    const usuarioExiste = await prisma.usuario.findUnique({
      where: { id_usuario },
    });

    if (!usuarioExiste) {
      return res.status(400).json({ error: "Usuário não encontrado." });
    }

    const novaDenuncia = await prisma.denuncia.create({
      data: {
        id_usuario,
        titulo,
        descricao,
        localizacao,
        latitude,
        longitude,
        foto,
        status,
      },
    });

    res.status(201).json(novaDenuncia);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar denúncia." });
  }
}


export async function atualizarDenuncia(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const dadosAtualizados = req.body;

    const denuncia = await prisma.denuncia.findUnique({
      where: { id_denuncia: id },
    });

    if (!denuncia) {
      return res.status(404).json({ error: "Denúncia não encontrada." });
    }

    const denunciaAtualizada = await prisma.denuncia.update({
      where: { id_denuncia: id },
      data: dadosAtualizados,
    });

    res.json(denunciaAtualizada);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar denúncia." });
  }
}

export async function deletarDenuncia(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    const denuncia = await prisma.denuncia.findUnique({
      where: { id_denuncia: id },
    });

    if (!denuncia) {
      return res.status(404).json({ error: "Denúncia não encontrada." });
    }

    await prisma.denuncia.delete({
      where: { id_denuncia: id },
    });

    res.status(204).send(); // sucesso sem corpo
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao deletar denúncia." });
  }
}

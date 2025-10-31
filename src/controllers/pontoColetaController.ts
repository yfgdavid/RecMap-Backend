import { prisma } from "../prisma/client";
import { Request, Response } from "express";


export async function listarPontos(req: Request, res: Response) {
  try {
    const pontos = await prisma.pontoColeta.findMany({
      include: { usuario: true }, // opcional: mostra o usuário criador
    });
    res.json(pontos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar pontos de coleta." });
  }
}

export async function buscarPonto(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const ponto = await prisma.pontoColeta.findUnique({
      where: { id_ponto: id },
      include: { usuario: true },
    });

    if (!ponto) {
      return res.status(404).json({ error: "Ponto de coleta não encontrado." });
    }

    res.json(ponto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar ponto de coleta." });
  }
}


export async function criarPonto(req: Request, res: Response) {
  try {
    const { titulo, descricao, tipo_residuo, latitude, longitude, criado_por } = req.body;

   
    if (!titulo || !tipo_residuo || !latitude || !longitude || !criado_por) {
      return res.status(400).json({ error: "Campos obrigatórios faltando." });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: criado_por },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuário criador não encontrado." });
    }

    const novoPonto = await prisma.pontoColeta.create({
      data: {
        titulo,
        descricao,
        tipo_residuo,
        latitude: Number(latitude),
        longitude: Number(longitude),
        criado_por,
      },
    });

    res.status(201).json(novoPonto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar ponto de coleta." });
  }
}


export async function atualizarPonto(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { titulo, descricao, tipo_residuo, latitude, longitude } = req.body;

    const ponto = await prisma.pontoColeta.findUnique({
      where: { id_ponto: id },
    });

    if (!ponto) {
      return res.status(404).json({ error: "Ponto de coleta não encontrado." });
    }

    const pontoAtualizado = await prisma.pontoColeta.update({
      where: { id_ponto: id },
      data: {
        titulo,
        descricao,
        tipo_residuo,
        latitude: Number(latitude),
        longitude: Number(longitude),
      },
    });

    res.json(pontoAtualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar ponto de coleta." });
  }
}


export async function deletarPonto(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    const ponto = await prisma.pontoColeta.findUnique({
      where: { id_ponto: id },
    });

    if (!ponto) {
      return res.status(404).json({ error: "Ponto de coleta não encontrado." });
    }

    await prisma.pontoColeta.delete({
      where: { id_ponto: id },
    });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao deletar ponto de coleta." });
  }
}

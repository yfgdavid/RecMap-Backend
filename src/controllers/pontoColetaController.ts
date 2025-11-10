import { isDataView } from "util/types";
import { prisma } from "../prisma/client";
import { Request, Response } from "express";
import { geocode } from "../services/uploadService"; // <-- usa a sua funçã

export async function listarPontos(req: Request, res: Response) {
  try {
    const pontos = await prisma.pontoColeta.findMany({ include: { usuario: true } });

    const formatados = pontos.map(p => ({
      id: p.id_ponto,
      titulo: p.titulo,
      descricao: p.descricao,
      latitude: p.latitude,
      longitude: p.longitude,
      foto: p.foto ? `/uploads/${p.foto}` : null, // <-- adiciona foto aqui
      usuario: p.usuario.nome,
    }));


    res.json(formatados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar pontos de coleta." });
  }
}

export async function buscarPonto(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const ponto = await prisma.pontoColeta.findUnique({ where: { id_ponto: id }, include: { usuario: true } });

    if (!ponto) return res.status(404).json({ error: "Ponto de coleta não encontrado." });

    res.json({
      id: ponto.id_ponto,
      titulo: ponto.titulo,
      descricao: ponto.descricao,
      latitude: ponto.latitude,
      longitude: ponto.longitude,
      id_usuario: ponto.usuario.nome,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar ponto de coleta." });
  }
}

export const criarPonto = async (req: Request, res: Response) => {
  try {
    const { id_usuario, titulo, descricao, localizacao } = req.body;

    if (!id_usuario || !titulo || !localizacao) {
      return res.status(400).json({ error: "Campos obrigatórios faltando." });
    }

    const coords = await geocode(localizacao);
    const latitude = coords?.latitude ?? null;
    const longitude = coords?.longitude ?? null;

    // 🔥 Converte foto para Base64 (se existir)
    let fotoBase64 = null;
    if (req.file) {
      fotoBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    }

    const novoPonto = await prisma.pontoColeta.create({
      data: {
        id_usuario: Number(id_usuario),
        titulo,
        descricao,
        localizacao,
        latitude,
        longitude,
        foto: fotoBase64,
      },
      include: { usuario: true },
    });

    return res.status(201).json(novoPonto);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao criar ponto de coleta." });
  }
};



export async function atualizarPonto(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { titulo, descricao, latitude, longitude } = req.body;

    const ponto = await prisma.pontoColeta.findUnique({ where: { id_ponto: id } });
    if (!ponto) return res.status(404).json({ error: "Ponto de coleta não encontrado." });

    const atualizado = await prisma.pontoColeta.update({
      where: { id_ponto: id },
      data: { titulo, descricao, latitude: Number(latitude), longitude: Number(longitude) },
    });

    res.json(atualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar ponto de coleta." });
  }
}

export async function deletarPonto(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    const ponto = await prisma.pontoColeta.findUnique({ where: { id_ponto: id } });
    if (!ponto) return res.status(404).json({ error: "Ponto de coleta não encontrado." });

    await prisma.pontoColeta.delete({ where: { id_ponto: id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao deletar ponto de coleta." });
  }
}

import { Request, Response } from "express";
import { prisma } from "../prisma/client";
import { geocode, getFile } from "../services/uploadService";

// Listar denúncias pendentes (exceto do usuário logado)
export async function listarDenunciasPendentes(req: Request, res: Response) {
  try {
    const id_usuario = Number(req.params.id_usuario);

    const denuncias = await prisma.denuncia.findMany({
      where: {
        status: "PENDENTE",
        id_usuario: { not: id_usuario },
      },
      include: { validacoes: true },
      orderBy: { data_criacao: "desc" },
    });

    const formatadas = denuncias.map(d => ({
      id_denuncia: d.id_denuncia,
      titulo: d.titulo,
      descricao: d.descricao,
      status: d.status,
      data_criacao: d.data_criacao.toISOString().split("T")[0],
      localizacao: d.localizacao,
      confirma: d.validacoes.filter(v => v.tipo_validacao === "CONFIRMAR").length,
      contesta: d.validacoes.filter(v => v.tipo_validacao === "CONTESTAR").length,
      foto: getFile(d.foto),
    }));

    res.json(formatadas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar denúncias pendentes." });
  }
}

// Criação de denúncia
export const criarDenuncia = async (req: Request, res: Response) => {
  try {
    const { id_usuario, titulo, descricao, localizacao } = req.body;

    if (!id_usuario || !titulo) {
      return res.status(400).json({ error: "Campos obrigatórios faltando." });
    }

    const coords = localizacao ? await geocode(localizacao) : null;

    const usuarioExiste = await prisma.usuario.findUnique({
      where: { id_usuario: Number(id_usuario) },
    });
    if (!usuarioExiste) return res.status(404).json({ error: "Usuário não encontrado." });

    const novaDenuncia = await prisma.denuncia.create({
      data: {
        id_usuario: Number(id_usuario),
        titulo,
        descricao,
        localizacao,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        foto: req.file ? req.file.filename : null,
        status: "PENDENTE",
      },
      include: {
        usuario: true,
        validacoes: { include: { usuario: true } },
      },
    });

    // Retorna já com URL completa da foto
    res.status(201).json({
      ...novaDenuncia,
      foto: getFile(novaDenuncia.foto),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao criar denúncia." });
  }
};

// Listar todas as denúncias
export async function listarDenuncias(req: Request, res: Response) {
  try {
    const denuncias = await prisma.denuncia.findMany({
      include: { usuario: true, validacoes: { include: { usuario: true } } },
    });

    const formatadas = denuncias.map(d => ({
      id: d.id_denuncia,
      titulo: d.titulo,
      descricao: d.descricao,
      localizacao: d.localizacao,
      latitude: d.latitude,
      longitude: d.longitude,
      foto: getFile(d.foto),
      status: d.status,
      usuario: d.usuario.nome,
      validacoes: d.validacoes.map(v => ({
        id: v.id_validacao,
        usuario: v.usuario.nome,
        tipo_validacao: v.tipo_validacao,
      })),
    }));

    res.json(formatadas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar denúncias." });
  }
}

// Atualizar denúncia
export async function atualizarDenuncia(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido." });

  const dadosAtualizados = req.body;

  try {
    const denuncia = await prisma.denuncia.findUnique({ where: { id_denuncia: id } });
    if (!denuncia) return res.status(404).json({ error: "Denúncia não encontrada." });

    if (dadosAtualizados.localizacao) {
      const coords = await geocode(dadosAtualizados.localizacao);
      if (coords) {
        dadosAtualizados.latitude = coords.latitude;
        dadosAtualizados.longitude = coords.longitude;
      }
    }

    const atualizado = await prisma.denuncia.update({
      where: { id_denuncia: id },
      data: dadosAtualizados,
      include: { usuario: true, validacoes: { include: { usuario: true } } },
    });

    res.json({
      id: atualizado.id_denuncia,
      titulo: atualizado.titulo,
      descricao: atualizado.descricao,
      localizacao: atualizado.localizacao,
      latitude: atualizado.latitude,
      longitude: atualizado.longitude,
      foto: getFile(atualizado.foto),
      status: atualizado.status,
      usuario: atualizado.usuario.nome,
      validacoes: atualizado.validacoes.map(v => ({
        id: v.id_validacao,
        usuario: v.usuario.nome,
        tipo_validacao: v.tipo_validacao,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar denúncia." });
  }
}

// Buscar denúncia pelo ID
export async function buscarDenuncia(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido." });

  try {
    const denuncia = await prisma.denuncia.findUnique({
      where: { id_denuncia: id },
      include: { usuario: true, validacoes: { include: { usuario: true } } },
    });

    if (!denuncia) return res.status(404).json({ error: "Denúncia não encontrada." });

    res.json({
      id: denuncia.id_denuncia,
      titulo: denuncia.titulo,
      descricao: denuncia.descricao,
      localizacao: denuncia.localizacao,
      latitude: denuncia.latitude,
      longitude: denuncia.longitude,
      foto: getFile(denuncia.foto),
      status: denuncia.status,
      usuario: denuncia.usuario.nome,
      validacoes: denuncia.validacoes.map(v => ({
        id: v.id_validacao,
        usuario: v.usuario.nome,
        tipo_validacao: v.tipo_validacao,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar denúncia." });
  }
}

// Denúncias de um usuário
export const getDenunciasPorUsuario = async (req: Request, res: Response) => {
  try {
    const { id_usuario } = req.params;

    const denuncias = await prisma.denuncia.findMany({
      where: { id_usuario: Number(id_usuario) },
      include: { validacoes: true },
      orderBy: { data_criacao: "desc" },
    });

    const formatadas = denuncias.map(d => ({
      ...d,
      foto: getFile(d.foto),
    }));

    res.json(formatadas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar denúncias do usuário." });
  }
};

// Deletar denúncia
export async function deletarDenuncia(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido." });

  try {
    const denuncia = await prisma.denuncia.findUnique({ where: { id_denuncia: id } });
    if (!denuncia) return res.status(404).json({ error: "Denúncia não encontrada." });

    await prisma.denuncia.delete({ where: { id_denuncia: id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao deletar denúncia." });
  }
};

import { Request, Response } from "express";
import { prisma } from "../prisma/client";
import { upload, geocode } from "../services/uploadService";

// Criação de denúncia
export const criarDenuncia = async (req: Request, res: Response) => {
  try {
    // multer processa o arquivo
    const { id_usuario, titulo, descricao, localizacao } = req.body;

    console.log("📦 Dados recebidos:", req.body);
    console.log("📸 Arquivo recebido:", req.file);

    if (!id_usuario || !titulo) {
      return res.status(400).json({ error: "Campos obrigatórios faltando." });
    }

    // Geocodificação opcional
    let latitude: number | null = null;
    let longitude: number | null = null;
    if (localizacao) {
      const coords = await geocode(localizacao);
      if (coords) {
        latitude = coords.latitude;
        longitude = coords.longitude;
      }
    }

    // Verifica se usuário existe
    const usuarioExiste = await prisma.usuario.findUnique({
      where: { id_usuario: Number(id_usuario) },
    });
    if (!usuarioExiste)
      return res.status(404).json({ error: "Usuário não encontrado." });

    // Cria denúncia
    const novaDenuncia = await prisma.denuncia.create({
      data: {
        id_usuario: Number(id_usuario),
        titulo,
        descricao,
        localizacao,
        latitude,
        longitude,
        foto: req.file ? req.file.filename : null,
        status: "PENDENTE",
      },
      include: {
        usuario: true,
        validacoes: { include: { usuario: true } },
      },
    });

    res.status(201).json({
      id: novaDenuncia.id_denuncia,
      titulo: novaDenuncia.titulo,
      descricao: novaDenuncia.descricao,
      localizacao: novaDenuncia.localizacao,
      latitude: novaDenuncia.latitude,
      longitude: novaDenuncia.longitude,
      foto: novaDenuncia.foto,
      status: novaDenuncia.status,
      usuario: novaDenuncia.usuario.nome,
      validacoes: [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar denúncia.", details: error });
  }
};


// Lista todas as denúncias
export async function listarDenuncias(req: Request, res: Response) {
  try {
    const denuncias = await prisma.denuncia.findMany({
      include: {
        usuario: true,
        validacoes: { include: { usuario: true } },
      },
    });

    const formatadas = denuncias.map(d => ({
      id: d.id_denuncia,
      titulo: d.titulo,
      descricao: d.descricao,
      localizacao: d.localizacao,
      latitude: d.latitude,
      longitude: d.longitude,
      foto: d.foto,
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

// Atualiza uma denúncia
export async function atualizarDenuncia(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido." });

  const dadosAtualizados = req.body;

  try {
    const denuncia = await prisma.denuncia.findUnique({ where: { id_denuncia: id } });
    if (!denuncia) return res.status(404).json({ error: "Denúncia não encontrada." });

    // Se localizacao foi atualizada, geocodifica de novo
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
      include: {
        usuario: true,
        validacoes: { include: { usuario: true } },
      },
    });

    res.json({
      id: atualizado.id_denuncia,
      titulo: atualizado.titulo,
      descricao: atualizado.descricao,
      localizacao: atualizado.localizacao,
      latitude: atualizado.latitude,
      longitude: atualizado.longitude,
      foto: atualizado.foto,
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
// Busca uma denúncia pelo ID
export async function buscarDenuncia(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido." });

  try {
    const denuncia = await prisma.denuncia.findUnique({
      where: { id_denuncia: id },
      include: {
        usuario: true,
        validacoes: { include: { usuario: true } }
      }
    });

    if (!denuncia) return res.status(404).json({ error: "Denúncia não encontrada." });

    const formatada = {
      id: denuncia.id_denuncia,
      titulo: denuncia.titulo,
      descricao: denuncia.descricao,
      localizacao: denuncia.localizacao,
      latitude: denuncia.latitude,
      longitude: denuncia.longitude,
      foto: denuncia.foto,
      status: denuncia.status,
      usuario: denuncia.usuario.nome,
      validacoes: denuncia.validacoes.map(v => ({
        id: v.id_validacao,
        usuario: v.usuario.nome,
        tipo_validacao: v.tipo_validacao
      }))
    };

    res.json(formatada);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar denúncia." });
  }
}


export const getDenunciasPorUsuario = async (req: Request, res: Response) => {
  try {
    const { id_usuario } = req.params;

    const denuncias = await prisma.denuncia.findMany({
      where: { id_usuario: Number(id_usuario) },
      include: { validacoes: true },
      orderBy: { data_criacao: "desc" },
    });

    res.json(denuncias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar denúncias do usuário." });
  }
};

// Deleta uma denúncia
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

  
}

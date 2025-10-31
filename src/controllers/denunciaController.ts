import { prisma } from "../prisma/client";
import { Request, Response } from "express";

// Lista todas as denúncias com usuário e validações
export async function listarDenuncias(req: Request, res: Response) {
  try {
    const denuncias = await prisma.denuncia.findMany({
      include: {
        usuario: true,
        validacoes: { include: { usuario: true } }
      }
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
        tipo_validacao: v.tipo_validacao
      }))
    }));

    res.json(formatadas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar denúncias." });
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

// Cria uma nova denúncia
export async function criarDenuncia(req: Request, res: Response) {
  const { id_usuario, titulo, descricao, localizacao, latitude, longitude, foto, status } = req.body;

  if (!id_usuario || !titulo || latitude === undefined || longitude === undefined)
    return res.status(400).json({ error: "Campos obrigatórios faltando." });

  try {
    const usuarioExiste = await prisma.usuario.findUnique({ where: { id_usuario } });
    if (!usuarioExiste) return res.status(404).json({ error: "Usuário não encontrado." });

    const novaDenuncia = await prisma.denuncia.create({
      data: {
        id_usuario,
        titulo,
        descricao,
        localizacao,
        latitude: Number(latitude),
        longitude: Number(longitude),
        foto,
        status
      },
      include: {
        usuario: true,
        validacoes: { include: { usuario: true } }
      }
    });

    // Retorna já formatada para front
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
      validacoes: [] // nova denúncia ainda não tem validações
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar denúncia." });
  }
}

// Atualiza uma denúncia existente
export async function atualizarDenuncia(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido." });

  const dadosAtualizados = req.body;

  try {
    const denuncia = await prisma.denuncia.findUnique({ where: { id_denuncia: id } });
    if (!denuncia) return res.status(404).json({ error: "Denúncia não encontrada." });

    const atualizado = await prisma.denuncia.update({
      where: { id_denuncia: id },
      data: dadosAtualizados,
      include: {
        usuario: true,
        validacoes: { include: { usuario: true } }
      }
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
        tipo_validacao: v.tipo_validacao
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar denúncia." });
  }
}

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

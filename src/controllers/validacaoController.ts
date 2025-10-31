import { prisma } from "../prisma/client";
import { Request, Response } from "express";

export async function listarValidacoes(req: Request, res: Response) {
  try {
    const validacoes = await prisma.validacaoDenuncia.findMany({
      include: {
        usuario: { select: { id_usuario: true, nome: true } },
        denuncia: { select: { id_denuncia: true, titulo: true, status: true } },
      },
    });

    const formatadas = validacoes.map(v => ({
      id: v.id_validacao,
      tipo_validacao: v.tipo_validacao,
      usuario: { id: v.usuario.id_usuario, nome: v.usuario.nome },
      denuncia: { id: v.denuncia.id_denuncia, titulo: v.denuncia.titulo, status: v.denuncia.status },
    
    }));

    res.json(formatadas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar validações." });
  }
}

export async function buscarValidacao(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const validacao = await prisma.validacaoDenuncia.findUnique({
      where: { id_validacao: id },
      include: {
        usuario: { select: { id_usuario: true, nome: true } },
        denuncia: { select: { id_denuncia: true, titulo: true, status: true } },
      },
    });

    if (!validacao) return res.status(404).json({ error: "Validação não encontrada." });

    res.json({
      id: validacao.id_validacao,
      tipo_validacao: validacao.tipo_validacao,
      usuario: { id: validacao.usuario.id_usuario, nome: validacao.usuario.nome },
      denuncia: { id: validacao.denuncia.id_denuncia, titulo: validacao.denuncia.titulo, status: validacao.denuncia.status },
      
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar validação." });
  }
}

export async function criarValidacao(req: Request, res: Response) {
  try {
    const { id_usuario, id_denuncia, tipo_validacao } = req.body;
    if (!id_usuario || !id_denuncia || !tipo_validacao) {
      return res.status(400).json({ error: "Campos obrigatórios faltando." });
    }

    const [usuarioExiste, denunciaExiste] = await Promise.all([
      prisma.usuario.findUnique({ where: { id_usuario } }),
      prisma.denuncia.findUnique({ where: { id_denuncia } }),
    ]);

    if (!usuarioExiste || !denunciaExiste) {
      return res.status(404).json({ error: "Usuário ou denúncia não encontrado." });
    }

    const novaValidacao = await prisma.validacaoDenuncia.create({
      data: { id_usuario, id_denuncia, tipo_validacao },
      include: {
        usuario: { select: { id_usuario: true, nome: true } },
        denuncia: { select: { id_denuncia: true, titulo: true, status: true } },
      },
    });

    res.status(201).json({
      id: novaValidacao.id_validacao,
      tipo_validacao: novaValidacao.tipo_validacao,
      usuario: { id: novaValidacao.usuario.id_usuario, nome: novaValidacao.usuario.nome },
      denuncia: { id: novaValidacao.denuncia.id_denuncia, titulo: novaValidacao.denuncia.titulo, status: novaValidacao.denuncia.status },
     
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar validação." });
  }
}

export async function atualizarValidacao(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { tipo_validacao } = req.body;

    const validacao = await prisma.validacaoDenuncia.findUnique({ where: { id_validacao: id } });
    if (!validacao) return res.status(404).json({ error: "Validação não encontrada." });

    const atualizada = await prisma.validacaoDenuncia.update({
      where: { id_validacao: id },
      data: { tipo_validacao },
      include: {
        usuario: { select: { id_usuario: true, nome: true } },
        denuncia: { select: { id_denuncia: true, titulo: true, status: true } },
      },
    });

    res.json({
      id: atualizada.id_validacao,
      tipo_validacao: atualizada.tipo_validacao,
      usuario: { id: atualizada.usuario.id_usuario, nome: atualizada.usuario.nome },
      denuncia: { id: atualizada.denuncia.id_denuncia, titulo: atualizada.denuncia.titulo, status: atualizada.denuncia.status },
      
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar validação." });
  }
}

export async function deletarValidacao(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const validacao = await prisma.validacaoDenuncia.findUnique({ where: { id_validacao: id } });
    if (!validacao) return res.status(404).json({ error: "Validação não encontrada." });

    await prisma.validacaoDenuncia.delete({ where: { id_validacao: id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao deletar validação." });
  }
}

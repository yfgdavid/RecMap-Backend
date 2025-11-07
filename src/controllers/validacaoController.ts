import { prisma } from "../prisma/client";
import { Request, Response } from "express";

/**
 * Listar todas as validações
 */
export async function listarValidacoes(req: Request, res: Response) {
  try {
    const validacoes = await prisma.validacaoDenuncia.findMany({
      include: {
        usuario: { select: { id_usuario: true, nome: true } },
        denuncia: { select: { id_denuncia: true, titulo: true, status: true } },
      },
    });

    const formatadas = validacoes.map((v: typeof validacoes[number]) => ({
      id: v.id_validacao,
      tipo_validacao: v.tipo_validacao,
      // Acesso seguro para evitar erros com 'noUncheckedIndexedAccess'
      usuario: { id: v.usuario?.id_usuario, nome: v.usuario?.nome ?? "Usuário desconhecido" },
      denuncia: { id: v.denuncia?.id_denuncia, titulo: v.denuncia?.titulo, status: v.denuncia?.status },
    }));

    res.json(formatadas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar validações." });
  }
}

/**
 * Buscar uma validação pelo ID
 */
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
      // Acesso seguro para evitar erros com 'noUncheckedIndexedAccess'
      usuario: { id: validacao.usuario?.id_usuario, nome: validacao.usuario?.nome ?? "Usuário desconhecido" },
      denuncia: { id: validacao.denuncia?.id_denuncia, titulo: validacao.denuncia?.titulo, status: validacao.denuncia?.status },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar validação." });
  }
}

/**
 * Criar validação (CONFIRMAR | CONTESTAR) de denúncia
 */
export async function criarValidacao(req: Request, res: Response) {
  try {
    const { id_usuario, id_denuncia, tipo_validacao } = req.body;

    if (!id_usuario || !id_denuncia || !tipo_validacao)
      return res.status(400).json({ error: "Campos obrigatórios faltando." });

    const denuncia = await prisma.denuncia.findUnique({ where: { id_denuncia: Number(id_denuncia) } });
    if (!denuncia) return res.status(404).json({ error: "Denúncia não encontrada." });

    if (denuncia.id_usuario === Number(id_usuario)) {
      return res.status(403).json({ error: "Você não pode validar sua própria denúncia." });
    }

    try {
      const novaValidacao = await prisma.validacaoDenuncia.create({
        data: { id_usuario: Number(id_usuario), id_denuncia: Number(id_denuncia), tipo_validacao },
        include: {
          usuario: { select: { id_usuario: true, nome: true } },
          denuncia: { select: { id_denuncia: true, titulo: true, status: true } },
        },
      });

      // Contagem de confirmações e contestações
      const confirma = await prisma.validacaoDenuncia.count({
        where: { id_denuncia: Number(id_denuncia), tipo_validacao: "CONFIRMAR" },
      });

      const contesta = await prisma.validacaoDenuncia.count({
        where: { id_denuncia: Number(id_denuncia), tipo_validacao: "CONTESTAR" },
      });

      // Lógica para a mensagem no plural
      const totalValidacoes = confirma + contesta;
      const mensagemTotal = `${totalValidacoes} ${totalValidacoes === 1 ? "avaliação" : "avaliações"}`;

      res.status(201).json({ 
        id: novaValidacao.id_validacao,
        tipo_validacao: novaValidacao.tipo_validacao,
        usuario: novaValidacao.usuario ?? null,
        denuncia: novaValidacao.denuncia ?? null,
        confirma,
        contesta,
        mensagemTotal, // <-- Adicionamos a mensagem formatada
      });

    } catch (err: any) {
      if (err.code === "P2002") return res.status(409).json({ error: "Você já validou essa denúncia." });
      throw err;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar validação." });
  }
}

/**
 * Atualizar validação
 */
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
      usuario: atualizada.usuario ?? null,
      denuncia: atualizada.denuncia ?? null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar validação." });
  }
}

/**
 * Deletar validação
 */
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
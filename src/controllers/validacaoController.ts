import { prisma } from "../prisma/client";
import { Request, Response } from "express";


export async function listarValidacoes(req: Request, res: Response) {
  try {
    const validacoes = await prisma.validacaoDenuncia.findMany({
      include: { usuario: true, denuncia: true },
    });
    res.json(validacoes);
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
      include: { usuario: true, denuncia: true },
    });

    if (!validacao) {
      return res.status(404).json({ error: "Validação não encontrada." });
    }

    res.json(validacao);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar validação." });
  }
}

export async function criarValidacao(req: Request, res: Response) {
  try {
    const { id_usuario, id_denuncia, tipo_validacao } = req.body;

    // Validação básica
    if (!id_usuario || !id_denuncia || !tipo_validacao) {
      return res.status(400).json({ error: "Campos obrigatórios faltando." });
    }

    // Verifica se o usuário e a denúncia existem
    const [usuarioExiste, denunciaExiste] = await Promise.all([
      prisma.usuario.findUnique({ where: { id_usuario } }),
      prisma.denuncia.findUnique({ where: { id_denuncia } }),
    ]);

    if (!usuarioExiste || !denunciaExiste) {
      return res
        .status(400)
        .json({ error: "Usuário ou denúncia não encontrada." });
    }

    // Cria a validação
    const novaValidacao = await prisma.validacaoDenuncia.create({
      data: {
        id_usuario,
        id_denuncia,
        tipo_validacao, // deve ser um valor do enum ValidacaoTipo
      },
    });

    res.status(201).json(novaValidacao);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar validação." });
  }
}

export async function atualizarValidacao(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { tipo_validacao } = req.body;

    const validacao = await prisma.validacaoDenuncia.findUnique({
      where: { id_validacao: id },
    });

    if (!validacao) {
      return res.status(404).json({ error: "Validação não encontrada." });
    }

    const validacaoAtualizada = await prisma.validacaoDenuncia.update({
      where: { id_validacao: id },
      data: { tipo_validacao },
    });

    res.json(validacaoAtualizada);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar validação." });
  }
}

export async function deletarValidacao(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    const validacao = await prisma.validacaoDenuncia.findUnique({
      where: { id_validacao: id },
    });

    if (!validacao) {
      return res.status(404).json({ error: "Validação não encontrada." });
    }

    await prisma.validacaoDenuncia.delete({
      where: { id_validacao: id },
    });

    res.status(204).send(); // sucesso sem corpo
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao deletar validação." });
  }
}

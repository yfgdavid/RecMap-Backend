import { prisma } from "../prisma/client";
import { Request, Response } from "express";


export async function listarRelatorios(req: Request, res: Response) {
  try {
    const relatorios = await prisma.relatorio.findMany({
      include: { usuario: true }, // opcional: mostra o usuário que gerou
    });
    res.json(relatorios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar relatórios." });
  }
}


export async function buscarRelatorio(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const relatorio = await prisma.relatorio.findUnique({
      where: { id_relatorio: id },
      include: { usuario: true },
    });

    if (!relatorio) {
      return res.status(404).json({ error: "Relatório não encontrado." });
    }

    res.json(relatorio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar relatório." });
  }
}

export async function criarRelatorio(req: Request, res: Response) {
  try {
    const { titulo, tipo, descricao, gerado_por } = req.body;

    if (!titulo || !tipo || !gerado_por) {
      return res.status(400).json({ error: "Campos obrigatórios faltando." });
    }

    // verifica se o usuário existe
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: gerado_por },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuário gerador não encontrado." });
    }

    const novoRelatorio = await prisma.relatorio.create({
      data: {
        titulo,
        tipo,
        descricao,
        gerado_por,
      },
    });

    res.status(201).json(novoRelatorio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar relatório." });
  }
}


export async function atualizarRelatorio(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { titulo, tipo, descricao } = req.body;

    const relatorio = await prisma.relatorio.findUnique({
      where: { id_relatorio: id },
    });

    if (!relatorio) {
      return res.status(404).json({ error: "Relatório não encontrado." });
    }

    const relatorioAtualizado = await prisma.relatorio.update({
      where: { id_relatorio: id },
      data: {
        titulo,
        tipo,
        descricao,
      },
    });

    res.json(relatorioAtualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar relatório." });
  }
}


export async function deletarRelatorio(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    const relatorio = await prisma.relatorio.findUnique({
      where: { id_relatorio: id },
    });

    if (!relatorio) {
      return res.status(404).json({ error: "Relatório não encontrado." });
    }

    await prisma.relatorio.delete({
      where: { id_relatorio: id },
    });

    res.status(204).send(); // sucesso sem corpo
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao deletar relatório." });
  }
}

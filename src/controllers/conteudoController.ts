import { prisma } from "../prisma/client";
import { Request, Response } from "express";


export async function listarConteudos(req: Request, res: Response) {
  try {
    const conteudos = await prisma.conteudoEducativo.findMany();
    res.json(conteudos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar conteúdos educativos." });
  }
}


export async function buscarConteudo(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    const conteudo = await prisma.conteudoEducativo.findUnique({
      where: { id_conteudo: id },
    });

    if (!conteudo) {
      return res.status(404).json({ error: "Conteúdo não encontrado." });
    }

    res.json(conteudo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar conteúdo educativo." });
  }
}


export async function criarConteudo(req: Request, res: Response) {
  try {
    const { titulo, tipo, descricao, url } = req.body;

    if (!titulo || !tipo) {
      return res.status(400).json({ error: "Campos obrigatórios faltando." });
    }

    const novoConteudo = await prisma.conteudoEducativo.create({
      data: {
        titulo,
        tipo,
        descricao,
        url,
      },
    });

    res.status(201).json(novoConteudo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar conteúdo educativo." });
  }
}


export async function atualizarConteudo(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { titulo, tipo, descricao, url } = req.body;

    const conteudo = await prisma.conteudoEducativo.findUnique({
      where: { id_conteudo: id },
    });

    if (!conteudo) {
      return res.status(404).json({ error: "Conteúdo não encontrado." });
    }

    const conteudoAtualizado = await prisma.conteudoEducativo.update({
      where: { id_conteudo: id },
      data: { titulo, tipo, descricao, url },
    });

    res.json(conteudoAtualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar conteúdo educativo." });
  }
}


export async function deletarConteudo(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    const conteudo = await prisma.conteudoEducativo.findUnique({
      where: { id_conteudo: id },
    });

    if (!conteudo) {
      return res.status(404).json({ error: "Conteúdo não encontrado." });
    }

    await prisma.conteudoEducativo.delete({
      where: { id_conteudo: id },
    });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao deletar conteúdo educativo." });
  }
}

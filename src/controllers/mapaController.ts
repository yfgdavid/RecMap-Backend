import { prisma } from "../prisma/client";
import { Request, Response } from "express";

export async function listarMapa(req: Request, res: Response) {
  try {
    const { tipo } = req.query; // tipo pode ser "ponto", "denuncia" ou undefined

    let resultados: any[] = [];

    if (!tipo || tipo === "ponto") {
      const pontos = await prisma.pontoColeta.findMany({
        include: { usuario: true },
      });

      const pontosFormatados = pontos.map(p => ({
        id: p.id_ponto,
        tipo: "ponto",
        titulo: p.titulo,
        descricao: p.descricao,
        latitude: p.latitude,
        longitude: p.longitude,
        criado_por: p.usuario.nome,
      }));

      resultados.push(...pontosFormatados);
    }

    if (!tipo || tipo === "denuncia") {
      const denuncias = await prisma.denuncia.findMany({
        include: { usuario: true },
      });

      const denunciasFormatadas = denuncias.map(d => ({
        id: d.id_denuncia,
        tipo: "denuncia",
        titulo: d.titulo,
        descricao: d.descricao,
        latitude: d.latitude,
        longitude: d.longitude,
        enviado_por: d.usuario.nome,
        status: d.status,
      }));

      resultados.push(...denunciasFormatadas);
    }

    res.json(resultados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao carregar dados do mapa." });
  }
}

import { prisma } from "../prisma/client";
import { Request, Response } from "express";

const BASE_URL = (process.env.BACKEND_URL || "http://localhost:3333") + "/uploads/";

export async function listarMapa(req: Request, res: Response) {
  try {
    const { tipo } = req.query;
    let resultados: any[] = [];

    if (!tipo || tipo === "ponto") {
      const pontos = await prisma.pontoColeta.findMany({ include: { usuario: true } });
      resultados.push(
        ...pontos.map(p => ({
          id: p.id_ponto,
          tipo: "ponto",
          titulo: p.titulo,
          descricao: p.descricao,
          latitude: p.latitude,
          longitude: p.longitude,
          criado_por: p.usuario.nome,
          foto: p.foto ? `${BASE_URL}${p.foto}` : null,
        }))
      );
    }

    if (!tipo || tipo === "denuncia") {
      const denuncias = await prisma.denuncia.findMany({ include: { usuario: true } });
      resultados.push(
        ...denuncias.map(d => ({
          id: d.id_denuncia,
          tipo: "denuncia",
          titulo: d.titulo,
          descricao: d.descricao,
          latitude: d.latitude,
          longitude: d.longitude,
          enviado_por: d.usuario.nome,
          status: d.status,
          foto: d.foto ? `${BASE_URL}${d.foto}` : null,
        }))
      );
    }

    return res.json(resultados);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao carregar dados do mapa." });
  }
}

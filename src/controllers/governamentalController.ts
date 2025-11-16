import { Request, Response } from "express";
import { prisma } from "../prisma/client";

const BASE_URL = (process.env.BACKEND_URL || "http://localhost:3333") + "/uploads/";

/**
 * Dashboard principal com estatísticas gerais
 */
export async function getDashboardStats(req: Request, res: Response) {
  try {
    // Verificar se o usuário é governamental
    const id_usuario = Number(req.query.id_usuario || req.body.id_usuario);
    
    if (id_usuario) {
      const usuario = await prisma.usuario.findUnique({
        where: { id_usuario },
        select: { tipo_usuario: true },
      });

      if (usuario && usuario.tipo_usuario !== "GOVERNAMENTAL") {
        return res.status(403).json({
          success: false,
          message: "Acesso negado. Apenas usuários governamentais podem acessar este dashboard.",
          type: "error"
        });
      }
    }

    // Estatísticas de denúncias
    const totalDenuncias = await prisma.denuncia.count();
    const denunciasPendentes = await prisma.denuncia.count({
      where: { status: "PENDENTE" },
    });
    const denunciasValidadas = await prisma.denuncia.count({
      where: { status: "VALIDADA" },
    });
    const denunciasEncaminhadas = await prisma.denuncia.count({
      where: { status: "ENCAMINHADA" },
    });
    const denunciasResolvidas = await prisma.denuncia.count({
      where: { status: "RESOLVIDA" },
    });

    // Estatísticas de pontos de coleta
    const totalPontosColeta = await prisma.pontoColeta.count();

    // Estatísticas de usuários
    const totalUsuarios = await prisma.usuario.count();
    const usuariosCidadaos = await prisma.usuario.count({
      where: { tipo_usuario: "CIDADAO" },
    });
    const usuariosGovernamentais = await prisma.usuario.count({
      where: { tipo_usuario: "GOVERNAMENTAL" },
    });

    // Estatísticas de validações
    const totalValidacoes = await prisma.validacaoDenuncia.count();
    const validacoesConfirmar = await prisma.validacaoDenuncia.count({
      where: { tipo_validacao: "CONFIRMAR" },
    });
    const validacoesContestar = await prisma.validacaoDenuncia.count({
      where: { tipo_validacao: "CONTESTAR" },
    });

    // Denúncias por status (gráfico)
    const denunciasPorStatus = await prisma.denuncia.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    // Denúncias recentes (últimas 10)
    const denunciasRecentes = await prisma.denuncia.findMany({
      take: 10,
      orderBy: { data_criacao: "desc" },
      include: {
        usuario: { select: { nome: true, email: true } },
        validacoes: true,
      },
    });

    // Pontos de coleta recentes (últimos 10)
    const pontosRecentes = await prisma.pontoColeta.findMany({
      take: 10,
      orderBy: { data_criacao: "desc" },
      include: {
        usuario: { select: { nome: true, email: true } },
      },
    });

    // Taxa de resolução
    const taxaResolucao = totalDenuncias > 0 
      ? ((denunciasResolvidas / totalDenuncias) * 100).toFixed(1)
      : "0.0";

    res.json({
      success: true,
      data: {
        estatisticas: {
          denuncias: {
            total: totalDenuncias,
            pendentes: denunciasPendentes,
            validadas: denunciasValidadas,
            encaminhadas: denunciasEncaminhadas,
            resolvidas: denunciasResolvidas,
            taxaResolucao: `${taxaResolucao}%`,
            porStatus: denunciasPorStatus.map((d: any) => ({
              status: d.status,
              quantidade: d._count.status,
            })),
          },
          pontosColeta: {
            total: totalPontosColeta,
          },
          usuarios: {
            total: totalUsuarios,
            cidadaos: usuariosCidadaos,
            governamentais: usuariosGovernamentais,
          },
          validacoes: {
            total: totalValidacoes,
            confirmacoes: validacoesConfirmar,
            contestacoes: validacoesContestar,
          },
        },
        recentes: {
          denuncias: denunciasRecentes.map((d) => ({
            id: d.id_denuncia,
            titulo: d.titulo,
            descricao: d.descricao,
            status: d.status,
            localizacao: d.localizacao,
            data_criacao: d.data_criacao,
            usuario: d.usuario.nome,
            total_validacoes: d.validacoes.length,
            foto: d.foto ? `${BASE_URL}${d.foto}` : null,
          })),
          pontosColeta: pontosRecentes.map((p) => ({
            id: p.id_ponto,
            titulo: p.titulo,
            descricao: p.descricao,
            localizacao: p.localizacao,
            data_criacao: p.data_criacao,
            usuario: p.usuario.nome,
            foto: p.foto ? `${BASE_URL}${p.foto}` : null,
          })),
        },
      },
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas do dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao carregar dados do dashboard.",
      type: "error",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
}

/**
 * Lista todas as denúncias para gestão governamental
 */
export async function listarDenunciasGovernamental(req: Request, res: Response) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [denuncias, total] = await Promise.all([
      prisma.denuncia.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { data_criacao: "desc" },
        include: {
          usuario: { select: { id_usuario: true, nome: true, email: true } },
          validacoes: {
            include: {
              usuario: { select: { nome: true } },
            },
          },
        },
      }),
      prisma.denuncia.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        denuncias: denuncias.map((d) => ({
          id: d.id_denuncia,
          titulo: d.titulo,
          descricao: d.descricao,
          localizacao: d.localizacao,
          latitude: d.latitude,
          longitude: d.longitude,
          status: d.status,
          data_criacao: d.data_criacao,
          usuario: {
            id: d.usuario.id_usuario,
            nome: d.usuario.nome,
            email: d.usuario.email,
          },
          validacoes: {
            total: d.validacoes.length,
            confirmacoes: d.validacoes.filter((v) => v.tipo_validacao === "CONFIRMAR").length,
            contestacoes: d.validacoes.filter((v) => v.tipo_validacao === "CONTESTAR").length,
            detalhes: d.validacoes.map((v) => ({
              tipo: v.tipo_validacao,
              usuario: v.usuario.nome,
              data: v.data_validacao,
            })),
          },
          foto: d.foto ? `${BASE_URL}${d.foto}` : null,
        })),
        paginacao: {
          total,
          pagina: Number(page),
          limite: Number(limit),
          totalPaginas: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Erro ao listar denúncias:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao listar denúncias.",
      type: "error",
    });
  }
}

/**
 * Atualizar status de denúncia (governamental)
 */
export async function atualizarStatusDenuncia(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const statusValidos = ["PENDENTE", "VALIDADA", "ENCAMINHADA", "RESOLVIDA"];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status inválido. Use um dos seguintes: ${statusValidos.join(", ")}`,
        type: "error",
      });
    }

    const denuncia = await prisma.denuncia.findUnique({
      where: { id_denuncia: Number(id) },
    });

    if (!denuncia) {
      return res.status(404).json({
        success: false,
        message: "Denúncia não encontrada.",
        type: "error",
      });
    }

    const denunciaAtualizada = await prisma.denuncia.update({
      where: { id_denuncia: Number(id) },
      data: { status },
      include: {
        usuario: { select: { nome: true, email: true } },
        validacoes: true,
      },
    });

    res.json({
      success: true,
      message: "Status da denúncia atualizado com sucesso.",
      type: "success",
      data: {
        id: denunciaAtualizada.id_denuncia,
        titulo: denunciaAtualizada.titulo,
        status: denunciaAtualizada.status,
        usuario: denunciaAtualizada.usuario.nome,
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar status da denúncia:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar status da denúncia.",
      type: "error",
    });
  }
}

/**
 * Relatório de engajamento
 */
export async function getRelatorioEngajamento(req: Request, res: Response) {
  try {
    // Usuários mais ativos (mais denúncias)
    const usuariosMaisDenuncias = await prisma.usuario.findMany({
      take: 10,
      orderBy: {
        denuncias: {
          _count: "desc",
        },
      },
      select: {
        id_usuario: true,
        nome: true,
        email: true,
        _count: {
          select: {
            denuncias: true,
            validacoes: true,
            pontosColeta: true,
          },
        },
      },
    });

    // Denúncias mais validadas
    const denunciasMaisValidadas = await prisma.denuncia.findMany({
      include: {
        validacoes: true,
        usuario: { select: { nome: true } },
      },
    });

    const denunciasComContagem = denunciasMaisValidadas
      .map((d) => ({
        id: d.id_denuncia,
        titulo: d.titulo,
        usuario: d.usuario.nome,
        total_validacoes: d.validacoes.length,
        confirmacoes: d.validacoes.filter((v) => v.tipo_validacao === "CONFIRMAR").length,
        contestacoes: d.validacoes.filter((v) => v.tipo_validacao === "CONTESTAR").length,
      }))
      .sort((a, b) => b.total_validacoes - a.total_validacoes)
      .slice(0, 10);

    // Estatísticas de atividade por mês
    const denunciasPorMes = await prisma.denuncia.groupBy({
      by: ["data_criacao"],
      _count: { id_denuncia: true },
    });

    res.json({
      success: true,
      data: {
        usuariosMaisAtivos: usuariosMaisDenuncias.map((u) => ({
          id: u.id_usuario,
          nome: u.nome,
          email: u.email,
          totalDenuncias: u._count.denuncias,
          totalValidacoes: u._count.validacoes,
          totalPontos: u._count.pontosColeta,
          engajamento: u._count.denuncias + u._count.validacoes + u._count.pontosColeta,
        })),
        denunciasMaisValidadas: denunciasComContagem,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar relatório de engajamento:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao gerar relatório de engajamento.",
      type: "error",
    });
  }
}


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

    // Calcular dados do mês atual e mês anterior para variações
    const agora = new Date();
    const inicioMesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const inicioMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);

    // Denúncias do mês atual
    const denunciasMesAtual = await prisma.denuncia.count({
      where: {
        data_criacao: {
          gte: inicioMesAtual,
        },
      },
    });

    // Denúncias do mês anterior
    const denunciasMesAnterior = await prisma.denuncia.count({
      where: {
        data_criacao: {
          gte: inicioMesAnterior,
          lt: inicioMesAtual,
        },
      },
    });

    // Variação percentual de denúncias
    const variacaoDenunciasNum = denunciasMesAnterior > 0
      ? (((denunciasMesAtual - denunciasMesAnterior) / denunciasMesAnterior) * 100)
      : denunciasMesAtual > 0 ? 100 : 0;
    const variacaoDenuncias = variacaoDenunciasNum.toFixed(0);

    // Usuários ativos (usuários que fizeram alguma ação no último mês)
    const usuariosAtivos = await prisma.usuario.count({
      where: {
        OR: [
          { denuncias: { some: { data_criacao: { gte: inicioMesAtual } } } },
          { validacoes: { some: { data_validacao: { gte: inicioMesAtual } } } },
          { pontosColeta: { some: { data_criacao: { gte: inicioMesAtual } } } },
        ],
      },
    });

    const usuariosAtivosMesAnterior = await prisma.usuario.count({
      where: {
        OR: [
          { denuncias: { some: { data_criacao: { gte: inicioMesAnterior, lt: inicioMesAtual } } } },
          { validacoes: { some: { data_validacao: { gte: inicioMesAnterior, lt: inicioMesAtual } } } },
          { pontosColeta: { some: { data_criacao: { gte: inicioMesAnterior, lt: inicioMesAtual } } } },
        ],
      },
    });

    const variacaoUsuariosNum = usuariosAtivosMesAnterior > 0
      ? (((usuariosAtivos - usuariosAtivosMesAnterior) / usuariosAtivosMesAnterior) * 100)
      : usuariosAtivos > 0 ? 100 : 0;
    const variacaoUsuarios = variacaoUsuariosNum.toFixed(0);

    // Novos pontos de coleta do mês
    const novosPontosMes = await prisma.pontoColeta.count({
      where: {
        data_criacao: {
          gte: inicioMesAtual,
        },
      },
    });

    // Evolução mensal (últimos 6 meses)
    const evolucaoMensal = [];
    
    for (let i = 5; i >= 0; i--) {
      const dataInicio = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const dataFim = new Date(agora.getFullYear(), agora.getMonth() - i + 1, 0, 23, 59, 59);
      
      const [totalMes, resolvidasMes] = await Promise.all([
        prisma.denuncia.count({
          where: {
            data_criacao: {
              gte: dataInicio,
              lte: dataFim,
            },
          },
        }),
        prisma.denuncia.count({
          where: {
            data_criacao: {
              gte: dataInicio,
              lte: dataFim,
            },
            status: "RESOLVIDA",
          },
        }),
      ]);

      const nomesMeses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      
      evolucaoMensal.push({
        mes: nomesMeses[dataInicio.getMonth()],
        total: totalMes,
        resolvidas: resolvidasMes,
      });
    }

    // Distribuição por tipo de denúncia (usando descrição/título das denúncias como proxy)
    // Como não temos campo de tipo de denúncia, vamos usar palavras-chave
    const todasDenuncias = await prisma.denuncia.findMany({
      select: { descricao: true, titulo: true },
    });

    let descarteIrregular = 0;
    let pontoColetaDanificado = 0;
    let entulho = 0;
    let esgotoCeuAberto = 0;
    let outros = 0;

    const palavrasDescarteIrregular = ["descarte irregular", "descarte", "irregular", "lixo", "jogado", "descartado", "abandonado", "jogar lixo"];
    const palavrasPontoColetaDanificado = ["ponto de coleta", "coleta danificado", "coleta quebrado", "coleta danificada", "ponto quebrado", "ponto danificado", "container", "lixeira"];
    const palavrasEntulho = ["entulho", "construção", "obra", "demolição", "material de construção", "cimento", "tijolo", "areia"];
    const palavrasEsgotoCeuAberto = ["esgoto", "esgoto a céu aberto", "esgoto a ceu aberto", "água servida", "água suja", "fossa", "vala", "bueiro"];

    todasDenuncias.forEach((d) => {
      const texto = `${d.titulo} ${d.descricao}`.toLowerCase();
      
      if (palavrasEsgotoCeuAberto.some(p => texto.includes(p))) {
        esgotoCeuAberto++;
      } else if (palavrasEntulho.some(p => texto.includes(p))) {
        entulho++;
      } else if (palavrasPontoColetaDanificado.some(p => texto.includes(p))) {
        pontoColetaDanificado++;
      } else if (palavrasDescarteIrregular.some(p => texto.includes(p))) {
        descarteIrregular++;
      } else {
        outros++;
      }
    });

    const totalTipos = descarteIrregular + pontoColetaDanificado + entulho + esgotoCeuAberto + outros;
    const distribuicaoTipos = totalTipos > 0 ? [
      { tipo: "Descarte Irregular", porcentagem: Math.round((descarteIrregular / totalTipos) * 100), quantidade: descarteIrregular },
      { tipo: "Ponto de Coleta Danificado", porcentagem: Math.round((pontoColetaDanificado / totalTipos) * 100), quantidade: pontoColetaDanificado },
      { tipo: "Entulho", porcentagem: Math.round((entulho / totalTipos) * 100), quantidade: entulho },
      { tipo: "Esgoto a Céu Aberto", porcentagem: Math.round((esgotoCeuAberto / totalTipos) * 100), quantidade: esgotoCeuAberto },
      { tipo: "Outros", porcentagem: Math.round((outros / totalTipos) * 100), quantidade: outros },
    ] : [
      { tipo: "Descarte Irregular", porcentagem: 0, quantidade: 0 },
      { tipo: "Ponto de Coleta Danificado", porcentagem: 0, quantidade: 0 },
      { tipo: "Entulho", porcentagem: 0, quantidade: 0 },
      { tipo: "Esgoto a Céu Aberto", porcentagem: 0, quantidade: 0 },
      { tipo: "Outros", porcentagem: 0, quantidade: 0 },
    ];

    res.json({
      success: true,
      data: {
        // Cards principais
        cards: {
          totalDenuncias: {
            valor: totalDenuncias,
            variacao: `${variacaoDenunciasNum >= 0 ? "+" : ""}${variacaoDenuncias}%`,
            periodo: "este mês",
            tendencia: variacaoDenunciasNum >= 0 ? "up" : "down",
          },
          denunciasResolvidas: {
            valor: denunciasResolvidas,
            taxa: `${taxaResolucao}% de resolução`,
            tendencia: "up",
          },
          usuariosAtivos: {
            valor: usuariosAtivos,
            variacao: `${variacaoUsuariosNum >= 0 ? "+" : ""}${variacaoUsuarios}%`,
            periodo: "este mês",
            tendencia: variacaoUsuariosNum >= 0 ? "up" : "down",
          },
          pontosColeta: {
            valor: totalPontosColeta,
            novos: novosPontosMes > 0 ? `+${novosPontosMes} novos pontos` : "Sem novos pontos",
            tendencia: "up",
          },
        },
        // Estatísticas detalhadas
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
            novosEsteMes: novosPontosMes,
          },
          usuarios: {
            total: totalUsuarios,
            ativos: usuariosAtivos,
            cidadaos: usuariosCidadaos,
            governamentais: usuariosGovernamentais,
          },
          validacoes: {
            total: totalValidacoes,
            confirmacoes: validacoesConfirmar,
            contestacoes: validacoesContestar,
          },
        },
        // Gráficos
        graficos: {
          evolucaoMensal: evolucaoMensal,
          distribuicaoTipos: distribuicaoTipos,
        },
        // Dados recentes
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


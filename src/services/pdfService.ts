// src/services/pdfService.ts
import { prisma } from "../prisma/client";
import PDFDocument from 'pdfkit';
import { Buffer } from "buffer";

interface InfograficoData {
  totalDenuncias: number;
  denunciasPendentes: number;
  denunciasValidadas: number;
  totalPontosColeta: number;
  denunciasPorStatus: { status: string; count: number }[];
  denunciasPorLocalizacao: { localizacao: string; count: number }[];
  metaResolucao: number;
}

const CORES = {
  PRIMARIA: '#143D60',
  SECUNDARIA: '#A0C878',
  DESTAQUE: '#DDEB9D',
  TEXTO: '#333333',
  CINZA: '#F5F5F5',
};

function formatarLocalizacao(localizacao: string): string {
  if (!localizacao) return 'Sem localização';
  const partes = localizacao.split(',').map(p => p.trim());
  if (partes.length >= 2) {
    return `${partes[0]}, ${partes[1]}`;
  }
  return partes[0] || 'Sem localização';
}

export async function getInfograficoData(): Promise<InfograficoData> {
  const totalDenuncias = await prisma.denuncia.count();
  
  // 🔥 CORRIGIDO: Usa RESOLVIDA
  const denunciasValidadas = await prisma.denuncia.count({
    where: { status: "RESOLVIDA" },
  });

  const denunciasPendentes = await prisma.denuncia.count({
    where: { status: "PENDENTE" },
  });

  const totalPontosColeta = await prisma.pontoColeta.count();

  const denunciasPorStatus = await prisma.denuncia.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  const statusFormatado = denunciasPorStatus.map((d: any) => ({
    status: d.status,
    count: d._count.status,
  }));

  const denunciasPorLocalizacao = await prisma.denuncia.groupBy({
    by: ["localizacao"],
    _count: { localizacao: true },
    orderBy: { _count: { localizacao: 'desc' } },
    take: 5,
  });

  const localizacaoFormatada = denunciasPorLocalizacao.map((d: any) => ({
    localizacao: formatarLocalizacao(d.localizacao || 'Sem localização'),
    count: d._count.localizacao,
  }));

  const metaResolucao = totalDenuncias > 0 
    ? Math.round((denunciasValidadas / totalDenuncias) * 100) 
    : 0;

  return {
    totalDenuncias,
    denunciasPendentes,
    denunciasValidadas,
    totalPontosColeta,
    denunciasPorStatus: statusFormatado,
    denunciasPorLocalizacao: localizacaoFormatada,
    metaResolucao,
  };
}

function drawPieChart(doc: any, data: any[], centerX: number, centerY: number, radius: number) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  const colors: { [key: string]: string } = {
    RESOLVIDA: '#A0C878',
    PENDENTE: '#143D60',
    REJEITADA: '#DDEB9D',
  };

  let startAngle = -Math.PI / 2;
  
  // 🔥 CORRIGIDO: Adicione tipagem
  const slices: Array<{
    item: any;
    startAngle: number;
    sliceAngle: number;
    color: string;
    percentage: string;
  }> = [];

  data.forEach((item) => {
    const sliceAngle = (item.count / total) * 2 * Math.PI;
    const color = colors[item.status] || '#CCCCCC';
    const percentage = ((item.count / total) * 100).toFixed(0);

    slices.push({ item, startAngle, sliceAngle, color, percentage });
    startAngle += sliceAngle;
  });

  slices.forEach(({ item, startAngle, sliceAngle, color }) => {
    doc
      .fillColor(color)
      .moveTo(centerX, centerY)
      .lineTo(
        centerX + radius * Math.cos(startAngle),
        centerY + radius * Math.sin(startAngle)
      )
      .arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
      .lineTo(centerX, centerY)
      .fill()
      .strokeColor('#FFF')
      .lineWidth(2)
      .stroke();
  });

  slices.forEach(({ item, startAngle, sliceAngle, percentage }) => {
    const labelAngle = startAngle + sliceAngle / 2;
    const labelRadius = radius * 0.65;
    const labelX = centerX + labelRadius * Math.cos(labelAngle);
    const labelY = centerY + labelRadius * Math.sin(labelAngle);

    doc
      .fillColor('#FFF')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(percentage + '%', labelX - 12, labelY - 6, { width: 24, align: 'center' });
  });

  let legendY = centerY + radius + 20;
  slices.forEach(({ item, color, percentage }) => {
    doc
      .fillColor(color)
      .rect(centerX - radius - 45, legendY, 12, 12)
      .fill();

    doc.strokeColor('#000').lineWidth(0.5).rect(centerX - radius - 45, legendY, 12, 12).stroke();

    doc
      .fillColor('#333333')
      .fontSize(8)
      .font('Helvetica')
      .text(`${item.status}: ${item.count}`, centerX - radius - 28, legendY + 1, { width: radius + 40 });

    legendY += 14;
  });
}
export async function generateInfograficoPDF(
  data: InfograficoData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        autoFirstPage: false,
      });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on('error', reject);

      // === PÁGINA 1 ===
      doc.addPage();

      // CABEÇALHO
      doc.fillColor(CORES.PRIMARIA).rect(0, 0, doc.page.width, 75).fill();

      doc
        .fillColor('#FFF')
        .fontSize(32)
        .font('Helvetica-Bold')
        .text('RecMap', 30, 15);

      doc
        .fontSize(12)
        .font('Helvetica')
        .text('Relatório de Denúncias - Órgãos Governamentais', 30, 48);

      doc
        .fontSize(10)
        .fillColor(CORES.DESTAQUE)
        .text(`${new Date().toLocaleDateString('pt-BR')}`, doc.page.width - 110, 48);

      let y = 95;

      // === KPI CARDS (3) ===
      const cardW = (doc.page.width - 60) / 3 - 8;
      const cardH = 65;

      const kpiCards = [
        { title: 'Total', value: data.totalDenuncias, bg: CORES.SECUNDARIA },
        { title: 'Taxa Resolução', value: `${data.metaResolucao}%`, bg: '#D4E8D4' },
        { title: 'Pendentes', value: data.denunciasPendentes, bg: '#FFE6E6' },
      ];

      let xPos = 25;
      kpiCards.forEach((kpi) => {
        doc.fillColor(kpi.bg).rect(xPos, y, cardW, cardH).fill();
        doc.strokeColor(CORES.PRIMARIA).lineWidth(2).rect(xPos, y, cardW, cardH).stroke();

        doc
          .fillColor(CORES.PRIMARIA)
          .fontSize(9)
          .font('Helvetica-Bold')
          .text(kpi.title, xPos + 8, y + 15, { width: cardW - 16, align: 'center' });

        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .text(String(kpi.value), xPos + 8, y + 35, { width: cardW - 16, align: 'center' });

        xPos += cardW + 8;
      });

      y += cardH + 18;

      // === SEÇÃO 1: STATUS (ESQUERDA) ===
      doc
        .fillColor(CORES.PRIMARIA)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('1. Status das Denúncias', 25, y);

      y += 16;

      const leftW = (doc.page.width - 60) / 2 - 5;
      const colW = leftW / 2;

      doc.fillColor(CORES.PRIMARIA).rect(25, y, leftW, 20).fill();
      doc
        .fillColor('#FFF')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Status', 35, y + 6);
      doc.text('Qtd', 25 + colW + 40, y + 6, { align: 'right' });

      y += 20;
      let tableY = y;

      data.denunciasPorStatus.forEach((item, idx) => {
        const rowHeight = 18;
        
        if (idx % 2 === 0) {
          doc.fillColor(CORES.CINZA).rect(25, tableY, leftW, rowHeight).fill();
        }

        doc.strokeColor('#DDD').lineWidth(0.5).rect(25, tableY, leftW, rowHeight).stroke();

        doc
          .fillColor(CORES.TEXTO)
          .fontSize(9)
          .font('Helvetica')
          .text(item.status, 35, tableY + 4);

        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .text(String(item.count), 25 + colW + 40, tableY + 4, { align: 'right' });

        tableY += rowHeight;
      });

      // === SEÇÃO 2: LOCALIZAÇÕES (DIREITA) ===
      const rightX = 25 + leftW + 10;
      const rightTableY = y - 16;

      doc
        .fillColor(CORES.PRIMARIA)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('2. Principais Áreas', rightX, rightTableY);

      y = rightTableY + 16;

      doc.fillColor(CORES.PRIMARIA).rect(rightX, y, leftW, 20).fill();
      doc
        .fillColor('#FFF')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Localização', rightX + 8, y + 6);
      doc.text('Qtd', rightX + colW + 40, y + 6, { align: 'right' });

      y += 20;
      let locY = y;

      data.denunciasPorLocalizacao.forEach((item, idx) => {
        const rowHeight = 18;
        
        if (idx % 2 === 0) {
          doc.fillColor(CORES.CINZA).rect(rightX, locY, leftW, rowHeight).fill();
        }

        doc.strokeColor('#DDD').lineWidth(0.5).rect(rightX, locY, leftW, rowHeight).stroke();

        doc
          .fillColor(CORES.TEXTO)
          .fontSize(7)
          .font('Helvetica')
          .text(item.localizacao.substring(0, 30), rightX + 8, locY + 4);

        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .text(String(item.count), rightX + colW + 40, locY + 4, { align: 'right' });

        locY += rowHeight;
      });

      y = Math.max(tableY, locY) + 15;

      // === DIVISOR ===
      doc.strokeColor(CORES.SECUNDARIA).lineWidth(1.5).moveTo(25, y).lineTo(doc.page.width - 25, y).stroke();

      y += 12;

      // === SEÇÃO 3: INDICADORES ===
      doc
        .fillColor(CORES.PRIMARIA)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('3. Indicadores de Desempenho', 25, y);

      y += 16;

      doc
        .fillColor(CORES.CINZA)
        .rect(25, y, doc.page.width - 50, 75)
        .fill();

      doc.strokeColor(CORES.PRIMARIA).lineWidth(1.5).rect(25, y, doc.page.width - 50, 75).stroke();

      doc
        .fillColor(CORES.TEXTO)
        .fontSize(9)
        .font('Helvetica');

      y += 10;
      const status = data.metaResolucao >= 70 ? 'Aceitável' : 'Crítica';

      doc.text(`• Taxa de Resolução: ${data.metaResolucao}% (${status})`, 35, y);
      y += 14;
      doc.text(`• Total de Pontos de Coleta: ${data.totalPontosColeta}`, 35, y);
      y += 14;
      doc.text(`• Denúncias Pendentes: ${data.denunciasPendentes}`, 35, y);
      y += 14;
      doc.text(`• Denúncias Resolvidas: ${data.denunciasValidadas}`, 35, y);

      // === RODAPÉ ===
      doc.fillColor(CORES.PRIMARIA).rect(0, doc.page.height - 30, doc.page.width, 30).fill();
      doc
        .fillColor('#FFF')
        .fontSize(7)
        .font('Helvetica')
        .text('RecMap - Cidadania Ativa e Sustentabilidade | Página 1 de 2', 25, doc.page.height - 20);

      // === PÁGINA 2 ===
      doc.addPage();

      doc.fillColor(CORES.PRIMARIA).rect(0, 0, doc.page.width, 60).fill();
      doc
        .fillColor('#FFF')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text('RecMap', 30, 15);
      doc
        .fontSize(11)
        .font('Helvetica')
        .text('Análises Técnicas', 30, 38);

      y = 85;

      // === GRÁFICO DE PIZZA ===
      doc
        .fillColor(CORES.PRIMARIA)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Distribuição por Status', 30, y);

      drawPieChart(doc, data.denunciasPorStatus, 120, 230, 60);

      // === RECOMENDAÇÕES ===
      const rightStart = 250;
      doc
        .fillColor(CORES.PRIMARIA)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Recomendações', rightStart, y);

      y += 20;

      const recomendacoes = [
        `Focar em ${data.denunciasPorLocalizacao[0]?.localizacao || 'áreas críticas'}`,
        `Resolver ${data.denunciasPendentes} denúncias pendentes`,
        `Meta: Atingir 85% de resolução`,
        `Expandir pontos de coleta`,
      ];

      recomendacoes.forEach((rec, idx) => {
        doc
          .fillColor(CORES.TEXTO)
          .fontSize(9)
          .font('Helvetica');

        const recX = rightStart;
        const recW = doc.page.width - rightStart - 40;

        doc.text(`${idx + 1}. ${rec}`, recX, y, { width: recW });
        y += 18;
      });

      // === RODAPÉ ===
      doc.fillColor(CORES.PRIMARIA).rect(0, doc.page.height - 30, doc.page.width, 30).fill();
      doc
        .fillColor('#FFF')
        .fontSize(7)
        .font('Helvetica')
        .text('RecMap - Cidadania Ativa e Sustentabilidade | Página 2 de 2', 25, doc.page.height - 20);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

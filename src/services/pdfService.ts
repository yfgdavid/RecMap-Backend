import PDFDocument from "pdfkit";
import { prisma } from "../prisma/client";

interface InfograficoData {
  totalDenuncias: number;
  denunciasPendentes: number;
  denunciasValidadas: number;
  totalPontosColeta: number;
  denunciasPorStatus: { status: string; count: number }[];
}

// Função para agregar os dados necessários para o infográfico (MANTIDA)
export async function getInfograficoData(): Promise<InfograficoData> {
  const totalDenuncias = await prisma.denuncia.count();
  const denunciasPendentes = await prisma.denuncia.count({
    where: { status: "PENDENTE" },
  });
  const denunciasValidadas = await prisma.denuncia.count({
    where: { status: "VALIDADA" },
  });
  const totalPontosColeta = await prisma.pontoColeta.count();


  // Agregação de denúncias por status
  const denunciasPorStatus = await prisma.denuncia.groupBy({
    by: ["status"],
    _count: {
      status: true,
    },
  });

  const denunciasFormatadas = denunciasPorStatus.map((d: any) => ({
    status: d.status,
    count: d._count.status,
  }));

  return {
    totalDenuncias,
    denunciasPendentes,
    denunciasValidadas,
    totalPontosColeta,
    denunciasPorStatus: denunciasFormatadas,
  };
}

// Função para gerar o PDF com NOVO DESIGN
export async function generateInfograficoPDF(data: InfograficoData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on("error", reject);

    // --- ESQUEMA DE CORES ---
    const COR_PRIMARIA = "#143D60"; // Azul Escuro (RecMap)
    const COR_SECUNDARIA = "#A0C878"; // Verde Claro (RecMap)
    const COR_DESTAQUE = "#DDEB9D"; // Amarelo/Verde (RecMap)
    const COR_TEXTO = "#333333";

    // --- FUNÇÕES AUXILIARES ---
    const drawHeader = () => {
      doc.fillColor(COR_PRIMARIA).rect(0, 0, doc.page.width, 70).fill();
      doc.fillColor("white").fontSize(20).font("Helvetica-Bold").text("Relatório Infográfico RecMap", 50, 25);
      
      const now = new Date();
      const dateString = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
      doc.fillColor("white").fontSize(10).font("Helvetica").text(`Gerado em: ${dateString}`, doc.page.width - 150, 30, { align: "right", width: 100 });
    };

    const drawFooter = () => {
      doc.fillColor(COR_PRIMARIA).rect(0, doc.page.height - 30, doc.page.width, 30).fill();
      doc.fillColor("white").fontSize(8).text("RecMap - Cidadania Ativa e Sustentabilidade", 50, doc.page.height - 20);
      doc.fillColor("white").fontSize(8).text("Relatório Gerencial", doc.page.width - 150, doc.page.height - 20, { align: "right", width: 100 });
    };

    const drawSectionTitle = (title: string) => {
      doc.moveDown(1.5);
      doc.fillColor(COR_PRIMARIA).fontSize(16).font("Helvetica-Bold").text(title, { underline: false });
      doc.strokeColor(COR_SECUNDARIA).lineWidth(2).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
      doc.moveDown(1);
    };

    const drawKpiCard = (title: string, value: number | string, color: string, x: number, y: number) => {
      const width = 150;
      const height = 60;
      
      doc.fillColor(color).rect(x, y, width, height).fill();
      doc.fillColor("white").rect(x + 5, y + 5, width - 10, height - 10).fill();
      
      doc.fillColor(COR_TEXTO).fontSize(10).font("Helvetica").text(title, x + 10, y + 10, { width: width - 20 });
      doc.fillColor(COR_PRIMARIA).fontSize(20).font("Helvetica-Bold").text(value.toString(), x + 10, y + 30, { width: width - 20 });
    };

    // --- INÍCIO DO DOCUMENTO ---
    drawHeader();
    doc.moveDown(3); // Desce após o cabeçalho

    // Título Principal
    doc.fillColor(COR_PRIMARIA).fontSize(28).font("Helvetica-Bold").text("Relatório Gerencial de Impacto", { align: "center" });
    doc.moveDown(0.5);
    doc.fillColor(COR_TEXTO).fontSize(12).font("Helvetica").text("Análise de Denúncias e Pontos de Coleta para o Governo Municipal", { align: "center" });
    doc.moveDown(1);

    // --- SEÇÃO 1: VISÃO GERAL (KPIs) ---
    drawSectionTitle("1. Visão Geral da Plataforma");
    
    const kpiY = doc.y;
    const kpiSpacing = 170;

    drawKpiCard("Total de Denúncias", data.totalDenuncias, COR_SECUNDARIA, 50, kpiY);
    drawKpiCard("Pontos de Coleta", data.totalPontosColeta, COR_PRIMARIA, 50 + kpiSpacing, kpiY);
    drawKpiCard("Denúncias Validadas", data.denunciasValidadas, COR_DESTAQUE, 50 + 2 * kpiSpacing, kpiY);
    drawKpiCard("Denúncias Pendentes", data.denunciasPendentes, COR_PRIMARIA, 50 + 3 * kpiSpacing, kpiY);

    doc.y = kpiY + 70; // Pula para baixo dos cards
    doc.moveDown(1);

    // --- SEÇÃO 2: DETALHE DE DENÚNCIAS ---
    drawSectionTitle("2. Detalhe: Denúncias por Status");

    // Tabela de Denúncias por Status
    const tableTop = doc.y;
    const itemHeight = 25;
    const col1X = 50;
    const col2X = 250;
    const col3X = 450;

    // Cabeçalho da Tabela
    doc.fillColor(COR_PRIMARIA).rect(col1X, tableTop, doc.page.width - 100, itemHeight).fill();
    doc.fillColor("white").fontSize(12).font("Helvetica-Bold");
    doc.text("Status", col1X + 10, tableTop + 8, { width: 200 });
    doc.text("Quantidade", col2X + 10, tableTop + 8, { width: 200 });
    doc.text("Percentual", col3X + 10, tableTop + 8, { width: 100 });
    
    doc.font("Helvetica");
    let currentY = tableTop + itemHeight;
    let totalDenuncias = data.totalDenuncias > 0 ? data.totalDenuncias : 1; // Evita divisão por zero

    data.denunciasPorStatus.forEach((item, index) => {
      const isEven = index % 2 === 0;
      const percent = ((item.count / totalDenuncias) * 100).toFixed(1) + "%";
      
      doc.fillColor(isEven ? COR_DESTAQUE + "30" : "white").rect(col1X, currentY, doc.page.width - 100, itemHeight).fill(); // Fundo zebrado
      
      doc.fillColor(COR_TEXTO).fontSize(10);
      doc.text(item.status, col1X + 10, currentY + 8, { width: 200 });
      doc.text(item.count.toString(), col2X + 10, currentY + 8, { width: 200 });
      doc.text(percent, col3X + 10, currentY + 8, { width: 100 });
      
      currentY += itemHeight;
    });
    
    doc.y = currentY;
    doc.moveDown(2);

    // --- SEÇÃO 3: DETALHE DE PONTOS DE COLETA ---
    drawSectionTitle("3. Detalhe: Pontos de Coleta por Tipo de Resíduo");

    // Tabela de Pontos de Coleta por Tipo
    const tableTop2 = doc.y;

    // Cabeçalho da Tabela
    doc.fillColor(COR_PRIMARIA).rect(col1X, tableTop2, doc.page.width - 100, itemHeight).fill();
    doc.fillColor("white").fontSize(12).font("Helvetica-Bold");
    doc.text("Tipo de Resíduo", col1X + 10, tableTop2 + 8, { width: 200 });
    doc.text("Quantidade", col2X + 10, tableTop2 + 8, { width: 200 });
    doc.text("Percentual", col3X + 10, tableTop2 + 8, { width: 100 });
    
    doc.font("Helvetica");
    currentY = tableTop2 + itemHeight;
    let totalPontos = data.totalPontosColeta > 0 ? data.totalPontosColeta : 1;

    // --- RODAPÉ ---
    drawFooter();

    doc.end();
  });
}
import { prisma } from "../prisma/client";
import axios from "axios"; // Importar axios
import { Buffer } from "buffer"; // Importar Buffer 

// Interface de dados 
interface InfograficoData {
  totalDenuncias: number;
  denunciasPendentes: number;
  denunciasValidadas: number;
  totalPontosColeta: number;
  denunciasPorStatus: { status: string; count: number }[];
}

// Função para agregar os dados 
export async function getInfograficoData(): Promise<InfograficoData> {
  const totalDenuncias = await prisma.denuncia.count();
  const denunciasPendentes = await prisma.denuncia.count({
    where: { status: "PENDENTE" },
  });
  const denunciasValidadas = await prisma.denuncia.count({
    where: { status: "VALIDADA" },
  });
  const totalPontosColeta = await prisma.pontoColeta.count();

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

// NOVA FUNÇÃO: Chama o Microserviço Python para gerar o PDF
export async function generateInfograficoPDF(
  data: InfograficoData
): Promise<Buffer> {
  // Endereço do Microserviço Python (ajuste a porta e o host conforme necessário)
  const PYTHON_API_URL = "http://localhost:8000/generate-pdf";

  try {
    // 1. Faz a requisição POST para o serviço Python, enviando os dados como JSON
    const response = await axios.post(PYTHON_API_URL, data, {
      // 2. Define o tipo de resposta esperado como um array de bytes (Buffer no Node.js )
      responseType: "arraybuffer",
    });

    return Buffer.from(response.data);
  } catch (error) {
    console.error("ERRO ao chamar o Microserviço Python:", error);

    // Se for um erro de resposta HTTP (ex: 500 do Python), tente extrair a mensagem de erro
    if (axios.isAxiosError(error) && error.response) {
      const errorData = error.response.data;
      let errorMessage = "Erro desconhecido no serviço Python.";

      // Tenta ler a mensagem de erro do corpo da resposta (se não for binário)
      try {
        const errorText = Buffer.from(errorData).toString("utf-8");
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.error || errorText;
      } catch (e) {
        // Se não for JSON, usa a mensagem padrão
      }

      throw new Error(
        `Falha na geração do PDF (Status ${error.response.status}): ${errorMessage}`
      );
    }

    throw new Error("Falha na comunicação com o Microserviço Python.");
  }
}

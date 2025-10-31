import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Rotas
import usuarioRoutes from "./routes/usuario.routes";
import denunciaRoutes from "./routes/denuncia.routes";
import pontoColetaRoutes from "./routes/pontoColeta.routes";
import relatorioRoutes from "./routes/relatorio.routes";
import validacaoRoutes from "./routes/validacao.routes";
import conteudoRoutes from "./routes/conteudo.routes";
import mapaRoutes from "./routes/mapa.routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Rotas principais
app.use("/usuarios", usuarioRoutes);
app.use("/denuncias", denunciaRoutes);
app.use("/pontos", pontoColetaRoutes);
app.use("/relatorios", relatorioRoutes);
app.use("/validacoes", validacaoRoutes);
app.use("/conteudos", conteudoRoutes);
app.use("/mapa", mapaRoutes);

// 🔎 Rota raiz só pra teste
app.get("/", (req, res) => {
  res.json({
    mensagem: "🚀 API RecMap rodando com sucesso!",
    rotas_disponiveis: [
      "/usuarios",
      "/denuncias",
      "/pontos",
      "/relatorios",
      "/validacoes",
      "/conteudos",
    ],
  });
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () =>
  console.log(`✅ Servidor rodando na porta ${PORT}`)
);

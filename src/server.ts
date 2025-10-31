// src/server.ts ou src/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// ✅ Importando as rotas
import usuarioRoutes from "./routes/usuario.routes";
import denunciaRoutes from "./routes/denuncia.routes";
import pontoColetaRoutes from "./routes/pontoColeta.routes";
import relatorioRoutes from "./routes/relatorio.routes";
import validacaoRoutes from "./routes/validacao.routes";
import conteudoRoutes from "./routes/conteudo.routes";
import mapaRoutes from "./routes/mapa.routes";
import authRoutes from "./routes/auth.routes";

dotenv.config();

const app = express();

// 🧩 Middlewares globais
app.use(cors({
  origin: "*", // depois podemos restringir para o endereço do front
}));
app.use(express.json());

// 🚦 Rotas principais
app.use("/usuarios", usuarioRoutes);
app.use("/denuncias", denunciaRoutes);
app.use("/pontos", pontoColetaRoutes);
app.use("/relatorios", relatorioRoutes);
app.use("/validacoes", validacaoRoutes);
app.use("/conteudos", conteudoRoutes);
app.use("/mapa", mapaRoutes);
app.use('/auth', authRoutes);


// 🧠 Rota raiz (teste rápido no navegador)
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
      "/mapa",
    ],
  });
});

// 🔥 Inicializando servidor
const PORT = process.env.PORT || 3333;
app.listen(PORT, () =>
  console.log(`✅ Servidor rodando na porta ${PORT}`)
);

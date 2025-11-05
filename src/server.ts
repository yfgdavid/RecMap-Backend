import express from "express";
import cors from "cors";
import dotenv from "dotenv";


import usuarioRoutes from "./routes/usuario.routes";
import denunciaRoutes from "./routes/denuncia.routes";
import pontoColetaRoutes from "./routes/pontoColeta.routes";
import relatorioRoutes from "./routes/relatorio.routes";
import validacaoRoutes from "./routes/validacao.routes";
import mapaRoutes from "./routes/mapa.routes";
import authRoutes from "./routes/auth.routes";

dotenv.config();

const app = express();


app.use(cors({ origin: "*" }));


app.use((req, res, next) => {
  console.log("🔎 Content-Type recebido:", req.headers["content-type"]);
  next();
});



app.use("/denuncias", denunciaRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/usuarios", usuarioRoutes);
app.use("/pontos", pontoColetaRoutes);
app.use("/relatorios", relatorioRoutes);
app.use("/validacoes", validacaoRoutes);
app.use("/mapa", mapaRoutes);
app.use("/auth", authRoutes);

// 🧠 Teste rápido no navegador
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

// 🔥 Inicializar servidor
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(`✅ Servidor rodando na porta ${PORT}`));

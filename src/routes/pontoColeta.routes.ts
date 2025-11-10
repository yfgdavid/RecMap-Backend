import { Router } from "express";
import multer from "multer";
import {
  listarPontos,
  buscarPonto,
  criarPonto,
  atualizarPonto,
  deletarPonto
} from "../controllers/pontoColetaController";

const router = Router();

// aqui você escolhe como armazenar as fotos
// Usando memória -> facilita salvar em base64 ou nuvem
const upload = multer({ dest: "uploads/" });

// Rotas
router.get("/", listarPontos);
router.get("/:id", buscarPonto);

// rota que recebe FormData (com ou sem foto)
router.post("/", upload.single("foto"), criarPonto);

router.put("/:id", atualizarPonto);
router.delete("/:id", deletarPonto);

export default router;

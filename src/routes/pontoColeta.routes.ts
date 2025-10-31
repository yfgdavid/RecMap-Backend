import { Router } from "express";
import {
  listarPontos,
  buscarPonto,
  criarPonto,
  atualizarPonto,
  deletarPonto,
} from "../controllers/pontoColetaController";

const router = Router();

// Rotas CRUD de Pontos de Coleta
router.get("/", listarPontos);           // GET /pontos → lista todos
router.get("/:id", buscarPonto);         // GET /pontos/:id → busca um
router.post("/", criarPonto);            // POST /pontos → cria um novo
router.put("/:id", atualizarPonto);      // PUT /pontos/:id → atualiza
router.delete("/:id", deletarPonto);     // DELETE /pontos/:id → deleta

export default router;

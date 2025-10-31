import { Router } from "express";
import {
  listarValidacoes,
  buscarValidacao,
  criarValidacao,
  atualizarValidacao,
  deletarValidacao,
} from "../controllers/validacaoController";

const router = Router();

// Rotas CRUD de Validações
router.get("/", listarValidacoes);        // GET /validacoes
router.get("/:id", buscarValidacao);      // GET /validacoes/:id
router.post("/", criarValidacao);         // POST /validacoes
router.put("/:id", atualizarValidacao);   // PUT /validacoes/:id
router.delete("/:id", deletarValidacao);  // DELETE /validacoes/:id

export default router;

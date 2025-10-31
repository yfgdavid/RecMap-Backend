import { Router } from "express";
import {
  listarConteudos,
  buscarConteudo,
  criarConteudo,
  atualizarConteudo,
  deletarConteudo,
} from "../controllers/conteudoController";

const router = Router();

// Rotas CRUD de Conteúdos Educativos
router.get("/", listarConteudos);        // GET /conteudos
router.get("/:id", buscarConteudo);      // GET /conteudos/:id
router.post("/", criarConteudo);         // POST /conteudos
router.put("/:id", atualizarConteudo);   // PUT /conteudos/:id
router.delete("/:id", deletarConteudo);  // DELETE /conteudos/:id

export default router;

import { Router } from "express";
import {
  listarUsuarios,
  buscarUsuario,
  criarUsuario,
  atualizarUsuario,
  deletarUsuario,
} from "../controllers/usuarioController";

const router = Router();


router.get("/", listarUsuarios);          // GET /usuarios → lista todos
router.get("/:id", buscarUsuario);        // GET /usuarios/:id → busca um
router.post("/", criarUsuario);           // POST /usuarios → cria um novo
router.put("/:id", atualizarUsuario);     // PUT /usuarios/:id → atualiza
router.delete("/:id", deletarUsuario);    // DELETE /usuarios/:id → deleta

export default router;

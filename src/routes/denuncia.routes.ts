import { Router } from "express";
import {
  listarDenuncias,
  buscarDenuncia,
  criarDenuncia,
  atualizarDenuncia,
  deletarDenuncia,
} from "../controllers/denunciaController";

const router = Router();

// Rotas CRUD de Denúncias
router.get("/", listarDenuncias);        // GET /denuncias
router.get("/:id", buscarDenuncia);      // GET /denuncias/:id
router.post("/", criarDenuncia);         // POST /denuncias
router.put("/:id", atualizarDenuncia);   // PUT /denuncias/:id
router.delete("/:id", deletarDenuncia);  // DELETE /denuncias/:id

export default router;

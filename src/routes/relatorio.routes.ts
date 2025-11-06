import { Router } from "express";
import {
  gerarInfograficoPDF,
  listarRelatorios,
  buscarRelatorio,
  criarRelatorio,
  atualizarRelatorio,
  deletarRelatorio,
} from "../controllers/relatorioController";

const router = Router();

// Rotas CRUD de Relatórios
router.get("/infografico", gerarInfograficoPDF); // <-- NOVA ROTA ADICIONADA
router.get("/", listarRelatorios);           // GET /relatorios → lista todos
router.get("/:id", buscarRelatorio);         // GET /relatorios/:id → busca um
router.post("/", criarRelatorio);            // POST /relatorios → cria um novo
router.put("/:id", atualizarRelatorio);      // PUT /relatorios/:id → atualiza
router.delete("/:id", deletarRelatorio);     // DELETE /relatorios/:id → deleta

export default router;
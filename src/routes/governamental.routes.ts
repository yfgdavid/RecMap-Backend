import { Router } from "express";
import {
  getDashboardStats,
  listarDenunciasGovernamental,
  atualizarStatusDenuncia,
  getRelatorioEngajamento,
} from "../controllers/governamentalController";

const router = Router();

// Dashboard principal
router.get("/dashboard", getDashboardStats);

// Gestão de denúncias
router.get("/denuncias", listarDenunciasGovernamental);
router.patch("/denuncias/:id/status", atualizarStatusDenuncia);

// Relatórios
router.get("/relatorios/engajamento", getRelatorioEngajamento);

export default router;


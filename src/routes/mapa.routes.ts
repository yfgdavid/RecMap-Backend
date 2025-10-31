import { Router } from "express";
import { listarMapa } from "../controllers/mapaController";

const router = Router();

// GET /mapa
router.get("/", listarMapa);

export default router;

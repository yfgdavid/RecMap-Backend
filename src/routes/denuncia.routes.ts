import { Router } from "express";
import multer from "multer";
import {
  listarDenuncias,
  buscarDenuncia,
  criarDenuncia,
  atualizarDenuncia,
  deletarDenuncia,
  getDenunciasPorUsuario,
  listarDenunciasPendentes,
} from "../controllers/denunciaController";

const router = Router();
const upload = multer({ dest: "uploads/" }); 

// Rotas CRUD de Denúncias
router.get("/", listarDenuncias);
router.get("/:id", buscarDenuncia);
router.get("/usuario/:id_usuario", getDenunciasPorUsuario);
router.get("/pendentes/:id_usuario", listarDenunciasPendentes);

// POST com foto e geocodificação
router.post("/", upload.single("foto"), criarDenuncia);

router.put("/:id", atualizarDenuncia);
router.delete("/:id", deletarDenuncia);

export default router;

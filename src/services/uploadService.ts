// src/services/uploadService.ts
import multer from "multer";
import path from "path";
import fs from "fs";

// Certifica que a pasta uploads existe
const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuração do storage do multer
export const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const nome = `${Date.now()}${ext}`;
      cb(null, nome);
    },
  }),
});

// Função para transformar endereço em latitude/longitude usando Nominatim (OpenStreetMap)
export async function geocode(address: string): Promise<{ latitude: number; longitude: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  const res = await fetch(url);
  const data = (await res.json()) as { lat: string; lon: string }[] | null;
  const firstResult = data?.[0];
  if (!firstResult) return null;
  return {
    latitude: parseFloat(firstResult.lat),
    longitude: parseFloat(firstResult.lon),
  };
}

// Gera URL completa da foto
export function getFile(filename: string | null): string | null {
  if (!filename) return null;
  
  const BASE_URL = (process.env.BACKEND_URL || "http://localhost:3333").replace(/\/+$/, "");
  const cleanFilename = filename.replace(/^\/+/, "");
  
  return `${BASE_URL}/uploads/${cleanFilename}`;
}

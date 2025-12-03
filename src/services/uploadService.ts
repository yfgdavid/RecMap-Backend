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

// Gera URL completa da foto sem barras duplicadas
export function getFile(filename: string | null): string | null {
  if (!filename) return null;
  
  // 1. Pega BASE_URL e garante que não tem barra no final
  let BASE_URL = process.env.BACKEND_URL || "http://localhost:3333";
  BASE_URL = BASE_URL.replace(/\/+$/, ""); // Remove todas as barras do final
  
  // 2. Remove barras extras no começo do filename
  const cleanFilename = filename.replace(/^\/+/, "");
  
  // 3. Monta a URL
  const fullUrl = `${BASE_URL}/uploads/${cleanFilename}`;
  
  // 4. GARANTIA EXTRA: Remove qualquer // que possa ter sobrado (exceto no https://)
  const finalUrl = fullUrl.replace(/([^:]\/)\/+/g, "$1");
  
  // 5. LOG DE DEBUG (remova depois)
  console.log("🔍 DEBUG getFile:");
  console.log("  - BASE_URL:", BASE_URL);
  console.log("  - filename original:", filename);
  console.log("  - cleanFilename:", cleanFilename);
  console.log("  - URL final:", finalUrl);
  
  return finalUrl;
}

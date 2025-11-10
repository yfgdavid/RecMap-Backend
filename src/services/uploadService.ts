// src/services/uploadService.ts
import multer from "multer";
import path from "path";

// Configuração do storage do multer
export const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "..", "uploads")),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
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

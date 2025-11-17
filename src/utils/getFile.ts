export function getFile(filename: string | null): string | null {
  if (!filename) return null;

  const BASE_URL = process.env.BACKEND_URL || "http://localhost:3333";
  return `${BASE_URL}/uploads/${filename}`;
}
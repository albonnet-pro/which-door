import "server-only";
import { unlink } from "node:fs/promises";
import path from "node:path";

export const UPLOAD_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR ?? "uploads");
export const UPLOAD_MAX_BYTES = Number(process.env.UPLOAD_MAX_MB ?? 500) * 1024 * 1024;
export const UPLOAD_PREFIX = "/uploads/";

export const VIDEO_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/mp4",
  ".ogv": "video/ogg",
};

const SAFE_NAME = /^[a-z0-9-]+\.[a-z0-9]+$/;

/** Chemin disque d'un fichier uploadé, ou null si le nom est invalide. */
export function uploadPath(name: string) {
  return SAFE_NAME.test(name) ? path.join(UPLOAD_DIR, name) : null;
}

/** Supprime le fichier si l'URL pointe vers un upload local (ignore les URL externes). */
export async function deleteUpload(url: string | null | undefined) {
  if (!url?.startsWith(UPLOAD_PREFIX)) return;
  const file = uploadPath(url.slice(UPLOAD_PREFIX.length));
  if (file) await unlink(file).catch(() => {});
}

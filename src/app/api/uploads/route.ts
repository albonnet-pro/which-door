import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import { UPLOAD_DIR, UPLOAD_MAX_BYTES, UPLOAD_PREFIX, VIDEO_TYPES } from "@/lib/uploads";

// Upload d'une vidéo : le corps de la requête est le fichier brut, écrit en streaming sur le disque.
export async function POST(request: Request) {
  const filename = decodeURIComponent(request.headers.get("x-filename") ?? "");
  const ext = path.extname(filename).toLowerCase();
  if (!VIDEO_TYPES[ext]) {
    return Response.json({ error: `Format non supporté (${Object.keys(VIDEO_TYPES).join(", ")})` }, { status: 415 });
  }
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > UPLOAD_MAX_BYTES) {
    return Response.json({ error: "Fichier trop volumineux" }, { status: 413 });
  }
  if (!request.body) return Response.json({ error: "Fichier vide" }, { status: 400 });

  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomUUID()}${ext}`;
  const target = path.join(UPLOAD_DIR, name);

  let received = 0;
  const limit = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      received += chunk.length;
      callback(received > UPLOAD_MAX_BYTES ? new Error("too-large") : null, chunk);
    },
  });

  try {
    await pipeline(Readable.fromWeb(request.body as WebReadableStream), limit, createWriteStream(target));
  } catch (error) {
    await unlink(target).catch(() => {});
    const tooLarge = error instanceof Error && error.message === "too-large";
    return Response.json(
      { error: tooLarge ? "Fichier trop volumineux" : "Échec de l'upload" },
      { status: tooLarge ? 413 : 500 },
    );
  }

  return Response.json({ url: `${UPLOAD_PREFIX}${name}` });
}

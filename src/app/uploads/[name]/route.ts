import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { uploadPath, VIDEO_TYPES } from "@/lib/uploads";

// Sert les vidéos uploadées, avec support des requêtes Range (lecture et avance rapide).
export async function GET(request: Request, { params }: RouteContext<"/uploads/[name]">) {
  const { name } = await params;
  const file = uploadPath(name);
  const info = file ? await stat(file).catch(() => null) : null;
  if (!file || !info?.isFile()) return new Response("Not found", { status: 404 });

  const size = info.size;
  const headers = new Headers({
    "Content-Type": VIDEO_TYPES[path.extname(name)] ?? "application/octet-stream",
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
  });

  const range = request.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  if (!range) {
    headers.set("Content-Length", String(size));
    return new Response(Readable.toWeb(createReadStream(file)) as ReadableStream, { headers });
  }

  const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
  const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
  if (start >= size || start > end) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }

  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(end - start + 1));
  return new Response(Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream, {
    status: 206,
    headers,
  });
}

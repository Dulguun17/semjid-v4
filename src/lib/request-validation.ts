import "server-only";

export class RequestInputError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export async function readLimitedBody(request: Request, limit: number): Promise<Uint8Array> {
  if (Number(request.headers.get("content-length")) > limit) throw new RequestInputError("Request too large.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestInputError("Request body required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new RequestInputError("Request too large.", 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
  return result;
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  const bytes = await readLimitedBody(request, 16384);
  let value;
  try { value = JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new RequestInputError("Invalid JSON request."); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new RequestInputError("Invalid request.");
  return value;
}

const uploadTypes: Record<string, { extension: string; signature: number[] }> = {
  "application/pdf": { extension: "pdf", signature: [0x25, 0x50, 0x44, 0x46, 0x2d] },
  "image/jpeg": { extension: "jpg", signature: [0xff, 0xd8, 0xff] },
  "image/jpg": { extension: "jpg", signature: [0xff, 0xd8, 0xff] },
  "image/png": { extension: "png", signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  "image/webp": { extension: "webp", signature: [0x52, 0x49, 0x46, 0x46] },
  "application/msword": { extension: "doc", signature: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] },
  "application/vnd.ms-excel": { extension: "xls", signature: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { extension: "docx", signature: [0x50, 0x4b, 0x03, 0x04] },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { extension: "xlsx", signature: [0x50, 0x4b, 0x03, 0x04] },
  "text/plain": { extension: "txt", signature: [] },
};

export function validateUpload(bytes: Uint8Array, mime: string, imagesOnly = false): string {
  const type = uploadTypes[mime];
  if (!type || (imagesOnly && !mime.startsWith("image/"))) throw new RequestInputError("Unsupported file type.");
  if (!bytes.length || !type.signature.every((value, i) => bytes[i] === value)) throw new RequestInputError("File content does not match its type.");
  if (mime === "image/webp" && new TextDecoder().decode(bytes.slice(8, 12)) !== "WEBP") throw new RequestInputError("Invalid WebP image.");
  if (mime === "text/plain" && bytes.includes(0)) throw new RequestInputError("Invalid text file.");
  return type.extension;
}

export async function readUpload(request: Request, imagesOnly = false) {
  const limit = (imagesOnly ? 5 : 10) * 1024 * 1024;
  const body = await readLimitedBody(request, limit + 65536);
  let form;
  try { form = await new Response(Buffer.from(body), { headers: { "content-type": request.headers.get("content-type") || "" } }).formData(); }
  catch { throw new RequestInputError("Invalid upload request."); }
  const file = form.get("file");
  if (!file || typeof file === "string" || file.size > limit) throw new RequestInputError("Missing file or file too large.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  return { bytes, mime: file.type, extension: validateUpload(bytes, file.type, imagesOnly) };
}

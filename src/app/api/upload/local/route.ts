import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  CLOUDINARY_ENDPOINTS,
  isEndpointAllowed,
  matchesAllowedMime,
  type CloudinaryEndpointName,
} from "@/lib/cloudinary";
import { isLocalStorageMode, writeLocalUploadFile } from "@/lib/cloudinary/server";
import { env } from "@/env";

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
};

function extensionFor(file: File): string {
  if (EXT_BY_MIME[file.type]) return EXT_BY_MIME[file.type];
  const match = file.name.match(/\.([a-zA-Z0-9]+)$/);
  if (match && /^[a-zA-Z0-9]{1,10}$/.test(match[1])) return match[1].toLowerCase();
  return "bin";
}

export async function POST(request: Request) {
  if (!isLocalStorageMode()) {
    return NextResponse.json({ error: "Almacenamiento local no habilitado" }, { status: 400 });
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(env.NEXT_PUBLIC_APP_URL).origin) {
        return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
    }
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: FormData;
  try {
    body = await request.formData();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const rawEndpoint = body.get("endpoint");
  if (typeof rawEndpoint !== "string" || !(rawEndpoint in CLOUDINARY_ENDPOINTS)) {
    return NextResponse.json({ error: "Endpoint de subida inválido" }, { status: 400 });
  }
  const endpointName = rawEndpoint as CloudinaryEndpointName;
  const config = CLOUDINARY_ENDPOINTS[endpointName];

  if (!isEndpointAllowed(endpointName, user.role as string | undefined)) {
    return NextResponse.json(
      { error: "No tienes permisos para subir a este destino" },
      { status: 403 }
    );
  }

  const files = body.getAll("files").filter((v): v is File => v instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
  }
  if (files.length > config.maxFileCount) {
    return NextResponse.json(
      { error: `Máximo ${config.maxFileCount} archivo(s) por carga` },
      { status: 400 }
    );
  }

  const invalid = files.find(
    (f) => f.size > config.maxSizeBytes || !matchesAllowedMime(f.type, config.allowedMimeTypes)
  );
  if (invalid) {
    return NextResponse.json(
      {
        error: `"${invalid.name}" no cumple los requisitos (${
          invalid.size > config.maxSizeBytes
            ? `máx ${Math.round(config.maxSizeBytes / 1024 / 1024)}MB`
            : "formato no permitido"
        })`,
      },
      { status: 400 }
    );
  }

  const uploaded: { url: string; name: string; size: number; type: string }[] = [];
  for (const file of files) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const url = await writeLocalUploadFile(config.folder, extensionFor(file), buffer);
      uploaded.push({ url, name: file.name, size: file.size, type: file.type });
    } catch (error) {
      console.error("[Local Upload Error] Failed to store file locally:", error);
      return NextResponse.json({ error: "Error al guardar el archivo" }, { status: 500 });
    }
  }

  return NextResponse.json({ files: uploaded });
}
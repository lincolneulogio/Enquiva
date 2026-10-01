import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  CLOUDINARY_ENDPOINTS,
  isEndpointAllowed,
  sanitizeFolderName,
  type CloudinaryEndpointName,
} from "@/lib/cloudinary";
import { signCloudinaryUpload, isLocalStorageMode } from "@/lib/cloudinary/server";
import { env } from "@/env";

export async function POST(request: Request) {
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

  let body: {
    endpoint?: unknown;
    eventTitle?: unknown;
    input?: { eventTitle?: unknown; [key: string]: unknown };
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const endpointName = body.endpoint as CloudinaryEndpointName;
  const endpoint = CLOUDINARY_ENDPOINTS[endpointName];
  if (!endpoint) {
    return NextResponse.json({ error: "Endpoint de subida inválido" }, { status: 400 });
  }

  if (!isEndpointAllowed(endpointName, user.role as string | undefined)) {
    return NextResponse.json(
      { error: "No tienes permisos para subir a este destino" },
      { status: 403 }
    );
  }

  const rawTitle =
    typeof body.eventTitle === "string"
      ? body.eventTitle
      : typeof body.input?.eventTitle === "string"
        ? body.input.eventTitle
        : "";

  let folder = endpoint.folder;
  if (endpointName === "eventCoverImage" || endpointName === "eventAttachment") {
    const titleSlug = rawTitle ? sanitizeFolderName(rawTitle) : "sin-titulo";
    folder = `events/${titleSlug}`;
  }

  if (isLocalStorageMode()) {
    // Almacenamiento local: el navegador sube a POST /api/upload/local.
    return NextResponse.json({
      mode: "local",
      endpoint: endpointName,
      folder,
      maxSizeBytes: endpoint.maxSizeBytes,
      allowedMimeTypes: endpoint.allowedMimeTypes,
    });
  }

  const sign = signCloudinaryUpload(folder, endpoint.resourceType);

  return NextResponse.json({
    mode: "cloudinary",
    ...sign,
    maxSizeBytes: endpoint.maxSizeBytes,
    allowedMimeTypes: endpoint.allowedMimeTypes,
  });
}
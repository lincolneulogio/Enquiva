import { UTApi } from "uploadthing/server";

async function main() {
  const utapi = new UTApi();
  const files = await utapi.listFiles({ limit: 1 });
  console.log("Uploadthing conectado correctamente.");
  console.log("App ID:", process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID);
  console.log("Archivos en bucket:", files.files?.length ?? 0);
}

main().catch((err) => {
  console.error("Error Uploadthing:", err.message ?? err);
  process.exit(1);
});

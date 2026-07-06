import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { exportFullDatabaseData, summarizeExport } from "../src/lib/db/export-full-database";

async function main() {
  console.log("Exportando base de datos...");
  const exportData = await exportFullDatabaseData();
  const summary = summarizeExport(exportData);

  const dir = path.join(process.cwd(), "backups");
  await mkdir(dir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filepath = path.join(dir, `eventia-${stamp}.json`);
  await writeFile(filepath, JSON.stringify(exportData, null, 2), "utf-8");

  console.log(`Backup guardado en: ${filepath}`);
  console.log(`Tablas: ${Object.keys(summary.counts).length} | Filas totales: ${summary.totalRows}`);
  for (const [table, count] of Object.entries(summary.counts)) {
    console.log(`  · ${table}: ${count}`);
  }
}

main().catch((error) => {
  console.error("Error al crear backup:", error);
  process.exit(1);
});

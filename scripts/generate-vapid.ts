import fs from "node:fs";
import path from "node:path";
import webpush from "web-push";

const root = process.cwd();
const targets = [".env.local", ".env"].map((file) => path.join(root, file));

const keys = webpush.generateVAPIDKeys();
const entries = {
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: keys.publicKey,
  VAPID_PRIVATE_KEY: keys.privateKey,
  VAPID_SUBJECT: "mailto:noreply@encuentrodefe.com",
};

function upsertEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return false;

  let content = fs.readFileSync(filePath, "utf8");

  for (const [key, value] of Object.entries(entries)) {
    const line = `${key}="${value}"`;
    const pattern = new RegExp(`^${key}=.*$`, "m");

    if (pattern.test(content)) {
      content = content.replace(pattern, line);
    } else {
      content = `${content.trimEnd()}\n${line}\n`;
    }
  }

  fs.writeFileSync(filePath, content, "utf8");
  return true;
}

let updated = 0;
for (const file of targets) {
  if (upsertEnvFile(file)) {
    updated += 1;
    console.log(`VAPID keys escritas en ${path.basename(file)}`);
  }
}

if (updated === 0) {
  console.log("No se encontró .env.local ni .env. Agrega manualmente:\n");
  for (const [key, value] of Object.entries(entries)) {
    console.log(`${key}="${value}"`);
  }
}

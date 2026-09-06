const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function main() {
  const inputPath = path.join(__dirname, "../public/images/enquiva-verified-seal.jpg");
  const outputPath = path.join(__dirname, "../public/images/enquiva-verified-seal.png");

  const circleSvg = Buffer.from(
    `<svg width="1024" height="1024">
      <circle cx="512" cy="512" r="497" fill="white"/>
    </svg>`
  );

  await sharp(inputPath)
    .composite([
      {
        input: circleSvg,
        blend: "dest-in",
      },
    ])
    .png()
    .toFile(outputPath);

  console.log("Clean transparent PNG seal created at:", outputPath);
}

main().catch(console.error);

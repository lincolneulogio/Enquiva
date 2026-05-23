const AVATAR_SIZE = 512;

async function loadImageFromFile(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("IMAGE_READ_ERROR"));
      img.src = objectUrl;
    });
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function optimizeAvatarFile(file: File) {
  const image = await loadImageFromFile(file);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const side = Math.min(sourceWidth, sourceHeight);
  const offsetX = Math.floor((sourceWidth - side) / 2);
  const offsetY = Math.floor((sourceHeight - side) / 2);

  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("IMAGE_PROCESS_ERROR");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    offsetX,
    offsetY,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("AVATAR_GENERATE_ERROR"));
          return;
        }
        resolve(result);
      },
      "image/webp",
      0.9,
    );
  });

  const fileName = file.name.replace(/\.[^/.]+$/, "") || "avatar";
  return new File([blob], `${fileName}-square.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

export async function optimizeAvatarFiles(files: File[]) {
  try {
    return await Promise.all(files.map((file) => optimizeAvatarFile(file)));
  } catch {
    return files;
  }
}

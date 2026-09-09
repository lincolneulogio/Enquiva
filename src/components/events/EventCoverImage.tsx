import Image, { type ImageProps } from "next/image";

/** Rutas locales, Cloudinary y UploadThing usan el optimizador; URLs externas (Unsplash, etc.) van directo. */
export function shouldOptimizeCoverImage(src: string): boolean {
  if (src.startsWith("/")) return true;
  if (src.includes("res.cloudinary.com") || src.includes("utfs.io") || src.includes("uploadthing.com"))
    return true;
  return false;
}

export function EventCoverImage({ src, alt, ...props }: ImageProps) {
  const srcString = typeof src === "string" ? src : "";
  const unoptimized = srcString ? !shouldOptimizeCoverImage(srcString) : false;

  return <Image src={src} alt={alt} unoptimized={unoptimized} {...props} />;
}

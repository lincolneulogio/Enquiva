import { generateUploadButton, generateUploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "./index";

export const UploadButton = generateUploadButton<OurFileRouter>({
	url: "/api/uploadthing",
});
export const UploadDropzone = generateUploadDropzone<OurFileRouter>({
	url: "/api/uploadthing",
});

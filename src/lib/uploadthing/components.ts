import { generateReactHelpers, generateUploadButton, generateUploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "./index";

export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>({
	url: "/api/uploadthing",
});
export const UploadButton = generateUploadButton<OurFileRouter>({
	url: "/api/uploadthing",
});
export const UploadDropzone = generateUploadDropzone<OurFileRouter>({
	url: "/api/uploadthing",
});

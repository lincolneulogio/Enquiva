import { redirect } from "next/navigation";

export default function ScannerIndexPage() {
  redirect("/scanner/scan");
}

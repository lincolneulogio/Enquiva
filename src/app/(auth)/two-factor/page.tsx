import { TwoFactorForm } from "@/components/auth/TwoFactorForm";

export default function TwoFactorPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="font-display text-2xl font-semibold text-foreground">Verificación en dos pasos</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Introduce el código de tu app autenticadora o un código de respaldo.
      </p>
      <div className="mt-8">
        <TwoFactorForm />
      </div>
    </div>
  );
}

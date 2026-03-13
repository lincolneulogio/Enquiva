"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "@/lib/auth/client";
import { signInSchema, type SignInInput } from "@/lib/validations";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";

export function LoginForm() {
  const router = useRouter();
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      rememberMe: true,
    },
  });

  const onSubmit = (data: SignInInput) => {
    startTransition(async () => {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe ?? false,
        callbackURL: "/dashboard",
      });

      if (result.error) {
        toast.error(result.error.message ?? t("auth.invalidCredentials"));
      } else {
        toast.success(t("auth.loginSuccess"));
        router.push("/dashboard");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("auth.email")}
          </label>
          <input
            type="email"
            {...register("email")}
            placeholder={t("auth.emailPlaceholder")}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("auth.password")}
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              placeholder={t("auth.yourPassword")}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-11 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-muted-foreground hover:bg-muted"
              aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            {...register("rememberMe")}
            className="h-4 w-4 rounded border-border"
          />
          {t("auth.rememberMe")}
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t("auth.signIn")
          )}
        </button>
      </form>
    </div>
  );
}

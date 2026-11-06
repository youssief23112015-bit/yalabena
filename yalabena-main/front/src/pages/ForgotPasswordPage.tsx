import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { authApi } from "@/api/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { resetRequestSchema, type ResetRequestForm } from "@/lib/authSchema";

export default function ForgotPasswordPage() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetRequestForm>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ResetRequestForm) => {
    setError(null);
    try {
      await authApi.requestPasswordReset({ email: data.email });
      toast({
        title: t("auth.resetLinkSent"),
        description: t("auth.pleaseCheckInbox"),
      });
      navigate("/login", { replace: true });
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || t("common.error");
      const localizedMessage = Array.isArray(message)
        ? message.join("; ")
        : message;
      setError(localizedMessage);
      toast({
        variant: "destructive",
        title: t("auth.somethingWentWrong"),
        description: localizedMessage,
      });
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Background decoration */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-500/15 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm border border-primary/20">
            <Mail className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t("auth.forgotPassword")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.resetPassword")}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t("auth.forgotPassword")}</CardTitle>
            <CardDescription>
              {t("auth.resetPassword")}{" "}
              <span className="text-muted-foreground">— {t("auth.sendResetLink")}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {t(errors.email.message || "auth.emailInvalid")}
                  </p>
                )}
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full font-semibold transition-all duration-200 active:scale-95"
                disabled={isSubmitting}
              >
                {isSubmitting ? t("common.loading") : t("auth.sendResetLink")}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-2">
            <p className="text-center text-sm text-muted-foreground">
              {t("auth.hasAccount")}{" "}
              <button
                type="button"
                className="font-semibold text-primary underline underline-offset-4"
                onClick={() => navigate("/login")}
              >
                {t("auth.login")}
              </button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

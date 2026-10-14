import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { authApi } from "@/api/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, Lock } from "lucide-react";
import { resetPasswordSchema, type ResetPasswordForm } from "@/lib/authSchema";

export default function ResetPasswordPage() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // The reset token is owned by the URL (?token=...), so it is derived
  // directly from the search params instead of being mirrored into state —
  // updating state during render would trigger render loops.
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) return;
    setSubmitError(null);
    try {
      await authApi.resetPassword({
        token,
        password: data.newPassword,
      });
      toast({
        title: t("auth.passwordReset"),
        description: t("auth.passwordResetSuccess"),
      });
      navigate("/login", { replace: true });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        err?.errors?.password?.join("; ") ||
        t("common.error");
      const localizedMessage = Array.isArray(message)
        ? message.join("; ")
        : message;
      setSubmitError(localizedMessage);
      toast({
        variant: "destructive",
        title: t("auth.somethingWentWrong"),
        description: localizedMessage,
      });
    }
  };

  if (!token) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
        <div className="relative z-10 w-full max-w-md space-y-6">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-medium">{t("auth.tokenMissing")}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/forgot-password")}
              >
                {t("common.back")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-500/15 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm border border-primary/20">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t("auth.resetPassword")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.resetPasswordDescription")}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t("auth.resetPassword")}</CardTitle>
            <CardDescription>
              {t("auth.enterNewPassword")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("auth.newPassword")}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  {...register("newPassword")}
                  placeholder="Enter new password"
                />
                {errors.newPassword && (
                  <p className="text-sm text-destructive">
                    {t(errors.newPassword.message || "auth.passwordComplexity")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {t("auth.passwordComplexity")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                  placeholder="Confirm new password"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {t(errors.confirmPassword.message || "auth.passwordMismatch")}
                  </p>
                )}
              </div>

              {submitError && (
                <p className="text-sm text-destructive">{submitError}</p>
              )}

              <Button
                type="submit"
                className="w-full font-semibold transition-all duration-200 active:scale-95"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  t("auth.resetPassword")
                )}
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

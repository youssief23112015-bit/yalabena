import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { authApi, isTwoFactorChallenge } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { TwoFactorChallenge } from "@/types";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const { toast } = useToast();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null);
  const [totpCode, setTotpCode] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    try {
      const res = await authApi.login({
        email: data.email,
        password: data.password,
      });

      if (isTwoFactorChallenge(res)) {
        setChallenge(res);
        setTotpCode("");
        return;
      }

      setAuth(res.user, res.access_token, res.refresh_token);

      toast({
        title: t("auth.loginSuccess"),
        description: `${res.user.first_name} ${res.user.last_name}`,
      });

      navigate("/");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: t("auth.invalidCredentials"),
        description: err.message || t("common.error"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onVerify2fa = async () => {
    if (!challenge) return;
    setIsSubmitting(true);
    try {
      const res = await authApi.verify2fa(challenge.temp_token, totpCode);
      setAuth(res.user, res.access_token, res.refresh_token);
      toast({
        title: t("auth.loginSuccess"),
        description: `${res.user.first_name} ${res.user.last_name}`,
      });
      navigate("/");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: t("security.2faInvalidCode"),
        description: err.message || t("common.error"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (challenge) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">{t("security.2faTitle")}</CardTitle>
            <CardDescription>{t("security.2faLoginHint")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totp">{t("security.enterCode")}</Label>
              <Input
                id="totp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && totpCode.length === 6) onVerify2fa();
                }}
                className="text-center text-lg tracking-[0.3em]"
                autoFocus
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              className="w-full"
              onClick={onVerify2fa}
              disabled={isSubmitting || totpCode.length !== 6}
            >
              {isSubmitting ? t("common.loading") : t("security.verify")}
            </Button>
            <button
              type="button"
              className="text-sm text-muted-foreground underline"
              onClick={() => setChallenge(null)}
            >
              {t("common.back")}
            </button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{t("app.name")}</CardTitle>
          <CardDescription>{t("auth.login")}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@speakup.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{t("auth.emailInvalid")}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{t("auth.passwordMin")}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t("common.loading") : t("auth.login")}
            </Button>
            <p className="text-sm text-muted-foreground">
              {t("auth.noAccount")}{" "}
              <Link to="/register" className="text-primary underline">
                {t("auth.register")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { authApi, isTwoFactorChallenge } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import type { TwoFactorChallenge } from "@/types";
import { loginSchema, type LoginForm } from "@/lib/authSchema";
import { beginSocialAuth } from "@/lib/socialAuth";

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

      navigate("/dashboard");
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
      navigate("/dashboard");
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

  /**
   * Social login: securely redirect the browser to the backend OAuth
   * authorization endpoint (`${BACKEND_URL}/auth/google` or
   * `${BACKEND_URL}/auth/facebook`).
   *
   * `beginSocialAuth` generates a cryptographically random CSRF `state`,
   * stores it in sessionStorage and appends it to the authorization URL; the
   * backend Passport OAuth 2.0 strategy validates it server-side and echoes
   * it back on the `/auth/callback` redirect, where AuthCallbackPage performs
   * the final single-use validation before storing the JWT pair.
   */
  const handleSocialLogin = (provider: "google" | "facebook") => {
    beginSocialAuth(provider);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* خلفية ضوئية جمالية */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-500/15 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm border border-primary/20">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            {t("app.name", "Speak Up Academy")}
          </h1>
        </div>

        {/* Card */}
        <Card className="border-border/60 shadow-xl backdrop-blur-md bg-card/95">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">{t("auth.login")}</CardTitle>
            <CardDescription>{t("app.tagline", "SpeakUp Learning Platform")}</CardDescription>
          </CardHeader>

          {challenge ? (
            <div className="p-6 pt-0 space-y-4">
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
              <Button
                className="w-full transition-all active:scale-95 font-semibold"
                onClick={onVerify2fa}
                disabled={isSubmitting || totpCode.length !== 6}
              >
                {isSubmitting ? t("common.loading") : t("security.verify")}
              </Button>
              <button
                type="button"
                className="w-full text-center text-sm text-muted-foreground underline"
                onClick={() => setChallenge(null)}
              >
                {t("common.back")}
              </button>
            </div>
          ) : (
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t("auth.password")}</Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      {t("auth.forgotPassword", "Forgot Password?")}
                    </Link>
                  </div>
                  <Input id="password" type="password" {...register("password")} />
                  {errors.password && (
                    <p className="text-sm text-destructive">
                      {t(errors.password.message || "auth.passwordComplexity")}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t("auth.passwordComplexity")}
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full font-semibold transition-all duration-200 active:scale-95"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t("common.loading") : t("auth.login")}
                </Button>

                {/* Divider */}
                <div className="relative my-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/60" />
                  </div>
                  <span className="relative bg-card px-3 text-xs text-muted-foreground uppercase">
                    {t("auth.orSocial", "Or sign in with")}
                  </span>
                </div>

                {/* Social Login Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialLogin("google")}
                    className="w-full gap-2 border-border/80 transition-all hover:bg-muted"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{t("auth.google", "Google")}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialLogin("facebook")}
                    className="w-full gap-2 border-border/80 transition-all hover:bg-muted"
                  >
                    <svg className="h-4 w-4 fill-[#1877F2]" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>{t("auth.facebook", "Facebook")}</span>
                  </Button>
                </div>

              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-2">
                <p className="text-center text-sm text-muted-foreground">
                  {t("auth.noAccount", "Don't have an account?")}{" "}
                  <Link
                    to="/register"
                    className="font-semibold text-primary underline underline-offset-4"
                  >
                    {t("auth.register", "Sign up")}
                  </Link>
                </p>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
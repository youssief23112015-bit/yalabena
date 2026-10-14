import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { registerSchema, type RegisterForm } from "@/lib/authSchema";
import { beginSocialAuth } from "@/lib/socialAuth";

export default function RegisterPage() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const { toast } = useToast();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsSubmitting(true);
    try {
      const res = await authApi.register({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
      });

      localStorage.setItem("access_token", res.access_token);
      localStorage.setItem("refresh_token", res.refresh_token);
      localStorage.setItem("user", JSON.stringify(res.user));

      setAuth(res.user, res.access_token, res.refresh_token);

      toast({
        title: t("auth.registerSuccess"),
        description: `${res.user.first_name} ${res.user.last_name}`,
      });

      navigate("/");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: err.message || "Registration failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Social sign-up: securely redirect the browser to the backend OAuth
   * authorization endpoint (`${BACKEND_URL}/auth/google` or
   * `${BACKEND_URL}/auth/facebook`). The CSRF `state` is generated and
   * persisted by `beginSocialAuth`, then validated single-use by
   * AuthCallbackPage on the `/auth/callback` redirect.
   */
  const handleSocialLogin = (provider: "google" | "facebook") => {
    beginSocialAuth(provider);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8">
      <Card className="w-full max-w-md shadow-xl border-border/60 animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Speak Up Academy</CardTitle>
          <CardDescription>{t("auth.register")}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">{t("auth.firstName")}</Label>
                <Input id="first_name" {...register("first_name")} />
                {errors.first_name && (
                  <p className="text-sm text-destructive">{t("auth.required")}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">{t("auth.lastName")}</Label>
                <Input id="last_name" {...register("last_name")} />
                {errors.last_name && (
                  <p className="text-sm text-destructive">{t("auth.required")}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-sm text-destructive">{t("auth.emailInvalid")}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("auth.phone")}</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {t(errors.password.message || "auth.passwordComplexity")}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {t("auth.passwordComplexity")}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
              <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {t(errors.confirmPassword.message || "auth.passwordMismatch")}
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="relative my-2 flex items-center justify-center">
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
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full transition-all duration-200 active:scale-95" disabled={isSubmitting}>
              {isSubmitting ? t("common.loading") : t("auth.register")}
            </Button>
            <p className="text-sm text-muted-foreground">
              {t("auth.hasAccount")}{" "}
              <Link to="/login" className="text-primary underline">
                {t("auth.login")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
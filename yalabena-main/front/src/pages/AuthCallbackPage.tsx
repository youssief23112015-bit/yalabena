import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { consumeOAuthState, type SocialProvider } from "@/lib/socialAuth";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, GraduationCap, Loader2 } from "lucide-react";
import type { User } from "@/types";

interface OAuthCallbackPayload {
  sub?: string;
  email?: string;
  roles?: string[];
}

type CallbackState =
  | { status: "processing" }
  | { status: "error"; message: string };

/**
 * OAuth callback handler mounted at `/auth/callback`.
 *
 * The backend Passport OAuth 2.0 strategy redirects here after a successful
 * Google/Facebook login, appending `access_token`, `refresh_token`, the
 * original CSRF `state` and, optionally, a URL-encoded `user` JSON object.
 *
 * Responsibilities:
 * 1. Validate the CSRF `state` against the value stored before redirect.
 * 2. Persist the JWT pair into the `useAuthStore` (zustand + persist).
 * 3. Toast `auth.socialLoginSuccess` and route the user to the dashboard.
 */
export default function AuthCallbackPage() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const { toast } = useToast();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [searchParams] = useSearchParams();
  // Guard against React 18 StrictMode double-invoking effects in dev: the
  // OAuth state is single-use, so the callback must only be processed once.
  const processedRef = useRef(false);
  const [state, setState] = useState<CallbackState>({ status: "processing" });

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const fail = (message: string) => {
      setState({ status: "error", message });
      toast({ variant: "destructive", title: t("auth.socialAuthError"), description: message });
      navigate("/login", { replace: true });
    };

    const oauthError = searchParams.get("error");
    if (oauthError) {
      const description = searchParams.get("error_description") || oauthError;
      fail(description);
      return;
    }

    // CSRF / login-CSRF protection: the `state` returned by the backend must
    // match the one we generated before redirecting to the provider.
    const returnedState = searchParams.get("state");
    const provider: SocialProvider | null = consumeOAuthState(returnedState);
    if (!provider) {
      fail(t("auth.socialAuthInvalidState"));
      return;
    }

    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    if (!accessToken || !refreshToken) {
      fail(t("auth.socialAuthMissingTokens"));
      return;
    }

    // Prefer an explicit user payload; otherwise reconstruct a minimal user
    // from the JWT claims (`{ sub, email, roles }`) signed by the backend.
    let user: User | null = null;
    const rawUser = searchParams.get("user");
    if (rawUser) {
      try {
        user = JSON.parse(rawUser) as User;
      } catch {
        user = null;
      }
    }
    if (!user) {
      try {
        const payload = jwtDecode<OAuthCallbackPayload>(accessToken);
        if (!payload.sub || !payload.email) throw new Error("invalid payload");
        const roles = payload.roles ?? [];
        user = {
          id: payload.sub,
          email: payload.email,
          first_name: payload.email.split("@")[0],
          last_name: "",
          language: "en",
          roles,
          role: roles[0],
          permissions: [],
        };
      } catch {
        fail(t("auth.socialAuthMissingTokens"));
        return;
      }
    }

    // Keep the legacy localStorage keys in sync (mirrors RegisterPage and
    // the cleanup performed by `authStore.clearAuth()`).
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));

    setAuth(user, accessToken, refreshToken);

    const providerLabel = t(`auth.${provider}`);
    toast({
      title: t("auth.socialLoginSuccess", { provider: providerLabel }),
      description: `${user.first_name} ${user.last_name}`.trim() || user.email,
    });

    navigate("/dashboard", { replace: true });
  }, [searchParams, setAuth, navigate, t, toast]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-500/15 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm border border-primary/20">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t("auth.login")}</h1>
        </div>

        <Card className="border-border/60 shadow-xl">
          <CardContent className="space-y-4 pt-6">
            {state.status === "processing" ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {t("auth.socialAuthProcessing")}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">{state.message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck, ShieldOff, KeyRound } from "lucide-react";
import { authApi } from "@/api/auth";
import { useToast } from "@/hooks/use-toast";
import { PageWrapper } from "@/components/common/PageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TwoFactorSetup } from "@/types";

/**
 * Account security page: enroll / disable TOTP two-factor auth (SRS 7.2).
 * Flow: setup (secret + QR) -> verify code -> enabled. Disabling also requires a live code.
 */
export default function SecuritySettingsPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [busy, setBusy] = useState(false);

  const startSetup = async () => {
    setBusy(true);
    try {
      setSetup(await authApi.setup2fa());
      setCode("");
    } catch (err: any) {
      toast({ variant: "destructive", title: t("common.error"), description: err.message });
    } finally {
      setBusy(false);
    }
  };

  const enable = async () => {
    setBusy(true);
    try {
      await authApi.enable2fa(code);
      toast({ title: t("security.2faEnabled") });
      setSetup(null);
      setCode("");
    } catch (err: any) {
      toast({ variant: "destructive", title: t("security.2faInvalidCode"), description: err.message });
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      await authApi.disable2fa(disableCode);
      toast({ title: t("security.2faDisabled") });
      setDisableCode("");
    } catch (err: any) {
      toast({ variant: "destructive", title: t("security.2faInvalidCode"), description: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageWrapper titleKey="security.title">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {t("security.enable2fa")}
            </CardTitle>
            <CardDescription>{t("security.enable2faHint")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!setup ? (
              <Button onClick={startSetup} disabled={busy}>
                <KeyRound className="me-2 h-4 w-4" />
                {t("security.startSetup")}
              </Button>
            ) : (
              <>
                <div className="flex flex-col items-center gap-3 rounded-md border p-4">
                  <img src={setup.qr_code_data_url} alt="2FA QR code" className="h-48 w-48" />
                  <p className="text-xs text-muted-foreground">{t("security.scanQr")}</p>
                  <code className="rounded bg-muted px-2 py-1 text-xs tracking-widest">{setup.secret}</code>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="enable-code">{t("security.enterCode")}</Label>
                  <Input
                    id="enable-code"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="w-40 text-center text-lg tracking-[0.3em]"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={enable} disabled={busy || code.length !== 6}>
                    {t("security.confirmEnable")}
                  </Button>
                  <Button variant="outline" onClick={() => setSetup(null)} disabled={busy}>
                    {t("common.cancel")}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5 text-destructive" />
              {t("security.disable2fa")}
            </CardTitle>
            <CardDescription>{t("security.disable2faHint")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disable-code">{t("security.enterCode")}</Label>
              <Input
                id="disable-code"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
                className="w-40 text-center text-lg tracking-[0.3em]"
              />
            </div>
            <Button variant="destructive" onClick={disable} disabled={busy || disableCode.length !== 6}>
              {t("security.confirmDisable")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}

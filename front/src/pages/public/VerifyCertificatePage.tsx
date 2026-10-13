import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BadgeCheck, Search, XCircle } from "lucide-react";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { verifyCertificatePublic, type CertificateVerificationResult } from "@/api/public";

export default function VerifyCertificatePage() {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<CertificateVerificationResult | null>(null);

  const mutation = useMutation({
    mutationFn: (value: string) => verifyCertificatePublic(value),
    onSuccess: (data) => setResult(data),
    onError: () =>
      setResult({ valid: false }),
  });

  return (
    <PublicLayout>
      <title>{t("public.seo.verifyTitle", "Verify a Certificate — Speak Up Academy")}</title>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold">
            {t("public.verify.title", "Verify a Certificate")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("public.verify.subtitle", "Enter the verification code printed on the certificate.")}
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form
              className="flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                setResult(null);
                if (code.trim()) mutation.mutate(code.trim());
              }}
            >
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t("public.verify.placeholder", "e.g. CERT-2026-000123")}
                className="flex-1"
              />
              <Button type="submit" disabled={mutation.isPending || !code.trim()}>
                <Search className="mr-2 h-4 w-4" />
                {mutation.isPending
                  ? t("public.verify.checking", "Checking...")
                  : t("public.verify.check", "Verify")}
              </Button>
            </form>

            {result && (
              <div
                className={`mt-6 flex items-start gap-3 rounded-lg border p-4 ${
                  result.valid
                    ? "border-green-300 bg-green-50 text-green-900"
                    : "border-red-300 bg-red-50 text-red-900"
                }`}
              >
                {result.valid ? (
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                )}
                <div className="text-sm">
                  {result.valid && result.certificate ? (
                    <>
                      <p className="font-semibold">
                        {t("public.verify.valid", "This certificate is valid.")}
                      </p>
                      <dl className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                        <div>
                          <dt className="inline font-medium">
                            {t("public.verify.student", "Student")}:{" "}
                          </dt>
                          <dd className="inline">{result.certificate.student_name}</dd>
                        </div>
                        <div>
                          <dt className="inline font-medium">
                            {t("public.verify.course", "Course")}:{" "}
                          </dt>
                          <dd className="inline">{result.certificate.course_name}</dd>
                        </div>
                        <div>
                          <dt className="inline font-medium">
                            {t("public.verify.level", "Level")}:{" "}
                          </dt>
                          <dd className="inline">{result.certificate.level}</dd>
                        </div>
                        <div>
                          <dt className="inline font-medium">
                            {t("public.verify.issued", "Issued")}:{" "}
                          </dt>
                          <dd className="inline">
                            {new Date(result.certificate.issued_at).toLocaleDateString()}
                          </dd>
                        </div>
                      </dl>
                      <p className="mt-2 text-xs">
                        {t("public.verify.code", "Code")}: {result.certificate.verification_code} ·{" "}
                        {result.certificate.status}
                      </p>
                    </>
                  ) : (
                    <p className="font-semibold">
                      {t("public.verify.invalid", "No certificate matches this code.")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
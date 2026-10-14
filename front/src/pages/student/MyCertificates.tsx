import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { certificatesApi } from "@/api/certificates";
import { downloadBlob } from "@/api/finance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Award, CalendarDays, Copy, FileDown, RefreshCw } from "lucide-react";

type MyCertificate = {
  id: string;
  code: string;
  issue_date: string;
  expiry_date?: string | null;
  status: string;
  course?: { id: string; name?: string; level?: string } | null;
  group?: { id: string; name?: string } | null;
};

export default function MyCertificatesPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  const certQ = useQuery({
    queryKey: ["certificates", "my"],
    queryFn: () => certificatesApi.my() as Promise<MyCertificate[]>,
  });

  const pdfM = useMutation({
    mutationFn: (cert: MyCertificate) => certificatesApi.pdf(cert.id),
    onSuccess: (blob: Blob, cert: MyCertificate) => {
      downloadBlob(blob, `certificate-${cert.code ?? cert.id}.pdf`);
    },
    onError: (e: Error) =>
      toast({
        variant: "destructive",
        title: t("myCertificates.downloadError"),
        description: e.message,
      }),
  });

  const copyCode = async (code?: string) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: t("myCertificates.codeCopied"), description: code });
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: code });
    }
  };

  const certificates = certQ.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("myCertificates.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("myCertificates.subtitle")}</p>
      </div>

      {certQ.isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      )}

      {certQ.isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <p>{(certQ.error as Error)?.message || t("myCertificates.loadError")}</p>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => certQ.refetch()}>
            <RefreshCw className="mr-2 h-3 w-3" />
            {t("common.retry")}
          </Button>
        </div>
      )}

      {certQ.isSuccess && certificates.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
          <Award className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">{t("myCertificates.empty")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("myCertificates.emptyHint")}</p>
        </div>
      )}

      {certificates.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {certificates.map((cert) => (
            <Card key={cert.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">
                      {cert.course?.name ?? t("myCertificates.unknownCourse")}
                    </p>
                    {cert.course?.level && (
                      <p className="text-xs text-muted-foreground">
                        {t("myCertificates.level")}: {cert.course.level}
                      </p>
                    )}
                  </div>
                  <Badge variant={cert.status === "active" ? "success" : "destructive"}>
                    {cert.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  <span>
                    {t("myCertificates.issuedOn")}:{" "}
                    {cert.issue_date ? new Date(cert.issue_date).toLocaleDateString() : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 rounded-md bg-muted px-3 py-2">
                  <span className="truncate font-mono text-sm">{cert.code}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    title={t("myCertificates.copyCode")}
                    onClick={() => copyCode(cert.code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  className="w-full"
                  disabled={pdfM.isPending && pdfM.variables?.id === cert.id}
                  onClick={() => pdfM.mutate(cert)}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  {pdfM.isPending && pdfM.variables?.id === cert.id
                    ? t("myCertificates.downloading")
                    : t("myCertificates.downloadPdf")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
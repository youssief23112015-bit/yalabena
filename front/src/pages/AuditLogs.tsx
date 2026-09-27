import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { auditApi, type AuditLogQuery } from "@/api/audit";
import { PageWrapper } from "@/components/common/PageWrapper";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, RotateCcw } from "lucide-react";
import type { AuditLog } from "@/types";

/** Read-only audit trail viewer (SRS 7.2) — restricted to super_admin / auditor via the route gate. */
export default function AuditLogsPage() {
  const { t } = useTranslation("common");
  const [draft, setDraft] = useState<AuditLogQuery>({});
  const [query, setQuery] = useState<AuditLogQuery>({ limit: 100 });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["audit-logs", query],
    queryFn: () => auditApi.list(query),
  });

  const applyFilters = () => {
    const clean: AuditLogQuery = { limit: 100 };
    for (const [k, v] of Object.entries(draft)) {
      if (v !== undefined && v !== "") (clean as any)[k] = v;
    }
    setQuery(clean);
  };

  const resetFilters = () => {
    setDraft({});
    setQuery({ limit: 100 });
  };

  const columns: Column<AuditLog>[] = [
    {
      key: "created_at",
      header: t("audit.time"),
      sortable: true,
      render: (row) => new Date(row.created_at).toLocaleString(),
    },
    {
      key: "action",
      header: t("audit.action"),
      render: (row) => (
        <span className="font-mono text-xs">
          {row.action}
          {row.description?.includes("(FAILED)") && (
            <Badge variant="destructive" className="ms-2">FAILED</Badge>
          )}
        </span>
      ),
    },
    { key: "module", header: t("audit.module"), render: (row) => row.module ?? "—" },
    {
      key: "actor_id",
      header: t("audit.actor"),
      render: (row) => (row.actor_id ? `${row.actor_id.slice(0, 8)}…` : t("audit.anonymous")),
    },
    {
      key: "target",
      header: t("audit.target"),
      render: (row) =>
        row.target_id ? (
          <span className="font-mono text-xs">
            {row.target_type}:{String(row.target_id).slice(0, 8)}…
          </span>
        ) : (
          "—"
        ),
    },
    { key: "ip_address", header: t("audit.ip"), render: (row) => row.ip_address ?? "—" },
  ];

  return (
    <PageWrapper titleKey="audit.title">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1">
              <Label>{t("audit.module")}</Label>
              <Input
                value={draft.module ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, module: e.target.value }))}
                placeholder="auth"
              />
            </div>
            <div className="space-y-1">
              <Label>{t("audit.action")}</Label>
              <Input
                value={draft.action ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, action: e.target.value }))}
                placeholder="POST /auth/login"
              />
            </div>
            <div className="space-y-1">
              <Label>{t("audit.dateFrom")}</Label>
              <Input
                type="date"
                value={draft.date_from ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, date_from: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("audit.dateTo")}</Label>
              <Input
                type="date"
                value={draft.date_to ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, date_to: e.target.value }))}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={applyFilters}>
                <Search className="me-2 h-4 w-4" />
                {t("common.filter")}
              </Button>
              <Button variant="outline" onClick={resetFilters}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={data?.items ?? []}
            isLoading={isLoading}
            isError={isError}
            errorMessage={(error as Error)?.message}
            onRetry={() => refetch()}
            keyExtractor={(row) => row.id}
            pageSize={20}
            emptyMessage={t("audit.empty")}
          />
        </CardContent>
      </Card>
    </PageWrapper>
  );
}

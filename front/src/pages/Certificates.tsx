import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { certificatesApi } from "@/api/certificates";
import { downloadBlob } from "@/api/finance";
import { studentsApi } from "@/api/students";
import { coursesApi } from "@/api/courses";
import { groupsApi } from "@/api/groups";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Plus, X, FileDown, Ban, Wand2 } from "lucide-react";

const certLabel = (c: any) =>
  c?.student?.user
    ? `${c.student.user.first_name ?? ""} ${c.student.user.last_name ?? ""}`.trim()
    : (c?.student_id ?? "").slice(0, 8);

export default function CertificatesPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { confirm, dialog } = useConfirm();

  const [tab, setTab] = useState("issued");
  const [statusFilter, setStatusFilter] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [issueForm, setIssueForm] = useState({ show: false, student_id: "", course_id: "", group_id: "" });
  const [autoGroupId, setAutoGroupId] = useState("");
  const [tplForm, setTplForm] = useState({ show: false, name: "", course_id: "", html_template: "", is_default: false });

  const certQ = useQuery({
    queryKey: ["certificates", statusFilter],
    queryFn: () => certificatesApi.list({ status: statusFilter || undefined }),
    enabled: tab === "issued",
  });
  const tplQ = useQuery({
    queryKey: ["cert-templates"],
    queryFn: () => certificatesApi.listTemplates(),
    enabled: tab === "templates",
  });
  const verifyQ = useQuery({
    queryKey: ["cert-verify", verifyCode],
    queryFn: () => certificatesApi.verify(verifyCode),
    enabled: false,
  });
  const { data: students } = useQuery({ queryKey: ["students"], queryFn: () => studentsApi.findAll() });
  const { data: courses } = useQuery({ queryKey: ["courses"], queryFn: () => coursesApi.findAll() });
  const { data: groups } = useQuery({ queryKey: ["groups"], queryFn: () => groupsApi.findAll() });

  const err = (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message });


  const issueM = useMutation({
    mutationFn: () => certificatesApi.issue({
      student_id: issueForm.student_id,
      course_id: issueForm.course_id,
      group_id: issueForm.group_id,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      setIssueForm({ show: false, student_id: "", course_id: "", group_id: "" });
      toast({ title: t("common.success") });
    },
    onError: err,
  });

  const autoM = useMutation({
    mutationFn: (groupId: string) => certificatesApi.autoIssue(groupId),
    onSuccess: (r: any) => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      setAutoGroupId("");
      toast({ title: `Issued ${Array.isArray(r) ? r.length : r?.issued ?? 0}` });
    },
    onError: err,
  });

  const revokeM = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => certificatesApi.revoke(id, reason),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["certificates"] }); toast({ title: t("common.success") }); },
    onError: err,
  });

  const tplM = useMutation({
    mutationFn: () => certificatesApi.createTemplate({
      name: tplForm.name,
      course_id: tplForm.course_id || undefined,
      html_template: tplForm.html_template,
      is_default: tplForm.is_default,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cert-templates"] });
      setTplForm({ show: false, name: "", course_id: "", html_template: "", is_default: false });
      toast({ title: t("common.success") });
    },
    onError: err,
  });


  const certColumns = [
    { key: "student", header: "Student", render: (c: any) => certLabel(c) },
    { key: "code", header: "Code", render: (c: any) => c.code ?? "—" },
    { key: "issue_date", header: "Issued", render: (c: any) => (c.issue_date ?? "").slice(0, 10) },
    { key: "status", header: t("common.status"), render: (c: any) => <Badge className={c.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>{c.status}</Badge> },
    {
      key: "pdf",
      header: "PDF",
      render: (c: any) => (
        <Button size="sm" variant="outline" onClick={async (e) => {
          e.stopPropagation();
          const blob = await certificatesApi.pdf(c.id);
          downloadBlob(blob, `certificate-${c.code ?? c.id}.pdf`);
        }}><FileDown className="h-3 w-3" /></Button>
      ),
    },
    {
      key: "revoke",
      header: t("common.actions"),
      render: (c: any) => (
        <Button size="sm" variant="outline" disabled={c.status !== "active"} onClick={(e) => {
          e.stopPropagation();
          confirm({
            title: "Revoke certificate",
            description: `Revoke certificate ${c.code ?? c.id}?`,
            variant: "destructive",
            confirmLabel: "Revoke",
            onConfirm: () => revokeM.mutate({ id: c.id, reason: "revoked from UI" }),
          });
        }}><Ban className="h-3 w-3" /></Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {dialog}
      <h1 className="text-2xl font-bold tracking-tight">{t("nav.certificates")}</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="issued">Issued</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="verify">Verify</TabsTrigger>
        </TabsList>
        <TabsContent value="issued">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-2">
                <Label>{t("common.status")}</Label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">{t("common.all")}</option>
                  {["active", "revoked", "expired"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Auto-issue to group</Label>
                <div className="flex gap-2">
                  <select value={autoGroupId} onChange={(e) => setAutoGroupId(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Select group</option>
                    {(groups ?? []).map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <Button variant="outline" disabled={!autoGroupId || autoM.isPending} onClick={() => autoM.mutate(autoGroupId)}>
                    <Wand2 className="mr-2 h-4 w-4" /> Issue
                  </Button>
                </div>
              </div>
            </div>
            <Button onClick={() => setIssueForm({ ...issueForm, show: !issueForm.show })}>
              {issueForm.show ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />} Issue certificate
            </Button>
          </div>



          {issueForm.show && (
            <Card className="mb-4">
              <CardHeader><CardTitle className="text-base">Manual issue</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Student *</Label>
                  <select value={issueForm.student_id} onChange={(e) => setIssueForm({ ...issueForm, student_id: e.target.value })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Select student</option>
                    {(students ?? []).map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.user ? `${s.user.first_name} ${s.user.last_name}` : s.id.slice(0, 8)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Course *</Label>
                  <select value={issueForm.course_id} onChange={(e) => setIssueForm({ ...issueForm, course_id: e.target.value })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Select course</option>
                    {(courses ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Group *</Label>
                  <select value={issueForm.group_id} onChange={(e) => setIssueForm({ ...issueForm, group_id: e.target.value })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Select group</option>
                    {(groups ?? []).map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <Button
                    disabled={issueM.isPending || !issueForm.student_id || !issueForm.course_id || !issueForm.group_id}
                    onClick={() => issueM.mutate()}
                  >{t("common.save")}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <DataTable
            columns={certColumns}
            data={certQ.data ?? []}
            isLoading={certQ.isLoading}
            isError={certQ.isError}
            errorMessage={(certQ.error as Error)?.message}
            onRetry={certQ.refetch}
            keyExtractor={(c: any) => c.id}
            pageSize={10}
          />
        </TabsContent>
        <TabsContent value="templates">
          <div className="mb-3 flex justify-end">
            <Button onClick={() => setTplForm({ ...tplForm, show: !tplForm.show })}>
              {tplForm.show ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />} Template
            </Button>
          </div>
          {tplForm.show && (
            <Card className="mb-4">
              <CardHeader><CardTitle className="text-base">New certificate template</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={tplForm.name} onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Course (optional)</Label>
                  <select value={tplForm.course_id} onChange={(e) => setTplForm({ ...tplForm, course_id: e.target.value })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Any course</option>
                    {(courses ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <input type="checkbox" checked={tplForm.is_default}
                      onChange={(e) => setTplForm({ ...tplForm, is_default: e.target.checked })} />
                    Set as default
                  </Label>
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label>HTML template * (use {"{{student_name}}"}, {"{{course_name}}"}, {"{{code}}"})</Label>
                  <textarea
                    value={tplForm.html_template}
                    onChange={(e) => setTplForm({ ...tplForm, html_template: e.target.value })}
                    rows={6}
                    className="w-full rounded-md border border-input bg-background p-3 font-mono text-xs"
                    placeholder="<h1>Certificate of Completion</h1><p>{{student_name}}</p>"
                  />
                </div>
                <div className="md:col-span-3">
                  <Button disabled={tplM.isPending || !tplForm.name || !tplForm.html_template} onClick={() => tplM.mutate()}>
                    {t("common.save")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          <DataTable
            columns={[
              { key: "name", header: "Name" },
              { key: "course", header: "Course", render: (t2: any) => t2.course?.name ?? t2.course_id?.slice(0, 8) ?? "Any" },
              { key: "is_default", header: "Default", render: (t2: any) => (t2.is_default ? "Yes" : "No") },
              { key: "status", header: t("common.status") },
            ]}
            data={tplQ.data ?? []}
            isLoading={tplQ.isLoading}
            isError={tplQ.isError}
            errorMessage={(tplQ.error as Error)?.message}
            onRetry={tplQ.refetch}
            keyExtractor={(t2: any) => t2.id}
            pageSize={10}
          />
        </TabsContent>


        <TabsContent value="verify">
          <Card>
            <CardHeader><CardTitle className="text-base">Public certificate verification</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Anyone can verify a certificate by its code — no login required on the public site.
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <div className="space-y-2">
                  <Label>Certificate code</Label>
                  <Input value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} placeholder="SU-XXXXXXXXXX" className="w-64" />
                </div>
                <Button disabled={!verifyCode || verifyQ.isFetching} onClick={() => verifyQ.refetch()}>Verify</Button>
              </div>
              {verifyQ.isError && (
                <p className="text-sm text-destructive">{(verifyQ.error as Error)?.message}</p>
              )}
              {verifyQ.data && (
                <pre className="max-h-72 overflow-auto rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(verifyQ.data, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

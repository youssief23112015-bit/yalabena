import { useEffect, useState } from "react";
import { hrApi } from "@/api/hr";
import type { Employee } from "@/types/hr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfileEditDialog } from "./ProfileEditDialog";

export default function ProfilePage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const e = await hrApi.myProfile();
      setEmployee(e);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load profile");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, []);

  async function onSaved() {
    await load();
  }

  if (error) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Profile</h1>
      <p className="text-destructive">{error}</p>
      <Button onClick={() => { setLoading(true); void load(); }}>Retry</Button>
    </div>
  );
  if (loading || !employee) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-sm text-muted-foreground">View and update your permitted profile information.</p>
        </div>
        <Button onClick={() => setOpen(true)}>Edit profile</Button>
      </div>

      <section className="rounded-lg border">
        <Card>
          <CardHeader>
            <CardTitle>Personal information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex flex-col gap-1"><span className="text-muted-foreground text-sm">Name</span><span className="font-medium">{employee.user?.first_name} {employee.user?.last_name}</span></div>
            <div className="flex flex-col gap-1"><span className="text-muted-foreground text-sm">Email</span><span className="font-medium">{employee.user?.email}</span></div>
            <div className="flex flex-col gap-1"><span className="text-muted-foreground text-sm">Employee ID</span><span className="font-medium">{employee.employee_number || "—"}</span></div>
            <div className="flex flex-col gap-1"><span className="text-muted-foreground text-sm">Job title</span><span className="font-medium">{employee.job_title}</span></div>
            <div className="flex flex-col gap-1"><span className="text-muted-foreground text-sm">Department</span><span className="font-medium">{employee.department || "—"}</span></div>
            <div className="flex flex-col gap-1"><span className="text-muted-foreground text-sm">Employee type</span><span className="font-medium capitalize">{employee.employee_type}</span></div>
            <div className="flex flex-col gap-1"><span className="text-muted-foreground text-sm">Contract start</span><span className="font-medium">{employee.contract_start?.slice(0, 10)}</span></div>
            <div className="flex flex-col gap-1"><span className="text-muted-foreground text-sm">Contract end</span><span className="font-medium">{employee.contract_end ? employee.contract_end.slice(0, 10) : "—"}</span></div>
            <div className="flex flex-col gap-1"><span className="text-muted-foreground text-sm">Status</span><span className={`font-medium capitalize ${employee.status === "active" ? "text-green-600" : ""}`}>{employee.status}</span></div>
            <div className="flex flex-col gap-1"><span className="text-muted-foreground text-sm">Phone</span><span className="font-medium">{employee.user?.phone || "—"}</span></div>
          </CardContent>
        </Card>
      </section>

      <ProfileEditDialog open={open} employee={employee} onClose={() => setOpen(false)} onSaved={onSaved} />
    </div>
  );
}

ProfilePage.displayName = "ProfilePage";

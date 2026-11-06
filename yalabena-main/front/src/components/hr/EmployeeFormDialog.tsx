import { useEffect, useState } from "react";
import { usersApi } from "@/api/users";
import { hrApi } from "@/api/hr";
import type { User } from "@/types";
import type { Employee, EmployeeType } from "@/types/hr";
import { Button } from "@/components/ui/button";

interface Props { open: boolean; employee?: Employee | null; onClose: () => void; onSaved: () => void; }

export function EmployeeFormDialog({ open, employee, onClose, onSaved }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState(employee?.user_id ?? "");
  const [type, setType] = useState<EmployeeType>(employee?.employee_type ?? "full_time");
  const [jobTitle, setJobTitle] = useState(employee?.job_title ?? "");
  const [department, setDepartment] = useState(employee?.department ?? "");
  const [start, setStart] = useState(employee?.contract_start?.slice(0,10) ?? "");
  const [end, setEnd] = useState(employee?.contract_end?.slice(0,10) ?? "");
  const [salary, setSalary] = useState(employee?.salary?.toString() ?? "");
  const [hourly, setHourly] = useState(employee?.hourly_rate?.toString() ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setUserId(employee?.user_id ?? "");
    setType(employee?.employee_type ?? "full_time");
    setJobTitle(employee?.job_title ?? "");
    setDepartment(employee?.department ?? "");
    setStart(employee?.contract_start?.slice(0,10) ?? new Date().toISOString().slice(0,10));
    setEnd(employee?.contract_end?.slice(0,10) ?? "");
    setSalary(employee?.salary?.toString() ?? "");
    setHourly(employee?.hourly_rate?.toString() ?? "");
    setError("");
    if (!employee) usersApi.findAll({ status: "active" }).then(setUsers).catch(() => setUsers([]));
  }, [open, employee]);

  if (!open) return null;

  async function save() {
    setBusy(true); setError("");
    try {
      if (employee) {
        await hrApi.updateEmployee(employee.id, {
          employee_type: type, job_title: jobTitle, department,
          contract_start: start, contract_end: end || undefined,
          salary: salary ? Number(salary) : undefined, hourly_rate: hourly ? Number(hourly) : undefined,
        });
      } else {
        if (!userId) throw new Error("Select a user account");
        if (!jobTitle || !start) throw new Error("Job title and contract start are required");
        await hrApi.createEmployee({
          user_id: userId, employee_type: type, job_title: jobTitle, department,
          contract_start: start, contract_end: end || undefined,
          salary: salary ? Number(salary) : undefined, hourly_rate: hourly ? Number(hourly) : undefined,
        });
      }
      onSaved(); onClose();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save employee"); }
    finally { setBusy(false); }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-2xl rounded-lg border bg-background p-6 shadow-xl">
      <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-semibold">{employee ? "Edit employee" : "Add employee"}</h2><Button variant="ghost" onClick={onClose}>×</Button></div>
      <div className="grid gap-4 sm:grid-cols-2">
        {!employee && <label className="space-y-1 text-sm sm:col-span-2"><span>User account</span><select className="w-full rounded-md border bg-background p-2" value={userId} onChange={e=>setUserId(e.target.value)}><option value="">Select user</option>{users.map(u=><option key={u.id} value={u.id}>{u.first_name} {u.last_name} — {u.email}</option>)}</select></label>}
        <label className="space-y-1 text-sm"><span>Employee type</span><select className="w-full rounded-md border bg-background p-2" value={type} onChange={e=>setType(e.target.value as EmployeeType)}>{["full_time","part_time","contract","hourly"].map(x=><option key={x} value={x}>{x.replace("_"," ")}</option>)}</select></label>
        <label className="space-y-1 text-sm"><span>Job title</span><input className="w-full rounded-md border bg-background p-2" value={jobTitle} onChange={e=>setJobTitle(e.target.value)} /></label>
        <label className="space-y-1 text-sm"><span>Department</span><input className="w-full rounded-md border bg-background p-2" value={department ?? ""} onChange={e=>setDepartment(e.target.value)} /></label>
        <label className="space-y-1 text-sm"><span>Contract start</span><input type="date" className="w-full rounded-md border bg-background p-2" value={start} onChange={e=>setStart(e.target.value)} /></label>
        <label className="space-y-1 text-sm"><span>Contract end</span><input type="date" className="w-full rounded-md border bg-background p-2" value={end} onChange={e=>setEnd(e.target.value)} /></label>
        <label className="space-y-1 text-sm"><span>Fixed salary (EGP)</span><input type="number" min="0" step="0.01" className="w-full rounded-md border bg-background p-2" value={salary} onChange={e=>setSalary(e.target.value)} /></label>
        <label className="space-y-1 text-sm"><span>Hourly rate (EGP)</span><input type="number" min="0" step="0.01" className="w-full rounded-md border bg-background p-2" value={hourly} onChange={e=>setHourly(e.target.value)} /></label>
      </div>
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      <div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={busy}>{busy ? "Saving..." : "Save"}</Button></div>
    </div>
  </div>;
}

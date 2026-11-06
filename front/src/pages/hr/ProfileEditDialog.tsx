import { useState } from "react";
import { hrApi } from "@/api/hr";
import type { Employee } from "@/types/hr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ProfileEditDialog({ open, employee, onClose, onSaved }: Props) {
  const [jobTitle, setJobTitle] = useState(employee?.job_title ?? "");
  const [department, setDepartment] = useState(employee?.department ?? "");
  const [phone, setPhone] = useState(employee?.user?.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!open || !employee) return null;

  async function save() {
    setBusy(true);
    setError("");
    try {
      await hrApi.updateMyProfile({ job_title: jobTitle || undefined, department: department || undefined });
      if (phone !== undefined) {
        // phone is updated via the same endpoint (service routes phone to User entity)
        await hrApi.updateMyProfile({ phone });
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save profile");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Edit profile</h2>
          <Button variant="ghost" onClick={onClose}>×</Button>
        </div>
        <div className="space-y-4">
          <Label className="text-sm">Job title</Label>
          <Input value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
          <Label className="text-sm">Department</Label>
          <Input value={department} onChange={e => setDepartment(e.target.value)} />
          <Label className="text-sm">Phone</Label>
          <Input value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={busy} onClick={save}>{busy ? "Saving…" : "Save"}</Button>
        </div>
      </div>
    </div>
  );
}

ProfileEditDialog.displayName = "ProfileEditDialog";

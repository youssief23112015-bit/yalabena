import React from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BranchSelectProps {
  className?: string;
  onChange?: (branchId: string | undefined) => void;
}

export function BranchSelect({ className, onChange }: BranchSelectProps) {
  const { t } = useTranslation("dashboard");
  const user = useAuthStore((s) => s.user);
  const branches = user?.branches ?? [];
  const currentBranch = user?.branchId ?? user?.branch_id;

  const isSuperAdmin = Array.isArray(user?.roles) && user.roles.includes("super_admin");

  if (!isSuperAdmin) return null;

  return (
    <Select
      onValueChange={(v) => {
        onChange?.(v === "" ? undefined : v);
      }}
      className={className}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder={currentBranch ? branches.find((b: any) => b.id === currentBranch)?.name ?? t("selectBranch") : t("selectBranch")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">{t("allBranches")}</SelectItem>
        {branches.map((b: any) => (
          <SelectItem key={b.id} value={b.id}>
            {b.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
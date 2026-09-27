import { useQuery } from "@tanstack/react-query";
import { sessionsApi } from "@/api/sessions";
export function SessionPicker(p: { value: string; groupFilter: string; onChange: (v: string) => void }) {
  const { data: sessions } = useQuery({ queryKey: ["sessions"], queryFn: () => sessionsApi.findAll() });
  const list = (sessions ?? []).filter((s: any) =>
    !p.groupFilter || (s.groupId ?? s.group_id ?? s.group?.id) === p.groupFilter);
  return (
    <select value={p.value} onChange={(e) => p.onChange(e.target.value)}
      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
      <option value="">Select session</option>
      {list.map((s: any) => <option key={s.id} value={s.id}>{s.title}</option>)}
    </select>
  );
}

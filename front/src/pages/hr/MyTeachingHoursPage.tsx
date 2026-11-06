import { useEffect, useState } from "react";
import { hrApi } from "@/api/hr";
import type { MyTeachingHours } from "@/types/hr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyTeachingHoursPage() {
  const [hours, setHours] = useState<MyTeachingHours | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const h = await hrApi.myTeachingHours();
      setHours(h);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load your teaching hours");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, []);

  if (error) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Teaching Hours</h1>
      <p className="text-destructive">{error}</p>
    </div>
  );
  if (loading || !hours) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Teaching Hours</h1>
        <p className="text-sm text-muted-foreground">Your teaching hours derived from payroll entries.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Total Hours</div>
            <div className="text-2xl font-bold">{hours.total_hours}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Total Amount</div>
            <div className="text-2xl font-bold">{hours.total_amount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Classes Taught</div>
            <div className="text-2xl font-bold">{hours.total_classes}</div>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-lg border">
        <Card>
          <CardHeader>
            <CardTitle>By Period</CardTitle>
          </CardHeader>
          <CardContent>
            {hours.periods.length === 0 && (
              <p className="p-4 text-center text-muted-foreground">No payroll periods found.</p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Period</th>
                    <th className="p-2 text-left">Hours</th>
                    <th className="p-2 text-left">Classes</th>
                    <th className="p-2 text-left">Amount</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {hours.periods.map(p => (
                    <tr className="border-b" key={p.period_id}>
                      <td className="p-2 font-medium">{p.period_name || p.period_id}</td>
                      <td className="p-2">{p.hours_worked}</td>
                      <td className="p-2">{p.classes_taught}</td>
                      <td className="p-2">{p.total_amount.toLocaleString()}</td>
                      <td className="p-2 capitalize">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

MyTeachingHoursPage.displayName = "MyTeachingHoursPage";

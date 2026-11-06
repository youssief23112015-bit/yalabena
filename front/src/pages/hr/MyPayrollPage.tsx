import { useEffect, useState } from "react";
import { hrApi } from "@/api/hr";
import type { MyPayrollEntry } from "@/types/hr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyPayrollPage() {
  const [entries, setEntries] = useState<MyPayrollEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const e = await hrApi.myPayroll();
      setEntries(e);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load your payroll");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, []);

  const num = (value: unknown): number => Number(value) || 0;

  const totalAmount = entries.reduce((sum, e) => sum + num(e.total_amount), 0);
  const totalHours = entries.reduce((sum, e) => sum + num(e.hours_worked), 0);

  if (error) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Payroll</h1>
      <p className="text-destructive">{error}</p>
    </div>
  );
  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Payroll</h1>
        <p className="text-sm text-muted-foreground">Your payroll entries across periods.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Total Amount</div>
            <div className="text-2xl font-bold">{totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Total Hours</div>
            <div className="text-2xl font-bold">{totalHours.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Entries</div>
            <div className="text-2xl font-bold">{entries.length}</div>
          </CardContent>
        </Card>
      </section>

      {entries.length === 0 && (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">No payroll entries found.</p>
        </div>
      )}

      <section className="rounded-lg border">
        <Card>
          <CardHeader>
            <CardTitle>Payroll Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Period</th>
                    <th className="p-2 text-left">Base</th>
                    <th className="p-2 text-left">Hours</th>
                    <th className="p-2 text-left">Classes</th>
                    <th className="p-2 text-left">Bonus</th>
                    <th className="p-2 text-left">Deductions</th>
                    <th className="p-2 text-left">Total</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => (
                    <tr className="border-b" key={e.id}>
                      <td className="p-2 font-medium">{e.period_name || e.period_id}</td>
                      <td className="p-2">{num(e.base_amount).toLocaleString()}</td>
                      <td className="p-2">{num(e.hours_worked).toFixed(2)}</td>
                      <td className="p-2">{num(e.classes_taught)}</td>
                      <td className="p-2">{num(e.bonus).toLocaleString()}</td>
                      <td className="p-2">{num(e.deductions).toLocaleString()}</td>
                      <td className="p-2 font-medium">{num(e.total_amount).toLocaleString()}</td>
                      <td className="p-2 capitalize">{e.status}</td>
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

MyPayrollPage.displayName = "MyPayrollPage";

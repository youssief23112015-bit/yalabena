import { useEffect, useState } from "react";
import { hrApi } from "@/api/hr";
import type { MySalesTarget } from "@/types/hr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MySalesTargetsPage() {
  const [targets, setTargets] = useState<MySalesTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const t = await hrApi.mySalesTargets();
      setTargets(t);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load your sales targets");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, []);

  if (error) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Sales Targets</h1>
      <p className="text-destructive">{error}</p>
    </div>
  );
  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  const totalTarget = targets.reduce((sum, t) => sum + t.target_amount, 0);
  const totalAchieved = targets.reduce((sum, t) => sum + t.achieved_amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sales Targets</h1>
        <p className="text-sm text-muted-foreground">Your sales targets and achievement.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Target Amount</div>
            <div className="text-2xl font-bold">{totalTarget.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Achieved Amount</div>
            <div className="text-2xl font-bold">{totalAchieved.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Overall Achievement</div>
            <div className="text-2xl font-bold">{totalTarget > 0 ? ((totalAchieved / totalTarget) * 100).toFixed(1) : 0}%</div>
          </CardContent>
        </Card>
      </section>

      {targets.length === 0 && (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">No sales targets found.</p>
        </div>
      )}

      <section className="rounded-lg border">
        <Card>
          <CardHeader>
            <CardTitle>Targets by Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Period</th>
                    <th className="p-2 text-left">Target Amount</th>
                    <th className="p-2 text-left">Achieved</th>
                    <th className="p-2 text-left">Target Conversions</th>
                    <th className="p-2 text-left">Achieved Conversions</th>
                    <th className="p-2 text-left">Conversion Rate</th>
                    <th className="p-2 text-left">Amount Achievement</th>
                  </tr>
                </thead>
                <tbody>
                  {targets.map(t => (
                    <tr className="border-b" key={t.id}>
                      <td className="p-2 font-medium">{t.month}/{t.year}</td>
                      <td className="p-2">{t.target_amount.toLocaleString()}</td>
                      <td className="p-2">{t.achieved_amount.toLocaleString()}</td>
                      <td className="p-2">{t.target_conversions}</td>
                      <td className="p-2">{t.achieved_conversions}</td>
                      <td className="p-2">{t.conversion_rate}%</td>
                      <td className="p-2">{t.amount_achievement}%</td>
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

MySalesTargetsPage.displayName = "MySalesTargetsPage";

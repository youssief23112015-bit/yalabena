import { useEffect, useState } from "react";
import { hrApi } from "@/api/hr";
import type { TeacherEvaluation } from "@/types/hr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyEvaluationsPage() {
  const [evaluations, setEvaluations] = useState<TeacherEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const e = await hrApi.myEvaluations();
      setEvaluations(e);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load your evaluations");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, []);

  if (error) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Evaluations</h1>
      <p className="text-destructive">{error}</p>
    </div>
  );
  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Evaluations</h1>
        <p className="text-sm text-muted-foreground">Teacher evaluations shared with you.</p>
      </div>

      {evaluations.length === 0 && (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">No evaluations found.</p>
        </div>
      )}

      <section className="rounded-lg border">
        <Card>
          <CardHeader>
            <CardTitle>Evaluations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Group</th>
                    <th className="p-2 text-left">Term</th>
                    <th className="p-2 text-left">Shared</th>
                    <th className="p-2 text-left">Created</th>
                    <th className="p-2 text-left">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map(e => (
                    <tr className="border-b" key={e.id}>
                      <td className="p-2 font-medium">{e.group_id}</td>
                      <td className="p-2">{e.term || "—"}</td>
                      <td className="p-2">{e.is_shared_with_student ? "Yes" : "No"}</td>
                      <td className="p-2">{e.created_at?.slice(0, 10)}</td>
                      <td className="p-2">{e.overall_comment || "—"}</td>
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

MyEvaluationsPage.displayName = "MyEvaluationsPage";

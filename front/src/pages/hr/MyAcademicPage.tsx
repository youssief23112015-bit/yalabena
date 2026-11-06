import { useEffect, useState } from "react";
import { hrApi } from "@/api/hr";
import type { AcademicData, MyGroup, TeacherEvaluation } from "@/types/hr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyAcademicPage() {
  const [data, setData] = useState<AcademicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const d = await hrApi.myAcademic();
      setData(d);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load academic data");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, []);

  if (error) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Academic</h1>
      <p className="text-destructive">{error}</p>
    </div>
  );
  if (loading || !data) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Academic Responsibilities</h1>
        <p className="text-sm text-muted-foreground">Groups and evaluations under your academic oversight.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Groups</div>
            <div className="text-2xl font-bold">{data.groups.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Evaluations</div>
            <div className="text-2xl font-bold">{data.evaluations.length}</div>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-lg border">
        <Card>
          <CardHeader>
            <CardTitle>Groups</CardTitle>
          </CardHeader>
          <CardContent>
            {data.groups.length === 0 && <p className="p-4 text-center text-muted-foreground">No groups found.</p>}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Group</th>
                    <th className="p-2 text-left">Course</th>
                    <th className="p-2 text-left">Teacher</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.groups.map((g: MyGroup) => (
                    <tr className="border-b" key={g.id}>
                      <td className="p-2 font-medium">{g.name}</td>
                      <td className="p-2">{g.course?.name || "—"}</td>
                      <td className="p-2">{g.teacher ? `${g.teacher.first_name} ${g.teacher.last_name}` : "—"}</td>
                      <td className="p-2 capitalize">{g.status || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-lg border">
        <Card>
          <CardHeader>
            <CardTitle>Teacher Evaluations</CardTitle>
          </CardHeader>
          <CardContent>
            {data.evaluations.length === 0 && <p className="p-4 text-center text-muted-foreground">No evaluations found.</p>}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Teacher</th>
                    <th className="p-2 text-left">Term</th>
                    <th className="p-2 text-left">Shared</th>
                    <th className="p-2 text-left">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.evaluations.map((e: TeacherEvaluation) => (
                    <tr className="border-b" key={e.id}>
                      <td className="p-2 font-medium">{e.teacher_id}</td>
                      <td className="p-2">{e.term || "—"}</td>
                      <td className="p-2">{e.is_shared_with_student ? "Yes" : "No"}</td>
                      <td className="p-2">{e.created_at?.slice(0, 10)}</td>
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

MyAcademicPage.displayName = "MyAcademicPage";

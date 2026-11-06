import { useEffect, useState } from "react";
import { hrApi } from "@/api/hr";
import type { MyStudent } from "@/types/hr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyStudentsPage() {
  const [students, setStudents] = useState<MyStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const s = await hrApi.myStudents();
      setStudents(s);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load your students");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, []);

  if (error) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Students</h1>
      <p className="text-destructive">{error}</p>
    </div>
  );
  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Students</h1>
        <p className="text-sm text-muted-foreground">Students enrolled in your assigned groups.</p>
      </div>

      {students.length === 0 && (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">No students found in your groups.</p>
        </div>
      )}

      <section className="rounded-lg border">
        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Student ID</th>
                    <th className="p-2 text-left">Level</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr className="border-b" key={s.id}>
                      <td className="p-2 font-medium">{s.user?.first_name} {s.user?.last_name}</td>
                      <td className="p-2">{s.student_number || "—"}</td>
                      <td className="p-2">{s.current_level || "—"}</td>
                      <td className="p-2 capitalize">{s.status || "—"}</td>
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

MyStudentsPage.displayName = "MyStudentsPage";

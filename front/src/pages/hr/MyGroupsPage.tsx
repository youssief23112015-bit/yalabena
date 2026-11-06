import { useEffect, useState } from "react";
import { hrApi } from "@/api/hr";
import type { MyGroup } from "@/types/hr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyGroupsPage() {
  const [groups, setGroups] = useState<MyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const g = await hrApi.myGroups();
      setGroups(g);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load your groups");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, []);

  if (error) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Groups</h1>
      <p className="text-destructive">{error}</p>
    </div>
  );
  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Groups</h1>
        <p className="text-sm text-muted-foreground">Groups you are assigned to teach.</p>
      </div>

      {groups.length === 0 && (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">No groups assigned to you yet.</p>
        </div>
      )}

      <section className="rounded-lg border">
        <Card>
          <CardHeader>
            <CardTitle>Assigned Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Group</th>
                    <th className="p-2 text-left">Course</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Mode</th>
                    <th className="p-2 text-left">Dates</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map(g => (
                    <tr className="border-b" key={g.id}>
                      <td className="p-2 font-medium">{g.name}</td>
                      <td className="p-2">{g.course?.name || "—"}</td>
                      <td className="p-2 capitalize">{g.status || "—"}</td>
                      <td className="p-2">{g.mode || "—"}</td>
                      <td className="p-2">{g.start_date?.slice(0, 10)} → {g.end_date?.slice(0, 10)}</td>
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

MyGroupsPage.displayName = "MyGroupsPage";

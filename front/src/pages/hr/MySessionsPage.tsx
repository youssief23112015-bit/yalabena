import { useEffect, useState } from "react";
import { hrApi } from "@/api/hr";
import type { MySession } from "@/types/hr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MySessionsPage() {
  const [sessions, setSessions] = useState<MySession[]>([]);
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filter === "upcoming") params.upcoming = "true";
      if (filter === "completed") params.completed = "true";
      const s = await hrApi.mySessions(params);
      setSessions(s);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load your sessions");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, [filter]);

  if (error) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Sessions</h1>
      <p className="text-destructive">{error}</p>
    </div>
  );
  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  const upcoming = sessions.filter(s => s.is_upcoming).length;
  const completed = sessions.filter(s => s.is_completed).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Sessions</h1>
        <p className="text-sm text-muted-foreground">Teaching sessions for your assigned groups.</p>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>All</Button>
        <Button size="sm" variant={filter === "upcoming" ? "default" : "outline"} onClick={() => setFilter("upcoming")}>Upcoming ({upcoming})</Button>
        <Button size="sm" variant={filter === "completed" ? "default" : "outline"} onClick={() => setFilter("completed")}>Completed ({completed})</Button>
      </div>

      {sessions.length === 0 && (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">No sessions found.</p>
        </div>
      )}

      <section className="rounded-lg border">
        <Card>
          <CardHeader>
            <CardTitle>Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Time</th>
                    <th className="p-2 text-left">Group</th>
                    <th className="p-2 text-left">Mode</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Join</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr className="border-b" key={s.id}>
                      <td className="p-2 font-medium">{s.date?.slice(0, 10)}</td>
                      <td className="p-2">{s.start_time} — {s.end_time}</td>
                      <td className="p-2">{s.group_id}</td>
                      <td className="p-2 capitalize">{s.mode || "—"}</td>
                      <td className="p-2 capitalize">{s.cancelled_at ? "cancelled" : s.is_upcoming ? "upcoming" : "completed"}</td>
                      <td className="p-2">{s.zoom_join_url ? <a href={s.zoom_join_url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">Join</a> : "—"}</td>
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

MySessionsPage.displayName = "MySessionsPage";

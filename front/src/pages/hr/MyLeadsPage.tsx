import { useEffect, useState } from "react";
import { hrApi } from "@/api/hr";
import type { MyLead } from "@/types/hr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyLeadsPage() {
  const [leads, setLeads] = useState<MyLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const l = await hrApi.myLeads();
      setLeads(l);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load your leads");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, []);

  if (error) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Leads</h1>
      <p className="text-destructive">{error}</p>
    </div>
  );
  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Leads</h1>
        <p className="text-sm text-muted-foreground">Sales leads assigned to you.</p>
      </div>

      {leads.length === 0 && (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">No leads assigned to you.</p>
        </div>
      )}

      <section className="rounded-lg border">
        <Card>
          <CardHeader>
            <CardTitle>Assigned Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Phone</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Level</th>
                    <th className="p-2 text-left">Converted</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(l => (
                    <tr className="border-b" key={l.id}>
                      <td className="p-2 font-medium">{l.first_name} {l.last_name}</td>
                      <td className="p-2">{l.phone}</td>
                      <td className="p-2">{l.email || "—"}</td>
                      <td className="p-2 capitalize">{l.status}</td>
                      <td className="p-2">{l.placement_level || "—"}</td>
                      <td className="p-2">{l.converted_to_student_id ? "Yes" : "No"}</td>
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

MyLeadsPage.displayName = "MyLeadsPage";

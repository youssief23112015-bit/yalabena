import { useEffect, useState } from "react";
import { hrApi } from "@/api/hr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function MyLmsPage() {
  const [data, setData] = useState<any[]>([]);
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const d = await hrApi.myLms();
      setData(d);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load LMS information");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, []);

  const toggleModule = (id: string) => {
    setOpenModules(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (error) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">LMS Resources</h1>
      <p className="text-destructive">{error}</p>
    </div>
  );
  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">LMS Resources</h1>
        <p className="text-sm text-muted-foreground">Lessons and resources for your assigned groups.</p>
      </div>

      {data.length === 0 && (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">No LMS resources found for your groups.</p>
        </div>
      )}

      {data.map((g) => (
        <section key={g.group_id} className="rounded-lg border">
          <Card>
            <CardHeader>
              <CardTitle>{g.group_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {g.modules?.map((m: any) => {
                const isOpen = openModules.has(m.id);
                return (
                  <div key={m.id} className="border-b pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
                    <div className="flex items-center justify-between cursor-pointer py-1" onClick={() => toggleModule(m.id)}>
                      <span className="font-medium">{m.name}</span>
                      <span className="text-xs text-muted-foreground">{m.is_published ? "Published" : "Draft"}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                    {isOpen && (
                      <div className="pl-4 space-y-2">
                        {m.lessons?.length ? (
                          <ul className="space-y-1">
                            {m.lessons.map((l: any) => (
                              <li key={l.id} className="text-sm border-l-2 border-secondary pl-3 py-1">
                                <span className="font-medium">{l.name}</span>{" "}
                                <span className="text-xs text-muted-foreground">({l.type} · {l.duration_minutes} min)</span>
                                {l.resources?.length && (
                                  <ul className="pl-4 space-y-1 mt-1">
                                    {l.resources.map((r: any) => (
                                      <li key={r.id} className="text-xs text-muted-foreground">
                                        • {r.name}{r.file_url ? " — <a href={r.file_url} target='_blank' rel='noopener noreferrer' className='text-primary underline underline-offset-2'>download</a>" : ""}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground pl-3 mt-1">No lessons in this module.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {g.modules?.length === 0 && <p className="p-3 text-sm text-muted-foreground">No modules published for this group.</p>}
            </CardContent>
          </Card>
        </section>
      ))}
    </div>
  );
}

MyLmsPage.displayName = "MyLmsPage";

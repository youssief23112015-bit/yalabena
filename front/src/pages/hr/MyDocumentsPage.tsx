import { useEffect, useState } from "react";
import { hrApi } from "@/api/hr";
import type { MyDocument } from "@/types/hr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DocumentType } from "@/types/hr";

export default function MyDocumentsPage() {
  const [documents, setDocuments] = useState<MyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [docType, setDocType] = useState<DocumentType | "">("");
  const [expiryDate, setExpiryDate] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const d = await hrApi.myDocuments();
      setDocuments(d);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load your documents");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, []);

  async function add() {
    setBusy(true);
    setError("");
    try {
      await hrApi.addMyDocument({ name: name || undefined, file_url: fileUrl || undefined, document_type: docType || undefined, expiry_date: expiryDate || undefined });
      setOpen(false);
      setName(""); setFileUrl(""); setDocType(""); setExpiryDate("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to add document");
    } finally {
      setBusy(false);
    }
  }

  if (error) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Documents</h1>
      <p className="text-destructive">{error}</p>
    </div>
  );
  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Documents</h1>
          <p className="text-sm text-muted-foreground">Your employee documents.</p>
        </div>
        <Button onClick={() => setOpen(true)}>Add document</Button>
      </div>

      {documents.length === 0 && (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">No documents found.</p>
        </div>
      )}

      <section className="rounded-lg border">
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-left">Expiry</th>
                    <th className="p-2 text-left">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(d => (
                    <tr className="border-b" key={d.id}>
                      <td className="p-2 font-medium">{d.name}</td>
                      <td className="p-2 capitalize">{d.document_type}</td>
                      <td className="p-2">{d.expiry_date ? d.expiry_date.slice(0, 10) : "—"}</td>
                      <td className="p-2">{d.created_at?.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" style={{ display: open ? "flex" : "none" }}>
        <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Add document</h2>
            <Button variant="ghost" onClick={() => setOpen(false)}>×</Button>
          </div>
          <div className="space-y-4">
            <Label className="text-sm">Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Document name" />
            <Label className="text-sm">File URL</Label>
            <Input value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://..." />
            <Label className="text-sm">Document type</Label>
            <Select value={docType} onValueChange={v => setDocType(v as DocumentType)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {["contract", "id", "certificate", "visa", "other"].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label className="text-sm">Expiry date</Label>
            <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
          </div>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={busy} onClick={add}>{busy ? "Adding…" : "Add"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

MyDocumentsPage.displayName = "MyDocumentsPage";

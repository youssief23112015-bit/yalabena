import { useState } from "react";
import { hrApi } from "@/api/hr";
import { Button } from "@/components/ui/button";
export function TerminateDialog({ open, employeeId, onClose, onSaved }: { open:boolean; employeeId?:string; onClose:()=>void; onSaved:()=>void }) {
 const [reason,setReason]=useState(""); const [date,setDate]=useState(new Date().toISOString().slice(0,10)); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
 if(!open||!employeeId)return null;
 async function submit(){if(!reason.trim()){setError("Reason is required");return;}setBusy(true);try{await hrApi.terminateEmployee(employeeId,reason,date);onSaved();onClose();}catch(e){setError(e instanceof Error?e.message:"Unable to terminate employee");}finally{setBusy(false);}}
 return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-md rounded-lg border bg-background p-6"><h2 className="text-lg font-semibold">Terminate employee</h2><div className="mt-4 space-y-3"><label className="block text-sm">Termination date<input type="date" className="mt-1 w-full rounded border p-2 bg-background" value={date} onChange={e=>setDate(e.target.value)}/></label><label className="block text-sm">Reason<textarea className="mt-1 min-h-24 w-full rounded border p-2 bg-background" value={reason} onChange={e=>setReason(e.target.value)}/></label></div>{error&&<p className="mt-3 text-sm text-destructive">{error}</p>}<div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant="destructive" disabled={busy} onClick={submit}>{busy?"Saving...":"Terminate"}</Button></div></div></div>;
}

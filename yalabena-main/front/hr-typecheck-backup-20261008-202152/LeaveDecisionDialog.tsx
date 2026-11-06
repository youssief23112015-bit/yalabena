import { useState } from "react";
import { hrApi } from "@/api/hr";
import { Button } from "@/components/ui/button";
export function LeaveDecisionDialog({open,id,action,onClose,onSaved}:{open:boolean;id?:string;action:"approve"|"reject";onClose:()=>void;onSaved:()=>void}){
 const [note,setNote]=useState("");const[busy,setBusy]=useState(false);if(!open||!id)return null;
 async function go(){setBusy(true);try{action==="approve"?await hrApi.approveLeave(id,note):await hrApi.rejectLeave(id,note);onSaved();onClose();}finally{setBusy(false);}}
 return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-md rounded-lg border bg-background p-6"><h2 className="text-lg font-semibold">{action==="approve"?"Approve":"Reject"} leave</h2><textarea className="mt-4 min-h-24 w-full rounded border bg-background p-2" placeholder="Note (optional)" value={note} onChange={e=>setNote(e.target.value)}/><div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant={action==="reject"?"destructive":"default"} disabled={busy} onClick={go}>{busy?"Saving...":"Confirm"}</Button></div></div></div>
}

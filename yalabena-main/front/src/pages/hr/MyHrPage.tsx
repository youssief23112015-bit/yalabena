import { useEffect,useState } from "react";
import { hrApi } from "@/api/hr";
import type { Employee, LeaveRequest } from "@/types/hr";
import { Button } from "@/components/ui/button";
import { AvailabilityPanel } from "@/components/hr/AvailabilityPanel";
import { LeaveRequestDialog } from "@/components/hr/LeaveRequestDialog";
export default function MyHrPage(){
 const[employee,setEmployee]=useState<Employee|null>(null);const[leaves,setLeaves]=useState<LeaveRequest[]>([]);const[open,setOpen]=useState(false);const[error,setError]=useState("");
 async function load(){try{const [e,l]=await Promise.all([hrApi.myEmployee(),hrApi.myLeaves()]);setEmployee(e);setLeaves(l)}catch(e){setError(e instanceof Error?e.message:"Unable to load your HR data")}}useEffect(()=>{void load()},[]);
 async function cancel(id:string){if(!window.confirm("Cancel this pending leave request?"))return;try{await hrApi.cancelMyLeave(id);await load()}catch(e){setError(e instanceof Error?e.message:"Unable to cancel leave")}}
 if(error)return <div className="space-y-4"><h1 className="text-2xl font-bold">My HR</h1><p className="text-destructive">{error}</p></div>;
 if(!employee)return <p>Loading...</p>;
 return <div className="space-y-6"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">My HR</h1><p className="text-sm text-muted-foreground">{employee.job_title} · {employee.employee_type}</p></div><Button onClick={()=>setOpen(true)}>Request leave</Button></div><section className="rounded-lg border p-5"><h2 className="mb-4 text-lg font-semibold">My leave requests</h2><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b"><th className="p-2 text-left">Type</th><th className="p-2 text-left">Dates</th><th className="p-2 text-left">Days</th><th className="p-2 text-left">Status</th><th/></tr></thead><tbody>{leaves.map(l=><tr className="border-b" key={l.id}><td className="p-2">{l.type}</td><td className="p-2">{l.start_date?.slice(0,10)} → {l.end_date?.slice(0,10)}</td><td className="p-2">{l.days_count}</td><td className="p-2">{l.status}</td><td className="p-2 text-right">{l.status==="pending"&&<Button variant="ghost" size="sm" onClick={()=>void cancel(l.id)}>Cancel</Button>}</td></tr>)}</tbody></table></div></section><section className="rounded-lg border p-5"><h2 className="mb-4 text-lg font-semibold">My availability</h2><AvailabilityPanel employeeId={employee.id}/></section><LeaveRequestDialog open={open} employeeId={employee.id} onClose={()=>setOpen(false)} onSaved={()=>void load()}/></div>
}

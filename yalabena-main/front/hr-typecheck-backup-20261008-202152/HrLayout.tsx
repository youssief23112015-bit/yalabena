import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useUserRoles, HR_PAYROLL_ROLES, HR_VIEW_ROLES, hasAnyRole } from "@/lib/rbac";
export default function HrLayout(){
 const roles=useUserRoles(); if(!hasAnyRole(roles,HR_VIEW_ROLES)&&!hasAnyRole(roles,["teacher","finance"]))return <Navigate to="/dashboard" replace/>;
 const tabs=[["/hr","Employees",HR_VIEW_ROLES],["/hr/leaves","Leaves",HR_VIEW_ROLES],["/hr/my","My HR",["teacher"]],["/hr/payroll","Payroll",HR_PAYROLL_ROLES]];
 return <div className="space-y-6"><div className="flex flex-wrap gap-2 border-b pb-2">{tabs.filter(([, ,r])=>hasAnyRole(roles,r as string[])).map(([to,label])=><NavLink key={to} to={to} end={to==="/hr"} className={({isActive})=>`rounded-md px-3 py-2 text-sm ${isActive?"bg-primary text-primary-foreground":"hover:bg-accent"}`}>{label}</NavLink>)}</div><Outlet/></div>
}

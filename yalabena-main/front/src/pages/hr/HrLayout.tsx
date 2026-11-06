import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useUserRoles, HR_PAYROLL_ROLES, HR_VIEW_ROLES, hasAnyRole } from "@/lib/rbac";
export default function HrLayout(){
 const roles=useUserRoles(); if(!hasAnyRole(roles,HR_VIEW_ROLES)&&!hasAnyRole(roles,["teacher","finance"]))return <Navigate to="/dashboard" replace/>;
 const tabs=[{to:"/hr",label:"Employees",roles:HR_VIEW_ROLES},{to:"/hr/leaves",label:"Leaves",roles:HR_VIEW_ROLES},{to:"/hr/my",label:"My HR",roles:["teacher"]},{to:"/hr/payroll",label:"Payroll",roles:HR_PAYROLL_ROLES}];
 return <div className="space-y-6"><div className="flex flex-wrap gap-2 border-b pb-2">{tabs.filter(tab=>hasAnyRole(roles,tab.roles)).map(tab=><NavLink key={tab.to} to={tab.to} end={tab.to==="/hr"} className={({isActive})=>`rounded-md px-3 py-2 text-sm ${isActive?"bg-primary text-primary-foreground":"hover:bg-accent"}`}>{tab.label}</NavLink>)}</div><Outlet/></div>
}


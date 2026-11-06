import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useUserRoles, HR_SELF_VIEW_ROLES, TEACHER_SELF_ROLES, SALES_SELF_ROLES, ACADEMIC_SELF_ROLES, ESS_NAV_ROLES, canViewSelfService, hasAnyRole } from "@/lib/rbac";
export default function HrLayout(){
  const roles=useUserRoles();
  if(!canViewSelfService(roles))return <Navigate to="/dashboard" replace/>;
  const tabs=[
    {to:"/hr",label:"Employees",roles:["super_admin","hr","branch_manager"]},
    {to:"/hr/leaves",label:"Leave Requests",roles:["super_admin","hr","branch_manager"]},
    {to:"/hr/my",label:"My HR",roles:ESS_NAV_ROLES},
    {to:"/hr/payroll",label:"Payroll",roles:["super_admin","hr","finance"]},
  ];
  return <div className="space-y-6"><div className="flex flex-wrap gap-2 border-b pb-2">{tabs.filter(tab=>hasAnyRole(roles,tab.roles)).map(tab=><NavLink key={tab.to} to={tab.to} end={tab.to==="/hr"} className={({isActive})=>`rounded-md px-3 py-2 text-sm ${isActive?"bg-primary text-primary-foreground":"hover:bg-accent"}`}>{tab.label}</NavLink>)}</div><Outlet/></div>
}


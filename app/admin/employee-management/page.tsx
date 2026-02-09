import { redirect } from "next/navigation";

export default function EmployeeManagementIndex() {
  redirect("/admin/employee-management/employees");
}

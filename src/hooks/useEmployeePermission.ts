import { useAppStore } from '../store/useAppStore';
import type { EmployeePagePermission } from '../types';

const FULL_PERMISSION: EmployeePagePermission = { view: true, create: true, edit: true, delete: true, approve: true };
const EMPTY_PERMISSION: EmployeePagePermission = { view: false, create: false, edit: false, delete: false, approve: false };

// Real admins always get the full permission set (zero behavior change). Employees get their
// resolved (OR-across-roles) grant for this page_key, or all-false if the page was never
// granted at all. The backend 403 is the real security boundary — this hook only controls
// whether action buttons are rendered, so an employee never sees a control that will fail.
export function useEmployeePermission(pageKey: string): EmployeePagePermission {
  const isEmployee = useAppStore(s => s.isEmployee);
  const employeePermissions = useAppStore(s => s.employeePermissions);
  if (!isEmployee) return FULL_PERMISSION;
  return employeePermissions[pageKey] ?? EMPTY_PERMISSION;
}

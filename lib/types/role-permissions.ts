// Role-based access control types and permissions

export type UserRole = 'LECTURER' | 'STUDENT' | 'DEPARTMENT' | 'FINANCE';

// Map authentication roles to permission roles
export type AuthRole = 'PGV' | 'KHOA' | 'SV' | 'PKT' | 'LECTURER' | 'STUDENT';

// Dashboard page identifiers
export type DashboardPage = 
  | 'classes'
  | 'students' 
  | 'subjects'
  | 'credit-classes'
  | 'student-grades'
  | 'reports'
  | 'course-registration'
  | 'tuition-payment'
  | 'tuition-reports'
  | 'departments'
  | 'settings';

// Permission configuration for each role
export interface RolePermissions {
  allowedPages: DashboardPage[];
  restrictedPages: DashboardPage[];
  displayName: string;
  description: string;
}

// Role permissions configuration
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  LECTURER: {
    allowedPages: ['classes', 'students', 'subjects', 'credit-classes', 'student-grades', 'reports', 'departments', 'settings'],
    restrictedPages: ['tuition-payment', 'tuition-reports', 'course-registration'],
    displayName: 'Lecturer',
    description: 'Access to academic management features'
  },
  DEPARTMENT: {
    allowedPages: ['classes', 'students', 'subjects', 'credit-classes', 'student-grades', 'reports', 'departments', 'settings'],
    restrictedPages: ['tuition-payment', 'tuition-reports', 'course-registration'],
    displayName: 'Department',
    description: 'Access to departmental management features'
  },
  STUDENT: {
    allowedPages: ['course-registration'],
    restrictedPages: ['classes', 'students', 'subjects', 'credit-classes', 'student-grades', 'reports', 'tuition-payment', 'tuition-reports', 'departments', 'settings'],
    displayName: 'Student',
    description: 'Access to course registration only'
  },
  FINANCE: {
    allowedPages: ['tuition-payment', 'tuition-reports'],
    restrictedPages: ['classes', 'students', 'subjects', 'credit-classes', 'student-grades', 'reports', 'course-registration', 'departments', 'settings'],
    displayName: 'Finance',
    description: 'Access to financial management features'
  }
};

// Map authentication roles to permission roles
export function mapAuthRoleToUserRole(authRole: string): UserRole {
  const roleMap: Record<string, UserRole> = {
    'PGV': 'LECTURER',
    'LECTURER': 'LECTURER',
    'KHOA': 'DEPARTMENT', 
    'DEPARTMENT': 'DEPARTMENT',
    'SV': 'STUDENT',
    'STUDENT': 'STUDENT',
    'PKT': 'FINANCE',
    'FINANCE': 'FINANCE'
  };
  
  return roleMap[authRole.toUpperCase()] || 'STUDENT';
}

// Check if user has access to a specific page
export function hasPageAccess(userRole: UserRole, page: DashboardPage): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions.allowedPages.includes(page);
}

// Get all allowed pages for a user role
export function getAllowedPages(userRole: UserRole): DashboardPage[] {
  return ROLE_PERMISSIONS[userRole].allowedPages;
}

// Get all restricted pages for a user role
export function getRestrictedPages(userRole: UserRole): DashboardPage[] {
  return ROLE_PERMISSIONS[userRole].restrictedPages;
}

// Get role display information
export function getRoleInfo(userRole: UserRole): { displayName: string; description: string } {
  const permissions = ROLE_PERMISSIONS[userRole];
  return {
    displayName: permissions.displayName,
    description: permissions.description
  };
}

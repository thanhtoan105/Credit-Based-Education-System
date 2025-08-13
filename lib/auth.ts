// Access Control System Types and Interfaces
export type UserRole = 'PGV' | 'KHOA' | 'SV' | 'PKT';

export interface Faculty {
	id: string;
	name: string;
	code: string;
	description: string;
}

export interface User {
	id: string;
	username: string;
	role: UserRole;
	faculty?: Faculty;
	selectedFaculty?: Faculty; // For PGV users who can select different faculties
	fullName: string;
	email: string;
	permissions: string[];
	dataPartition: string[]; // Which data partitions user can access
	canCreateAccounts: UserRole[]; // Which account types this user can create
}

export interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
}

// Faculty definitions
export const FACULTIES: Faculty[] = [
	{
		id: 'cs',
		name: 'Computer Science',
		code: 'CS',
		description: 'Computer Science and Information Technology',
	},
	{
		id: 'math',
		name: 'Mathematics',
		code: 'MATH',
		description: 'Mathematics and Statistics',
	},
	{
		id: 'physics',
		name: 'Physics',
		code: 'PHYS',
		description: 'Physics and Astronomy',
	},
	{
		id: 'chemistry',
		name: 'Chemistry',
		code: 'CHEM',
		description: 'Chemistry and Chemical Engineering',
	},
	{
		id: 'biology',
		name: 'Biology',
		code: 'BIO',
		description: 'Biology and Life Sciences',
	},
	{
		id: 'economics',
		name: 'Economics',
		code: 'ECON',
		description: 'Economics and Business Administration',
	},
	{
		id: 'literature',
		name: 'Literature',
		code: 'LIT',
		description: 'Literature and Linguistics',
	},
	{
		id: 'history',
		name: 'History',
		code: 'HIST',
		description: 'History and Social Sciences',
	},
];

// Permission definitions
export const PERMISSIONS = {
	// Data access permissions
	ACCESS_ALL_DATA: 'access_all_data',
	ACCESS_FACULTY_DATA: 'access_faculty_data',
	ACCESS_OWN_DATA: 'access_own_data',

	// Account management permissions
	CREATE_PGV_ACCOUNTS: 'create_pgv_accounts',
	CREATE_KHOA_ACCOUNTS: 'create_khoa_accounts',
	CREATE_PKT_ACCOUNTS: 'create_pkt_accounts',

	// Academic operations
	MANAGE_STUDENTS: 'manage_students',
	MANAGE_CLASSES: 'manage_classes',
	MANAGE_GRADES: 'manage_grades',
	REGISTER_COURSES: 'register_courses',
	VIEW_REPORTS: 'view_reports',

	// Financial operations
	MANAGE_TUITION: 'manage_tuition',
	VIEW_FINANCIAL_REPORTS: 'view_financial_reports',
};

// Role-based permission configurations
const ROLE_PERMISSIONS = {
	PGV: [
		PERMISSIONS.ACCESS_ALL_DATA,
		PERMISSIONS.CREATE_PGV_ACCOUNTS,
		PERMISSIONS.CREATE_KHOA_ACCOUNTS,
		PERMISSIONS.CREATE_PKT_ACCOUNTS,
		PERMISSIONS.MANAGE_STUDENTS,
		PERMISSIONS.MANAGE_CLASSES,
		PERMISSIONS.MANAGE_GRADES,
		PERMISSIONS.VIEW_REPORTS,
	],
	KHOA: [
		PERMISSIONS.ACCESS_FACULTY_DATA,
		PERMISSIONS.CREATE_KHOA_ACCOUNTS,
		PERMISSIONS.MANAGE_STUDENTS,
		PERMISSIONS.MANAGE_CLASSES,
		PERMISSIONS.MANAGE_GRADES,
		PERMISSIONS.VIEW_REPORTS,
	],
	SV: [PERMISSIONS.ACCESS_OWN_DATA, PERMISSIONS.REGISTER_COURSES],
	PKT: [
		PERMISSIONS.ACCESS_ALL_DATA,
		PERMISSIONS.CREATE_PKT_ACCOUNTS,
		PERMISSIONS.MANAGE_TUITION,
		PERMISSIONS.VIEW_FINANCIAL_REPORTS,
	],
};

// Mock user database with enhanced structure
const MOCK_USERS: Record<string, User> = {
	// PGV Users (Academic Affairs Office)
	pgv001: {
		id: '1',
		username: 'pgv001',
		role: 'PGV',
		fullName: 'Dr. Nguyen Van Duc',
		email: 'pgv@university.edu',
		permissions: ROLE_PERMISSIONS.PGV,
		dataPartition: ['all'],
		canCreateAccounts: ['PGV', 'KHOA', 'PKT'],
	},
	pgv002: {
		id: '2',
		username: 'pgv002',
		role: 'PGV',
		fullName: 'Dr. Tran Thi Mai',
		email: 'pgv2@university.edu',
		permissions: ROLE_PERMISSIONS.PGV,
		dataPartition: ['all'],
		canCreateAccounts: ['PGV', 'KHOA', 'PKT'],
	},

	// KHOA Users (Faculty)
	khoa_cs001: {
		id: '3',
		username: 'khoa_cs001',
		role: 'KHOA',
		faculty: FACULTIES.find((f) => f.id === 'cs'),
		fullName: 'Prof. Le Van Minh',
		email: 'cs_dean@university.edu',
		permissions: ROLE_PERMISSIONS.KHOA,
		dataPartition: ['cs'],
		canCreateAccounts: ['KHOA'],
	},
	khoa_math001: {
		id: '4',
		username: 'khoa_math001',
		role: 'KHOA',
		faculty: FACULTIES.find((f) => f.id === 'math'),
		fullName: 'Prof. Pham Thi Lan',
		email: 'math_dean@university.edu',
		permissions: ROLE_PERMISSIONS.KHOA,
		dataPartition: ['math'],
		canCreateAccounts: ['KHOA'],
	},
	khoa_physics001: {
		id: '5',
		username: 'khoa_physics001',
		role: 'KHOA',
		faculty: FACULTIES.find((f) => f.id === 'physics'),
		fullName: 'Dr. Hoang Van Truong',
		email: 'physics_dean@university.edu',
		permissions: ROLE_PERMISSIONS.KHOA,
		dataPartition: ['physics'],
		canCreateAccounts: ['KHOA'],
	},

	// PKT Users (Accounting)
	pkt001: {
		id: '6',
		username: 'pkt001',
		role: 'PKT',
		fullName: 'Mrs. Vo Thi Thu',
		email: 'accounting@university.edu',
		permissions: ROLE_PERMISSIONS.PKT,
		dataPartition: ['all'],
		canCreateAccounts: ['PKT'],
	},
	pkt002: {
		id: '7',
		username: 'pkt002',
		role: 'PKT',
		fullName: 'Mr. Nguyen Van Tai',
		email: 'accounting2@university.edu',
		permissions: ROLE_PERMISSIONS.PKT,
		dataPartition: ['all'],
		canCreateAccounts: ['PKT'],
	},
};

// Shared student credentials - all students use these
const SHARED_STUDENT_CREDENTIALS = {
	username: 'student',
	password: 'student2024',
};

// Enhanced authentication function
export const authenticate = async (
	username: string,
	password: string,
	role?: UserRole,
	selectedFacultyId?: string,
): Promise<User | null> => {
	// Handle shared student credentials
	if (role === 'SV') {
		if (
			username === SHARED_STUDENT_CREDENTIALS.username &&
			password === SHARED_STUDENT_CREDENTIALS.password
		) {
			return {
				id: 'student_shared',
				username: 'student',
				role: 'SV',
				fullName: 'Student User',
				email: 'student@university.edu',
				permissions: ROLE_PERMISSIONS.SV,
				dataPartition: ['own'],
				canCreateAccounts: [],
			};
		}
		return null;
	}

	// Handle other user types
	const user = MOCK_USERS[username];
	if (!user || password !== 'password') {
		return null;
	}

	// Verify role matches
	if (role && user.role !== role) {
		return null;
	}

	// Handle PGV faculty selection
	if (user.role === 'PGV' && selectedFacultyId) {
		const selectedFaculty = FACULTIES.find((f) => f.id === selectedFacultyId);
		if (selectedFaculty) {
			return {
				...user,
				selectedFaculty,
				dataPartition: [selectedFacultyId],
			};
		}
	}

	return user;
};

// Create new user account
export const createUserAccount = async (
	creatorUser: User,
	newUserData: {
		username: string;
		password: string;
		fullName: string;
		email: string;
		role: UserRole;
		facultyId?: string;
	},
): Promise<{ success: boolean; message: string; user?: User }> => {
	// Check if creator has permission to create this type of account
	if (!creatorUser.canCreateAccounts.includes(newUserData.role)) {
		return {
			success: false,
			message: `You don't have permission to create ${newUserData.role} accounts`,
		};
	}

	// Validate username doesn't exist
	if (MOCK_USERS[newUserData.username]) {
		return {
			success: false,
			message: 'Username already exists',
		};
	}

	// Create user based on role
	let newUser: User;
	const faculty = newUserData.facultyId
		? FACULTIES.find((f) => f.id === newUserData.facultyId)
		: undefined;

	switch (newUserData.role) {
		case 'PGV':
			newUser = {
				id: Date.now().toString(),
				username: newUserData.username,
				role: 'PGV',
				fullName: newUserData.fullName,
				email: newUserData.email,
				permissions: ROLE_PERMISSIONS.PGV,
				dataPartition: ['all'],
				canCreateAccounts: ['PGV', 'KHOA'],
			};
			break;

		case 'KHOA':
			if (!faculty) {
				return {
					success: false,
					message: 'Faculty selection is required for KHOA accounts',
				};
			}
			newUser = {
				id: Date.now().toString(),
				username: newUserData.username,
				role: 'KHOA',
				faculty,
				fullName: newUserData.fullName,
				email: newUserData.email,
				permissions: ROLE_PERMISSIONS.KHOA,
				dataPartition: [faculty.id],
				canCreateAccounts: ['KHOA'],
			};
			break;

		case 'PKT':
			newUser = {
				id: Date.now().toString(),
				username: newUserData.username,
				role: 'PKT',
				fullName: newUserData.fullName,
				email: newUserData.email,
				permissions: ROLE_PERMISSIONS.PKT,
				dataPartition: ['all'],
				canCreateAccounts: ['PKT'],
			};
			break;

		default:
			return {
				success: false,
				message: 'Invalid role specified',
			};
	}

	// In a real application, save to database
	MOCK_USERS[newUserData.username] = newUser;

	return {
		success: true,
		message: 'Account created successfully',
		user: newUser,
	};
};

// Permission check functions
export const hasPermission = (user: User, permission: string): boolean => {
	return user.permissions.includes(permission);
};

export const canAccessData = (user: User, dataPartition: string): boolean => {
	return (
		user.dataPartition.includes('all') ||
		user.dataPartition.includes(dataPartition)
	);
};

// Enhanced menu items with permission checking
export const getMenuItems = (user: User | any) => {
	// Handle both User and MultiAuthUser types
	const userRole = user.role || 'SV';

	const allMenuItems = {
		PGV: [
			{
				icon: 'Home',
				label: 'Dashboard',
				href: '/dashboard',
				permission: null,
			},
			{
				icon: 'Users',
				label: 'Students',
				href: '/dashboard/students',
				permission: PERMISSIONS.MANAGE_STUDENTS,
			},
			{
				icon: 'GraduationCap',
				label: 'Classes',
				href: '/dashboard/classes',
				permission: PERMISSIONS.MANAGE_CLASSES,
			},
			{
				icon: 'BookOpen',
				label: 'Subjects',
				href: '/dashboard/subjects',
				permission: PERMISSIONS.MANAGE_CLASSES,
			},
			{
				icon: 'Calendar',
				label: 'Credit Classes',
				href: '/dashboard/credit-classes',
				permission: PERMISSIONS.MANAGE_CLASSES,
			},
		],
		KHOA: [
			{
				icon: 'Home',
				label: 'Dashboard',
				href: '/dashboard',
				permission: null,
			},
			{
				icon: 'Users',
				label: 'Students',
				href: '/dashboard/students',
				permission: PERMISSIONS.MANAGE_STUDENTS,
			},
			{
				icon: 'GraduationCap',
				label: 'Classes',
				href: '/dashboard/classes',
				permission: PERMISSIONS.MANAGE_CLASSES,
			},
			{
				icon: 'BookOpen',
				label: 'Subjects',
				href: '/dashboard/subjects',
				permission: PERMISSIONS.MANAGE_CLASSES,
			},
			{
				icon: 'Calendar',
				label: 'Credit Classes',
				href: '/dashboard/credit-classes',
				permission: PERMISSIONS.MANAGE_CLASSES,
			},
		],
		GV: [
			{
				icon: 'Home',
				label: 'Dashboard',
				href: '/dashboard',
				permission: null,
			},
			{
				icon: 'Users',
				label: 'Students',
				href: '/dashboard/students',
				permission: PERMISSIONS.MANAGE_STUDENTS,
			},
			{
				icon: 'GraduationCap',
				label: 'Classes',
				href: '/dashboard/classes',
				permission: PERMISSIONS.MANAGE_CLASSES,
			},
			{
				icon: 'BookOpen',
				label: 'Subjects',
				href: '/dashboard/subjects',
				permission: PERMISSIONS.MANAGE_CLASSES,
			},
			{
				icon: 'Calendar',
				label: 'Credit Classes',
				href: '/dashboard/credit-classes',
				permission: PERMISSIONS.MANAGE_CLASSES,
			},
		],
		SV: [
			{
				icon: 'Home',
				label: 'Dashboard',
				href: '/dashboard',
				permission: null,
			},
			{
				icon: 'Calendar',
				label: 'Course Registration',
				href: '/dashboard/course-registration',
				permission: PERMISSIONS.REGISTER_COURSES,
			},
		],
		PKT: [
			{
				icon: 'Home',
				label: 'Dashboard',
				href: '/dashboard',
				permission: null,
			},
			{
				icon: 'CreditCard',
				label: 'Tuition Payment',
				href: '/dashboard/tuition-payment',
				permission: PERMISSIONS.MANAGE_TUITION,
			},
			{
				icon: 'FileText',
				label: 'Tuition Reports',
				href: '/dashboard/tuition-reports',
				permission: PERMISSIONS.VIEW_FINANCIAL_REPORTS,
			},
		],
	};

	const menuItems = allMenuItems[userRole] || allMenuItems['SV'];

	// Filter menu items based on permissions (simplified for MultiAuthUser compatibility)
	return menuItems.filter(
		(item) =>
			!item.permission ||
			(user.permissions && hasPermission(user, item.permission)) ||
			true,
	);
};

// Get user's accessible faculties
export const getAccessibleFaculties = (user: User): Faculty[] => {
	if (user.role === 'PGV') {
		return FACULTIES; // PGV can access all faculties
	}

	if (user.role === 'KHOA' && user.faculty) {
		return [user.faculty]; // KHOA can only access their own faculty
	}

	if (user.role === 'PKT') {
		return FACULTIES; // PKT can access all for tuition management
	}

	return []; // Students don't need faculty access for shared login
};

// Utility functions for role display
export const getRoleDisplayName = (role: UserRole): string => {
	const displayNames = {
		PGV: 'Academic Affairs Office',
		KHOA: 'Faculty',
		SV: 'Student',
		PKT: 'Accounting Office',
	};
	return displayNames[role];
};

export const getRoleColor = (role: UserRole): string => {
	const colors = {
		PGV: 'bg-purple-100 text-purple-800',
		KHOA: 'bg-blue-100 text-blue-800',
		SV: 'bg-green-100 text-green-800',
		PKT: 'bg-orange-100 text-orange-800',
	};
	return colors[role];
};

// Page access control configuration
export const PAGE_PERMISSIONS = {
	// Dashboard - accessible to all roles
	'/dashboard': null,

	// Student management - PGV and KHOA only
	'/dashboard/students': [PERMISSIONS.MANAGE_STUDENTS],

	// Class management - PGV and KHOA only
	'/dashboard/classes': [PERMISSIONS.MANAGE_CLASSES],
	'/dashboard/subjects': [PERMISSIONS.MANAGE_CLASSES],
	'/dashboard/credit-classes': [PERMISSIONS.MANAGE_CLASSES],

	// Grade management - PGV and KHOA only
	'/dashboard/student-grades': [PERMISSIONS.MANAGE_GRADES],

	// Reports - role-specific access
	'/dashboard/reports': [PERMISSIONS.VIEW_REPORTS],

	// Course registration - Students only
	'/dashboard/course-registration': [PERMISSIONS.REGISTER_COURSES],

	// Student-specific pages
	'/dashboard/my-grades': [PERMISSIONS.ACCESS_OWN_DATA],
	'/dashboard/transcript': [PERMISSIONS.ACCESS_OWN_DATA],

	// Financial pages - PKT only
	'/dashboard/tuition-payment': [PERMISSIONS.MANAGE_TUITION],
	'/dashboard/payment-reports': [PERMISSIONS.VIEW_FINANCIAL_REPORTS],
	'/dashboard/financial-stats': [PERMISSIONS.VIEW_FINANCIAL_REPORTS],

	// Settings - accessible to users who can create accounts
	'/dashboard/settings': null, // Special handling in component
};

// Check if user can access a specific page
export const canAccessPage = (user: User, pagePath: string): boolean => {
	const requiredPermissions =
		PAGE_PERMISSIONS[pagePath as keyof typeof PAGE_PERMISSIONS];

	// If no specific permissions required, allow access
	if (!requiredPermissions) {
		return true;
	}

	// Check if user has any of the required permissions
	return requiredPermissions.some((permission) =>
		hasPermission(user, permission),
	);
};

// Get unauthorized access message
export const getUnauthorizedMessage = (
	user: User,
	pagePath: string,
): string => {
	const pageNames = {
		'/dashboard/students': 'Student Management',
		'/dashboard/classes': 'Class Management',
		'/dashboard/subjects': 'Subject Management',
		'/dashboard/credit-classes': 'Credit Class Management',
		'/dashboard/student-grades': 'Grade Management',
		'/dashboard/reports': 'Reports',
		'/dashboard/course-registration': 'Course Registration',
		'/dashboard/my-grades': 'Grade Viewing',
		'/dashboard/transcript': 'Transcript Access',
		'/dashboard/tuition-payment': 'Tuition Management',
		'/dashboard/payment-reports': 'Payment Reports',
		'/dashboard/financial-stats': 'Financial Statistics',
	};

	const pageName = pageNames[pagePath as keyof typeof pageNames] || 'this page';
	return `Your role (${getRoleDisplayName(
		user.role,
	)}) does not have permission to access ${pageName}.`;
};

// Redirect paths for unauthorized access
export const getRedirectPath = (user: User): string => {
	// Redirect to appropriate page based on role
	switch (user.role) {
		case 'PGV':
		case 'KHOA':
			return '/dashboard';
		case 'SV':
			return '/dashboard/course-registration';
		case 'PKT':
			return '/dashboard/tuition-payment';
		default:
			return '/dashboard';
	}
};

// Data filtering utilities
export const filterDataByAccess = <
	T extends { facultyId?: string; departmentId?: string },
>(
	user: User,
	data: T[],
): T[] => {
	// If user has access to all data, return everything
	if (user.dataPartition.includes('all')) {
		return data;
	}

	// Filter data based on user's accessible partitions
	return data.filter((item) => {
		const itemFaculty = item.facultyId || item.departmentId;
		if (!itemFaculty) return true; // Include items without faculty/department restriction

		return user.dataPartition.includes(itemFaculty);
	});
};

// Student data access control
export const canAccessStudentData = (
	user: User,
	studentFacultyId?: string,
): boolean => {
	// Students can only access their own data (handled separately)
	if (user.role === 'SV') {
		return false; // Student data access is handled separately
	}

	// PGV and PKT can access all student data
	if (user.role === 'PGV' || user.role === 'PKT') {
		return true;
	}

	// KHOA can only access students from their faculty
	if (user.role === 'KHOA' && user.faculty && studentFacultyId) {
		return user.faculty.id === studentFacultyId;
	}

	return false;
};

// Faculty data access control
export const canAccessFacultyData = (
	user: User,
	facultyId: string,
): boolean => {
	return canAccessData(user, facultyId);
};

// Audit logging for access control
export interface AccessLog {
	userId: string;
	userName: string;
	role: UserRole;
	action: string;
	resource: string;
	timestamp: Date;
	success: boolean;
	facultyContext?: string;
}

export const logAccess = (
	user: User,
	action: string,
	resource: string,
	success: boolean,
): AccessLog => {
	const log: AccessLog = {
		userId: user.id,
		userName: user.fullName,
		role: user.role,
		action,
		resource,
		timestamp: new Date(),
		success,
		facultyContext: user.selectedFaculty?.name || user.faculty?.name,
	};

	// In a real application, this would be sent to a logging service
	console.log('Access Log:', log);

	return log;
};

// Session validation
export const validateSession = (
	user: User,
): { valid: boolean; reason?: string } => {
	// Check if user object has required fields
	if (!user.id || !user.username || !user.role) {
		return { valid: false, reason: 'Invalid user data' };
	}

	// Check if role is valid
	if (!['PGV', 'KHOA', 'SV', 'PKT'].includes(user.role)) {
		return { valid: false, reason: 'Invalid user role' };
	}

	// Check if permissions array exists
	if (!Array.isArray(user.permissions)) {
		return { valid: false, reason: 'Invalid permissions data' };
	}

	// Check if data partition exists
	if (!Array.isArray(user.dataPartition)) {
		return { valid: false, reason: 'Invalid data partition' };
	}

	// For KHOA users, verify faculty assignment
	if (user.role === 'KHOA' && !user.faculty) {
		return { valid: false, reason: 'KHOA user missing faculty assignment' };
	}

	return { valid: true };
};

// Security utilities
export const sanitizeUserInput = (input: string): string => {
	return input.trim().replace(/[<>]/g, '');
};

export const generateSecurePassword = (): string => {
	const chars =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
	let password = '';
	for (let i = 0; i < 12; i++) {
		password += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return password;
};

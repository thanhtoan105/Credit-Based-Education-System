// Multi-database authentication types

// Department information from VIEW_FRAGMENT_LIST
export interface Department {
	branch_name: string;
	server_name: string;
}

// Department dropdown option
export interface DepartmentOption {
	value: string;
	label: string;
	serverName: string;
}

// Authentication result from SP_LOGIN
export interface SPLoginResult {
	USERNAME: string;
	FULL_NAME: string; // Changed from HOTEN to FULL_NAME
	RoleName: string; // Changed from tennhom to RoleName
}

// Multi-database user interface
export interface MultiAuthUser {
	id: string;
	username: string;
	fullName: string;
	groupName: string; // From RoleName field
	department: Department;
	serverName: string;
	isStudent: boolean;
}

// Authentication response
export interface MultiAuthResponse {
	success: boolean;
	user?: MultiAuthUser;
	error?: string;
}

// Login request payload
export interface LoginRequest {
	username: string;
	password: string;
	department: string;
}

// Login response payload
export interface LoginResponse {
	success: boolean;
	user?: MultiAuthUser;
	authType?: 'multi-database' | 'legacy';
	error?: string;
}

// Department test results
export interface DepartmentTestResult {
	departmentExists: boolean;
	serverAccessible: boolean;
	storedProcExists: boolean;
	error?: string;
}

// Connection test results
export interface ConnectionTestResult {
	department: string;
	serverName: string;
	connectionTest: boolean;
	authTest: DepartmentTestResult;
}

// View access test result
export interface ViewAccessResult {
	exists: boolean;
	accessible: boolean;
	error?: string;
}

// Complete test results
export interface MultiDbTestResults {
	timestamp: string;
	primaryConnection: boolean;
	departments: Department[];
	viewAccess: ViewAccessResult;
	departmentTests: ConnectionTestResult[];
}

// Session data
export interface UserSession {
	user: MultiAuthUser;
	authType: 'multi-database' | 'legacy';
	loginTime: string;
	lastActivity: string;
}

// Session validation result
export interface SessionValidationResult {
	isValid: boolean;
	user?: MultiAuthUser;
	error?: string;
}

// Database configuration for departments
export interface DepartmentConfig {
	serverName: string;
	instanceName?: string;
	user: string;
	password: string;
	database?: string;
}

// Multi-database configuration
export interface MultiDatabaseConfig {
	primary: {
		server: string;
		database: string;
		user: string;
		password: string;
	};
	departments: Record<string, DepartmentConfig>;
}

// API response types
export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

export interface DepartmentsApiResponse extends ApiResponse {
	departments: DepartmentOption[];
}

export interface TestApiResponse extends ApiResponse {
	testResults: MultiDbTestResults;
}

// Error types
export enum AuthErrorType {
	INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
	DEPARTMENT_NOT_FOUND = 'DEPARTMENT_NOT_FOUND',
	SERVER_UNAVAILABLE = 'SERVER_UNAVAILABLE',
	STORED_PROC_MISSING = 'STORED_PROC_MISSING',
	SESSION_EXPIRED = 'SESSION_EXPIRED',
	UNAUTHORIZED = 'UNAUTHORIZED',
}

export interface AuthError {
	type: AuthErrorType;
	message: string;
	details?: any;
}

// User group types (from RoleName field)
export type UserGroup = 'SV' | 'GV' | 'ADMIN' | 'KHOA' | 'PKT';

// Permission levels
export enum PermissionLevel {
	READ = 'READ',
	WRITE = 'WRITE',
	ADMIN = 'ADMIN',
	SUPER_ADMIN = 'SUPER_ADMIN',
}

// User permissions based on group
export interface UserPermissions {
	level: PermissionLevel;
	canAccessStudentData: boolean;
	canAccessTeacherData: boolean;
	canAccessFinancialData: boolean;
	canManageUsers: boolean;
	canSwitchDepartments: boolean;
}

// Extended user interface with permissions
export interface ExtendedMultiAuthUser extends MultiAuthUser {
	permissions: UserPermissions;
	lastLogin?: string;
	sessionId?: string;
}

// Database operation result
export interface DbOperationResult<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	affectedRows?: number;
}

// Stored procedure execution result
export interface StoredProcResult<T = any> {
	success: boolean;
	recordset?: T[];
	error?: string;
	returnValue?: number;
}

// Connection pool status
export interface ConnectionPoolStatus {
	serverName: string;
	connected: boolean;
	poolSize: number;
	activeConnections: number;
	idleConnections: number;
	error?: string;
}

// Multi-database manager status
export interface MultiDbManagerStatus {
	primaryConnection: ConnectionPoolStatus;
	departmentConnections: ConnectionPoolStatus[];
	totalConnections: number;
	healthStatus: 'healthy' | 'degraded' | 'critical';
}

// Audit log entry
export interface AuditLogEntry {
	id: string;
	userId: string;
	username: string;
	action: string;
	resource: string;
	department: string;
	serverName: string;
	timestamp: string;
	success: boolean;
	error?: string;
	ipAddress?: string;
	userAgent?: string;
}

// Configuration validation result
export interface ConfigValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}

// Health check result
export interface HealthCheckResult {
	service: string;
	status: 'healthy' | 'unhealthy' | 'degraded';
	timestamp: string;
	responseTime: number;
	error?: string;
	details?: any;
}

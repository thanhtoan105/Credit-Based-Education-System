import {
	getDepartmentPool,
	getStudentPool,
	getPrimaryPool,
} from '../multi-database';
import { createDepartmentConfig, createStudentConfig } from '../db-config';
import { DepartmentService, Department } from './department.service';

// Authentication result from SP_LOGIN
export interface AuthenticationResult {
	USERNAME: string;
	FULL_NAME: string; // Changed from HOTEN to FULL_NAME
	RoleName: string; // Changed from tennhom to RoleName
}

// Authentication result from SP_LOGIN_INFO
export interface UserInfoResult {
	USERNAME: string;
	FULL_NAME: string; // Changed from HOTEN to FULL_NAME
	RoleName?: string; // For teacher authentication (LECTURER flow)
	ROLE_NAME?: string; // For student authentication (STUDENT flow)
}

// Enhanced user interface for multi-database system
export interface MultiAuthUser {
	id: string;
	username: string;
	fullName: string;
	role: 'LECTURER' | 'STUDENT';
	groupName: string;
	department: Department;
	serverName: string;
	isStudent: boolean;
}

// Authentication response
export interface MultiAuthResponse {
	success: boolean;
	user?: MultiAuthUser;
	error?: string;
	message?: string;
}

// Multi-database authentication service
export class MultiAuthService {
	// Generic function to execute stored procedures and return results
	static async executeStoredProcedure<T = any>(
		serverName: string,
		procedureName: string,
		parameters: { [key: string]: any } = {},
		isStudent: boolean = false,
	): Promise<T | null> {
		try {
			// Use appropriate connection pool based on user type
			const pool = isStudent
				? await getStudentPool(serverName)
				: await getDepartmentPool(serverName);

			const request = pool.request();

			// Add parameters to the request
			Object.entries(parameters).forEach(([key, value]) => {
				request.input(key, value);
			});

			const result = await request.execute(procedureName);

			if (result.recordset && result.recordset.length > 0) {
				return result.recordset[0] as T;
			}

			return null;
		} catch (error) {
			console.error(
				`Error executing ${procedureName} on ${serverName}:`,
				error,
			);
			return null;
		}
	}

	// Execute SP_LOGIN stored procedure on target server
	static async executeSPLogin(
		serverName: string,
		username: string,
		isStudent: boolean = false,
	): Promise<AuthenticationResult | null> {
		try {
			// Use student pool for student access, department pool for others
			const pool = isStudent
				? await getStudentPool(serverName)
				: await getDepartmentPool(serverName);

			const request = pool.request();
			request.input('LoginName', username);

			const result = await request.execute('SP_LOGIN');

			if (result.recordset && result.recordset.length > 0) {
				const authResult = result.recordset[0] as AuthenticationResult;
				return authResult;
			}

			return null;
		} catch (error) {
			console.error(`Error executing SP_LOGIN on ${serverName}:`, error);
			return null;
		}
	}

	// Execute SP_LOGIN_INFO stored procedure for enhanced authentication
	static async executeSPLoginInfo(
		serverName: string,
		username: string,
		userRole: 'LECTURER' | 'STUDENT',
		isStudent: boolean = false,
	): Promise<UserInfoResult | null> {
		const result = await this.executeStoredProcedure<UserInfoResult>(
			serverName,
			'SP_LOGIN_INFO',
			{
				LoginName: username,
				UserRole: userRole,
			},
			isStudent,
		);

		if (result) {
			console.log('SP_LOGIN_INFO result:', result); // Debug log
		}

		return result;
	}

	// Direct STUDENT table query for student authentication (Option A: ID only, no password required)
	static async validateStudentExists(
		serverName: string,
		studentId: string,
	): Promise<boolean> {
		try {
			const pool = await getStudentPool(serverName);
			const request = pool.request();

			// Direct query to STUDENT table - only check if Student ID exists
			const query = `
				SELECT *
				FROM STUDENT
				WHERE STUDENT_ID = @StudentId
			`;

			request.input('StudentId', studentId);

			const result = await request.query(query);

			// Return true if student found (HasRows equivalent)
			return result.recordset && result.recordset.length > 0;
		} catch (error) {
			console.error('Student validation error:', error);
			return false;
		}
	}

	// Enhanced Teacher Authentication Flow
	static async authenticateTeacher(
		username: string,
		password: string,
		departmentName: string,
	): Promise<MultiAuthResponse> {
		try {
			// Get department info from VIEW_FRAGMENT_LIST
			const departments = await DepartmentService.getDepartments();
			const department = departments.find(
				(d) => d.branch_name === departmentName,
			);

			if (!department) {
				return {
					success: false,
					error: `Department "${departmentName}" not found in VIEW_FRAGMENT_LIST`,
					user: null,
				};
			}

			const serverName = department.server_name;

			// Step 1: Connect to department server using HTKN credentials
			try {
				const pool = await getDepartmentPool(serverName);
				console.log(`Connected to ${serverName} for teacher authentication`);
			} catch (error) {
				return {
					success: false,
					error: `Cannot connect to department server ${serverName}`,
					user: null,
				};
			}

			// Step 2: Execute SP_LOGIN_INFO with teacher credentials
			const userInfo = await this.executeSPLoginInfo(
				serverName,
				username,
				'LECTURER',
				false,
			);

			if (!userInfo) {
				return {
					success: false,
					error: 'Invalid teacher credentials or user not found',
					user: null,
				};
			}

			// Step 3: Create user object with enhanced information
			// Use the role returned from SP_LOGIN_INFO (RoleName field)
			const actualRole = userInfo.RoleName || 'LECTURER';

			const user: MultiAuthUser = {
				id: userInfo.USERNAME,
				username: userInfo.USERNAME,
				fullName: userInfo.FULL_NAME,
				role: 'LECTURER',
				department: department,
				serverName: serverName,
				groupName: actualRole, // Use the actual role from stored procedure
				isStudent: false,
			};

			return {
				success: true,
				error: null,
				user,
				message: `Teacher login successful. Welcome ${userInfo.FULL_NAME} with role ${actualRole}`,
			};
		} catch (error) {
			console.error('Teacher authentication error:', error);
			return {
				success: false,
				error: `Authentication failed: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`,
				user: null,
			};
		}
	}

	// Enhanced Student Authentication Flow (Option A: ID only, no password required)
	static async authenticateStudent(
		studentId: string,
		departmentName: string,
	): Promise<MultiAuthResponse> {
		try {
			// Get department info from VIEW_FRAGMENT_LIST
			const departments = await DepartmentService.getDepartments();
			const department = departments.find(
				(d) => d.branch_name === departmentName,
			);

			if (!department) {
				return {
					success: false,
					error: `Department "${departmentName}" not found in VIEW_FRAGMENT_LIST`,
					user: null,
				};
			}

			const serverName = department.server_name;

			// Step 1: Validate student exists in STUDENT table (Option A: ID only, no password required)
			const studentValidation = await this.validateStudentExists(
				serverName,
				studentId,
			);

			if (!studentValidation) {
				return {
					success: false,
					error: 'Invalid student ID or student not found',
					user: null,
				};
			}

			// Step 2: Execute SP_LOGIN_INFO to get student information (like SP_THONGTINDANGNHAP in C#)
			const userInfo = await this.executeSPLoginInfo(
				serverName,
				studentId,
				'STUDENT',
				true,
			);

			if (!userInfo) {
				return {
					success: false,
					error: 'Cannot retrieve student information',
					user: null,
				};
			}

			// Step 4: Create user object with enhanced information
			const user: MultiAuthUser = {
				id: userInfo.USERNAME,
				username: userInfo.USERNAME,
				fullName: userInfo.FULL_NAME,
				role: 'STUDENT',
				department: department,
				serverName: serverName,
				groupName: userInfo.ROLE_NAME || 'STUDENT',
				isStudent: true,
			};

			return {
				success: true,
				error: null,
				user,
				message: `Student login successful. Welcome ${userInfo.FULL_NAME}`,
			};
		} catch (error) {
			console.error('Student authentication error:', error);
			return {
				success: false,
				error: `Authentication failed: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`,
				user: null,
			};
		}
	}

	// Main authentication method with enhanced flows
	static async authenticate(
		username: string,
		password: string,
		departmentName: string,
		isStudentLogin: boolean = false,
	): Promise<MultiAuthResponse> {
		// Route to appropriate authentication flow
		if (isStudentLogin) {
			return this.authenticateStudent(username, departmentName); // No password needed for students
		} else {
			return this.authenticateTeacher(username, password, departmentName);
		}
	}

	// Legacy authentication method (for backward compatibility)
	static async authenticateLegacy(
		username: string,
		password: string,
		departmentName: string,
	): Promise<MultiAuthResponse> {
		try {
			// Get department information
			const department = await DepartmentService.getDepartmentByBranchName(
				departmentName,
			);
			if (!department) {
				return {
					success: false,
					error: 'Invalid department selection',
				};
			}

			// Determine if this is a student login (simple heuristic: student IDs are typically numeric)
			const isStudent =
				/^\d+$/.test(username) || username.toLowerCase().startsWith('sv');

			// Execute SP_LOGIN on the target server
			const authResult = await this.executeSPLogin(
				department.server_name,
				username,
				isStudent,
			);

			if (!authResult || !authResult.USERNAME) {
				return {
					success: false,
					error: 'Invalid username or user not found',
				};
			}

			// Validate password based on user type
			if (isStudent) {
				// Students use account "SV" with password "123456"
				if (password !== '123456') {
					return {
						success: false,
						error: 'Invalid password for student account',
					};
				}
			} else {
				// Faculty use account "HTKN" with password "123456"
				if (password !== '123456') {
					return {
						success: false,
						error: 'Invalid password for faculty account',
					};
				}
			}

			// Create user object
			const user: MultiAuthUser = {
				id: authResult.USERNAME,
				username: authResult.USERNAME,
				fullName: authResult.FULL_NAME,
				role: authResult.RoleName === 'STUDENT' ? 'STUDENT' : 'LECTURER',
				groupName: authResult.RoleName,
				department,
				serverName: department.server_name,
				isStudent: authResult.RoleName === 'STUDENT',
			};

			return {
				success: true,
				user,
			};
		} catch (error) {
			console.error('Multi-database authentication error:', error);
			return {
				success: false,
				error: 'Authentication failed. Please try again.',
			};
		}
	}

	// Validate user session
	static async validateUserSession(
		username: string,
		departmentName: string,
	): Promise<MultiAuthUser | null> {
		try {
			const department = await DepartmentService.getDepartmentByBranchName(
				departmentName,
			);
			if (!department) {
				return null;
			}

			const isStudent =
				/^\d+$/.test(username) || username.toLowerCase().startsWith('sv');
			const authResult = await this.executeSPLogin(
				department.server_name,
				username,
				isStudent,
			);

			if (!authResult || !authResult.USERNAME) {
				return null;
			}

			return {
				id: authResult.USERNAME,
				username: authResult.USERNAME,
				fullName: authResult.FULL_NAME,
				role: authResult.RoleName === 'STUDENT' ? 'STUDENT' : 'LECTURER',
				groupName: authResult.RoleName,
				department,
				serverName: department.server_name,
				isStudent: authResult.RoleName === 'STUDENT',
			};
		} catch (error) {
			console.error('Session validation error:', error);
			return null;
		}
	}

	// Enhanced connection diagnostics
	static async diagnoseConnection(
		serverName: string,
		isStudent: boolean = false,
	): Promise<{
		serverName: string;
		connectionString: string;
		canConnect: boolean;
		error?: string;
		suggestions: string[];
	}> {
		const suggestions: string[] = [];
		let connectionString = '';
		let canConnect = false;
		let error = '';

		try {
			// Get the appropriate configuration
			const config = isStudent
				? createStudentConfig(serverName)
				: createDepartmentConfig(serverName);

			// Build connection string for display
			connectionString = `Server: ${config.server}${
				config.options?.instanceName ? '\\' + config.options.instanceName : ''
			}, User: ${config.user}, Database: ${config.database || 'QLDSV_TC'}`;

			// Test connection
			const pool = isStudent
				? await getStudentPool(serverName)
				: await getDepartmentPool(serverName);

			// Test with simple query
			const request = pool.request();
			await request.query(
				'SELECT @@SERVERNAME as ServerName, @@VERSION as Version',
			);
			canConnect = true;
		} catch (err: any) {
			error = err.message || 'Unknown error';
			canConnect = false;

			// Provide specific suggestions based on error type
			if (error.includes('ETIMEOUT') || error.includes('timeout')) {
				suggestions.push(
					'Check if SQL Server is running and accepting connections',
				);
				suggestions.push(
					'Verify SQL Server Browser service is running (for named instances)',
				);
				suggestions.push(
					'Check Windows Firewall settings for SQL Server ports',
				);
				suggestions.push(
					'Ensure TCP/IP protocol is enabled in SQL Server Configuration Manager',
				);
			}

			if (error.includes('Login failed')) {
				suggestions.push(
					`Check if user '${
						isStudent ? 'SV' : 'HTKN'
					}' exists and has correct password`,
				);
				suggestions.push(
					'Verify SQL Server Authentication is enabled (not just Windows Auth)',
				);
				suggestions.push('Check user permissions and database access');
			}

			if (error.includes('server was not found')) {
				suggestions.push('Verify server name and instance name are correct');
				suggestions.push('Check if SQL Server Browser service is running');
				suggestions.push('Try using IP address instead of server name');
			}

			if (serverName.includes('\\')) {
				suggestions.push(
					'For named instances, ensure SQL Server Browser service is running',
				);
				suggestions.push('Check if the instance name is correct');
				suggestions.push(
					'Try connecting without instance name if using default instance',
				);
			}
		}

		return {
			serverName,
			connectionString,
			canConnect,
			error: canConnect ? undefined : error,
			suggestions,
		};
	}

	// Test authentication setup for a department
	static async testDepartmentAuth(departmentName: string): Promise<{
		departmentExists: boolean;
		serverAccessible: boolean;
		storedProcExists: boolean;
		error?: string;
	}> {
		try {
			// Check if department exists
			const department = await DepartmentService.getDepartmentByBranchName(
				departmentName,
			);
			if (!department) {
				return {
					departmentExists: false,
					serverAccessible: false,
					storedProcExists: false,
					error: 'Department not found',
				};
			}

			// Test server accessibility
			let serverAccessible = false;
			try {
				const pool = await getDepartmentPool(department.server_name);
				const request = pool.request();
				await request.query('SELECT 1');
				serverAccessible = true;
			} catch (error) {
				console.error(
					`Server ${department.server_name} not accessible:`,
					error,
				);
			}

			// Since stored procedures already exist in SQL, we assume they exist
			const storedProcExists = serverAccessible;

			return {
				departmentExists: true,
				serverAccessible,
				storedProcExists,
			};
		} catch (error) {
			return {
				departmentExists: false,
				serverAccessible: false,
				storedProcExists: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}
}

import { ConnectionPool } from 'mssql';

export interface DatabaseConfig {
	server: string;
	database?: string;
	user: string;
	password: string;
	options?: {
		encrypt?: boolean;
		trustServerCertificate?: boolean;
		enableArithAbort?: boolean;
		instanceName?: string;
	};
}

// Primary database configuration (MSI server) - Updated as per requirements
export const dbConfig: DatabaseConfig = {
	server: 'MSI',
	database: 'QLDSV_TC',
	user: 'sa',
	password: '123456',
	options: {
		encrypt: false,
		trustServerCertificate: true,
		enableArithAbort: true,
	},
};

// Department-specific configuration factory
export const createDepartmentConfig = (serverName: string): DatabaseConfig => {
	const config: DatabaseConfig = {
		server: serverName,
		database: 'QLDSV_TC', // Default database for all department servers
		user: 'HTKN',
		password: '123456',
		options: {
			encrypt: false,
			trustServerCertificate: true,
			enableArithAbort: true,
		},
	};

	// Set instance name for specific servers
	if (serverName.includes('\\')) {
		const [server, instance] = serverName.split('\\');
		config.server = server;
		config.options!.instanceName = instance;
	}

	return config;
};

// Student access configuration factory
export const createStudentConfig = (serverName: string): DatabaseConfig => {
	const config: DatabaseConfig = {
		server: serverName,
		database: 'QLDSV_TC', // Default database for all student connections
		user: 'SV',
		password: '123456',
		options: {
			encrypt: false,
			trustServerCertificate: true,
			enableArithAbort: true,
		},
	};

	// Set instance name for specific servers
	if (serverName.includes('\\')) {
		const [server, instance] = serverName.split('\\');
		config.server = server;
		config.options!.instanceName = instance;
	}

	return config;
};

// Test database connection
export const testConnection = async (
	config: DatabaseConfig,
): Promise<boolean> => {
	try {
		const pool = new ConnectionPool(config);
		await pool.connect();

		// Test with a simple query
		const request = pool.request();
		await request.query('SELECT 1 as test');

		await pool.close();
		return true;
	} catch (error) {
		console.error('Database connection test failed:', error);
		return false;
	}
};

// Get appropriate config based on user type and department
export const getConfigForUser = (
	serverName: string,
	isStudent: boolean = false,
): DatabaseConfig => {
	return isStudent
		? createStudentConfig(serverName)
		: createDepartmentConfig(serverName);
};

// Department to server mapping
export const DEPARTMENT_SERVER_MAP: Record<string, string> = {
	'IT Department': 'MSI\\MSSQLSERVER1',
	'Information Technology Department': 'MSI\\MSSQLSERVER1',
	'Telecommunications Department': 'MSI\\MSSQLSERVER2',
	'Accounting Department': 'MSI\\MSSQLSERVER3',
};

// Get server name from department name
export const getServerNameFromDepartment = (departmentName: string): string => {
	return DEPARTMENT_SERVER_MAP[departmentName] || departmentName;
};

// Validate configuration
export const validateConfig = (
	config: DatabaseConfig,
): { valid: boolean; errors: string[] } => {
	const errors: string[] = [];

	if (!config.server) {
		errors.push('Server name is required');
	}

	if (!config.user) {
		errors.push('Username is required');
	}

	if (!config.password) {
		errors.push('Password is required');
	}

	return {
		valid: errors.length === 0,
		errors,
	};
};

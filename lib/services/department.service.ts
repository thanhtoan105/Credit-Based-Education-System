import { getPrimaryPool } from '../multi-database';

// Department interface based on VIEW_FRAGMENT_LIST
export interface Department {
	branch_name: string;
	server_name: string;
}

// Department service for handling department-related operations
export class DepartmentService {
	// Get all departments from VIEW_FRAGMENT_LIST on primary server
	static async getDepartments(): Promise<Department[]> {
		try {
			const pool = await getPrimaryPool();
			const request = pool.request();

			// Use the exact SQL query as requested: SELECT * FROM VIEW_FRAGMENT_LIST
			const query = `SELECT * FROM VIEW_FRAGMENT_LIST ORDER BY BRANCH_NAME`;

			const result = await request.query<{
				BRANCH_NAME: string;
				SERVER_NAME: string;
			}>(query);

			// Map the result to our Department interface
			return (result.recordset || []).map((row) => ({
				branch_name: row.BRANCH_NAME,
				server_name: row.SERVER_NAME,
			}));
		} catch (error) {
			console.error(
				'Error fetching departments from VIEW_FRAGMENT_LIST:',
				error,
			);

			// No fallback - database must be properly configured
			throw new Error(
				`Cannot access departments: ${
					error instanceof Error ? error.message : 'Unknown database error'
				}`,
			);
		}
	}

	// Get department by server name
	static async getDepartmentByServerName(
		serverName: string,
	): Promise<Department | null> {
		try {
			const departments = await this.getDepartments();
			return (
				departments.find((dept) => dept.server_name === serverName) || null
			);
		} catch (error) {
			console.error('Error finding department by server name:', error);
			return null;
		}
	}

	// Get department by branch name
	static async getDepartmentByBranchName(
		branchName: string,
	): Promise<Department | null> {
		try {
			const departments = await this.getDepartments();
			return (
				departments.find((dept) => dept.branch_name === branchName) || null
			);
		} catch (error) {
			console.error('Error finding department by branch name:', error);
			return null;
		}
	}

	// Test if VIEW_FRAGMENT_LIST exists and is accessible
	static async testViewAccess(): Promise<{
		exists: boolean;
		accessible: boolean;
		error?: string;
	}> {
		try {
			const pool = await getPrimaryPool();
			const request = pool.request();

			// First check if the view exists
			const checkViewQuery = `
        SELECT COUNT(*) as view_count
        FROM INFORMATION_SCHEMA.VIEWS 
        WHERE TABLE_NAME = 'VIEW_FRAGMENT_LIST'
      `;

			const viewResult = await request.query(checkViewQuery);
			const viewExists = viewResult.recordset[0]?.view_count > 0;

			if (!viewExists) {
				return {
					exists: false,
					accessible: false,
					error: 'VIEW_FRAGMENT_LIST does not exist',
				};
			}

			// Test if we can query the view
			const testQuery = 'SELECT TOP 1 * FROM VIEW_FRAGMENT_LIST';
			await request.query(testQuery);

			return { exists: true, accessible: true };
		} catch (error) {
			console.error('Error testing VIEW_FRAGMENT_LIST access:', error);
			return {
				exists: false,
				accessible: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	// Create VIEW_FRAGMENT_LIST if it doesn't exist (for development/testing)
	static async createViewIfNotExists(): Promise<{
		success: boolean;
		message: string;
	}> {
		try {
			const pool = await getPrimaryPool();
			const request = pool.request();

			const createViewQuery = `
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_NAME = 'VIEW_FRAGMENT_LIST')
        BEGIN
          EXEC('
            CREATE VIEW VIEW_FRAGMENT_LIST AS
            SELECT  
              BRANCH_NAME = PUBS.description, 
              SERVER_NAME = subscriber_server
            FROM 
              dbo.sysmergepublications PUBS,  
              dbo.sysmergesubscriptions SUBS
            WHERE 
              PUBS.pubid = SUBS.PUBID  
              AND PUBS.publisher <> SUBS.subscriber_server
          ')
        END
      `;

			await request.query(createViewQuery);

			return {
				success: true,
				message: 'VIEW_FRAGMENT_LIST created or already exists',
			};
		} catch (error) {
			console.error('Error creating VIEW_FRAGMENT_LIST:', error);
			return {
				success: false,
				message:
					error instanceof Error ? error.message : 'Failed to create view',
			};
		}
	}

	// Validate department selection
	static async validateDepartment(
		branchName: string,
		serverName: string,
	): Promise<boolean> {
		try {
			const departments = await this.getDepartments();
			return departments.some(
				(dept) =>
					dept.branch_name === branchName && dept.server_name === serverName,
			);
		} catch (error) {
			console.error('Error validating department:', error);
			return false;
		}
	}

	// Get formatted departments for UI dropdown
	static async getDepartmentsForDropdown(): Promise<
		Array<{ value: string; label: string; serverName: string }>
	> {
		try {
			const departments = await this.getDepartments();
			return departments.map((dept) => ({
				value: dept.branch_name,
				label: dept.branch_name,
				serverName: dept.server_name,
			}));
		} catch (error) {
			console.error('Error formatting departments for dropdown:', error);

			// No fallback - throw error to force proper database setup
			throw new Error(
				`Cannot load departments for dropdown: ${
					error instanceof Error ? error.message : 'Database error'
				}`,
			);
		}
	}
}

import { NextRequest, NextResponse } from 'next/server';
import { DepartmentService } from '@/lib/services/department.service';
import { MultiAuthService } from '@/lib/services/multi-auth.service';
import { getPrimaryPool, getDepartmentPool } from '@/lib/multi-database';

interface SetupResult {
	step: string;
	success: boolean;
	message: string;
	error?: string;
}

export async function POST(request: NextRequest) {
	const results: SetupResult[] = [];

	try {
		// Step 1: Test primary database connection
		results.push(await testPrimaryConnection());

		// Step 2: Create/test VIEW_FRAGMENT_LIST
		results.push(await setupViewFragmentList());

		// Step 3: Get departments (this will use real data now)
		const departmentsResult = await getDepartments();
		results.push(departmentsResult);

		// Stored procedures already exist in SQL, no need to create them

		const allSuccess = results.every((r) => r.success);

		return NextResponse.json({
			success: allSuccess,
			message: allSuccess
				? 'Database setup completed successfully'
				: 'Some setup steps failed',
			results,
		});
	} catch (error) {
		console.error('Database setup error:', error);

		return NextResponse.json(
			{
				success: false,
				error: 'Setup failed with unexpected error',
				results,
			},
			{ status: 500 },
		);
	}
}

async function testPrimaryConnection(): Promise<SetupResult> {
	try {
		const pool = await getPrimaryPool();
		const request = pool.request();
		await request.query('SELECT 1 as test');

		return {
			step: 'Primary Database Connection',
			success: true,
			message: 'Connected to MSI server successfully',
		};
	} catch (error) {
		return {
			step: 'Primary Database Connection',
			success: false,
			message: 'Failed to connect to MSI server',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

async function setupViewFragmentList(): Promise<SetupResult> {
	try {
		// First check if it exists
		const viewTest = await DepartmentService.testViewAccess();

		if (viewTest.accessible) {
			return {
				step: 'VIEW_FRAGMENT_LIST Setup',
				success: true,
				message: 'VIEW_FRAGMENT_LIST already exists and is accessible',
			};
		}

		// Try to create it
		const createResult = await DepartmentService.createViewIfNotExists();

		if (createResult.success) {
			// Test again after creation
			const testAfterCreate = await DepartmentService.testViewAccess();

			if (testAfterCreate.accessible) {
				return {
					step: 'VIEW_FRAGMENT_LIST Setup',
					success: true,
					message: 'VIEW_FRAGMENT_LIST created and tested successfully',
				};
			}
		}

		return {
			step: 'VIEW_FRAGMENT_LIST Setup',
			success: false,
			message: 'Failed to create or access VIEW_FRAGMENT_LIST',
			error: createResult.message,
		};
	} catch (error) {
		return {
			step: 'VIEW_FRAGMENT_LIST Setup',
			success: false,
			message: 'Error setting up VIEW_FRAGMENT_LIST',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

async function getDepartments(): Promise<SetupResult> {
	try {
		// Get departments from database (no fallback)
		const pool = await getPrimaryPool();
		const request = pool.request();

		const query = `
      SELECT  
        BRANCH_NAME = PUBS.description, 
        SERVER_NAME = subscriber_server
      FROM 
        dbo.sysmergepublications PUBS,  
        dbo.sysmergesubscriptions SUBS
      WHERE 
        PUBS.pubid = SUBS.PUBID  
        AND PUBS.publisher <> SUBS.subscriber_server
      ORDER BY PUBS.description
    `;

		const result = await request.query(query);
		const departments = result.recordset || [];

		if (departments.length === 0) {
			return {
				step: 'Load Departments',
				success: false,
				message: 'No departments found in VIEW_FRAGMENT_LIST',
				error: 'Database may not be properly configured with merge replication',
			};
		}

		return {
			step: 'Load Departments',
			success: true,
			message: JSON.stringify(departments),
		};
	} catch (error) {
		return {
			step: 'Load Departments',
			success: false,
			message: 'Failed to load departments from database',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function GET(request: NextRequest) {
	return NextResponse.json({
		message: 'Database Setup API',
		description: 'POST to this endpoint to initialize database setup',
		steps: [
			'1. Test primary database connection',
			'2. Create/test VIEW_FRAGMENT_LIST',
			'3. Load departments from database',
			'4. Setup SP_LOGIN on department servers',
		],
	});
}

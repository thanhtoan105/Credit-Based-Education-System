import { NextRequest, NextResponse } from 'next/server';
import { DepartmentService } from '@/lib/services/department.service';
import { MultiAuthService } from '@/lib/services/multi-auth.service';
import { multiDb, testDepartmentConnection } from '@/lib/multi-database';

export async function GET(request: NextRequest) {
	try {
		const testResults = {
			timestamp: new Date().toISOString(),
			primaryConnection: false,
			departments: [] as any[],
			viewAccess: null as any,
			departmentTests: [] as any[],
		};

		// Test primary connection
		try {
			const primaryPool = await multiDb.getPrimaryPool();
			const request = primaryPool.request();
			await request.query('SELECT 1 as test');
			testResults.primaryConnection = true;
		} catch (error) {
			console.error('Primary connection test failed:', error);
		}

		// Test VIEW_FRAGMENT_LIST access
		testResults.viewAccess = await DepartmentService.testViewAccess();

		// Get departments
		try {
			testResults.departments = await DepartmentService.getDepartments();
		} catch (error) {
			console.error('Error getting departments:', error);
			testResults.departments = [];
		}

		// Test each department connection and authentication setup
		for (const dept of testResults.departments) {
			const deptTest = {
				department: dept.branch_name,
				serverName: dept.server_name,
				connectionTest: false,
				authTest: null as any,
			};

			// Test connection
			try {
				deptTest.connectionTest = await testDepartmentConnection(
					dept.server_name,
				);
			} catch (error) {
				console.error(`Connection test failed for ${dept.server_name}:`, error);
			}

			// Test authentication setup
			try {
				deptTest.authTest = await MultiAuthService.testDepartmentAuth(
					dept.branch_name,
				);
			} catch (error) {
				console.error(`Auth test failed for ${dept.branch_name}:`, error);
				deptTest.authTest = {
					departmentExists: false,
					serverAccessible: false,
					storedProcExists: false,
					error: error instanceof Error ? error.message : 'Unknown error',
				};
			}

			testResults.departmentTests.push(deptTest);
		}

		return NextResponse.json({
			success: true,
			testResults,
		});
	} catch (error) {
		console.error('Multi-database test error:', error);

		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Test failed',
				testResults: null,
			},
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { action, departmentName, serverName } = body;

		if (action === 'create-view') {
			const result = await DepartmentService.createViewIfNotExists();
			return NextResponse.json({
				success: result.success,
				message: result.message,
			});
		}

		if (action === 'create-stored-proc' && departmentName && serverName) {
			return NextResponse.json({
				success: true,
				message: 'Stored procedures already exist in SQL database',
			});
		}

		if (action === 'test-auth' && departmentName) {
			const result = await MultiAuthService.testDepartmentAuth(departmentName);
			return NextResponse.json({
				success: true,
				authTest: result,
			});
		}

		if (action === 'test-connection' && serverName) {
			const result = await testDepartmentConnection(serverName);
			return NextResponse.json({
				success: true,
				connectionTest: result,
			});
		}

		return NextResponse.json(
			{
				success: false,
				error: 'Invalid action',
			},
			{ status: 400 },
		);
	} catch (error) {
		console.error('Multi-database test POST error:', error);

		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Operation failed',
			},
			{ status: 500 },
		);
	}
}

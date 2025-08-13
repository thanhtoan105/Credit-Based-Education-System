import { NextRequest, NextResponse } from 'next/server';
import { DepartmentService } from '@/lib/services/department.service';

export async function GET(request: NextRequest) {
	try {
		// Get departments from VIEW_FRAGMENT_LIST using: SELECT * FROM VIEW_FRAGMENT_LIST
		const departments = await DepartmentService.getDepartmentsForDropdown();

		return NextResponse.json({
			success: true,
			departments,
			message: `Loaded ${departments.length} departments from VIEW_FRAGMENT_LIST`,
			query: 'SELECT * FROM VIEW_FRAGMENT_LIST ORDER BY BRANCH_NAME',
		});
	} catch (error) {
		console.error('Departments API error:', error);

		return NextResponse.json(
			{
				success: false,
				error: `Failed to fetch departments from VIEW_FRAGMENT_LIST: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`,
				departments: [],
				query: 'SELECT * FROM VIEW_FRAGMENT_LIST ORDER BY BRANCH_NAME',
			},
			{ status: 500 },
		);
	}
}

// Test endpoint for department setup
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { action, departmentName } = body;

		if (action === 'test-view') {
			const viewTest = await DepartmentService.testViewAccess();
			return NextResponse.json({
				success: true,
				viewTest,
			});
		}

		if (action === 'create-view') {
			const createResult = await DepartmentService.createViewIfNotExists();
			return NextResponse.json({
				success: createResult.success,
				message: createResult.message,
			});
		}

		if (action === 'validate-department' && departmentName) {
			const departments = await DepartmentService.getDepartments();
			const isValid = departments.some(
				(dept) => dept.branch_name === departmentName,
			);

			return NextResponse.json({
				success: true,
				isValid,
				departments,
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
		console.error('Departments POST API error:', error);

		return NextResponse.json(
			{
				success: false,
				error: 'Operation failed',
			},
			{ status: 500 },
		);
	}
}

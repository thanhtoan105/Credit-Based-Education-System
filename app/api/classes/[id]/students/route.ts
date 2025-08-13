import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentPool } from '@/lib/multi-database';
import { DepartmentService } from '@/lib/services/department.service';

interface RouteParams {
	params: Promise<{
		id: string;
	}>;
}

// GET - Check if class has students
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const { searchParams } = new URL(request.url);
		const departmentName = searchParams.get('department');
		const resolvedParams = await params;
		const classId = resolvedParams.id;

		if (!departmentName) {
			return NextResponse.json({
				success: false,
				error: 'Department parameter is required',
			});
		}

		// Get department information
		const department = await DepartmentService.getDepartmentByBranchName(
			departmentName,
		);
		if (!department) {
			return NextResponse.json({
				success: false,
				error: `Department "${departmentName}" not found`,
			});
		}

		// Connect to the department's server
		const pool = await getDepartmentPool(department.server_name);
		const request_db = pool.request();

		// Check if class has students and get their details using underlying SINHVIEN table
		const studentQuery = `
			SELECT
				STUDENT_ID,
				FULL_NAME
			FROM STUDENT
			WHERE CLASS_ID = @classId
			ORDER BY FIRST_NAME, LAST_NAME
		`;

		const result = await request_db
			.input('classId', classId)
			.query(studentQuery);

		const students = result.recordset || [];
		const hasStudents = students.length > 0;

		return NextResponse.json({
			success: true,
			hasStudents,
			studentCount: students.length,
			students,
		});
	} catch (error) {
		console.error('Error checking class students:', error);
		return NextResponse.json({
			success: false,
			error:
				error instanceof Error
					? error.message
					: 'Failed to check class students',
		});
	}
}

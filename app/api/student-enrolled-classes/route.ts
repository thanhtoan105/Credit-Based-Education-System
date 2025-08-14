import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentPool } from '@/lib/multi-database';
import { DepartmentService } from '@/lib/services/department.service';

interface EnrolledClassData {
	CREDIT_CLASS_ID: number;
	ACADEMIC_YEAR: string;
	SEMESTER: number;
	SUBJECT_NAME: string;
	LECTURER_NAME: string;
	GROUP: number;
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const departmentName = searchParams.get('department');
		const studentId = searchParams.get('studentId');
		const academicYear = searchParams.get('academicYear');
		const semester = searchParams.get('semester');
		const facultyId = searchParams.get('facultyId');

		if (!departmentName) {
			return NextResponse.json({
				success: false,
				error: 'Department parameter is required',
			});
		}

		if (!studentId || !academicYear || !semester || !facultyId) {
			return NextResponse.json({
				success: false,
				error: 'StudentId, academicYear, semester, and facultyId parameters are required',
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

		// Execute SP_STUDENT_ENROLLED_CREDIT_CLASSES stored procedure
		const result = await request_db
			.input('StudentID', studentId)
			.input('AcademicYear', academicYear)
			.input('Semester', parseInt(semester))
			.input('FacultyID', facultyId)
			.execute('SP_STUDENT_ENROLLED_CREDIT_CLASSES');

		return NextResponse.json({
			success: true,
			enrolledClasses: result.recordset || [],
			department: department.branch_name,
			serverName: department.server_name,
		});
	} catch (error) {
		console.error('Error fetching enrolled classes:', error);
		return NextResponse.json({
			success: false,
			error:
				error instanceof Error
					? error.message
					: 'Failed to fetch enrolled classes',
		});
	}
}

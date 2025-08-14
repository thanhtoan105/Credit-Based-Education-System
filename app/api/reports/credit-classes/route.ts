import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentPool } from '@/lib/multi-database';
import { DepartmentService } from '@/lib/services/department.service';

interface CreditClassReportData {
	CREDIT_CLASS_ID: number;
	ACADEMIC_YEAR: string;
	SEMESTER: number;
	SUBJECT_ID: string;
	SUBJECT_NAME: string;
	GROUP_NUMBER: number;
	LECTURER_ID: string;
	LECTURER_NAME: string;
	FACULTY_ID: string;
	MIN_STUDENTS: number;
	CANCELED_CLASS: boolean;
	REGISTERED_STUDENTS?: number;
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const departmentName = searchParams.get('department');
		const academicYear = searchParams.get('academicYear');
		const semester = searchParams.get('semester');

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

		// Build query with optional filters
		let query = `
			SELECT 
				cc.CREDIT_CLASS_ID,
				cc.ACADEMIC_YEAR,
				cc.SEMESTER,
				cc.SUBJECT_ID,
				s.SUBJECT_NAME,
				cc.GROUP_NUMBER,
				cc.LECTURER_ID,
				l.LAST_NAME + ' ' + l.FIRST_NAME AS LECTURER_NAME,
				cc.FACULTY_ID,
				cc.MIN_STUDENTS,
				cc.CANCELED_CLASS,
				(SELECT COUNT(*) FROM ENROLLMENT e WHERE e.CREDIT_CLASS_ID = cc.CREDIT_CLASS_ID) AS REGISTERED_STUDENTS
			FROM CREDIT_CLASS cc
			LEFT JOIN SUBJECT s ON cc.SUBJECT_ID = s.SUBJECT_ID
			LEFT JOIN LECTURER l ON cc.LECTURER_ID = l.LECTURER_ID
			WHERE 1=1
		`;

		// Add filters if provided
		if (academicYear) {
			query += ` AND cc.ACADEMIC_YEAR = @academicYear`;
			request_db.input('academicYear', academicYear);
		}

		if (semester) {
			query += ` AND cc.SEMESTER = @semester`;
			request_db.input('semester', parseInt(semester));
		}

		query += ` ORDER BY cc.ACADEMIC_YEAR DESC, cc.SEMESTER, s.SUBJECT_NAME, cc.GROUP_NUMBER`;

		const result = await request_db.query<CreditClassReportData>(query);

		return NextResponse.json({
			success: true,
			creditClasses: result.recordset || [],
			department: department.branch_name,
			serverName: department.server_name,
			filters: {
				academicYear,
				semester,
			},
		});
	} catch (error) {
		console.error('Error fetching credit classes report:', error);
		return NextResponse.json({
			success: false,
			error:
				error instanceof Error
					? error.message
					: 'Failed to fetch credit classes report',
		});
	}
}

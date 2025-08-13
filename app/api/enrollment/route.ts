import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentPool } from '@/lib/multi-database';
import { DepartmentService } from '@/lib/services/department.service';

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const department = searchParams.get('department');
		const academicYear = searchParams.get('academicYear');
		const semester = searchParams.get('semester');
		const group = searchParams.get('group');
		const subject = searchParams.get('subject');

		if (!department || !academicYear || !semester || !group || !subject) {
			return NextResponse.json(
				{
					success: false,
					error:
						'All parameters are required: department, academicYear, semester, group, subject',
				},
				{ status: 400 },
			);
		}

		// Get department information
		const departmentInfo = await DepartmentService.getDepartmentByBranchName(
			department,
		);
		if (!departmentInfo) {
			return NextResponse.json(
				{ success: false, error: 'Invalid department' },
				{ status: 400 },
			);
		}

		// Connect to the department's server
		const pool = await getDepartmentPool(departmentInfo.server_name);
		const request = pool.request();

		// Call SP_ENROLLMENT_LIST_BY_SUBJECT stored procedure with correct parameter names
		console.log('Calling SP_ENROLLMENT_LIST_BY_SUBJECT with parameters:', {
			AcademicYear: academicYear,
			Semester: parseInt(semester),
			GroupNumber: parseInt(group),
			SubjectID: subject,
		});

		const result = await request
			.input('AcademicYear', academicYear)
			.input('Semester', parseInt(semester))
			.input('GroupNumber', parseInt(group))
			.input('SubjectID', subject)
			.execute('SP_ENROLLMENT_LIST_BY_SUBJECT');

		const enrollmentList = result.recordset.map((row: any) => ({
			creditClassId: row.CREDIT_CLASS_ID, // Include CREDIT_CLASS_ID for updates
			studentId: row.STUDENT_ID,
			studentName: row.FULL_NAME,
			subjectCode: subject, // Use the subject parameter since it's not returned by the SP
			subjectName: '', // Will be filled from subjects data on frontend
			attendanceGrade: row.ATTENDANCE_SCORE || 0,
			midtermGrade: row.MIDTERM_SCORE || 0,
			finalGrade: row.FINAL_SCORE || 0,
			overallGrade: row.TOTAL_SCORE || 0,
		}));

		return NextResponse.json({
			success: true,
			enrollmentList,
		});
	} catch (error) {
		console.error('Error fetching enrollment list:', error);
		return NextResponse.json(
			{ success: false, error: 'Failed to fetch enrollment list' },
			{ status: 500 },
		);
	}
}

import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentPool } from '@/lib/multi-database';
import { DepartmentService } from '@/lib/services/department.service';
import sql from 'mssql';

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

// POST - Enroll student in credit class using SP_ENROLLMENT_MANAGEMENT
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { departmentName, studentId, creditClassId } = body;

		if (!departmentName || !studentId || !creditClassId) {
			return NextResponse.json({
				success: false,
				error:
					'Department, studentId, and creditClassId parameters are required',
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

		// First, get all current active enrollments for this student
		const queryRequest = pool.request();
		const currentEnrollmentsQuery = `
			SELECT CREDIT_CLASS_ID, STUDENT_ID
			FROM ENROLLMENT
			WHERE STUDENT_ID = @StudentId
			AND (CANCELED_ENROLLMENT = 'FALSE' OR CANCELED_ENROLLMENT IS NULL)
		`;

		const currentEnrollmentsResult = await queryRequest
			.input('StudentId', sql.NVarChar(10), studentId)
			.query(currentEnrollmentsQuery);

		// Add the new enrollment record (if not already present)
		const isAlreadyEnrolled = currentEnrollmentsResult.recordset.some(
			(enrollment: any) => enrollment.CREDIT_CLASS_ID === creditClassId,
		);

		if (isAlreadyEnrolled) {
			return NextResponse.json({
				success: false,
				error: 'Student is already enrolled in this class',
			});
		}

		// Create table-valued parameter for enrollment data
		const enrollmentTable = new sql.Table('TYPE_UPDATE_ENROLLMENT');
		enrollmentTable.columns.add('CREDIT_CLASS_ID', sql.Int);
		enrollmentTable.columns.add('STUDENT_ID', sql.NVarChar(10));

		// Add all current active enrollments to maintain them
		currentEnrollmentsResult.recordset.forEach((enrollment: any) => {
			enrollmentTable.rows.add(
				enrollment.CREDIT_CLASS_ID,
				enrollment.STUDENT_ID,
			);
		});

		// Add the new enrollment record
		enrollmentTable.rows.add(creditClassId, studentId);

		// Execute SP_ENROLLMENT_MANAGEMENT stored procedure with all enrollments
		const spRequest = pool.request();
		await spRequest
			.input('StudentID', sql.NVarChar(10), studentId)
			.input('EnrollmentData', enrollmentTable)
			.execute('SP_ENROLLMENT_MANAGEMENT');

		return NextResponse.json({
			success: true,
			message: 'Enrollment successful',
			department: department.branch_name,
			serverName: department.server_name,
		});
	} catch (error) {
		console.error('Error processing enrollment:', error);
		return NextResponse.json({
			success: false,
			error:
				error instanceof Error ? error.message : 'Failed to process enrollment',
		});
	}
}

// DELETE - Cancel specific student enrollment using SP_ENROLLMENT_MANAGEMENT
export async function DELETE(request: NextRequest) {
	try {
		const body = await request.json();
		const { departmentName, studentId, creditClassId } = body;

		if (!departmentName || !studentId || !creditClassId) {
			return NextResponse.json({
				success: false,
				error:
					'Department, studentId, and creditClassId parameters are required',
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

		// First, get all current active enrollments for this student
		const queryRequest = pool.request();
		const currentEnrollmentsQuery = `
			SELECT CREDIT_CLASS_ID, STUDENT_ID
			FROM ENROLLMENT
			WHERE STUDENT_ID = @StudentId
			AND (CANCELED_ENROLLMENT = 'FALSE' OR CANCELED_ENROLLMENT IS NULL)
		`;

		const currentEnrollmentsResult = await queryRequest
			.input('StudentId', sql.NVarChar(10), studentId)
			.query(currentEnrollmentsQuery);

		// Create table-valued parameter for enrollment data
		const enrollmentTable = new sql.Table('TYPE_UPDATE_ENROLLMENT');
		enrollmentTable.columns.add('CREDIT_CLASS_ID', sql.Int);
		enrollmentTable.columns.add('STUDENT_ID', sql.NVarChar(10));

		// Add all current active enrollments EXCEPT the one to be cancelled
		currentEnrollmentsResult.recordset.forEach((enrollment: any) => {
			if (enrollment.CREDIT_CLASS_ID !== creditClassId) {
				enrollmentTable.rows.add(
					enrollment.CREDIT_CLASS_ID,
					enrollment.STUDENT_ID,
				);
			}
		});

		// Execute SP_ENROLLMENT_MANAGEMENT stored procedure
		// This will keep all enrollments in the table and cancel the one not included
		const spRequest = pool.request();
		await spRequest
			.input('StudentID', sql.NVarChar(10), studentId)
			.input('EnrollmentData', enrollmentTable)
			.execute('SP_ENROLLMENT_MANAGEMENT');

		return NextResponse.json({
			success: true,
			message: 'Enrollment cancelled successfully',
			department: department.branch_name,
			serverName: department.server_name,
		});
	} catch (error) {
		console.error('Error cancelling enrollment:', error);
		return NextResponse.json({
			success: false,
			error:
				error instanceof Error ? error.message : 'Failed to cancel enrollment',
		});
	}
}

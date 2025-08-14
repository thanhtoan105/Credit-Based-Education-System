import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentPool } from '@/lib/multi-database';
import { DepartmentService } from '@/lib/services/department.service';

interface StudentEnrollmentData {
	CREDIT_CLASS_ID: number;
	STUDENT_ID: string;
	FULL_NAME?: string;
	LAST_NAME?: string;
	FIRST_NAME?: string;
	GENDER?: number;
	CLASS_ID?: string;
	ATTENDANCE_SCORE?: number;
	MIDTERM_SCORE?: number;
	FINAL_SCORE?: number;
	TOTAL_SCORE?: number;
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const departmentName = searchParams.get('department');
		const academicYear = searchParams.get('academicYear');
		const semester = searchParams.get('semester');
		const subjectId = searchParams.get('subjectId');
		const groupNumber = searchParams.get('groupNumber');

		if (
			!departmentName ||
			!academicYear ||
			!semester ||
			!subjectId ||
			!groupNumber
		) {
			return NextResponse.json({
				success: false,
				error:
					'All parameters are required: department, academicYear, semester, subjectId, groupNumber',
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

		// Get Faculty ID from database instead of hardcoded mapping
		let facultyId = 'IT'; // Default fallback
		try {
			const request_faculty = pool.request();

			// First try to find faculty by matching department name with faculty name
			const facultyQuery = `SELECT FACULTY_ID FROM FACULTY WHERE FACULTY_NAME = @departmentName`;
			request_faculty.input('departmentName', department.branch_name);
			const facultyResult = await request_faculty.query(facultyQuery);

			if (facultyResult.recordset.length > 0) {
				facultyId = facultyResult.recordset[0].FACULTY_ID;
			} else {
				// Fallback: get the first faculty ID from this department's database
				const fallbackQuery = `SELECT TOP 1 FACULTY_ID FROM FACULTY ORDER BY FACULTY_ID`;
				const fallbackResult = await pool.request().query(fallbackQuery);
				if (fallbackResult.recordset.length > 0) {
					facultyId = fallbackResult.recordset[0].FACULTY_ID;
				}
			}
		} catch (error) {
			console.warn('Error fetching faculty ID from database:', error);
			// Keep default fallback value
		}

		// Try to use stored procedure first, fallback to direct query if it fails
		let result: any;
		const request_db = pool.request();

		try {
			// Try the stored procedure first
			console.log(
				'Trying SP_STUDENT_ENROLLMENT_LIST_BY_CREDIT_CLASS with parameters:',
				{
					AcademicYear: academicYear,
					Semester: parseInt(semester),
					GroupNumber: parseInt(groupNumber),
					SubjectID: subjectId,
					FacultyID: facultyId,
				},
			);

			result = await request_db
				.input('AcademicYear', academicYear)
				.input('Semester', parseInt(semester))
				.input('GroupNumber', parseInt(groupNumber))
				.input('SubjectID', subjectId)
				.input('FacultyID', facultyId)
				.execute('SP_STUDENT_ENROLLMENT_LIST_BY_CREDIT_CLASS');
		} catch (spError) {
			console.warn('Stored procedure failed, trying direct query:', spError);

			// Fallback to direct SQL query
			const query = `
				SELECT
					e.CREDIT_CLASS_ID,
					e.STUDENT_ID,
					CONCAT(RTRIM(s.LAST_NAME), ' ', RTRIM(s.FIRST_NAME)) as FULL_NAME,
					s.LAST_NAME,
					s.FIRST_NAME,
					s.GENDER,
					s.CLASS_ID,
					e.ATTENDANCE_SCORE,
					e.MIDTERM_SCORE,
					e.FINAL_SCORE,
					e.TOTAL_SCORE
				FROM ENROLLMENT e
				INNER JOIN CREDIT_CLASS cc ON e.CREDIT_CLASS_ID = cc.CREDIT_CLASS_ID
				INNER JOIN STUDENT s ON e.STUDENT_ID = s.STUDENT_ID
				WHERE cc.ACADEMIC_YEAR = @academicYear
					AND cc.SEMESTER = @semester
					AND cc.GROUP_NUMBER = @groupNumber
					AND cc.SUBJECT_ID = @subjectId
					AND cc.FACULTY_ID = @facultyId
				ORDER BY s.LAST_NAME, s.FIRST_NAME
			`;

			const fallbackRequest = pool.request();
			result = await fallbackRequest
				.input('academicYear', academicYear)
				.input('semester', parseInt(semester))
				.input('groupNumber', parseInt(groupNumber))
				.input('subjectId', subjectId)
				.input('facultyId', facultyId)
				.query(query);
		}

		// Transform the data for the reports page with null checking
		const students = result.recordset.map((row: StudentEnrollmentData) => {
			const fullName =
				row.FULL_NAME ||
				`${row.LAST_NAME || ''} ${row.FIRST_NAME || ''}`.trim();
			const nameParts = fullName ? fullName.split(' ') : ['', ''];

			// Convert gender number to text (0 = Male, 1 = Female)
			let genderText = 'N/A';
			if (row.GENDER !== null && row.GENDER !== undefined) {
				const genderValue = Number(row.GENDER);
				if (genderValue === 0) {
					genderText = 'Male';
				} else if (genderValue === 1) {
					genderText = 'Female';
				}
			}

			return {
				id: row.STUDENT_ID || '',
				lastName:
					nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : fullName,
				firstName: nameParts.length > 1 ? nameParts.slice(-1)[0] : '',
				gender: genderText,
				classCode: row.CLASS_ID || 'N/A',
				creditClassId: row.CREDIT_CLASS_ID || 0,
				attendanceScore: row.ATTENDANCE_SCORE || 0,
				midtermScore: row.MIDTERM_SCORE || 0,
				finalScore: row.FINAL_SCORE || 0,
				totalScore: row.TOTAL_SCORE || 0,
			};
		});

		return NextResponse.json({
			success: true,
			students: students || [],
			department: department.branch_name,
			serverName: department.server_name,
			filters: {
				academicYear,
				semester,
				subjectId,
				groupNumber,
			},
		});
	} catch (error) {
		console.error('Error fetching class students report:', error);
		return NextResponse.json({
			success: false,
			error:
				error instanceof Error
					? error.message
					: 'Failed to fetch class students report',
		});
	}
}

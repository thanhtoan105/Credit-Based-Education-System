import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentPool } from '@/lib/multi-database';
import { DepartmentService } from '@/lib/services/department.service';

interface SubjectGradeData {
	CREDIT_CLASS_ID: number;
	STUDENT_ID: string;
	FULL_NAME?: string;
	LAST_NAME?: string;
	FIRST_NAME?: string;
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
			// Try SP_SUBJECT_GRADE_REPORT first - try with fewer parameters
			console.log('Trying SP_SUBJECT_GRADE_REPORT with basic parameters:', {
				AcademicYear: academicYear,
				Semester: parseInt(semester),
				SubjectID: subjectId,
			});

			result = await request_db
				.input('AcademicYear', academicYear)
				.input('Semester', parseInt(semester))
				.input('SubjectID', subjectId)
				.execute('SP_SUBJECT_GRADE_REPORT');
		} catch (spError) {
			console.warn(
				'SP_SUBJECT_GRADE_REPORT failed, trying with group parameter:',
				spError,
			);

			try {
				// Try with group parameter added
				const spRequest2 = pool.request();
				result = await spRequest2
					.input('AcademicYear', academicYear)
					.input('Semester', parseInt(semester))
					.input('SubjectID', subjectId)
					.input('GroupNumber', parseInt(groupNumber))
					.execute('SP_SUBJECT_GRADE_REPORT');
			} catch (spError2) {
				console.warn(
					'SP_SUBJECT_GRADE_REPORT failed with all parameter combinations, trying alternative stored procedure:',
					spError2,
				);

				try {
					// Fallback to SP_STUDENT_ENROLLMENT_LIST_BY_CREDIT_CLASS
					// Create a new request to avoid parameter conflicts
					const fallbackRequest = pool.request();
					result = await fallbackRequest
						.input('AcademicYear', academicYear)
						.input('Semester', parseInt(semester))
						.input('GroupNumber', parseInt(groupNumber))
						.input('SubjectID', subjectId)
						.input('FacultyID', facultyId)
						.execute('SP_STUDENT_ENROLLMENT_LIST_BY_CREDIT_CLASS');
				} catch (spError3) {
					console.warn(
						'Alternative stored procedure failed, using direct query:',
						spError3,
					);

					// Fallback to direct SQL query
					// Create a new request to avoid parameter conflicts
					const queryRequest = pool.request();
					const query = `
						SELECT
							e.CREDIT_CLASS_ID,
							e.STUDENT_ID,
							CONCAT(RTRIM(s.LAST_NAME), ' ', RTRIM(s.FIRST_NAME)) as FULL_NAME,
							s.LAST_NAME,
							s.FIRST_NAME,
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

					result = await queryRequest
						.input('academicYear', academicYear)
						.input('semester', parseInt(semester))
						.input('groupNumber', parseInt(groupNumber))
						.input('subjectId', subjectId)
						.input('facultyId', facultyId)
						.query(query);
				}
			}
		}

		// Calculate overall grade function (same as student-grades page)
		const calculateOverallGrade = (
			attendance: number,
			midterm: number,
			final: number,
		): number => {
			return (
				Math.round((attendance * 0.1 + midterm * 0.3 + final * 0.6) * 100) / 100
			);
		};

		// Transform the data for the grade report with proper formatting
		const grades = result.recordset.map((row: SubjectGradeData) => {
			const fullName =
				row.FULL_NAME ||
				`${row.LAST_NAME || ''} ${row.FIRST_NAME || ''}`.trim();
			const nameParts = fullName ? fullName.split(' ') : ['', ''];

			const attendance = row.ATTENDANCE_SCORE || 0;
			const midterm = row.MIDTERM_SCORE || 0;
			const finalExam = row.FINAL_SCORE || 0;

			// Auto-calculate total grade using the same formula as student-grades page
			// Overall Grade = Attendance × 10% + Midterm × 30% + Final × 60%
			const calculatedTotalGrade = calculateOverallGrade(
				attendance,
				midterm,
				finalExam,
			);

			// Use calculated grade if database total is 0 or missing, otherwise use database value
			const totalGrade =
				row.TOTAL_SCORE && row.TOTAL_SCORE > 0
					? row.TOTAL_SCORE
					: calculatedTotalGrade;

			return {
				studentId: row.STUDENT_ID || '',
				lastName:
					nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : fullName,
				firstName: nameParts.length > 1 ? nameParts.slice(-1)[0] : '',
				attendance,
				midterm,
				finalExam,
				totalGrade,
			};
		});

		return NextResponse.json({
			success: true,
			grades: grades || [],
			department: department.branch_name,
			serverName: department.server_name,
			filters: {
				academicYear,
				semester,
				subjectId,
				groupNumber,
				facultyId,
			},
		});
	} catch (error) {
		console.error('Error fetching subject grade report:', error);
		return NextResponse.json({
			success: false,
			error:
				error instanceof Error
					? error.message
					: 'Failed to fetch subject grade report',
		});
	}
}

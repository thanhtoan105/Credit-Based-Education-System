import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentPool } from '@/lib/multi-database';
import { DepartmentService } from '@/lib/services/department.service';

interface StudentGradeData {
	CREDIT_CLASS_ID: number;
	STUDENT_ID: string;
	SUBJECT_ID: string;
	SUBJECT_NAME: string;
	ATTENDANCE_SCORE?: number;
	MIDTERM_SCORE?: number;
	FINAL_SCORE?: number;
	TOTAL_SCORE?: number;
	ACADEMIC_YEAR?: string;
	SEMESTER?: number;
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const departmentName = searchParams.get('department');
		const studentId = searchParams.get('studentId');

		if (!departmentName || !studentId) {
			return NextResponse.json({
				success: false,
				error: 'Both department and studentId are required parameters',
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

		// Calculate overall grade function (same as other grade reports)
		const calculateOverallGrade = (
			attendance: number,
			midterm: number,
			final: number,
		): number => {
			return (
				Math.round((attendance * 0.1 + midterm * 0.3 + final * 0.6) * 100) / 100
			);
		};

		// Try to use stored procedure first, fallback to direct query if it fails
		let result: any;
		const request_db = pool.request();

		try {
			// Try SP_GET_STUDENT_GRADES first, if it exists
			console.log('Trying SP_GET_STUDENT_GRADES with parameters:', {
				StudentID: studentId,
			});

			result = await request_db
				.input('StudentID', studentId)
				.execute('SP_GET_STUDENT_GRADES');
		} catch (spError) {
			console.warn(
				'SP_GET_STUDENT_GRADES failed, using direct query:',
				spError,
			);

			// Fallback to direct SQL query
			const queryRequest = pool.request();
			const query = `
				SELECT
					e.CREDIT_CLASS_ID,
					e.STUDENT_ID,
					cc.SUBJECT_ID,
					s.SUBJECT_NAME,
					e.ATTENDANCE_SCORE,
					e.MIDTERM_SCORE,
					e.FINAL_SCORE,
					e.TOTAL_SCORE,
					cc.ACADEMIC_YEAR,
					cc.SEMESTER
				FROM ENROLLMENT e
				INNER JOIN CREDIT_CLASS cc ON e.CREDIT_CLASS_ID = cc.CREDIT_CLASS_ID
				INNER JOIN SUBJECT s ON cc.SUBJECT_ID = s.SUBJECT_ID
				WHERE e.STUDENT_ID = @studentId
					AND (e.CANCELED_ENROLLMENT IS NULL OR e.CANCELED_ENROLLMENT = 0)
				ORDER BY cc.ACADEMIC_YEAR DESC, cc.SEMESTER DESC, s.SUBJECT_NAME
			`;

			result = await queryRequest.input('studentId', studentId).query(query);
		}

		// Transform the data for the student grade slip
		const studentGrades = result.recordset.map((row: StudentGradeData) => {
			const attendance = row.ATTENDANCE_SCORE || 0;
			const midterm = row.MIDTERM_SCORE || 0;
			const finalExam = row.FINAL_SCORE || 0;

			// Auto-calculate total grade using the same formula as other reports
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

			// Convert numerical grade to letter grade using Vietnamese grading scale
			const getLetterGrade = (score: number): string => {
				if (score >= 9.0) return 'A+'; // 4.0 GPA
				if (score >= 8.5) return 'A'; // 3.7 GPA
				if (score >= 8.0) return 'B+'; // 3.5 GPA
				if (score >= 7.0) return 'B'; // 3.0 GPA
				if (score >= 6.5) return 'C+'; // 2.5 GPA
				if (score >= 5.5) return 'C'; // 2.0 GPA
				if (score >= 5.0) return 'D+'; // 1.5 GPA
				if (score >= 4.0) return 'D'; // 1.0 GPA
				return 'F'; // 0.0 GPA
			};

			return {
				creditClassId: row.CREDIT_CLASS_ID,
				subjectId: row.SUBJECT_ID,
				subjectName: row.SUBJECT_NAME,
				attendance,
				midterm,
				finalExam,
				totalGrade,
				letterGrade: getLetterGrade(totalGrade),
				academicYear: row.ACADEMIC_YEAR,
				semester: row.SEMESTER,
			};
		});

		return NextResponse.json({
			success: true,
			studentGrades: studentGrades || [],
			studentId,
			department: department.branch_name,
			serverName: department.server_name,
		});
	} catch (error) {
		console.error('Error fetching student grade slip:', error);
		return NextResponse.json({
			success: false,
			error:
				error instanceof Error
					? error.message
					: 'Failed to fetch student grade slip',
		});
	}
}

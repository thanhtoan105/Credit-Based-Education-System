import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentPool } from '@/lib/multi-database';
import { DepartmentService } from '@/lib/services/department.service';
import { getCurrentUser } from '@/lib/session';

// Interface for SP_DETAILED_TUITION_FEE response
interface DetailedTuitionFeeRecord {
	ACADEMIC_YEAR: string;
	SEMESTER: number;
	FEE_AMOUNT: number;
	AMOUNT_PAID: number;
	AMOUNT_DUE: number;
}

// Interface for student information
interface StudentInfo {
	STUDENT_ID: string;
	FULL_NAME: string;
	CLASS_ID: string;
}

// Combined response interface
interface DetailedTuitionFeeResponse {
	success: boolean;
	studentInfo?: StudentInfo;
	tuitionRecords?: DetailedTuitionFeeRecord[];
	error?: string;
}

export async function GET(
	request: NextRequest,
): Promise<NextResponse<DetailedTuitionFeeResponse>> {
	try {
		// Extract parameters from query string
		const { searchParams } = new URL(request.url);
		const studentId = searchParams.get('studentId');
		const departmentName = searchParams.get('department');

		if (!studentId) {
			return NextResponse.json(
				{
					success: false,
					error: 'Student ID parameter is required',
				},
				{ status: 400 },
			);
		}

		if (!departmentName) {
			return NextResponse.json(
				{
					success: false,
					error: 'Department parameter is required',
				},
				{ status: 400 },
			);
		}

		// Validate student ID format (should be alphanumeric, max 10 characters)
		if (!/^[A-Za-z0-9]{1,10}$/.test(studentId)) {
			return NextResponse.json(
				{
					success: false,
					error: 'Invalid student ID format',
				},
				{ status: 400 },
			);
		}

		// Get department information
		const departmentInfo = await DepartmentService.getDepartmentByBranchName(
			departmentName,
		);
		if (!departmentInfo) {
			return NextResponse.json(
				{
					success: false,
					error: 'Invalid department',
				},
				{ status: 400 },
			);
		}

		// Connect to the department's database server
		const pool = await getDepartmentPool(departmentInfo.server_name);
		const request_db = pool.request();

		// First, get student information
		const studentInfoQuery = `
			SELECT 
				STUDENT_ID,
				LAST_NAME + ' ' + FIRST_NAME AS FULL_NAME,
				CLASS_ID
			FROM STUDENT 
			WHERE STUDENT_ID = @StudentID
		`;

		const studentInfoResult = await request_db
			.input('StudentID', studentId)
			.query<StudentInfo>(studentInfoQuery);

		if (
			!studentInfoResult.recordset ||
			studentInfoResult.recordset.length === 0
		) {
			return NextResponse.json(
				{
					success: false,
					error: 'Student not found',
				},
				{ status: 404 },
			);
		}

		const studentInfo = studentInfoResult.recordset[0];

		// Now call SP_DETAILED_TUITION_FEE stored procedure
		const tuitionRequest = pool.request();
		const tuitionResult = await tuitionRequest
			.input('StudentID', studentId)
			.execute('SP_DETAILED_TUITION_FEE');

		// Process and sort the tuition records by academic year (desc) and semester (desc)
		const tuitionRecords = (
			tuitionResult.recordset as DetailedTuitionFeeRecord[]
		).sort((a, b) => {
			// Sort by academic year descending, then by semester descending
			if (a.ACADEMIC_YEAR !== b.ACADEMIC_YEAR) {
				return b.ACADEMIC_YEAR.localeCompare(a.ACADEMIC_YEAR);
			}
			return b.SEMESTER - a.SEMESTER;
		});

		console.log(
			`Fetched ${tuitionRecords.length} tuition records for student ${studentId}`,
		);

		return NextResponse.json({
			success: true,
			studentInfo,
			tuitionRecords,
		});
	} catch (error) {
		console.error('Error in detailed tuition fee API:', error);

		// Handle specific database errors
		if (error instanceof Error) {
			if (error.message.includes('Invalid object name')) {
				return NextResponse.json(
					{
						success: false,
						error: 'Database table or stored procedure not found',
					},
					{ status: 500 },
				);
			}

			if (error.message.includes('connection')) {
				return NextResponse.json(
					{
						success: false,
						error: 'Database connection failed',
					},
					{ status: 500 },
				);
			}
		}

		return NextResponse.json(
			{
				success: false,
				error:
					error instanceof Error
						? error.message
						: 'Failed to fetch tuition fee details',
			},
			{ status: 500 },
		);
	}
}

// Optional: Handle POST requests for more complex queries
export async function POST(
	request: NextRequest,
): Promise<NextResponse<DetailedTuitionFeeResponse>> {
	try {
		const body = await request.json();
		const { studentId, departmentName } = body;

		if (!studentId) {
			return NextResponse.json(
				{
					success: false,
					error: 'Student ID is required',
				},
				{ status: 400 },
			);
		}

		// Get department information
		if (!departmentName) {
			return NextResponse.json(
				{
					success: false,
					error: 'Department name is required',
				},
				{ status: 400 },
			);
		}

		const departmentInfo = await DepartmentService.getDepartmentByBranchName(
			departmentName,
		);
		if (!departmentInfo) {
			return NextResponse.json(
				{
					success: false,
					error: 'Invalid department specified',
				},
				{ status: 400 },
			);
		}
		const serverName = departmentInfo.server_name;

		// Connect and execute the same logic as GET
		const pool = await getDepartmentPool(serverName);

		// Get student info
		const studentRequest = pool.request();
		const studentInfoQuery = `
			SELECT 
				STUDENT_ID,
				LAST_NAME + ' ' + FIRST_NAME AS FULL_NAME,
				CLASS_ID
			FROM STUDENT 
			WHERE STUDENT_ID = @StudentID
		`;

		const studentInfoResult = await studentRequest
			.input('StudentID', studentId)
			.query<StudentInfo>(studentInfoQuery);

		if (
			!studentInfoResult.recordset ||
			studentInfoResult.recordset.length === 0
		) {
			return NextResponse.json(
				{
					success: false,
					error: 'Student not found',
				},
				{ status: 404 },
			);
		}

		// Get tuition records
		const tuitionRequest = pool.request();
		const tuitionResult = await tuitionRequest
			.input('StudentID', studentId)
			.execute('SP_DETAILED_TUITION_FEE');

		const tuitionRecords = (
			tuitionResult.recordset as DetailedTuitionFeeRecord[]
		).sort((a, b) => {
			if (a.ACADEMIC_YEAR !== b.ACADEMIC_YEAR) {
				return b.ACADEMIC_YEAR.localeCompare(a.ACADEMIC_YEAR);
			}
			return b.SEMESTER - a.SEMESTER;
		});

		return NextResponse.json({
			success: true,
			studentInfo: studentInfoResult.recordset[0],
			tuitionRecords,
		});
	} catch (error) {
		console.error('Error in detailed tuition fee POST API:', error);
		return NextResponse.json(
			{
				success: false,
				error:
					error instanceof Error
						? error.message
						: 'Failed to fetch tuition fee details',
			},
			{ status: 500 },
		);
	}
}

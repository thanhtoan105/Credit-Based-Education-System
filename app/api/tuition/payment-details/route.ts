import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentPool } from '@/lib/multi-database';
import { DepartmentService } from '@/lib/services/department.service';
import { getCurrentUser } from '@/lib/session';

// Interface for SP_DETAILED_TUITION_PAYMENT_INFO response
interface TuitionPaymentDetail {
	PAYMENT_DATE: string; // Will be formatted as dd/mm/yyyy in response
	AMOUNT_PAID: number;
}

// Response interface
interface TuitionPaymentDetailsResponse {
	success: boolean;
	paymentDetails?: TuitionPaymentDetail[];
	totalPayments?: number;
	totalAmount?: number;
	error?: string;
}

// Helper function to format date as dd/mm/yyyy
function formatDateToDDMMYYYY(dateString: string): string {
	try {
		const date = new Date(dateString);
		const day = date.getDate().toString().padStart(2, '0');
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const year = date.getFullYear();
		return `${day}/${month}/${year}`;
	} catch (error) {
		console.error('Error formatting date:', error);
		return dateString; // Return original if formatting fails
	}
}

export async function GET(
	request: NextRequest,
): Promise<NextResponse<TuitionPaymentDetailsResponse>> {
	try {
		// Extract parameters from query string
		const { searchParams } = new URL(request.url);
		const studentId = searchParams.get('studentId');
		const academicYear = searchParams.get('academicYear');
		const semester = searchParams.get('semester');
		const departmentName = searchParams.get('department');

		// Validate required parameters
		if (!studentId || !academicYear || !semester) {
			return NextResponse.json(
				{
					success: false,
					error:
						'All parameters are required: studentId, academicYear, semester',
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

		// Validate parameter formats
		if (!/^[A-Za-z0-9]{1,10}$/.test(studentId)) {
			return NextResponse.json(
				{
					success: false,
					error: 'Invalid student ID format',
				},
				{ status: 400 },
			);
		}

		if (!/^\d{4}-\d{4}$/.test(academicYear)) {
			return NextResponse.json(
				{
					success: false,
					error: 'Invalid academic year format (expected: YYYY-YYYY)',
				},
				{ status: 400 },
			);
		}

		const semesterNum = parseInt(semester);
		if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 3) {
			return NextResponse.json(
				{
					success: false,
					error: 'Invalid semester (must be 1, 2, or 3)',
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

		// Call SP_DETAILED_TUITION_PAYMENT_INFO stored procedure
		console.log(
			`Calling SP_DETAILED_TUITION_PAYMENT_INFO for student: ${studentId}, year: ${academicYear}, semester: ${semester}`,
		);

		const result = await request_db
			.input('StudentID', studentId)
			.input('AcademicYear', academicYear)
			.input('Semester', semesterNum)
			.execute('SP_DETAILED_TUITION_PAYMENT_INFO');

		// Process the results
		const rawPaymentDetails = result.recordset as Array<{
			PAYMENT_DATE: string;
			AMOUNT_PAID: number;
		}>;

		// Format payment details with proper date formatting
		const paymentDetails: TuitionPaymentDetail[] = rawPaymentDetails.map(
			(detail) => ({
				PAYMENT_DATE: formatDateToDDMMYYYY(detail.PAYMENT_DATE),
				AMOUNT_PAID: detail.AMOUNT_PAID,
			}),
		);

		// Calculate summary statistics
		const totalPayments = paymentDetails.length;
		const totalAmount = paymentDetails.reduce(
			(sum, payment) => sum + payment.AMOUNT_PAID,
			0,
		);

		console.log(
			`Found ${totalPayments} payment records with total amount: ${totalAmount}`,
		);

		return NextResponse.json({
			success: true,
			paymentDetails,
			totalPayments,
			totalAmount,
		});
	} catch (error) {
		console.error('Error in tuition payment details API:', error);

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

			if (error.message.includes('Invalid column name')) {
				return NextResponse.json(
					{
						success: false,
						error: 'Database schema mismatch',
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
						: 'Failed to fetch payment details',
			},
			{ status: 500 },
		);
	}
}

// POST method for more complex requests or when parameters are sent in body
export async function POST(
	request: NextRequest,
): Promise<NextResponse<TuitionPaymentDetailsResponse>> {
	try {
		const body = await request.json();
		const { studentId, academicYear, semester, departmentName } = body;

		// Validate required parameters
		if (!studentId || !academicYear || semester === undefined) {
			return NextResponse.json(
				{
					success: false,
					error: 'Required fields: studentId, academicYear, semester',
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

		// Connect to database and execute stored procedure
		const pool = await getDepartmentPool(serverName);
		const request_db = pool.request();

		const result = await request_db
			.input('StudentID', studentId)
			.input('AcademicYear', academicYear)
			.input('Semester', parseInt(semester))
			.execute('SP_DETAILED_TUITION_PAYMENT_INFO');

		// Process results
		const rawPaymentDetails = result.recordset as Array<{
			PAYMENT_DATE: string;
			AMOUNT_PAID: number;
		}>;

		const paymentDetails: TuitionPaymentDetail[] = rawPaymentDetails.map(
			(detail) => ({
				PAYMENT_DATE: formatDateToDDMMYYYY(detail.PAYMENT_DATE),
				AMOUNT_PAID: detail.AMOUNT_PAID,
			}),
		);

		const totalPayments = paymentDetails.length;
		const totalAmount = paymentDetails.reduce(
			(sum, payment) => sum + payment.AMOUNT_PAID,
			0,
		);

		return NextResponse.json({
			success: true,
			paymentDetails,
			totalPayments,
			totalAmount,
		});
	} catch (error) {
		console.error('Error in tuition payment details POST API:', error);
		return NextResponse.json(
			{
				success: false,
				error:
					error instanceof Error
						? error.message
						: 'Failed to fetch payment details',
			},
			{ status: 500 },
		);
	}
}

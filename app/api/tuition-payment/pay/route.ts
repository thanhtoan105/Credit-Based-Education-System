import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentPool } from '@/lib/multi-database';
import { DepartmentService } from '@/lib/services/department.service';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			studentId,
			academicYear,
			semester,
			paymentDate,
			amountPaid,
			departmentName,
		} = body;

		console.log('Received payment request:', {
			studentId,
			academicYear,
			semester,
			paymentDate,
			amountPaid,
			departmentName,
		});

		// Validate required fields
		if (
			!studentId ||
			!academicYear ||
			!semester ||
			!paymentDate ||
			!amountPaid
		) {
			return NextResponse.json(
				{
					success: false,
					error:
						'Missing required fields: studentId, academicYear, semester, paymentDate, amountPaid',
				},
				{ status: 400 },
			);
		}

		// Validate department
		if (!departmentName) {
			return NextResponse.json(
				{
					success: false,
					error: 'Department name is required',
				},
				{ status: 400 },
			);
		}

		// Validate amount is positive
		if (amountPaid <= 0) {
			return NextResponse.json(
				{
					success: false,
					error: 'Amount paid must be greater than 0',
				},
				{ status: 400 },
			);
		}

		console.log('Getting department info for:', departmentName);

		// Get department information
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

		console.log('Department info found:', departmentInfo);

		// Connect to the department's database server
		const pool = await getDepartmentPool(departmentInfo.server_name);
		const request_db = pool.request();

		console.log(
			`Calling SP_PAY_TUITION for student: ${studentId}, year: ${academicYear}, semester: ${semester}, amount: ${amountPaid}`,
		);

		// Call SP_PAY_TUITION stored procedure
		const result = await request_db
			.input('StudentID', studentId)
			.input('AcademicYear', academicYear)
			.input('Semester', parseInt(semester))
			.input('PaymentDate', paymentDate)
			.input('AmountPaid', parseInt(amountPaid))
			.execute('SP_PAY_TUITION');

		console.log('SP_PAY_TUITION executed successfully:', result);

		return NextResponse.json({
			success: true,
			message: 'Payment recorded successfully',
		});
	} catch (error) {
		console.error('Error processing payment:', error);

		// Handle specific database errors
		if (error instanceof Error) {
			if (error.message.includes('Invalid object name')) {
				return NextResponse.json(
					{
						success: false,
						error: 'SP_PAY_TUITION stored procedure not found',
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

			if (
				error.message.includes('PRIMARY KEY constraint') &&
				error.message.includes('TUITION_PAYMENT_DETAIL')
			) {
				return NextResponse.json(
					{
						success: false,
						error:
							'A payment record already exists for this student, academic year, semester, and date. Please choose a different date or check existing payment records.',
					},
					{ status: 400 },
				);
			}
		}

		return NextResponse.json(
			{
				success: false,
				error:
					error instanceof Error ? error.message : 'Failed to process payment',
			},
			{ status: 500 },
		);
	}
}

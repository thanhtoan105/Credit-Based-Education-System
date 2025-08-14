import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentPool } from '@/lib/multi-database';
import { DepartmentService } from '@/lib/services/department.service';

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const classId = searchParams.get('classId');
		const academicYear = searchParams.get('academicYear');
		const semester = searchParams.get('semester');
		const departmentName = searchParams.get('department');

		console.log('Tuition report request:', { classId, academicYear, semester, departmentName });

		// Validate required fields
		if (!classId || !academicYear || !semester || !departmentName) {
			return NextResponse.json(
				{ 
					success: false,
					error: 'Missing required fields: classId, academicYear, semester, department' 
				},
				{ status: 400 }
			);
		}

		// Get department information
		const departmentInfo = await DepartmentService.getDepartmentByBranchName(departmentName);
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

		// Get faculty name for the class
		console.log(`Calling SP_GET_FACULTY_BY_CLASS for class: ${classId}`);
		const facultyResult = await pool
			.request()
			.input('ClassID', classId)
			.execute('SP_GET_FACULTY_BY_CLASS');

		const facultyName = facultyResult.recordset[0]?.FACULTY_NAME || 'Unknown Faculty';
		console.log('Faculty name:', facultyName);

		// Get tuition report data
		console.log(`Calling SP_REPORT_TUITION_FEE for class: ${classId}, year: ${academicYear}, semester: ${semester}`);
		const reportResult = await pool
			.request()
			.input('ClassID', classId)
			.input('AcademicYear', academicYear)
			.input('Semester', parseInt(semester))
			.execute('SP_REPORT_TUITION_FEE');

		const reportData = reportResult.recordset;
		console.log(`Found ${reportData.length} student records`);

		// Calculate totals
		const totalStudents = reportData.length;
		const totalAmountPaid = reportData.reduce((sum: number, record: any) => sum + (record.AMOUNT_PAID || 0), 0);

		return NextResponse.json({
			success: true,
			data: {
				classId,
				academicYear,
				semester,
				facultyName,
				students: reportData.map((record: any, index: number) => ({
					no: index + 1,
					fullName: record.FULL_NAME,
					tuitionFee: record.FEE_AMOUNT,
					amountPaid: record.AMOUNT_PAID || 0,
				})),
				summary: {
					totalStudents,
					totalAmountPaid,
				}
			}
		});
	} catch (error) {
		console.error('Error generating tuition report:', error);
		
		// Handle specific database errors
		if (error instanceof Error) {
			if (error.message.includes('INFORMATION NOT FOUND')) {
				return NextResponse.json(
					{
						success: false,
						error: 'No tuition information found for the specified class, academic year, and semester.',
					},
					{ status: 404 },
				);
			}

			if (error.message.includes('Invalid object name')) {
				return NextResponse.json(
					{
						success: false,
						error: 'Required stored procedures not found',
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
				error: error instanceof Error ? error.message : 'Failed to generate tuition report' 
			},
			{ status: 500 }
		);
	}
}

import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentPool } from '@/lib/multi-database';
import { DepartmentService } from '@/lib/services/department.service';

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const department = searchParams.get('department');
		const academicYear = searchParams.get('academicYear');

		if (!department) {
			return NextResponse.json(
				{ success: false, error: 'Department parameter is required' },
				{ status: 400 },
			);
		}

		if (!academicYear) {
			return NextResponse.json(
				{ success: false, error: 'Academic year parameter is required' },
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

		// Call SP_GET_SEMESTER stored procedure with academic year parameter
		console.log('Fetching semesters for academic year:', academicYear);
		const result = await request
			.input('AcademicYear', academicYear)
			.execute('SP_GET_SEMESTER');

		console.log('Semesters result:', result.recordset);
		const semesters = result.recordset.map((row: any) => ({
			value: row.SEMESTER.toString(),
			label: `Semester ${row.SEMESTER}`,
		}));

		console.log('Mapped semesters:', semesters);

		return NextResponse.json({
			success: true,
			semesters,
		});
	} catch (error) {
		console.error('Error fetching semesters:', error);
		return NextResponse.json(
			{ success: false, error: 'Failed to fetch semesters' },
			{ status: 500 },
		);
	}
}

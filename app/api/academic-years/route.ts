import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentPool } from '@/lib/multi-database';
import { DepartmentService } from '@/lib/services/department.service';

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const department = searchParams.get('department');

		if (!department) {
			return NextResponse.json(
				{ success: false, error: 'Department parameter is required' },
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

		// Call SP_DANHSACHNAMHOC stored procedure (Vietnamese name for academic year list)
		const result = await request.execute('SP_GET_ACADEMIC_YEAR');

		const academicYears = result.recordset.map((row: any) => ({
			value: row.ACADEMIC_YEAR || row.NAMHOC || row.NAM_HOC || row.YEAR,
			label: row.ACADEMIC_YEAR || row.NAMHOC || row.NAM_HOC || row.YEAR,
		}));

		return NextResponse.json({
			success: true,
			academicYears,
		});
	} catch (error) {
		console.error('Error fetching academic years:', error);
		return NextResponse.json(
			{ success: false, error: 'Failed to fetch academic years' },
			{ status: 500 },
		);
	}
}

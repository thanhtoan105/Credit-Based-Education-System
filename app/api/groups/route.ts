import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentPool } from '@/lib/multi-database';
import { DepartmentService } from '@/lib/services/department.service';

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const department = searchParams.get('department');
		const academicYear = searchParams.get('academicYear');
		const semester = searchParams.get('semester');
		const subjectId = searchParams.get('subjectId');

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

		if (!semester) {
			return NextResponse.json(
				{ success: false, error: 'Semester parameter is required' },
				{ status: 400 },
			);
		}

		if (!subjectId) {
			return NextResponse.json(
				{ success: false, error: 'Subject ID parameter is required' },
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

		// Call SP_GET_GROUP stored procedure with required parameters
		const result = await request
			.input('AcademicYear', academicYear)
			.input('Semester', parseInt(semester))
			.input('SubjectID', subjectId)
			.execute('SP_GET_GROUP');

		const groups = result.recordset.map((row: any) => ({
			value: row.GROUP_NUMBER.toString(),
			label: `Group ${row.GROUP_NUMBER}`,
		}));

		return NextResponse.json({
			success: true,
			groups,
		});
	} catch (error) {
		console.error('Error fetching groups:', error);
		return NextResponse.json(
			{ success: false, error: 'Failed to fetch groups' },
			{ status: 500 },
		);
	}
}

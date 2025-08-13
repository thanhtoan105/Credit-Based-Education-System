import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentPool } from '@/lib/multi-database';
import { DepartmentService } from '@/lib/services/department.service';

interface RouteParams {
	params: Promise<{
		name: string;
	}>;
}

// GET - Get Faculty ID for a department
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const resolvedParams = await params;
		const departmentName = decodeURIComponent(resolvedParams.name);

		if (!departmentName) {
			return NextResponse.json({
				success: false,
				error: 'Department name is required',
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
		const request_db = pool.request();

		// Get Faculty ID from FACULTY table/view
		// We'll get the first faculty ID from this department's database
		const facultyQuery = `SELECT TOP 1 FACULTY_ID FROM FACULTY ORDER BY FACULTY_ID`;
		const result = await request_db.query(facultyQuery);

		if (result.recordset.length === 0) {
			return NextResponse.json({
				success: false,
				error: 'No faculty found for this department',
			});
		}

		const facultyId = result.recordset[0].FACULTY_ID;

		return NextResponse.json({
			success: true,
			facultyId,
			departmentName,
			serverName: department.server_name,
		});
	} catch (error) {
		console.error('Error getting faculty ID:', error);
		return NextResponse.json({
			success: false,
			error:
				error instanceof Error ? error.message : 'Failed to get faculty ID',
		});
	}
}

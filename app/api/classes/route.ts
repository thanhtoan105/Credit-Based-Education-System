import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentPool } from '@/lib/multi-database';
import { DepartmentService } from '@/lib/services/department.service';

interface ClassData {
	CLASS_ID: string;
	CLASS_NAME: string;
	COURSE_YEAR: string;
	FACULTY_ID: string;
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const departmentName = searchParams.get('department');
		const classId = searchParams.get('classId');

		if (!departmentName) {
			return NextResponse.json({
				success: false,
				error: 'Department parameter is required',
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

		// Execute the SQL query - filter by classId if provided
		let query = `SELECT CLASS_ID, CLASS_NAME, COURSE_YEAR, FACULTY_ID FROM CLASS`;
		if (classId) {
			query += ` WHERE CLASS_ID = @classId`;
			request_db.input('classId', classId);
		}
		query += ` ORDER BY CLASS_ID`;

		const result = await request_db.query<ClassData>(query);

		return NextResponse.json({
			success: true,
			classes: result.recordset || [],
			department: department.branch_name,
			serverName: department.server_name,
		});
	} catch (error) {
		console.error('Error fetching classes:', error);
		return NextResponse.json({
			success: false,
			error: error instanceof Error ? error.message : 'Failed to fetch classes',
		});
	}
}

// POST - Add new class
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { classId, className, courseYear, facultyId, departmentName } = body;

		if (
			!classId ||
			!className ||
			!courseYear ||
			!facultyId ||
			!departmentName
		) {
			return NextResponse.json({
				success: false,
				error: 'All fields are required',
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

		// Check if CLASS_ID already exists using SP_CHECK_ID_EXISTS
		const checkResult = await request_db
			.input('ID', classId)
			.input('Type', 'CLASS_ID')
			.execute('SP_CHECK_ID');

		const returnValue = checkResult.returnValue;
		if (returnValue === 1) {
			return NextResponse.json({
				success: false,
				error: 'Class ID already exists in current department',
			});
		} else if (returnValue === 2) {
			return NextResponse.json({
				success: false,
				error: 'Class ID already exists in another department',
			});
		}

		// Insert new class into the underlying CLASS table
		const insertQuery = `
			INSERT INTO CLASS (CLASS_ID, CLASS_NAME, COURSE_YEAR, FACULTY_ID)
			VALUES (@classId, @className, @courseYear, @facultyId)
		`;

		await request_db
			.input('classId', classId)
			.input('className', className)
			.input('courseYear', courseYear)
			.input('facultyId', facultyId)
			.query(insertQuery);

		return NextResponse.json({
			success: true,
			message: 'Class added successfully',
		});
	} catch (error) {
		console.error('Error adding class:', error);
		return NextResponse.json({
			success: false,
			error: error instanceof Error ? error.message : 'Failed to add class',
		});
	}
}

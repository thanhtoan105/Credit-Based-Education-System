import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentPool } from '@/lib/multi-database';
import { DepartmentService } from '@/lib/services/department.service';

interface StudentData {
	STUDENT_ID: string;
	LAST_NAME: string;
	FIRST_NAME: string;
	GENDER: boolean;
	ADDRESS: string | null;
	DATE_OF_BIRTH: string | null;
	CLASS_ID: string;
	SUSPENDED: boolean;
	PASSWORD: string | null;
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const departmentName = searchParams.get('department');

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

		// Execute the SQL query to get students with their class information
		const query = `
			SELECT 
				s.STUDENT_ID, 
				s.LAST_NAME, 
				s.FIRST_NAME, 
				s.GENDER, 
				s.ADDRESS, 
				s.DATE_OF_BIRTH, 
				s.CLASS_ID, 
				s.SUSPENDED, 
				s.PASSWORD,
				c.CLASS_NAME
			FROM STUDENT s
			LEFT JOIN CLASS c ON s.CLASS_ID = c.CLASS_ID
			ORDER BY s.STUDENT_ID
		`;
		const result = await request_db.query<StudentData & { CLASS_NAME: string }>(
			query,
		);

		return NextResponse.json({
			success: true,
			students: result.recordset || [],
			department: department.branch_name,
			serverName: department.server_name,
		});
	} catch (error) {
		console.error('Error fetching students:', error);
		return NextResponse.json({
			success: false,
			error:
				error instanceof Error ? error.message : 'Failed to fetch students',
		});
	}
}

// POST - Add new student
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			studentId,
			lastName,
			firstName,
			gender,
			address,
			dateOfBirth,
			classId,
			suspended,
			password,
			departmentName,
		} = body;

		if (!studentId || !lastName || !firstName || !classId || !departmentName) {
			return NextResponse.json({
				success: false,
				error:
					'Student ID, Last Name, First Name, Class ID, and Department are required',
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

		// Check if STUDENT_ID already exists using SP_CHECK_ID
		const checkResult = await request_db
			.input('ID', studentId)
			.input('Type', 'STUDENT_ID')
			.execute('SP_CHECK_ID');

		const returnValue = checkResult.returnValue;
		if (returnValue === 1) {
			return NextResponse.json({
				success: false,
				error: 'Student ID already exists in current department',
			});
		} else if (returnValue === 2) {
			return NextResponse.json({
				success: false,
				error: 'Student ID already exists in another department',
			});
		}

		// Insert new student into the STUDENT table
		const insertQuery = `
			INSERT INTO STUDENT (
				STUDENT_ID, LAST_NAME, FIRST_NAME, GENDER, ADDRESS, 
				DATE_OF_BIRTH, CLASS_ID, SUSPENDED, PASSWORD
			)
			VALUES (
				@studentId, @lastName, @firstName, @gender, @address, 
				@dateOfBirth, @classId, @suspended, @password
			)
		`;

		await request_db
			.input('studentId', studentId)
			.input('lastName', lastName)
			.input('firstName', firstName)
			.input('gender', gender || false)
			.input('address', address || null)
			.input('dateOfBirth', dateOfBirth || null)
			.input('classId', classId)
			.input('suspended', suspended || false)
			.input('password', password || '')
			.query(insertQuery);

		return NextResponse.json({
			success: true,
			message: 'Student added successfully',
		});
	} catch (error) {
		console.error('Error adding student:', error);
		return NextResponse.json({
			success: false,
			error: error instanceof Error ? error.message : 'Failed to add student',
		});
	}
}

// PUT - Update existing student
export async function PUT(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			studentId,
			lastName,
			firstName,
			gender,
			address,
			dateOfBirth,
			classId,
			suspended,
			password,
			departmentName,
		} = body;

		if (!studentId || !lastName || !firstName || !classId || !departmentName) {
			return NextResponse.json({
				success: false,
				error:
					'Student ID, Last Name, First Name, Class ID, and Department are required',
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

		// Update student in the STUDENT table
		const updateQuery = `
			UPDATE STUDENT SET
				LAST_NAME = @lastName,
				FIRST_NAME = @firstName,
				GENDER = @gender,
				ADDRESS = @address,
				DATE_OF_BIRTH = @dateOfBirth,
				CLASS_ID = @classId,
				SUSPENDED = @suspended,
				PASSWORD = @password
			WHERE STUDENT_ID = @studentId
		`;

		const result = await request_db
			.input('studentId', studentId)
			.input('lastName', lastName)
			.input('firstName', firstName)
			.input('gender', gender || false)
			.input('address', address || null)
			.input('dateOfBirth', dateOfBirth || null)
			.input('classId', classId)
			.input('suspended', suspended || false)
			.input('password', password || '')
			.query(updateQuery);

		if (result.rowsAffected[0] === 0) {
			return NextResponse.json({
				success: false,
				error: 'Student not found',
			});
		}

		return NextResponse.json({
			success: true,
			message: 'Student updated successfully',
		});
	} catch (error) {
		console.error('Error updating student:', error);
		return NextResponse.json({
			success: false,
			error:
				error instanceof Error ? error.message : 'Failed to update student',
		});
	}
}

// DELETE - Delete student
export async function DELETE(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const studentId = searchParams.get('studentId');
		const departmentName = searchParams.get('department');

		if (!studentId || !departmentName) {
			return NextResponse.json({
				success: false,
				error: 'Student ID and Department are required',
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

		// Delete student from the STUDENT table
		const deleteQuery = `DELETE FROM STUDENT WHERE STUDENT_ID = @studentId`;
		const result = await request_db
			.input('studentId', studentId)
			.query(deleteQuery);

		if (result.rowsAffected[0] === 0) {
			return NextResponse.json({
				success: false,
				error: 'Student not found',
			});
		}

		return NextResponse.json({
			success: true,
			message: 'Student deleted successfully',
		});
	} catch (error) {
		console.error('Error deleting student:', error);
		return NextResponse.json({
			success: false,
			error:
				error instanceof Error ? error.message : 'Failed to delete student',
		});
	}
}

import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentPool } from '@/lib/multi-database';
import { DepartmentService } from '@/lib/services/department.service';

interface RouteParams {
	params: Promise<{
		id: string;
	}>;
}

// PUT - Update class
export async function PUT(request: NextRequest, { params }: RouteParams) {
	try {
		const body = await request.json();
		const { className, courseYear, departmentName } = body;
		const resolvedParams = await params;
		const classId = resolvedParams.id;

		if (!className || !courseYear || !departmentName) {
			return NextResponse.json({
				success: false,
				error: 'Class name, course year, and department are required',
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

		// Update class in the underlying CLASS table
		const updateQuery = `
			UPDATE CLASS
			SET CLASS_NAME = @className, COURSE_YEAR = @courseYear
			WHERE CLASS_ID = @classId
		`;

		const result = await request_db
			.input('className', className)
			.input('courseYear', courseYear)
			.input('classId', classId)
			.query(updateQuery);

		if (result.rowsAffected[0] === 0) {
			return NextResponse.json({
				success: false,
				error: 'Class not found',
			});
		}

		return NextResponse.json({
			success: true,
			message: 'Class updated successfully',
		});
	} catch (error) {
		console.error('Error updating class:', error);
		return NextResponse.json({
			success: false,
			error: error instanceof Error ? error.message : 'Failed to update class',
		});
	}
}

// DELETE - Delete class
export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		const { searchParams } = new URL(request.url);
		const departmentName = searchParams.get('department');
		const resolvedParams = await params;
		const classId = resolvedParams.id;

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

		// Check if class has students using the underlying STUDENT table
		const studentCheckQuery = `SELECT COUNT(*) as studentCount FROM STUDENT WHERE CLASS_ID = @checkClassId`;
		const studentResult = await request_db
			.input('checkClassId', classId)
			.query(studentCheckQuery);

		const studentCount = studentResult.recordset[0]?.studentCount || 0;
		if (studentCount > 0) {
			return NextResponse.json({
				success: false,
				error: `Cannot delete class. It has ${studentCount} student(s) enrolled.`,
				hasStudents: true,
				studentCount,
			});
		}

		// Delete class from the underlying CLASS table
		const deleteQuery = `DELETE FROM CLASS WHERE CLASS_ID = @deleteClassId`;
		const deleteRequest = pool.request();
		const result = await deleteRequest
			.input('deleteClassId', classId)
			.query(deleteQuery);

		if (result.rowsAffected[0] === 0) {
			return NextResponse.json({
				success: false,
				error: 'Class not found',
			});
		}

		return NextResponse.json({
			success: true,
			message: 'Class deleted successfully',
		});
	} catch (error) {
		console.error('Error deleting class:', error);
		return NextResponse.json({
			success: false,
			error: error instanceof Error ? error.message : 'Failed to delete class',
		});
	}
}

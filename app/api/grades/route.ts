import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentPool } from '@/lib/multi-database';
import { DepartmentService } from '@/lib/services/department.service';
import sql from 'mssql';

export async function PUT(req: NextRequest) {
	try {
		const body = await req.json();
		const { department, grades } = body;

		if (!department || !grades || !Array.isArray(grades)) {
			return NextResponse.json(
				{ success: false, error: 'Department and grades array are required' },
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

		// Create table-valued parameter for TYPE_ENROLLMENT
		const gradeTable = new sql.Table();
		gradeTable.columns.add('CREDIT_CLASS_ID', sql.Int);
		gradeTable.columns.add('STUDENT_ID', sql.NChar(10));
		gradeTable.columns.add('ATTENDANCE_SCORE', sql.Int);
		gradeTable.columns.add('MIDTERM_SCORE', sql.Float);
		gradeTable.columns.add('FINAL_SCORE', sql.Float);

		// Add rows to the table
		grades.forEach((grade: any) => {
			gradeTable.rows.add(
				grade.creditClassId || null, // This needs to be provided from frontend
				grade.studentId,
				grade.attendanceGrade,
				grade.midtermGrade,
				grade.finalGrade,
			);
		});

		// Call SP_UPDATE_GRADES with table-valued parameter
		await request.input('GradeData', gradeTable).execute('SP_UPDATE_GRADES');

		return NextResponse.json({
			success: true,
			message: 'Grades updated successfully',
		});
	} catch (error) {
		console.error('Error updating grades:', error);
		return NextResponse.json(
			{ success: false, error: 'Failed to update grades' },
			{ status: 500 },
		);
	}
}

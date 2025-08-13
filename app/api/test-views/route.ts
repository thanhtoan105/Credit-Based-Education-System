import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentPool } from '@/lib/multi-database';
import { DepartmentService } from '@/lib/services/department.service';

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
		const department = await DepartmentService.getDepartmentByBranchName(departmentName);
		if (!department) {
			return NextResponse.json({
				success: false,
				error: `Department "${departmentName}" not found`,
			});
		}

		// Connect to the department's server
		const pool = await getDepartmentPool(department.server_name);
		const request_db = pool.request();

		// Test if English views exist
		const testResults: any = {};

		try {
			// Test CLASS view
			const classResult = await request_db.query(`SELECT TOP 1 * FROM CLASS`);
			testResults.CLASS = {
				exists: true,
				columns: Object.keys(classResult.recordset[0] || {}),
				sampleData: classResult.recordset[0] || null
			};
		} catch (error) {
			testResults.CLASS = {
				exists: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}

		try {
			// Test FACULTY view
			const facultyResult = await request_db.query(`SELECT TOP 1 * FROM FACULTY`);
			testResults.FACULTY = {
				exists: true,
				columns: Object.keys(facultyResult.recordset[0] || {}),
				sampleData: facultyResult.recordset[0] || null
			};
		} catch (error) {
			testResults.FACULTY = {
				exists: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}

		try {
			// Test STUDENT view
			const studentResult = await request_db.query(`SELECT TOP 1 * FROM STUDENT`);
			testResults.STUDENT = {
				exists: true,
				columns: Object.keys(studentResult.recordset[0] || {}),
				sampleData: studentResult.recordset[0] || null
			};
		} catch (error) {
			testResults.STUDENT = {
				exists: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}

		try {
			// Test SUBJECT view
			const subjectResult = await request_db.query(`SELECT TOP 1 * FROM SUBJECT`);
			testResults.SUBJECT = {
				exists: true,
				columns: Object.keys(subjectResult.recordset[0] || {}),
				sampleData: subjectResult.recordset[0] || null
			};
		} catch (error) {
			testResults.SUBJECT = {
				exists: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}

		try {
			// Test CREDIT_CLASS view
			const creditClassResult = await request_db.query(`SELECT TOP 1 * FROM CREDIT_CLASS`);
			testResults.CREDIT_CLASS = {
				exists: true,
				columns: Object.keys(creditClassResult.recordset[0] || {}),
				sampleData: creditClassResult.recordset[0] || null
			};
		} catch (error) {
			testResults.CREDIT_CLASS = {
				exists: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}

		return NextResponse.json({
			success: true,
			department: department.branch_name,
			serverName: department.server_name,
			viewTests: testResults,
		});
	} catch (error) {
		console.error('Error testing views:', error);
		return NextResponse.json({
			success: false,
			error: error instanceof Error ? error.message : 'Failed to test views',
		});
	}
}

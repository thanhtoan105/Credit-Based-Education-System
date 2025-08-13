import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentPool } from '@/lib/multi-database';
import { DepartmentService } from '@/lib/services/department.service';

interface CreditClassData {
	CREDIT_CLASS_ID: number;
	ACADEMIC_YEAR: string;
	SEMESTER: number;
	SUBJECT_ID: string;
	SUBJECT_NAME: string;
	GROUP_NUMBER: number;
	LECTURER_ID: string;
	LECTURER_NAME: string;
	FACULTY_ID: string;
	MIN_STUDENTS: number;
	CANCELED_CLASS: boolean;
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

		// Execute query to get credit classes with subject and lecturer information
		const query = `
			SELECT 
				cc.CREDIT_CLASS_ID,
				cc.ACADEMIC_YEAR,
				cc.SEMESTER,
				cc.SUBJECT_ID,
				s.SUBJECT_NAME,
				cc.GROUP_NUMBER,
				cc.LECTURER_ID,
				l.LAST_NAME + ' ' + l.FIRST_NAME AS LECTURER_NAME,
				cc.FACULTY_ID,
				cc.MIN_STUDENTS,
				cc.CANCELED_CLASS
			FROM CREDIT_CLASS cc
			LEFT JOIN SUBJECT s ON cc.SUBJECT_ID = s.SUBJECT_ID
			LEFT JOIN LECTURER l ON cc.LECTURER_ID = l.LECTURER_ID
			ORDER BY cc.ACADEMIC_YEAR DESC, cc.SEMESTER, cc.SUBJECT_ID, cc.GROUP_NUMBER
		`;

		const result = await request_db.query<CreditClassData>(query);

		return NextResponse.json({
			success: true,
			creditClasses: result.recordset || [],
			department: department.branch_name,
			serverName: department.server_name,
		});
	} catch (error) {
		console.error('Error fetching credit classes:', error);
		return NextResponse.json({
			success: false,
			error:
				error instanceof Error
					? error.message
					: 'Failed to fetch credit classes',
		});
	}
}

// POST - Add new credit class
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			academicYear,
			semester,
			subjectId,
			groupNumber,
			lecturerId,
			facultyId,
			minStudents,
			canceledClass,
			departmentName,
		} = body;

		if (
			!academicYear ||
			!semester ||
			!subjectId ||
			!groupNumber ||
			!lecturerId ||
			!facultyId ||
			!departmentName
		) {
			return NextResponse.json({
				success: false,
				error: 'All required fields must be provided',
			});
		}

		// Validate minStudents
		if (minStudents <= 0) {
			return NextResponse.json({
				success: false,
				error: 'Minimum students must be greater than 0',
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

		// Check if the same credit class already exists (same year, semester, subject, group, faculty)
		const checkQuery = `
			SELECT COUNT(*) as count 
			FROM CREDIT_CLASS 
			WHERE ACADEMIC_YEAR = @academicYear 
			AND SEMESTER = @semester 
			AND SUBJECT_ID = @subjectId 
			AND GROUP_NUMBER = @groupNumber 
			AND FACULTY_ID = @facultyId
		`;

		const checkResult = await request_db
			.input('academicYear', academicYear)
			.input('semester', semester)
			.input('subjectId', subjectId)
			.input('groupNumber', groupNumber)
			.input('facultyId', facultyId)
			.query(checkQuery);

		if (checkResult.recordset[0].count > 0) {
			return NextResponse.json({
				success: false,
				error: 'A credit class with the same details already exists',
			});
		}

		// Insert new credit class
		const insertQuery = `
			INSERT INTO CREDIT_CLASS (
				ACADEMIC_YEAR, SEMESTER, SUBJECT_ID, GROUP_NUMBER, 
				LECTURER_ID, FACULTY_ID, MIN_STUDENTS, CANCELED_CLASS
			)
			VALUES (
				@academicYear, @semester, @subjectId, @groupNumber,
				@lecturerId, @facultyId, @minStudents, @canceledClass
			)
		`;

		// Create a new request for insert since parameters are already bound for conflict check
		const insertRequest = pool.request();
		await insertRequest
			.input('academicYear', academicYear)
			.input('semester', semester)
			.input('subjectId', subjectId)
			.input('groupNumber', groupNumber)
			.input('lecturerId', lecturerId)
			.input('facultyId', facultyId)
			.input('minStudents', minStudents)
			.input('canceledClass', canceledClass || false)
			.query(insertQuery);

		return NextResponse.json({
			success: true,
			message: 'Credit class added successfully',
		});
	} catch (error) {
		console.error('Error adding credit class:', error);
		return NextResponse.json({
			success: false,
			error:
				error instanceof Error ? error.message : 'Failed to add credit class',
		});
	}
}

// PUT - Update existing credit class
export async function PUT(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			creditClassId,
			academicYear,
			semester,
			subjectId,
			groupNumber,
			lecturerId,
			facultyId,
			minStudents,
			canceledClass,
			departmentName,
		} = body;

		if (
			!creditClassId ||
			!academicYear ||
			!semester ||
			!subjectId ||
			!groupNumber ||
			!lecturerId ||
			!facultyId ||
			!departmentName
		) {
			return NextResponse.json({
				success: false,
				error: 'All required fields must be provided',
			});
		}

		// Validate minStudents
		if (minStudents <= 0) {
			return NextResponse.json({
				success: false,
				error: 'Minimum students must be greater than 0',
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

		// Check if credit class exists
		const checkQuery = `
			SELECT COUNT(*) as count 
			FROM CREDIT_CLASS 
			WHERE CREDIT_CLASS_ID = @creditClassId
		`;

		const checkResult = await request_db
			.input('creditClassId', creditClassId)
			.query(checkQuery);

		if (checkResult.recordset[0].count === 0) {
			return NextResponse.json({
				success: false,
				error: 'Credit class not found',
			});
		}

		// Check for conflicts with other credit classes (exclude current one)
		const conflictQuery = `
			SELECT COUNT(*) as count 
			FROM CREDIT_CLASS 
			WHERE ACADEMIC_YEAR = @academicYear 
			AND SEMESTER = @semester 
			AND SUBJECT_ID = @subjectId 
			AND GROUP_NUMBER = @groupNumber 
			AND FACULTY_ID = @facultyId
			AND CREDIT_CLASS_ID != @creditClassId
		`;

		// Create a new request for conflict check since creditClassId is already bound
		const conflictRequest = pool.request();
		const conflictResult = await conflictRequest
			.input('academicYear', academicYear)
			.input('semester', semester)
			.input('subjectId', subjectId)
			.input('groupNumber', groupNumber)
			.input('facultyId', facultyId)
			.input('creditClassId', creditClassId)
			.query(conflictQuery);

		if (conflictResult.recordset[0].count > 0) {
			return NextResponse.json({
				success: false,
				error: 'A credit class with the same details already exists',
			});
		}

		// Update credit class
		const updateQuery = `
			UPDATE CREDIT_CLASS SET
				ACADEMIC_YEAR = @academicYear,
				SEMESTER = @semester,
				SUBJECT_ID = @subjectId,
				GROUP_NUMBER = @groupNumber,
				LECTURER_ID = @lecturerId,
				FACULTY_ID = @facultyId,
				MIN_STUDENTS = @minStudents,
				CANCELED_CLASS = @canceledClass
			WHERE CREDIT_CLASS_ID = @creditClassId
		`;

		// Create a new request for update since creditClassId is already bound from earlier checks
		const updateRequest = pool.request();
		const result = await updateRequest
			.input('creditClassId', creditClassId)
			.input('academicYear', academicYear)
			.input('semester', semester)
			.input('subjectId', subjectId)
			.input('groupNumber', groupNumber)
			.input('lecturerId', lecturerId)
			.input('facultyId', facultyId)
			.input('minStudents', minStudents)
			.input('canceledClass', canceledClass || false)
			.query(updateQuery);

		if (result.rowsAffected[0] === 0) {
			return NextResponse.json({
				success: false,
				error: 'Credit class not found or no changes made',
			});
		}

		return NextResponse.json({
			success: true,
			message: 'Credit class updated successfully',
		});
	} catch (error) {
		console.error('Error updating credit class:', error);
		return NextResponse.json({
			success: false,
			error:
				error instanceof Error
					? error.message
					: 'Failed to update credit class',
		});
	}
}

// DELETE - Delete credit class(es)
export async function DELETE(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const creditClassIds = searchParams.get('ids')?.split(',') || [];
		const departmentName = searchParams.get('department');

		if (!departmentName) {
			return NextResponse.json({
				success: false,
				error: 'Department parameter is required',
			});
		}

		if (creditClassIds.length === 0) {
			return NextResponse.json({
				success: false,
				error: 'At least one credit class ID is required',
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

		// Check if any credit classes have enrollments
		const enrollmentQuery = `
			SELECT COUNT(*) as count 
			FROM ENROLLMENT 
			WHERE CREDIT_CLASS_ID IN (${creditClassIds.map(() => '?').join(',')})
		`;

		// Since mssql doesn't support array binding in IN clause directly, we'll build the query
		const placeholders = creditClassIds.map((_, index) => `@id${index}`).join(',');
		const enrollmentCheckQuery = `
			SELECT COUNT(*) as count 
			FROM ENROLLMENT 
			WHERE CREDIT_CLASS_ID IN (${placeholders})
		`;

		let enrollmentRequest = pool.request();
		creditClassIds.forEach((id, index) => {
			enrollmentRequest = enrollmentRequest.input(`id${index}`, parseInt(id));
		});

		const enrollmentResult = await enrollmentRequest.query(enrollmentCheckQuery);

		if (enrollmentResult.recordset[0].count > 0) {
			return NextResponse.json({
				success: false,
				error: 'Cannot delete credit classes with existing enrollments',
			});
		}

		// Delete credit classes
		const deleteQuery = `
			DELETE FROM CREDIT_CLASS 
			WHERE CREDIT_CLASS_ID IN (${placeholders})
		`;

		let deleteRequest = pool.request();
		creditClassIds.forEach((id, index) => {
			deleteRequest = deleteRequest.input(`id${index}`, parseInt(id));
		});

		const result = await deleteRequest.query(deleteQuery);

		return NextResponse.json({
			success: true,
			message: `${result.rowsAffected[0]} credit class(es) deleted successfully`,
			deletedCount: result.rowsAffected[0],
		});
	} catch (error) {
		console.error('Error deleting credit classes:', error);
		return NextResponse.json({
			success: false,
			error:
				error instanceof Error
					? error.message
					: 'Failed to delete credit classes',
		});
	}
}


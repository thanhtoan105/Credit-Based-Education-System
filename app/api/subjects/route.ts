import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentPool } from '@/lib/multi-database';
import { DepartmentService } from '@/lib/services/department.service';

interface SubjectData {
	SUBJECT_ID: string;
	SUBJECT_NAME: string;
	THEORY_HOURS: number;
	PRACTICE_HOURS: number;
}

export async function GET(request: NextRequest) {
	try {
		// Use primary database connection for subjects (they're shared across departments)
		const pool = await getDepartmentPool('MSI'); // Primary server
		const request_db = pool.request();

		// Use direct SQL query to get subjects
		const query = `SELECT SUBJECT_ID, SUBJECT_NAME, THEORY_HOURS, PRACTICE_HOURS FROM SUBJECT ORDER BY SUBJECT_ID`;
		const result = await request_db.query<SubjectData>(query);

		return NextResponse.json({
			success: true,
			subjects: result.recordset || [],
		});
	} catch (error) {
		console.error('Error fetching subjects:', error);
		return NextResponse.json({
			success: false,
			error:
				error instanceof Error ? error.message : 'Failed to fetch subjects',
		});
	}
}

// POST - Add new subject
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { subjectId, subjectName, theoryHours, practiceHours } = body;

		if (
			!subjectId ||
			!subjectName ||
			theoryHours === undefined ||
			practiceHours === undefined
		) {
			return NextResponse.json({
				success: false,
				error: 'All fields are required',
			});
		}

		// Validate hours are non-negative
		if (theoryHours < 0 || practiceHours < 0) {
			return NextResponse.json({
				success: false,
				error: 'Hours cannot be negative',
			});
		}

		// Use primary database connection
		const pool = await getDepartmentPool('MSI');

		// Check if SUBJECT_ID already exists using SP_CHECK_ID
		const checkRequest = pool.request();
		const checkResult = await checkRequest
			.input('ID', subjectId)
			.input('Type', 'SUBJECT_ID')
			.execute('SP_CHECK_ID');

		const returnValue = checkResult.returnValue;
		if (returnValue === 1) {
			return NextResponse.json({
				success: false,
				error: 'Subject ID already exists',
			});
		}

		// Insert new subject into the SUBJECT table
		const insertRequest = pool.request();
		const insertQuery = `
			INSERT INTO SUBJECT (SUBJECT_ID, SUBJECT_NAME, THEORY_HOURS, PRACTICE_HOURS)
			VALUES (@subjectId, @subjectName, @theoryHours, @practiceHours)
		`;

		await insertRequest
			.input('subjectId', subjectId)
			.input('subjectName', subjectName)
			.input('theoryHours', theoryHours)
			.input('practiceHours', practiceHours)
			.query(insertQuery);

		return NextResponse.json({
			success: true,
			message: 'Subject added successfully',
		});
	} catch (error) {
		console.error('Error adding subject:', error);
		return NextResponse.json({
			success: false,
			error: error instanceof Error ? error.message : 'Failed to add subject',
		});
	}
}

// PUT - Update existing subject
export async function PUT(request: NextRequest) {
	try {
		const body = await request.json();
		const { subjectId, subjectName, theoryHours, practiceHours } = body;

		if (
			!subjectId ||
			!subjectName ||
			theoryHours === undefined ||
			practiceHours === undefined
		) {
			return NextResponse.json({
				success: false,
				error: 'All fields are required',
			});
		}

		// Validate hours are non-negative
		if (theoryHours < 0 || practiceHours < 0) {
			return NextResponse.json({
				success: false,
				error: 'Hours cannot be negative',
			});
		}

		// Use primary database connection
		const pool = await getDepartmentPool('MSI');

		// Check if subject exists
		const checkRequest = pool.request();
		const checkQuery = `SELECT COUNT(*) as count FROM SUBJECT WHERE SUBJECT_ID = @subjectId`;
		const checkResult = await checkRequest
			.input('subjectId', subjectId)
			.query(checkQuery);

		if (checkResult.recordset[0].count === 0) {
			return NextResponse.json({
				success: false,
				error: 'Subject not found',
			});
		}

		// Update subject in the SUBJECT table
		const updateRequest = pool.request();
		const updateQuery = `
			UPDATE SUBJECT
			SET SUBJECT_NAME = @subjectName,
				THEORY_HOURS = @theoryHours,
				PRACTICE_HOURS = @practiceHours
			WHERE SUBJECT_ID = @subjectId
		`;

		await updateRequest
			.input('subjectId', subjectId)
			.input('subjectName', subjectName)
			.input('theoryHours', theoryHours)
			.input('practiceHours', practiceHours)
			.query(updateQuery);

		return NextResponse.json({
			success: true,
			message: 'Subject updated successfully',
		});
	} catch (error) {
		console.error('Error updating subject:', error);
		return NextResponse.json({
			success: false,
			error:
				error instanceof Error ? error.message : 'Failed to update subject',
		});
	}
}

// DELETE - Remove subject
export async function DELETE(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const subjectId = searchParams.get('subjectId');

		if (!subjectId) {
			return NextResponse.json({
				success: false,
				error: 'Subject ID parameter is required',
			});
		}

		// Use primary database connection
		const pool = await getDepartmentPool('MSI');

		// Check if subject exists
		const checkRequest = pool.request();
		const checkQuery = `SELECT COUNT(*) as count FROM SUBJECT WHERE SUBJECT_ID = @subjectId`;
		const checkResult = await checkRequest
			.input('subjectId', subjectId)
			.query(checkQuery);

		if (checkResult.recordset[0].count === 0) {
			return NextResponse.json({
				success: false,
				error: 'Subject not found',
			});
		}

		// Check if subject is referenced in CREDIT_CLASS table (foreign key constraint)
		const referenceRequest = pool.request();
		const referenceQuery = `SELECT COUNT(*) as count FROM CREDIT_CLASS WHERE SUBJECT_ID = @subjectId`;
		const referenceResult = await referenceRequest
			.input('subjectId', subjectId)
			.query(referenceQuery);

		if (referenceResult.recordset[0].count > 0) {
			return NextResponse.json({
				success: false,
				error: 'Cannot delete subject: it is referenced by credit classes',
			});
		}

		// Delete subject from the SUBJECT table
		const deleteRequest = pool.request();
		const deleteQuery = `DELETE FROM SUBJECT WHERE SUBJECT_ID = @subjectId`;
		await deleteRequest.input('subjectId', subjectId).query(deleteQuery);

		return NextResponse.json({
			success: true,
			message: 'Subject deleted successfully',
		});
	} catch (error) {
		console.error('Error deleting subject:', error);
		return NextResponse.json({
			success: false,
			error:
				error instanceof Error ? error.message : 'Failed to delete subject',
		});
	}
}

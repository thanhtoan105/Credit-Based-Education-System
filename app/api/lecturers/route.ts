import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentPool } from '@/lib/multi-database';
import { DepartmentService } from '@/lib/services/department.service';

interface LecturerData {
	LECTURER_ID: string;
	FACULTY_ID: string;
	LAST_NAME: string;
	FIRST_NAME: string;
	ACADEMIC_DEGREE?: string;
	ACADEMIC_TITLE?: string;
	SPECIALIZATION?: string;
}

// Subject-Lecturer mapping based on specializations and sample data
const getSubjectLecturerMapping = () => {
	return {
		'AV': ['GV05'], // English
		'CTDL': ['GV01', 'GV07'], // Data Structure & Algorithms
		'DSA': ['GV01'], // Algorithms and Data Structure
		'MMT': ['GV02', 'GV08'], // Computer Network
		'CSDL': ['GV02', 'GV07'], // Database
		'OOP': ['GV01', 'GV06'], // Object-Oriented Programming
		'WEB': ['GV03', 'GV06'], // Web Development
		'LTW': ['GV03', 'GV06'], // Web Programming
		'AI': ['GV04', 'GV08'], // Artificial Intelligence
		'SE': ['GV04'], // Software Engineering
		'OS': ['GV03'], // Operating System
		'HDH': ['GV03'], // Operating System
		'XLA': ['GV05'], // Image Processing
		'KTDH': ['GV05'], // Computer Graphics
	};
};

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const subjectId = searchParams.get('subjectId');

		// Use primary database connection for lecturers (they're shared across departments)
		const pool = await getDepartmentPool('MSI'); // Primary server
		const request_db = pool.request();

		let query = `
			SELECT
				LECTURER_ID,
				FACULTY_ID,
				LAST_NAME,
				FIRST_NAME,
				ACADEMIC_DEGREE,
				ACADEMIC_TITLE,
				SPECIALIZATION,
				CONCAT(RTRIM(LAST_NAME), ' ', RTRIM(FIRST_NAME)) as FULL_NAME
			FROM LECTURER
		`;

		// If subjectId is provided, filter lecturers who can teach that subject
		if (subjectId) {
			const subjectMapping = getSubjectLecturerMapping();
			const lecturerIds = subjectMapping[subjectId as keyof typeof subjectMapping] || [];
			
			if (lecturerIds.length === 0) {
				return NextResponse.json({
					success: true,
					lecturers: [],
					message: `No lecturers found for subject ${subjectId}`,
				});
			}

			const placeholders = lecturerIds.map((_, index) => `@lecturerId${index}`).join(',');
			query += ` WHERE LECTURER_ID IN (${placeholders})`;
			
			lecturerIds.forEach((id, index) => {
				request_db.input(`lecturerId${index}`, id);
			});
		}

		query += ` ORDER BY LAST_NAME, FIRST_NAME`;

		const result = await request_db.query<LecturerData & { FULL_NAME: string }>(
			query,
		);

		// Add subject codes to each lecturer for frontend compatibility
		const lecturersWithSubjects = result.recordset.map(lecturer => {
			const subjectMapping = getSubjectLecturerMapping();
			const subjectCodes = Object.keys(subjectMapping).filter(
				subject => subjectMapping[subject as keyof typeof subjectMapping].includes(lecturer.LECTURER_ID)
			);
			
			return {
				...lecturer,
				SUBJECT_CODES: subjectCodes,
			};
		});

		return NextResponse.json({
			success: true,
			lecturers: lecturersWithSubjects,
			subjectFilter: subjectId || null,
		});
	} catch (error) {
		console.error('Error fetching lecturers:', error);
		return NextResponse.json({
			success: false,
			error:
				error instanceof Error ? error.message : 'Failed to fetch lecturers',
		});
	}
}

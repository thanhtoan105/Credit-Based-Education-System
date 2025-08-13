import { NextRequest, NextResponse } from 'next/server';
import { MultiAuthService } from '@/lib/services/multi-auth.service';
import { DepartmentService } from '@/lib/services/department.service';

export async function POST(request: NextRequest) {
	try {
		// Parse request body
		const body = await request.json();
		const { username, password, department, isStudentLogin = false } = body;

		// Validate input
		if (!username || !department) {
			return NextResponse.json(
				{
					success: false,
					error: 'Username and department are required',
				},
				{ status: 400 },
			);
		}

		// Validate password only for teacher login (students don't need password)
		if (!isStudentLogin && !password) {
			return NextResponse.json(
				{
					success: false,
					error: 'Password is required for teacher login',
				},
				{ status: 400 },
			);
		}

		// Validate department exists
		const validDepartment = await DepartmentService.getDepartmentByBranchName(
			department,
		);
		if (!validDepartment) {
			return NextResponse.json(
				{
					success: false,
					error: 'Invalid department selection',
				},
				{ status: 400 },
			);
		}

		// Attempt authentication using enhanced multi-database service
		const authResult = await MultiAuthService.authenticate(
			username.trim(),
			password,
			department,
			isStudentLogin,
		);

		if (authResult.success && authResult.user) {
			// Return successful authentication
			return NextResponse.json({
				success: true,
				user: authResult.user,
				authType: 'multi-database',
				message: authResult.message || 'Authentication successful',
				loginType: isStudentLogin ? 'student' : 'teacher',
			});
		} else {
			// Return authentication failure
			return NextResponse.json(
				{
					success: false,
					error: authResult.error || 'Invalid credentials',
					loginType: isStudentLogin ? 'student' : 'teacher',
				},
				{ status: 401 },
			);
		}
	} catch (error) {
		console.error('Login API error:', error);

		return NextResponse.json(
			{
				success: false,
				error: 'Internal server error. Please try again.',
			},
			{ status: 500 },
		);
	}
}

// Optional: Handle GET requests for testing
export async function GET(request: NextRequest) {
	return NextResponse.json({
		message: 'Login API endpoint',
		endpoints: {
			POST: '/api/auth/login - Authenticate user with username, password, and department',
		},
		requiredFields: ['username', 'password', 'department'],
		authMethod: 'SP_LOGIN stored procedure',
		databaseType: 'Multi-database with dynamic connections',
	});
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Loader2,
	Database,
	AlertCircle,
	GraduationCap,
	Users,
} from 'lucide-react';
import { toast } from '@/lib/toast';

interface Department {
	value: string;
	label: string;
	serverName: string;
}

interface LoginFormData {
	username: string;
	password: string;
	department: string;
	isStudentLogin: boolean;
}

export default function LoginForm() {
	const [formData, setFormData] = useState<LoginFormData>({
		username: '',
		password: '',
		department: '',
		isStudentLogin: false,
	});
	const [departments, setDepartments] = useState<Department[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
	const [error, setError] = useState('');
	const [connectionStatus, setConnectionStatus] = useState<
		'checking' | 'connected' | 'failed'
	>('checking');

	const router = useRouter();

	// Load departments on component mount
	useEffect(() => {
		loadDepartments();
	}, []);

	const loadDepartments = async () => {
		try {
			setIsLoadingDepartments(true);
			setConnectionStatus('checking');

			const response = await fetch('/api/departments');
			const data = await response.json();

			if (data.success) {
				setDepartments(data.departments);
				setConnectionStatus('connected');

				if (data.departments.length === 0) {
					setError('No departments found. Please contact administrator.');
				}
			} else {
				setConnectionStatus('failed');
				setError('Failed to load departments. Database setup required.');
				setDepartments([]);
			}
		} catch (error) {
			console.error('Error loading departments:', error);
			setConnectionStatus('failed');
			setError('Database connection failed. Please run database setup first.');
			setDepartments([]);
		} finally {
			setIsLoadingDepartments(false);
		}
	};

	const handleInputChange = (
		field: keyof LoginFormData,
		value: string | boolean,
	) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));

		// Clear error when user starts typing
		if (error) {
			setError('');
		}
	};

	const handleStudentLoginChange = (checked: boolean) => {
		handleInputChange('isStudentLogin', checked);
		// Clear username when switching modes to avoid confusion
		if (formData.username) {
			handleInputChange('username', '');
		}
	};

	const validateForm = (): boolean => {
		if (!formData.username.trim()) {
			setError('Username is required');
			return false;
		}

		// Password is only required for teachers, not students
		if (!formData.isStudentLogin && !formData.password.trim()) {
			setError('Password is required for teacher login');
			return false;
		}

		if (!formData.department) {
			setError('Please select a department');
			return false;
		}

		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setIsLoading(true);
		setError('');

		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					username: formData.username.trim(),
					password: formData.password,
					department: formData.department,
					isStudentLogin: formData.isStudentLogin,
				}),
			});

			const data = await response.json();

			if (data.success && data.user) {
				// Store user session using session manager
				const { saveUserSession } = await import('@/lib/session');
				saveUserSession(data.user, 'multi-database');

				// Store login timestamp to prevent duplicate welcome toast
				localStorage.setItem('loginTime', Date.now().toString());

				// Show success toast with Sonner
				toast.success({
					title: `Welcome back, ${data.user.fullName}!`,
					duration: 2000, // Shorter duration for faster redirect
				});

				// Redirect to dashboard immediately
				router.push('/dashboard');
			} else {
				// Show error toast with Sonner
				toast.error({
					title: data.error || 'Login failed. Please check your credentials.',
					duration: 5000,
				});
				setError(data.error || 'Login failed. Please check your credentials.');
			}
		} catch (error) {
			console.error('Login error:', error);

			// Show connection error toast
			toast.error({
				title: 'Connection Failed - Please check your internet connection',
				duration: 5000,
			});

			setError('Connection failed. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const getConnectionStatusIcon = () => {
		switch (connectionStatus) {
			case 'checking':
				return <Loader2 className='h-4 w-4 animate-spin' />;
			case 'connected':
				return <Database className='h-4 w-4 text-green-600' />;
			case 'failed':
				return <AlertCircle className='h-4 w-4 text-red-600' />;
		}
	};

	const getConnectionStatusText = () => {
		switch (connectionStatus) {
			case 'checking':
				return 'Connecting to database...';
			case 'connected':
				return 'Database connected';
			case 'failed':
				return 'Database connection failed';
		}
	};

	return (
		<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4'>
			<Card className='w-full max-w-md'>
				<CardHeader className='space-y-1'>
					<CardTitle className='text-2xl font-bold text-center'>
						QLDSV_TC - Student Management System
					</CardTitle>
				</CardHeader>

				<CardContent>
					<form onSubmit={handleSubmit} className='space-y-4'>
						{/* Error Alert */}
						{error && (
							<Alert variant='destructive'>
								<AlertCircle className='h-4 w-4' />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						{/* Username Field */}
						<div className='space-y-2'>
							<Label htmlFor='username'>Username</Label>
							<Input
								id='username'
								type='text'
								placeholder='Enter your username'
								value={formData.username}
								onChange={(e) => handleInputChange('username', e.target.value)}
								disabled={isLoading}
								className='w-full'
							/>
						</div>

						{/* Password Field */}
						<div className='space-y-2'>
							<Label htmlFor='password'>
								Password{' '}
								{formData.isStudentLogin && (
									<span className='text-gray-500 text-sm'>
										(optional for students)
									</span>
								)}
							</Label>
							<Input
								id='password'
								type='password'
								placeholder={
									formData.isStudentLogin
										? 'Password (optional for students)'
										: 'Enter your password'
								}
								value={formData.password}
								onChange={(e) => handleInputChange('password', e.target.value)}
								disabled={isLoading}
								className='w-full'
							/>
						</div>

						{/* Student/Teacher Login Selection */}
						<div className='space-y-2'>
							<div className='flex items-center space-x-2'>
								<Checkbox
									id='studentLogin'
									checked={formData.isStudentLogin}
									onCheckedChange={handleStudentLoginChange}
									disabled={isLoading}
								/>
								<Label
									htmlFor='studentLogin'
									className='flex items-center space-x-2 cursor-pointer'
								>
									{formData.isStudentLogin ? (
										<GraduationCap className='h-4 w-4 text-blue-600' />
									) : (
										<Users className='h-4 w-4 text-green-600' />
									)}
									<span>
										{formData.isStudentLogin
											? 'Student Login'
											: 'Teacher Login'}
									</span>
								</Label>
							</div>
						</div>

						{/* Department Selection */}
						<div className='space-y-2'>
							<Label htmlFor='department'>Department</Label>
							<Select
								value={formData.department}
								onValueChange={(value) =>
									handleInputChange('department', value)
								}
								disabled={isLoading || isLoadingDepartments}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={
											isLoadingDepartments
												? 'Loading departments...'
												: 'Select your department'
										}
									/>
								</SelectTrigger>
								<SelectContent>
									{departments.map((dept) => (
										<SelectItem key={dept.value} value={dept.value}>
											{dept.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Login Button */}
						<Button
							type='submit'
							className='w-full'
							disabled={isLoading || isLoadingDepartments}
						>
							{isLoading ? (
								<>
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									Signing in...
								</>
							) : (
								'Sign In'
							)}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

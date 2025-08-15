'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PageAccessGuard } from '@/components/dashboard/page-access-guard';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { toast } from '@/lib/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from '@/components/ui/sonner';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
	Search,
	UserSearch,
	Calendar,
	BookOpen,
	CheckCircle,
	GraduationCap,
	Users,
	AlertCircle,
	X,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/session';

// Types
interface StudentInfo {
	STUDENT_ID: string;
	FULL_NAME: string;
	CLASS_ID: string;
	CLASS_NAME: string;
	FACULTY_NAME: string;
}

interface CreditClass {
	CREDIT_CLASS_ID: number;
	SUBJECT_ID: string;
	SUBJECT_NAME: string;
	GROUP_NUMBER: number;
	LECTURER_NAME: string;
	MIN_STUDENTS: number;
	ENROLLED_STUDENTS: number;
}

interface EnrolledClass {
	CREDIT_CLASS_ID: number;
	ACADEMIC_YEAR: string;
	SEMESTER: number;
	SUBJECT_NAME: string;
	LECTURER_NAME: string;
	GROUP: number;
}

function CourseRegistrationPageContent() {
	// State management
	const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
	const [cachedFacultyId, setCachedFacultyId] = useState<string | null>(null);
	const [academicYear, setAcademicYear] = useState('');
	const [semester, setSemester] = useState('');
	const [availableClasses, setAvailableClasses] = useState<CreditClass[]>([]);
	const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
	const [selectedClass, setSelectedClass] = useState<CreditClass | null>(null);
	const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [selectedClassForRegistration, setSelectedClassForRegistration] =
		useState<CreditClass | null>(null);
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [selectedClassForCancellation, setSelectedClassForCancellation] =
		useState<EnrolledClass | null>(null);
	const [refreshTrigger, setRefreshTrigger] = useState(0);
	const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const [academicYears, setAcademicYears] = useState<string[]>([]);
	const [semesters, setSemesters] = useState<string[]>([]);

	// Get current user and automatically load student information
	useEffect(() => {
		const loadStudentInfo = async () => {
			const currentUser = getCurrentUser();
			if (!currentUser || !currentUser.isStudent) {
				toast.error({
					title: 'Access denied. Only students can access course registration.',
				});
				return;
			}

			setIsLoading(true);
			try {
				const response = await fetch(
					`/api/students?department=${encodeURIComponent(
						currentUser.department?.branch_name || '',
					)}&studentId=${encodeURIComponent(currentUser.username)}`,
				);

				const data = await response.json();
				if (data.success && data.student) {
					const student = data.student;
					setStudentInfo(student);

					// Cache faculty ID by getting it from class info
					if (student.CLASS_ID) {
						try {
							const classResponse = await fetch(
								`/api/classes?department=${encodeURIComponent(
									currentUser.department?.branch_name || '',
								)}&classId=${student.CLASS_ID}`,
							);

							const classData = await classResponse.json();
							if (
								classData.success &&
								classData.classes &&
								classData.classes.length > 0
							) {
								const facultyId = classData.classes[0].FACULTY_ID || 'IT';
								setCachedFacultyId(facultyId);
								console.log('🏫 Cached Faculty ID:', facultyId);
							}
						} catch (error) {
							console.error('Error caching faculty ID:', error);
							setCachedFacultyId('IT'); // Fallback
						}
					}

					toast.success({
						title: `Welcome ${student.FULL_NAME}`,
					});
				} else {
					toast.error({
						title: 'Failed to load student information',
					});
				}
			} catch (error) {
				console.error('Error loading student info:', error);
				toast.error({
					title: 'Error loading student information',
				});
			} finally {
				setIsLoading(false);
			}
		};

		loadStudentInfo();
	}, []);

	// Load academic years
	useEffect(() => {
		const loadAcademicYears = async () => {
			const currentUser = getCurrentUser();
			if (!currentUser) return;

			try {
				const response = await fetch(
					`/api/academic-years?department=${encodeURIComponent(
						currentUser.department?.branch_name || '',
					)}`,
				);

				const data = await response.json();
				if (data.success) {
					setAcademicYears(data.academicYears || []);
				} else {
					console.error('Failed to load academic years:', data.error);
				}
			} catch (error) {
				console.error('Error loading academic years:', error);
			}
		};

		loadAcademicYears();
	}, []);

	// Load semesters when academic year changes
	useEffect(() => {
		const loadSemesters = async () => {
			if (!academicYear) {
				setSemesters([]);
				setSemester(''); // Reset semester when academic year changes
				return;
			}

			const currentUser = getCurrentUser();
			if (!currentUser) return;

			// Reset semester when academic year changes
			setSemester('');

			try {
				const response = await fetch(
					`/api/semesters?department=${encodeURIComponent(
						currentUser.department?.branch_name || '',
					)}&academicYear=${encodeURIComponent(academicYear)}`,
				);

				const data = await response.json();
				if (data.success) {
					setSemesters(data.semesters || []);
				} else {
					console.error('Failed to load semesters:', data.error);
				}
			} catch (error) {
				console.error('Error loading semesters:', error);
			}
		};

		loadSemesters();
	}, [academicYear]);

	// Function to refresh enrolled classes
	const refreshEnrolledClasses = useCallback(async () => {
		console.log('🔄 Refreshing enrolled classes...', {
			academicYear,
			semester,
			studentId: studentInfo?.STUDENT_ID,
		});

		if (!academicYear || !semester || !studentInfo) {
			setEnrolledClasses([]);
			return;
		}

		const currentUser = getCurrentUser();
		if (!currentUser) return;

		try {
			// Use cached faculty ID if available, otherwise fallback to lookup
			let facultyId = cachedFacultyId || 'IT';

			if (!cachedFacultyId) {
				console.log('⚠️ Faculty ID not cached, performing lookup...');
				const classResponse = await fetch(
					`/api/classes?department=${encodeURIComponent(
						currentUser.department?.branch_name || '',
					)}&classId=${studentInfo.CLASS_ID}`,
				);

				const classData = await classResponse.json();
				if (
					classData.success &&
					classData.classes &&
					classData.classes.length > 0
				) {
					facultyId = classData.classes[0].FACULTY_ID || 'IT';
					setCachedFacultyId(facultyId); // Cache it for next time
				}
			} else {
				console.log('⚡ Using cached Faculty ID:', facultyId);
			}

			// Call SP_STUDENT_ENROLLED_CREDIT_CLASSES
			const response = await fetch(
				`/api/student-enrolled-classes?department=${encodeURIComponent(
					currentUser.department?.branch_name || '',
				)}&studentId=${encodeURIComponent(
					studentInfo.STUDENT_ID,
				)}&academicYear=${encodeURIComponent(
					academicYear,
				)}&semester=${encodeURIComponent(
					semester,
				)}&facultyId=${encodeURIComponent(facultyId)}`,
			);

			const data = await response.json();
			console.log('📊 Enrolled classes API response:', data);

			if (data.success) {
				console.log(
					'✅ Setting enrolled classes:',
					data.enrolledClasses?.length || 0,
					'classes',
				);
				setEnrolledClasses(data.enrolledClasses || []);
			} else {
				console.error('❌ Failed to load enrolled classes:', data.error);
				setEnrolledClasses([]);
			}
		} catch (error) {
			console.error('Error loading enrolled classes:', error);
			setEnrolledClasses([]);
		}
	}, [academicYear, semester, studentInfo, cachedFacultyId]);

	// Force refresh when refreshTrigger changes
	useEffect(() => {
		if (refreshTrigger > 0) {
			refreshEnrolledClasses();
		}
	}, [refreshTrigger, refreshEnrolledClasses]);

	// Debounced search function
	const debouncedSearch = useCallback((searchFn: () => Promise<void>) => {
		// Clear previous timeout
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current);
		}

		// Set new timeout
		searchTimeoutRef.current = setTimeout(() => {
			searchFn();
		}, 300); // 300ms debounce
	}, []);

	// Search available classes (actual search logic)
	const performClassSearch = async () => {
		if (!academicYear || !semester || !studentInfo) {
			toast.error({
				title: 'Please select both academic year and semester.',
			});
			return;
		}

		const currentUser = getCurrentUser();
		if (!currentUser) {
			toast.error({
				title: 'User session not found',
			});
			return;
		}

		setIsLoading(true);

		try {
			// First, get the faculty ID from the student's class information
			// We need to make a separate API call to get the faculty ID from the class
			const classResponse = await fetch(
				`/api/classes?department=${encodeURIComponent(
					currentUser.department?.branch_name || '',
				)}&classId=${studentInfo.CLASS_ID}`,
			);

			const classData = await classResponse.json();
			let facultyId = 'IT'; // Default fallback

			if (
				classData.success &&
				classData.classes &&
				classData.classes.length > 0
			) {
				facultyId = classData.classes[0].FACULTY_ID || 'IT';
			}

			// Call SP_CREDIT_CLASS_LIST through the API
			const response = await fetch(
				`/api/credit-classes?department=${encodeURIComponent(
					currentUser.department?.branch_name || '',
				)}&facultyId=${facultyId}&academicYear=${academicYear}&semester=${semester}`,
			);

			const data = await response.json();
			if (data.success) {
				// Filter out cancelled classes (already done in the stored procedure)
				setAvailableClasses(data.creditClasses);

				// Load enrolled classes in parallel (don't await)
				refreshEnrolledClasses().catch((error) =>
					console.error('Error loading enrolled classes:', error),
				);

				toast.success({
					title: `Found ${data.creditClasses.length} available classes for ${academicYear} - Semester ${semester}`,
				});
			} else {
				toast.error({
					title: data.error || 'Failed to load credit classes',
				});
			}
		} catch (error) {
			console.error('Error loading credit classes:', error);
			toast.error({
				title: 'Error loading credit classes',
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Public search function with debouncing
	const handleClassSearch = () => {
		debouncedSearch(performClassSearch);
	};

	// Check if user is already enrolled in a class
	const isAlreadyEnrolled = (classData: CreditClass) => {
		return enrolledClasses.some(
			(enrolledClass) =>
				enrolledClass.CREDIT_CLASS_ID === classData.CREDIT_CLASS_ID,
		);
	};

	// Handle class selection - now triggers registration dialog
	const handleClassSelection = (classData: CreditClass) => {
		// Check if already enrolled
		if (isAlreadyEnrolled(classData)) {
			toast.error({
				title: `Already enrolled in ${classData.SUBJECT_NAME} - Group ${classData.GROUP_NUMBER}`,
			});
			return;
		}

		if (selectedClassId === classData.CREDIT_CLASS_ID) {
			// Deselect if already selected
			setSelectedClassId(null);
			setSelectedClass(null);
		} else {
			// Select new class and immediately show registration dialog
			setSelectedClassId(classData.CREDIT_CLASS_ID);
			setSelectedClass(classData);
			setSelectedClassForRegistration(classData);
			setShowConfirmDialog(true);
		}
	};

	// Confirm registration
	const confirmRegister = async () => {
		if (!studentInfo || !selectedClassForRegistration) return;

		const currentUser = getCurrentUser();
		if (!currentUser) {
			toast.error({
				title: 'User session not found',
			});
			return;
		}

		setIsLoading(true);

		try {
			const response = await fetch('/api/enrollment', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					departmentName: currentUser.department?.branch_name || '',
					studentId: studentInfo.STUDENT_ID,
					creditClassId: selectedClassForRegistration.CREDIT_CLASS_ID,
				}),
			});

			const data = await response.json();
			if (data.success) {
				console.log('🎉 Registration successful, triggering refresh...');

				toast.success({
					title: `Successfully registered for ${selectedClassForRegistration.SUBJECT_NAME}`,
				});

				// Force refresh enrolled classes by updating trigger
				setTimeout(() => {
					console.log('⏰ Triggering enrolled classes refresh...');
					setRefreshTrigger((prev) => prev + 1);
				}, 500);
			} else {
				toast.error({
					title: data.error || 'Failed to register for the class',
				});
			}
		} catch (error) {
			console.error('Error registering for class:', error);
			toast.error({
				title: 'An error occurred while registering for the class',
			});
		} finally {
			setIsLoading(false);
			setShowConfirmDialog(false);
			setSelectedClassForRegistration(null);
		}
	};

	// Handle cancel enrollment
	const handleCancelEnrollment = (enrolledClass: EnrolledClass) => {
		setSelectedClassForCancellation(enrolledClass);
		setShowCancelDialog(true);
	};

	// Confirm cancel enrollment
	const confirmCancelEnrollment = async () => {
		if (!studentInfo || !selectedClassForCancellation) return;

		const currentUser = getCurrentUser();
		if (!currentUser) {
			toast.error({
				title: 'User session not found',
			});
			return;
		}

		setIsLoading(true);

		try {
			const response = await fetch('/api/enrollment', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					departmentName: currentUser.department?.branch_name || '',
					studentId: studentInfo.STUDENT_ID,
					creditClassId: selectedClassForCancellation.CREDIT_CLASS_ID,
				}),
			});

			const data = await response.json();
			if (data.success) {
				console.log('🗑️ Cancellation successful, triggering refresh...');

				toast.success({
					title: `Successfully cancelled enrollment for ${selectedClassForCancellation.SUBJECT_NAME}`,
				});

				// Force refresh enrolled classes by updating trigger
				setTimeout(() => {
					console.log(
						'⏰ Triggering enrolled classes refresh after cancellation...',
					);
					setRefreshTrigger((prev) => prev + 1);
				}, 500);
			} else {
				toast.error({
					title: data.error || 'Failed to cancel enrollment',
				});
			}
		} catch (error) {
			console.error('Error cancelling enrollment:', error);
			toast.error({
				title: 'An error occurred while cancelling enrollment',
			});
		} finally {
			setIsLoading(false);
			setShowCancelDialog(false);
			setSelectedClassForCancellation(null);
		}
	};

	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'>
			<Toaster />

			{/* Header */}
			<div className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm'>
				<div className='container mx-auto px-6 py-4'>
					<div className='flex justify-between items-center'>
						<div className='flex items-center space-x-4'>
							<div className='bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg'>
								<GraduationCap className='h-6 w-6 text-white' />
							</div>
							<div>
								<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
									Course Registration
								</h1>
								<p className='text-sm text-gray-500 dark:text-gray-400'>
									Register for credit-based courses for the academic year
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className='container mx-auto px-6 py-6'>
				{/* Top Section - Student Information and Academic Selection */}
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
					{/* Student Information */}
					<Card className='shadow-lg border-0 bg-white/80 backdrop-blur-sm'>
						<CardHeader className='pb-3'>
							<CardTitle className='flex items-center gap-2 text-lg'>
								<UserSearch className='h-5 w-5 text-blue-600' />
								Student Information
							</CardTitle>
							<CardDescription>
								Your student information for course registration
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							{/* Student Info Display */}
							{studentInfo ? (
								<div className='p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800'>
									<div className='flex items-center gap-2 mb-2'>
										<CheckCircle className='h-4 w-4 text-green-600' />
										<h3 className='font-semibold text-green-800 dark:text-green-200'>
											Student Information
										</h3>
									</div>
									<div className='grid grid-cols-2 gap-2 text-sm'>
										<div>
											<span className='text-gray-600 dark:text-gray-400'>
												Student ID:
											</span>
											<div className='font-medium'>
												{studentInfo.STUDENT_ID}
											</div>
										</div>
										<div>
											<span className='text-gray-600 dark:text-gray-400'>
												Full Name:
											</span>
											<div className='font-medium'>{studentInfo.FULL_NAME}</div>
										</div>
										<div>
											<span className='text-gray-600 dark:text-gray-400'>
												Class ID:
											</span>
											<Badge variant='secondary' className='mt-1'>
												{studentInfo.CLASS_ID}
											</Badge>
										</div>
										<div>
											<span className='text-gray-600 dark:text-gray-400'>
												Class Name:
											</span>
											<div className='font-medium'>
												{studentInfo.CLASS_NAME}
											</div>
										</div>
										<div className='col-span-2'>
											<span className='text-gray-600 dark:text-gray-400'>
												Faculty:
											</span>
											<div className='font-medium'>
												{studentInfo.FACULTY_NAME}
											</div>
										</div>
									</div>
								</div>
							) : (
								<div className='p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
									<div className='flex items-center gap-2 text-gray-500'>
										{isLoading ? (
											<>
												<div className='h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600'></div>
												<span>Loading student information...</span>
											</>
										) : (
											<>
												<AlertCircle className='h-4 w-4' />
												<span>Unable to load student information</span>
											</>
										)}
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Academic Year & Semester Selection */}
					<Card
						className={`shadow-lg border-0 bg-white/80 backdrop-blur-sm transition-all duration-200 ${
							studentInfo ? 'opacity-100' : 'opacity-50'
						}`}
					>
						<CardHeader className='pb-3'>
							<CardTitle className='flex items-center gap-2 text-lg'>
								<Calendar className='h-5 w-5 text-indigo-600' />
								Academic Period
							</CardTitle>
							<CardDescription>
								Select academic year and semester to view available courses
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='grid grid-cols-1 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='academicYear' className='text-sm font-medium'>
										Academic Year
									</Label>
									<Select
										value={academicYear}
										onValueChange={setAcademicYear}
										disabled={!studentInfo}
									>
										<SelectTrigger className='border-gray-300 focus:border-indigo-500'>
											<SelectValue placeholder='Select academic year' />
										</SelectTrigger>
										<SelectContent>
											{academicYears.length > 0 ? (
												academicYears.map((year) => (
													<SelectItem key={year} value={year}>
														{year}
													</SelectItem>
												))
											) : (
												<SelectItem value='loading' disabled>
													Loading academic years...
												</SelectItem>
											)}
										</SelectContent>
									</Select>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='semester' className='text-sm font-medium'>
										Semester
									</Label>
									<Select
										value={semester}
										onValueChange={setSemester}
										disabled={!studentInfo || !academicYear}
									>
										<SelectTrigger className='border-gray-300 focus:border-indigo-500'>
											<SelectValue
												placeholder={
													!academicYear
														? 'Select academic year first'
														: 'Select semester'
												}
											/>
										</SelectTrigger>
										<SelectContent>
											{!academicYear ? (
												<SelectItem value='no-year' disabled>
													Select academic year first
												</SelectItem>
											) : semesters.length > 0 ? (
												semesters.map((sem) => (
													<SelectItem key={sem} value={sem}>
														Semester {sem}
													</SelectItem>
												))
											) : (
												<SelectItem value='loading' disabled>
													Loading semesters...
												</SelectItem>
											)}
										</SelectContent>
									</Select>
								</div>

								<Button
									onClick={handleClassSearch}
									disabled={
										isLoading || !academicYear || !semester || !studentInfo
									}
									className='w-full bg-indigo-600 hover:bg-indigo-700 shadow-sm'
								>
									<Search className='mr-2 h-4 w-4' />
									Search Available Classes
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Main Content Area */}
				<div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
					{/* Available Classes - Takes up 2 columns */}
					<div className='xl:col-span-2 space-y-6'>
						{/* Available Credit Classes */}
						{availableClasses.length > 0 && (
							<Card className='shadow-lg border-0 bg-white/80 backdrop-blur-sm'>
								<CardHeader className='pb-3'>
									<div className='flex items-center justify-between'>
										<div className='flex items-center gap-2'>
											<BookOpen className='h-5 w-5 text-emerald-600' />
											<CardTitle className='text-lg'>
												Available Classes
											</CardTitle>
										</div>
										<Badge
											variant='secondary'
											className='bg-emerald-100 text-emerald-800'
										>
											{availableClasses.length} classes found
										</Badge>
									</div>
									<CardDescription>
										Select a class to register for {academicYear} - Semester{' '}
										{semester}
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className='space-y-3'>
										{isLoading ? (
											// Loading skeletons
											Array.from({ length: 3 }).map((_, index) => (
												<div
													key={index}
													className='p-4 rounded-lg border-2 border-gray-200'
												>
													<div className='flex items-start gap-3'>
														<Skeleton className='h-4 w-4 mt-1' />
														<div className='flex-1 space-y-2'>
															<div className='flex items-center gap-2'>
																<Skeleton className='h-5 w-48' />
																<Skeleton className='h-4 w-16' />
															</div>
															<div className='grid grid-cols-3 gap-2'>
																<Skeleton className='h-4 w-20' />
																<Skeleton className='h-4 w-24' />
																<Skeleton className='h-4 w-32' />
															</div>
															<div className='flex items-center gap-4'>
																<Skeleton className='h-4 w-16' />
																<Skeleton className='h-4 w-20' />
																<Skeleton className='h-4 w-12' />
															</div>
														</div>
													</div>
												</div>
											))
										) : availableClasses.length > 0 ? (
											availableClasses.map((classData) => (
												<div
													key={classData.CREDIT_CLASS_ID}
													className={`p-4 rounded-lg border-2 transition-all duration-200 ${
														isAlreadyEnrolled(classData)
															? 'border-green-500 bg-green-50 dark:bg-green-900/20 cursor-not-allowed opacity-75'
															: selectedClassId === classData.CREDIT_CLASS_ID
															? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 cursor-pointer hover:shadow-md'
															: 'border-gray-200 hover:border-gray-300 bg-white dark:bg-gray-800 cursor-pointer hover:shadow-md'
													}`}
													onClick={() => handleClassSelection(classData)}
												>
													<div className='flex items-start justify-between'>
														<div className='flex items-start gap-3 flex-1'>
															<Checkbox
																checked={
																	selectedClassId ===
																		classData.CREDIT_CLASS_ID ||
																	isAlreadyEnrolled(classData)
																}
																disabled={isAlreadyEnrolled(classData)}
																onCheckedChange={() =>
																	handleClassSelection(classData)
																}
																className='mt-1'
															/>
															<div className='flex-1 space-y-2'>
																<div className='flex items-center gap-2'>
																	<h3 className='font-semibold text-gray-900 dark:text-white'>
																		{classData.SUBJECT_NAME}
																	</h3>
																	<Badge variant='outline' className='text-xs'>
																		{classData.SUBJECT_ID}
																	</Badge>
																</div>
																<div className='grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400'>
																	<div className='flex items-center gap-1'>
																		<span className='font-medium'>ID:</span>{' '}
																		{classData.CREDIT_CLASS_ID}
																	</div>
																	<div className='flex items-center gap-1'>
																		<Users className='h-3 w-3' />
																		<span>Group {classData.GROUP_NUMBER}</span>
																	</div>
																	<div className='flex items-center gap-1'>
																		<span className='font-medium'>
																			Instructor:
																		</span>{' '}
																		{classData.LECTURER_NAME}
																	</div>
																</div>
																<div className='flex items-center justify-between'>
																	<div className='flex items-center gap-4 text-sm'>
																		<div className='flex items-center gap-1'>
																			<span className='text-gray-500'>
																				Enrolled:
																			</span>
																			<span className='text-blue-600 font-semibold'>
																				{classData.ENROLLED_STUDENTS || 0}
																			</span>
																		</div>
																		<div className='flex items-center gap-1'>
																			<span className='text-gray-500'>
																				Min required:
																			</span>
																			<span className='font-medium'>
																				{classData.MIN_STUDENTS}
																			</span>
																		</div>
																		{isAlreadyEnrolled(classData) ? (
																			<Badge
																				variant='default'
																				className='text-xs bg-green-600'
																			>
																				Already Enrolled
																			</Badge>
																		) : (
																			<Badge
																				variant='default'
																				className='text-xs bg-blue-600'
																			>
																				Available
																			</Badge>
																		)}
																	</div>
																</div>
															</div>
														</div>
													</div>
												</div>
											))
										) : (
											// Empty state
											<div className='text-center py-8 text-gray-500'>
												<BookOpen className='mx-auto h-12 w-12 mb-3 text-gray-300' />
												<h3 className='font-semibold mb-1'>No Classes Found</h3>
												<p className='text-sm'>
													No available classes found for the selected academic
													year and semester.
												</p>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						)}

						{/* Enrolled Classes Table */}
						{studentInfo && academicYear && semester && (
							<Card className='shadow-lg border-0 bg-white/80 backdrop-blur-sm'>
								<CardHeader className='pb-3'>
									<div className='flex items-center justify-between'>
										<div className='flex items-center gap-2'>
											<CheckCircle className='h-5 w-5 text-green-600' />
											<CardTitle className='text-lg'>
												My Enrolled Classes
											</CardTitle>
										</div>
										<Badge
											variant='secondary'
											className='bg-green-100 text-green-800'
										>
											{enrolledClasses.length} classes
										</Badge>
									</div>
									<CardDescription>
										Classes you are enrolled in for {academicYear} - Semester{' '}
										{semester}
									</CardDescription>
								</CardHeader>
								<CardContent>
									{enrolledClasses.length > 0 ? (
										<div className='overflow-x-auto'>
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Class ID</TableHead>
														<TableHead>Subject Name</TableHead>
														<TableHead>Group</TableHead>
														<TableHead>Lecturer</TableHead>
														<TableHead>Academic Year</TableHead>
														<TableHead>Semester</TableHead>
														<TableHead>Actions</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{enrolledClasses.map((enrolledClass) => (
														<TableRow key={enrolledClass.CREDIT_CLASS_ID}>
															<TableCell className='font-medium'>
																{enrolledClass.CREDIT_CLASS_ID}
															</TableCell>
															<TableCell>
																{enrolledClass.SUBJECT_NAME}
															</TableCell>
															<TableCell>
																<Badge variant='outline'>
																	Group {enrolledClass.GROUP}
																</Badge>
															</TableCell>
															<TableCell>
																{enrolledClass.LECTURER_NAME}
															</TableCell>
															<TableCell>
																{enrolledClass.ACADEMIC_YEAR}
															</TableCell>
															<TableCell>
																<Badge variant='secondary'>
																	Semester {enrolledClass.SEMESTER}
																</Badge>
															</TableCell>
															<TableCell>
																<Button
																	onClick={() =>
																		handleCancelEnrollment(enrolledClass)
																	}
																	disabled={isLoading}
																	size='sm'
																	variant='destructive'
																	className='h-8'
																>
																	<X className='mr-1 h-3 w-3' />
																	Cancel
																</Button>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</div>
									) : (
										<div className='text-center py-8 text-gray-500'>
											<BookOpen className='mx-auto h-12 w-12 mb-3 text-gray-300' />
											<h3 className='font-semibold mb-1'>
												No Enrolled Classes
											</h3>
											<p className='text-sm'>
												{!academicYear || !semester
													? 'Select academic year and semester to view enrolled classes'
													: 'You are not enrolled in any classes for this period'}
											</p>
										</div>
									)}
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			</div>

			{/* Confirmation Dialog */}
			<AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirm Registration</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to register for{' '}
							<strong>{selectedClassForRegistration?.SUBJECT_NAME}</strong>?
							<br />
							<br />
							<strong>Details:</strong>
							<br />
							Subject ID: {selectedClassForRegistration?.SUBJECT_ID}
							<br />
							Group: {selectedClassForRegistration?.GROUP_NUMBER}
							<br />
							Lecturer: {selectedClassForRegistration?.LECTURER_NAME}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmRegister}
							disabled={isLoading}
							className='bg-blue-600 hover:bg-blue-700'
						>
							{isLoading ? 'Registering...' : 'Yes, Register'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Cancel Confirmation Dialog */}
			<AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirm Cancellation</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to cancel your enrollment for{' '}
							<strong>{selectedClassForCancellation?.SUBJECT_NAME}</strong>?
							<br />
							<br />
							<strong>Details:</strong>
							<br />
							Class ID: {selectedClassForCancellation?.CREDIT_CLASS_ID}
							<br />
							Group: {selectedClassForCancellation?.GROUP}
							<br />
							Lecturer: {selectedClassForCancellation?.LECTURER_NAME}
							<br />
							<br />
							<span className='text-red-600 font-medium'>
								This action cannot be undone. You will need to register again if
								you want to rejoin this class.
							</span>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Keep Enrollment</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmCancelEnrollment}
							disabled={isLoading}
							className='bg-red-600 hover:bg-red-700'
						>
							{isLoading ? 'Cancelling...' : 'Yes, Cancel Enrollment'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

export default function CourseRegistrationPage() {
	return (
		<PageAccessGuard page='course-registration'>
			<CourseRegistrationPageContent />
		</PageAccessGuard>
	);
}

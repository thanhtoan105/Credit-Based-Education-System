'use client';

import { useState, useEffect } from 'react';
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
	RefreshCw,
	LogOut,
	X,
	UserPlus,
	Trash2,
	CheckCircle,
	XCircle,
	GraduationCap,
	Users,
	Clock,
	AlertCircle,
} from 'lucide-react';

// Types
interface Student {
	id: string;
	lastName: string;
	firstName: string;
	classCode: string;
	department: string;
}

interface CreditClass {
	id: string;
	courseName: string;
	courseCode: string;
	group: string;
	instructorName: string;
	minStudents: number;
	registeredStudents: number;
	maxStudents: number;
	academicYear: string;
	semester: string;
	schedule: string;
	isCancelled: boolean;
	isOpen: boolean;
}

interface Registration {
	id: string;
	studentId: string;
	classId: string;
	academicYear: string;
	semester: string;
	courseName: string;
	courseCode: string;
	instructor: string;
	group: string;
	registrationDate: string;
	status: 'ACTIVE' | 'CANCELLED';
}

// Mock data
const mockStudents: Student[] = [
	{
		id: 'SV001',
		lastName: 'Nguyen',
		firstName: 'Van A',
		classCode: 'CNTT01',
		department: 'CNTT',
	},
	{
		id: 'SV002',
		lastName: 'Tran',
		firstName: 'Thi B',
		classCode: 'CNTT02',
		department: 'CNTT',
	},
	{
		id: 'SV003',
		lastName: 'Le',
		firstName: 'Van C',
		classCode: 'VT01',
		department: 'VT',
	},
	{
		id: 'SV004',
		lastName: 'Pham',
		firstName: 'Thi D',
		classCode: 'CNTT03',
		department: 'CNTT',
	},
	{
		id: 'SV005',
		lastName: 'Hoang',
		firstName: 'Van E',
		classCode: 'VT02',
		department: 'VT',
	},
];

const mockCreditClasses: CreditClass[] = [
	{
		id: 'CC001',
		courseName: 'Cấu trúc dữ liệu & Giải thuật',
		courseCode: 'CTDL',
		group: 'A1',
		instructorName: 'Dr. Nguyen Van A',
		minStudents: 20,
		registeredStudents: 18,
		maxStudents: 40,
		academicYear: '2024-2025',
		semester: '1',
		schedule: 'Mon 7:00-9:00, Wed 7:00-9:00',
		isCancelled: false,
		isOpen: true,
	},
	{
		id: 'CC002',
		courseName: 'Cơ sở dữ liệu',
		courseCode: 'CSDL',
		group: 'B1',
		instructorName: 'Dr. Tran Thi B',
		minStudents: 25,
		registeredStudents: 30,
		maxStudents: 35,
		academicYear: '2024-2025',
		semester: '1',
		schedule: 'Tue 7:00-9:00, Thu 7:00-9:00',
		isCancelled: false,
		isOpen: true,
	},
	{
		id: 'CC003',
		courseName: 'Lập trình hướng đối tượng',
		courseCode: 'OOP',
		group: 'C1',
		instructorName: 'Dr. Le Van C',
		minStudents: 30,
		registeredStudents: 35,
		maxStudents: 35,
		academicYear: '2024-2025',
		semester: '1',
		schedule: 'Mon 9:00-11:00, Fri 7:00-9:00',
		isCancelled: false,
		isOpen: false,
	},
	{
		id: 'CC004',
		courseName: 'Trí tuệ nhân tạo',
		courseCode: 'AI',
		group: 'A1',
		instructorName: 'Dr. Pham Thi D',
		minStudents: 20,
		registeredStudents: 15,
		maxStudents: 30,
		academicYear: '2024-2025',
		semester: '2',
		schedule: 'Wed 9:00-11:00, Fri 9:00-11:00',
		isCancelled: false,
		isOpen: true,
	},
	{
		id: 'CC005',
		courseName: 'Mạng máy tính',
		courseCode: 'MMT',
		group: 'B1',
		instructorName: 'Dr. Vo Thi E',
		minStudents: 15,
		registeredStudents: 8,
		maxStudents: 25,
		academicYear: '2024-2025',
		semester: '2',
		schedule: 'Tue 9:00-11:00, Thu 9:00-11:00',
		isCancelled: true,
		isOpen: false,
	},
];

const initialRegistrations: Registration[] = [
	{
		id: 'REG001',
		studentId: 'SV001',
		classId: 'CC001',
		academicYear: '2024-2025',
		semester: '1',
		courseName: 'Cấu trúc dữ liệu & Giải thuật',
		courseCode: 'CTDL',
		instructor: 'Dr. Nguyen Van A',
		group: 'A1',
		registrationDate: '2024-01-15',
		status: 'ACTIVE',
	},
	{
		id: 'REG002',
		studentId: 'SV001',
		classId: 'CC002',
		academicYear: '2024-2025',
		semester: '1',
		courseName: 'Cơ sở dữ liệu',
		courseCode: 'CSDL',
		instructor: 'Dr. Tran Thi B',
		group: 'B1',
		registrationDate: '2024-01-16',
		status: 'ACTIVE',
	},
];

function CourseRegistrationPageContent() {
	// Toast is imported directly from @/lib/toast

	// State management
	const [studentId, setStudentId] = useState('');
	const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
	const [academicYear, setAcademicYear] = useState('');
	const [semester, setSemester] = useState('');
	const [availableClasses, setAvailableClasses] = useState<CreditClass[]>([]);
	const [selectedClassId, setSelectedClassId] = useState<string>('');
	const [selectedClass, setSelectedClass] = useState<CreditClass | null>(null);
	const [registrations, setRegistrations] =
		useState<Registration[]>(initialRegistrations);
	const [isLoading, setIsLoading] = useState(false);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [confirmAction, setConfirmAction] = useState<{
		type: 'register' | 'cancel';
		data?: any;
	}>({ type: 'register' });

	// Academic years and semesters
	const academicYears = ['2024-2025', '2025-2026', '2026-2027'];
	const semesters = ['1', '2', '3'];

	// Student lookup
	const handleStudentSearch = () => {
		setIsLoading(true);

		setTimeout(() => {
			const student = mockStudents.find((s) => s.id === studentId);
			if (student) {
				setSelectedStudent(student);
				toast.success({
					title: `Found student: ${student.firstName} ${student.lastName}`,
				});
			} else {
				setSelectedStudent(null);
				toast.error({
					title: 'Please check the student ID and try again.',
				});
			}
			setIsLoading(false);
		}, 1000);
	};

	// Search available classes
	const handleClassSearch = () => {
		if (!academicYear || !semester) {
			toast.error({
				title: 'Please select both academic year and semester.',
			});
			return;
		}

		setIsLoading(true);

		setTimeout(() => {
			const filtered = mockCreditClasses.filter(
				(cls) =>
					cls.academicYear === academicYear &&
					cls.semester === semester &&
					!cls.isCancelled &&
					cls.isOpen,
			);
			setAvailableClasses(filtered);

			toast.success({
				title: `Found ${filtered.length} available classes for ${academicYear} - Semester ${semester}`,
			});
			setIsLoading(false);
		}, 800);
	};

	// Handle class selection
	const handleClassSelection = (classData: CreditClass) => {
		setSelectedClassId(classData.id);
		setSelectedClass(classData);

		toast({
			title: 'Class Selected',
			description: `Selected: ${classData.courseName} - Group ${classData.group}`,
		});
	};

	// Handle registration
	const handleRegister = () => {
		if (!selectedStudent || !selectedClass) {
			toast({
				title: 'Missing Information',
				description: 'Please select a student and a class first.',
				variant: 'destructive',
			});
			return;
		}

		// Check if already registered
		const existingRegistration = registrations.find(
			(reg) =>
				reg.studentId === selectedStudent.id &&
				reg.classId === selectedClass.id &&
				reg.status === 'ACTIVE',
		);

		if (existingRegistration) {
			toast({
				title: 'Already Registered',
				description: 'Student is already registered for this class.',
				variant: 'destructive',
			});
			return;
		}

		// Check if class is full
		if (selectedClass.registeredStudents >= selectedClass.maxStudents) {
			toast({
				title: 'Class Full',
				description: 'This class has reached maximum capacity.',
				variant: 'destructive',
			});
			return;
		}

		setConfirmAction({ type: 'register' });
		setShowConfirmDialog(true);
	};

	// Confirm registration
	const confirmRegister = () => {
		if (!selectedStudent || !selectedClass) return;

		const newRegistration: Registration = {
			id: `REG${Date.now()}`,
			studentId: selectedStudent.id,
			classId: selectedClass.id,
			academicYear: selectedClass.academicYear,
			semester: selectedClass.semester,
			courseName: selectedClass.courseName,
			courseCode: selectedClass.courseCode,
			instructor: selectedClass.instructorName,
			group: selectedClass.group,
			registrationDate: new Date().toISOString().split('T')[0],
			status: 'ACTIVE',
		};

		setRegistrations((prev) => [...prev, newRegistration]);

		// Update class registered students count
		setAvailableClasses((prev) =>
			prev.map((cls) =>
				cls.id === selectedClass.id
					? { ...cls, registeredStudents: cls.registeredStudents + 1 }
					: cls,
			),
		);

		setSelectedClassId('');
		setSelectedClass(null);
		setShowConfirmDialog(false);

		toast({
			title: 'Registration Successful',
			description: `Successfully registered for ${selectedClass.courseName}`,
		});
	};

	// Handle cancel registration
	const handleCancelRegistration = (registration: Registration) => {
		setConfirmAction({ type: 'cancel', data: registration });
		setShowConfirmDialog(true);
	};

	// Confirm cancel registration
	const confirmCancelRegistration = () => {
		const registration = confirmAction.data;
		if (!registration) return;

		setRegistrations((prev) =>
			prev.map((reg) =>
				reg.id === registration.id ? { ...reg, status: 'CANCELLED' } : reg,
			),
		);

		// Update class registered students count
		setAvailableClasses((prev) =>
			prev.map((cls) =>
				cls.id === registration.classId
					? {
							...cls,
							registeredStudents: Math.max(0, cls.registeredStudents - 1),
					  }
					: cls,
			),
		);

		setShowConfirmDialog(false);

		toast({
			title: 'Registration Cancelled',
			description: `Cancelled registration for ${registration.courseName}`,
		});
	};

	// Handle refresh
	const handleRefresh = () => {
		setIsLoading(true);

		setTimeout(() => {
			setStudentId('');
			setSelectedStudent(null);
			setAcademicYear('');
			setSemester('');
			setAvailableClasses([]);
			setSelectedClassId('');
			setSelectedClass(null);
			setIsLoading(false);

			toast({
				title: 'Page Refreshed',
				description: 'All data has been refreshed',
			});
		}, 500);
	};

	// Handle exit
	const handleExit = () => {
		window.location.href = '/dashboard';
	};

	// Get student registrations
	const getStudentRegistrations = () => {
		if (!selectedStudent) return [];
		return registrations.filter(
			(reg) => reg.studentId === selectedStudent.id && reg.status === 'ACTIVE',
		);
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

						<div className='flex gap-3'>
							<Button
								variant='outline'
								onClick={handleRefresh}
								disabled={isLoading}
								className='shadow-sm'
							>
								<RefreshCw className='mr-2 h-4 w-4' />
								Refresh
							</Button>
							<Button
								variant='destructive'
								onClick={handleExit}
								className='shadow-sm'
							>
								<LogOut className='mr-2 h-4 w-4' />
								Exit
							</Button>
						</div>
					</div>
				</div>
			</div>

			<div className='container mx-auto px-6 py-6'>
				{/* Top Section - Student Search and Academic Selection */}
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
					{/* Student Lookup */}
					<Card className='shadow-lg border-0 bg-white/80 backdrop-blur-sm'>
						<CardHeader className='pb-3'>
							<CardTitle className='flex items-center gap-2 text-lg'>
								<UserSearch className='h-5 w-5 text-blue-600' />
								Student Lookup
							</CardTitle>
							<CardDescription>
								Enter your student ID to begin registration
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='flex gap-2'>
								<Input
									placeholder='Enter Student ID (e.g., SV001)'
									value={studentId}
									onChange={(e) => setStudentId(e.target.value)}
									className='flex-1 border-gray-300 focus:border-blue-500'
								/>
								<Button
									onClick={handleStudentSearch}
									disabled={isLoading || !studentId}
									className='bg-blue-600 hover:bg-blue-700 shadow-sm'
								>
									<Search className='mr-2 h-4 w-4' />
									Search
								</Button>
							</div>

							{/* Student Info Display */}
							{selectedStudent && (
								<div className='mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800'>
									<div className='flex items-center gap-2 mb-2'>
										<CheckCircle className='h-4 w-4 text-green-600' />
										<h3 className='font-semibold text-green-800 dark:text-green-200'>
											Student Found
										</h3>
									</div>
									<div className='grid grid-cols-2 gap-2 text-sm'>
										<div>
											<span className='text-gray-600 dark:text-gray-400'>
												Student ID:
											</span>
											<div className='font-medium'>{selectedStudent.id}</div>
										</div>
										<div>
											<span className='text-gray-600 dark:text-gray-400'>
												Full Name:
											</span>
											<div className='font-medium'>
												{selectedStudent.firstName} {selectedStudent.lastName}
											</div>
										</div>
										<div>
											<span className='text-gray-600 dark:text-gray-400'>
												Class Code:
											</span>
											<Badge variant='secondary' className='mt-1'>
												{selectedStudent.classCode}
											</Badge>
										</div>
										<div>
											<span className='text-gray-600 dark:text-gray-400'>
												Department:
											</span>
											<div className='font-medium'>
												{selectedStudent.department}
											</div>
										</div>
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Academic Year & Semester Selection */}
					<Card
						className={`shadow-lg border-0 bg-white/80 backdrop-blur-sm transition-all duration-200 ${
							selectedStudent ? 'opacity-100' : 'opacity-50'
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
										disabled={!selectedStudent}
									>
										<SelectTrigger className='border-gray-300 focus:border-indigo-500'>
											<SelectValue placeholder='Select academic year' />
										</SelectTrigger>
										<SelectContent>
											{academicYears.map((year) => (
												<SelectItem key={year} value={year}>
													{year}
												</SelectItem>
											))}
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
										disabled={!selectedStudent}
									>
										<SelectTrigger className='border-gray-300 focus:border-indigo-500'>
											<SelectValue placeholder='Select semester' />
										</SelectTrigger>
										<SelectContent>
											{semesters.map((sem) => (
												<SelectItem key={sem} value={sem}>
													Semester {sem}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<Button
									onClick={handleClassSearch}
									disabled={
										isLoading || !academicYear || !semester || !selectedStudent
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
										{availableClasses.map((classData) => (
											<div
												key={classData.id}
												className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
													selectedClassId === classData.id
														? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
														: 'border-gray-200 hover:border-gray-300 bg-white dark:bg-gray-800'
												}`}
												onClick={() => handleClassSelection(classData)}
											>
												<div className='flex items-start justify-between'>
													<div className='flex items-start gap-3 flex-1'>
														<Checkbox
															checked={selectedClassId === classData.id}
															onCheckedChange={() =>
																handleClassSelection(classData)
															}
															className='mt-1'
														/>
														<div className='flex-1 space-y-2'>
															<div className='flex items-center gap-2'>
																<h3 className='font-semibold text-gray-900 dark:text-white'>
																	{classData.courseName}
																</h3>
																<Badge variant='outline' className='text-xs'>
																	{classData.courseCode}
																</Badge>
															</div>
															<div className='grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 dark:text-gray-400'>
																<div className='flex items-center gap-1'>
																	<span className='font-medium'>ID:</span>{' '}
																	{classData.id}
																</div>
																<div className='flex items-center gap-1'>
																	<Users className='h-3 w-3' />
																	<span>Group {classData.group}</span>
																</div>
																<div className='flex items-center gap-1'>
																	<span className='font-medium'>
																		Instructor:
																	</span>{' '}
																	{classData.instructorName}
																</div>
																<div className='flex items-center gap-1'>
																	<Clock className='h-3 w-3' />
																	<span className='text-xs'>
																		{classData.schedule}
																	</span>
																</div>
															</div>
															<div className='flex items-center gap-4 text-sm'>
																<div className='flex items-center gap-1'>
																	<span className='text-gray-500'>
																		Students:
																	</span>
																	<span
																		className={
																			classData.registeredStudents >=
																			classData.maxStudents
																				? 'text-red-600 font-semibold'
																				: 'text-green-600 font-semibold'
																		}
																	>
																		{classData.registeredStudents}/
																		{classData.maxStudents}
																	</span>
																</div>
																<div className='flex items-center gap-1'>
																	<span className='text-gray-500'>
																		Min required:
																	</span>
																	<span className='font-medium'>
																		{classData.minStudents}
																	</span>
																</div>
																{classData.registeredStudents >=
																classData.maxStudents ? (
																	<Badge
																		variant='destructive'
																		className='text-xs'
																	>
																		Full
																	</Badge>
																) : (
																	<Badge
																		variant='default'
																		className='text-xs bg-green-600'
																	>
																		Open
																	</Badge>
																)}
															</div>
														</div>
													</div>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						)}

						{/* Registered Classes */}
						{selectedStudent && getStudentRegistrations().length > 0 && (
							<Card className='shadow-lg border-0 bg-white/80 backdrop-blur-sm'>
								<CardHeader className='pb-3'>
									<div className='flex items-center justify-between'>
										<div className='flex items-center gap-2'>
											<CheckCircle className='h-5 w-5 text-green-600' />
											<CardTitle className='text-lg'>
												My Registered Classes
											</CardTitle>
										</div>
										<Badge
											variant='secondary'
											className='bg-green-100 text-green-800'
										>
											{getStudentRegistrations().length} classes
										</Badge>
									</div>
									<CardDescription>
										Classes you are currently registered for
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className='space-y-3'>
										{getStudentRegistrations().map((registration) => (
											<div
												key={registration.id}
												className='p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
											>
												<div className='flex items-center justify-between'>
													<div className='flex-1'>
														<div className='flex items-center gap-2 mb-2'>
															<h3 className='font-semibold text-green-800 dark:text-green-200'>
																{registration.courseName}
															</h3>
															<Badge variant='outline' className='text-xs'>
																{registration.courseCode}
															</Badge>
														</div>
														<div className='grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-green-700 dark:text-green-300'>
															<div>
																<span className='font-medium'>Class ID:</span>{' '}
																{registration.classId}
															</div>
															<div>
																<span className='font-medium'>Group:</span>{' '}
																{registration.group}
															</div>
															<div>
																<span className='font-medium'>Instructor:</span>{' '}
																{registration.instructor}
															</div>
															<div>
																<span className='font-medium'>Registered:</span>{' '}
																{registration.registrationDate}
															</div>
														</div>
													</div>
													<Button
														variant='destructive'
														size='sm'
														onClick={() =>
															handleCancelRegistration(registration)
														}
														className='ml-4'
													>
														<Trash2 className='mr-2 h-4 w-4' />
														Cancel
													</Button>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						)}
					</div>

					{/* Registration Panel - Sidebar */}
					<div className='xl:col-span-1'>
						{selectedClass && (
							<Card className='shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 sticky top-6'>
								<CardHeader className='pb-3'>
									<CardTitle className='flex items-center gap-2 text-lg'>
										<UserPlus className='h-5 w-5 text-blue-600' />
										Registration Panel
									</CardTitle>
									<CardDescription>
										Confirm your course registration
									</CardDescription>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div className='space-y-3'>
										<div className='p-3 bg-white dark:bg-gray-800 rounded-lg'>
											<Label className='text-xs text-gray-500 uppercase tracking-wide'>
												Selected Course
											</Label>
											<div className='font-semibold text-blue-800 dark:text-blue-200'>
												{selectedClass.courseName}
											</div>
											<div className='text-sm text-gray-600 dark:text-gray-400'>
												{selectedClass.courseCode} - Group {selectedClass.group}
											</div>
										</div>

										<div className='p-3 bg-white dark:bg-gray-800 rounded-lg'>
											<Label className='text-xs text-gray-500 uppercase tracking-wide'>
												Student
											</Label>
											<div className='font-semibold'>
												{selectedStudent?.firstName} {selectedStudent?.lastName}
											</div>
											<div className='text-sm text-gray-600 dark:text-gray-400'>
												ID: {selectedStudent?.id}
											</div>
										</div>

										<div className='p-3 bg-white dark:bg-gray-800 rounded-lg'>
											<Label className='text-xs text-gray-500 uppercase tracking-wide'>
												Instructor
											</Label>
											<div className='font-semibold'>
												{selectedClass.instructorName}
											</div>
										</div>

										<div className='p-3 bg-white dark:bg-gray-800 rounded-lg'>
											<Label className='text-xs text-gray-500 uppercase tracking-wide'>
												Schedule
											</Label>
											<div className='text-sm'>{selectedClass.schedule}</div>
										</div>
									</div>

									<Separator />

									<div className='space-y-2'>
										<div className='flex justify-between text-sm'>
											<span>Available Spots:</span>
											<span className='font-semibold'>
												{selectedClass.maxStudents -
													selectedClass.registeredStudents}{' '}
												/ {selectedClass.maxStudents}
											</span>
										</div>
										<div className='w-full bg-gray-200 rounded-full h-2'>
											<div
												className='bg-blue-600 h-2 rounded-full transition-all'
												style={{
													width: `${
														(selectedClass.registeredStudents /
															selectedClass.maxStudents) *
														100
													}%`,
												}}
											></div>
										</div>
									</div>

									<Button
										onClick={handleRegister}
										className='w-full bg-blue-600 hover:bg-blue-700 shadow-lg'
										size='lg'
									>
										<UserPlus className='mr-2 h-4 w-4' />
										Register for This Course
									</Button>
								</CardContent>
							</Card>
						)}

						{!selectedClass && availableClasses.length > 0 && (
							<Card className='shadow-lg border-0 bg-gray-50 dark:bg-gray-800/50'>
								<CardContent className='pt-6'>
									<div className='text-center text-gray-500 dark:text-gray-400'>
										<BookOpen className='mx-auto h-12 w-12 mb-3 text-gray-300' />
										<h3 className='font-semibold mb-1'>Select a Course</h3>
										<p className='text-sm'>
											Choose a course from the available classes to register
										</p>
									</div>
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
						<AlertDialogTitle>
							{confirmAction.type === 'register'
								? 'Confirm Registration'
								: 'Confirm Cancellation'}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{confirmAction.type === 'register'
								? `Are you sure you want to register for ${selectedClass?.courseName}?`
								: `Are you sure you want to cancel registration for ${confirmAction.data?.courseName}?`}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={
								confirmAction.type === 'register'
									? confirmRegister
									: confirmCancelRegistration
							}
							className={
								confirmAction.type === 'cancel'
									? 'bg-destructive hover:bg-destructive/90'
									: ''
							}
						>
							{confirmAction.type === 'register'
								? 'Register'
								: 'Cancel Registration'}
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

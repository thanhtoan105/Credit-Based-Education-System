'use client';

import React from 'react';
import { useState, useEffect, useCallback } from 'react';
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
import { Label } from '@/components/ui/label';
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Search,
	RefreshCw,
	Users,
	GraduationCap,
	Plus,
	Edit,
	Trash2,
	CheckCircle,
	AlertTriangle,
	Calendar,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/session';
import { MultiAuthUser } from '@/lib/services/multi-auth.service';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';

interface Department {
	value: string;
	label: string;
	serverName: string;
}

interface StudentData {
	STUDENT_ID: string;
	LAST_NAME: string;
	FIRST_NAME: string;
	GENDER: boolean;
	ADDRESS: string | null;
	DATE_OF_BIRTH: string | null;
	CLASS_ID: string;
	SUSPENDED: boolean;
	PASSWORD: string | null;
	CLASS_NAME?: string;
}

// Validation schema for student form
const studentFormSchema = z.object({
	studentId: z
		.string()
		.min(1, 'Student ID is required')
		.min(3, 'Student ID must be at least 3 characters')
		.max(20, 'Student ID must not exceed 20 characters')
		.regex(/^[A-Za-z0-9]+$/, 'Student ID can only contain letters and numbers'),
	lastName: z
		.string()
		.min(1, 'Last name is required')
		.min(2, 'Last name must be at least 2 characters')
		.max(50, 'Last name must not exceed 50 characters')
		.regex(/^[A-Za-z\s]+$/, 'Last name can only contain letters and spaces'),
	firstName: z
		.string()
		.min(1, 'First name is required')
		.min(2, 'First name must be at least 2 characters')
		.max(50, 'First name must not exceed 50 characters')
		.regex(/^[A-Za-z\s]+$/, 'First name can only contain letters and spaces'),
	gender: z.boolean(),
	address: z
		.string()
		.max(200, 'Address must not exceed 200 characters')
		.optional()
		.or(z.literal('')),
	dateOfBirth: z
		.string()
		.optional()
		.refine((date) => {
			if (!date) return true; // Optional field
			const parsedDate = new Date(date);
			const today = new Date();
			const minAge = new Date(
				today.getFullYear() - 100,
				today.getMonth(),
				today.getDate(),
			);
			const maxAge = new Date(
				today.getFullYear() - 15,
				today.getMonth(),
				today.getDate(),
			);
			return parsedDate >= minAge && parsedDate <= maxAge;
		}, 'Date of birth must be between 15 and 100 years ago'),
	classId: z
		.string()
		.min(1, 'Class ID is required')
		.min(3, 'Class ID must be at least 3 characters')
		.max(20, 'Class ID must not exceed 20 characters'),
	suspended: z.boolean().default(false),
	password: z
		.string()
		.max(50, 'Password must not exceed 50 characters')
		.optional()
		.or(z.literal('')),
});

type StudentFormData = z.infer<typeof studentFormSchema>;

export default function StudentsPage() {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedDepartment, setSelectedDepartment] = useState('');
	const [departments, setDepartments] = useState<Department[]>([]);
	const [studentData, setStudentData] = useState<StudentData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingStudents, setIsLoadingStudents] = useState(false);
	const [user, setUser] = useState<MultiAuthUser | null>(null);
	const [isDepartmentDisabled, setIsDepartmentDisabled] = useState(false);

	// Modal states
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [selectedStudentForDelete, setSelectedStudentForDelete] =
		useState<StudentData | null>(null);
	const [editingStudent, setEditingStudent] = useState<StudentData | null>(
		null,
	);

	// Form handling with react-hook-form and zod validation
	const addForm = useForm<StudentFormData>({
		resolver: zodResolver(studentFormSchema),
		defaultValues: {
			studentId: '',
			lastName: '',
			firstName: '',
			gender: false,
			address: '',
			dateOfBirth: '',
			classId: '',
			suspended: false,
			password: '',
		},
	});

	const editForm = useForm<StudentFormData>({
		resolver: zodResolver(studentFormSchema),
		defaultValues: {
			studentId: '',
			lastName: '',
			firstName: '',
			gender: false,
			address: '',
			dateOfBirth: '',
			classId: '',
			suspended: false,
			password: '',
		},
	});

	// Get current user and determine if department should be disabled
	useEffect(() => {
		const currentUser = getCurrentUser();
		if (currentUser) {
			setUser(currentUser);

			// Check if user has KHOA-level permissions (groupName = 'KHOA' or role includes KHOA)
			const isKhoaLevel =
				currentUser.groupName === 'KHOA' ||
				(currentUser.role && currentUser.role.includes('KHOA'));

			if (isKhoaLevel && currentUser.department) {
				// For KHOA users, disable department selection and set to their department
				setIsDepartmentDisabled(true);
				setSelectedDepartment(currentUser.department.branch_name);
			}
		}
	}, []);

	// Load departments from API (excluding Accounting Department)
	useEffect(() => {
		const loadDepartments = async () => {
			try {
				const response = await fetch('/api/departments');
				const data = await response.json();

				if (data.success) {
					// Filter out Accounting Department in the students page only
					const filteredDepartments = data.departments.filter(
						(dept: Department) =>
							!dept.label.toLowerCase().includes('accounting'),
					);
					setDepartments(filteredDepartments);

					// If no department is selected yet and user is not KHOA level, select first department
					if (
						!selectedDepartment &&
						!isDepartmentDisabled &&
						filteredDepartments.length > 0
					) {
						setSelectedDepartment(filteredDepartments[0].value);
					}
				} else {
					toast.error({
						title: 'Failed to load departments',
					});
				}
			} catch (error) {
				console.error('Error loading departments:', error);
				toast.error({
					title: 'Failed to load departments',
				});
			} finally {
				setIsLoading(false);
			}
		};

		loadDepartments();
	}, [selectedDepartment, isDepartmentDisabled]);

	// Load students when department changes
	useEffect(() => {
		if (selectedDepartment) {
			loadStudents();
		}
	}, [selectedDepartment]);

	const loadStudents = useCallback(async () => {
		if (!selectedDepartment) return;

		setIsLoadingStudents(true);
		try {
			const response = await fetch(
				`/api/students?department=${encodeURIComponent(selectedDepartment)}`,
			);
			const data = await response.json();

			if (data.success) {
				setStudentData(data.students || []);
			} else {
				toast.error({
					title: 'Failed to load students',
				});
				setStudentData([]);
			}
		} catch (error) {
			console.error('Error loading students:', error);
			toast.error({
				title: 'Failed to load students',
			});
			setStudentData([]);
		} finally {
			setIsLoadingStudents(false);
		}
	}, [selectedDepartment]);

	// Filter students based on search term
	const filteredStudents = studentData.filter(
		(student) =>
			student.STUDENT_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
			student.LAST_NAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
			student.FIRST_NAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(student.CLASS_NAME &&
				student.CLASS_NAME.toLowerCase().includes(searchTerm.toLowerCase())),
	);

	// Reset form data
	const resetAddForm = () => {
		addForm.reset({
			studentId: '',
			lastName: '',
			firstName: '',
			gender: false,
			address: '',
			dateOfBirth: '',
			classId: '',
			suspended: false,
			password: '',
		});
	};

	const resetEditForm = () => {
		editForm.reset({
			studentId: '',
			lastName: '',
			firstName: '',
			gender: false,
			address: '',
			dateOfBirth: '',
			classId: '',
			suspended: false,
			password: '',
		});
	};

	// Format date for display
	const formatDate = (dateString: string | null) => {
		if (!dateString) return 'N/A';
		try {
			return new Date(dateString).toLocaleDateString();
		} catch {
			return 'Invalid Date';
		}
	};

	// Format date for input field
	const formatDateForInput = (dateString: string | null) => {
		if (!dateString) return '';
		try {
			return new Date(dateString).toISOString().split('T')[0];
		} catch {
			return '';
		}
	};

	// Handle add student
	const handleAddStudent = async (data: StudentFormData) => {
		if (!selectedDepartment) {
			toast.error({ title: 'Please select a department' });
			return;
		}

		try {
			const response = await fetch('/api/students', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...data,
					departmentName: selectedDepartment,
				}),
			});

			const result = await response.json();

			if (result.success) {
				toast.success({ title: 'Student added successfully' });
				setIsAddDialogOpen(false);
				resetAddForm();
				loadStudents();
			} else {
				toast.error({ title: result.error || 'Failed to add student' });
			}
		} catch (error) {
			console.error('Error adding student:', error);
			toast.error({ title: 'Failed to add student' });
		}
	};

	// Handle edit student
	const handleEditStudent = async (data: StudentFormData) => {
		if (!selectedDepartment || !editingStudent) {
			toast.error({ title: 'Invalid operation' });
			return;
		}

		try {
			const response = await fetch('/api/students', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...data,
					departmentName: selectedDepartment,
				}),
			});

			const result = await response.json();

			if (result.success) {
				toast.success({ title: 'Student updated successfully' });
				setIsEditDialogOpen(false);
				setEditingStudent(null);
				resetEditForm();
				loadStudents();
			} else {
				toast.error({ title: result.error || 'Failed to update student' });
			}
		} catch (error) {
			console.error('Error updating student:', error);
			toast.error({ title: 'Failed to update student' });
		}
	};

	// Handle delete student
	const handleDeleteStudent = async () => {
		if (!selectedStudentForDelete || !selectedDepartment) {
			toast.error({ title: 'Invalid operation' });
			return;
		}

		try {
			const response = await fetch(
				`/api/students?studentId=${encodeURIComponent(
					selectedStudentForDelete.STUDENT_ID,
				)}&department=${encodeURIComponent(selectedDepartment)}`,
				{ method: 'DELETE' },
			);

			const data = await response.json();

			if (data.success) {
				toast.success({ title: 'Student deleted successfully' });
				setIsDeleteDialogOpen(false);
				setSelectedStudentForDelete(null);
				loadStudents();
			} else {
				toast.error({ title: data.error || 'Failed to delete student' });
			}
		} catch (error) {
			console.error('Error deleting student:', error);
			toast.error({ title: 'Failed to delete student' });
		}
	};

	// Open edit dialog
	const openEditDialog = (student: StudentData) => {
		setEditingStudent(student);
		editForm.reset({
			studentId: student.STUDENT_ID,
			lastName: student.LAST_NAME,
			firstName: student.FIRST_NAME,
			gender: student.GENDER,
			address: student.ADDRESS || '',
			dateOfBirth: formatDateForInput(student.DATE_OF_BIRTH),
			classId: student.CLASS_ID,
			suspended: student.SUSPENDED,
			password: student.PASSWORD || '',
		});
		setIsEditDialogOpen(true);
	};

	if (isLoading) {
		return (
			<div className='container mx-auto p-6'>
				<div className='flex items-center justify-center h-64'>
					<RefreshCw className='h-8 w-8 animate-spin' />
					<span className='ml-2'>Loading...</span>
				</div>
			</div>
		);
	}

	return (
		<div className='container mx-auto p-6'>
			<Toaster />

			{/* Header */}
			<div className='mb-6'>
				<h1 className='text-3xl font-bold mb-2'>Student Management</h1>
				<p className='text-muted-foreground'>
					View and manage students by department
				</p>
			</div>

			{/* Controls */}
			<Card className='mb-6'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Users className='h-5 w-5' />
						Student Controls
					</CardTitle>
					<CardDescription>
						Search and filter students, or add new students to the system
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='flex flex-col md:flex-row gap-4'>
						{/* Department Selection */}
						<div className='flex-1'>
							<Label htmlFor='department'>Department</Label>
							<Select
								value={selectedDepartment}
								onValueChange={setSelectedDepartment}
								disabled={isDepartmentDisabled}
							>
								<SelectTrigger>
									<SelectValue placeholder='Select department' />
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

						{/* Search */}
						<div className='flex-1'>
							<Label htmlFor='search'>Search Students</Label>
							<div className='relative'>
								<Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
								<Input
									id='search'
									placeholder='Search by ID, name, or class...'
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className='pl-10'
								/>
							</div>
						</div>

						{/* Action Buttons */}
						<div className='flex gap-2 items-end'>
							<Button
								onClick={loadStudents}
								variant='outline'
								disabled={isLoadingStudents}
							>
								<RefreshCw
									className={`h-4 w-4 mr-2 ${
										isLoadingStudents ? 'animate-spin' : ''
									}`}
								/>
								Refresh
							</Button>
							<Button
								onClick={() => {
									resetAddForm();
									setIsAddDialogOpen(true);
								}}
								disabled={!selectedDepartment}
							>
								<Plus className='h-4 w-4 mr-2' />
								Add Student
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Students Table */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<GraduationCap className='h-5 w-5' />
						Students
						{selectedDepartment && (
							<Badge variant='secondary'>{selectedDepartment}</Badge>
						)}
					</CardTitle>
					<CardDescription>
						{filteredStudents.length} student(s) found
						{searchTerm && ` matching "${searchTerm}"`}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoadingStudents ? (
						<div className='flex items-center justify-center h-32'>
							<RefreshCw className='h-6 w-6 animate-spin mr-2' />
							Loading students...
						</div>
					) : filteredStudents.length === 0 ? (
						<div className='text-center py-8'>
							<Users className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
							<h3 className='text-lg font-medium mb-2'>No students found</h3>
							<p className='text-muted-foreground mb-4'>
								{searchTerm
									? `No students match your search "${searchTerm}"`
									: selectedDepartment
									? `No students found in ${selectedDepartment}`
									: 'Select a department to view students'}
							</p>
							{selectedDepartment && (
								<Button
									onClick={() => {
										resetAddForm();
										setIsAddDialogOpen(true);
									}}
								>
									<Plus className='h-4 w-4 mr-2' />
									Add First Student
								</Button>
							)}
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Student ID</TableHead>
									<TableHead>Full Name</TableHead>
									<TableHead>Gender</TableHead>
									<TableHead>Class</TableHead>
									<TableHead>Date of Birth</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredStudents.map((student) => (
									<TableRow key={student.STUDENT_ID}>
										<TableCell className='font-medium'>
											{student.STUDENT_ID}
										</TableCell>
										<TableCell>
											{student.LAST_NAME} {student.FIRST_NAME}
										</TableCell>
										<TableCell>
											<Badge variant={student.GENDER ? 'default' : 'secondary'}>
												{student.GENDER ? 'Female' : 'Male'}
											</Badge>
										</TableCell>
										<TableCell>
											<div>
												<div className='font-medium'>{student.CLASS_ID}</div>
												{student.CLASS_NAME && (
													<div className='text-sm text-muted-foreground'>
														{student.CLASS_NAME}
													</div>
												)}
											</div>
										</TableCell>
										<TableCell>{formatDate(student.DATE_OF_BIRTH)}</TableCell>
										<TableCell>
											<Badge
												variant={student.SUSPENDED ? 'destructive' : 'default'}
											>
												{student.SUSPENDED ? (
													<>
														<AlertTriangle className='h-3 w-3 mr-1' />
														Suspended
													</>
												) : (
													<>
														<CheckCircle className='h-3 w-3 mr-1' />
														Active
													</>
												)}
											</Badge>
										</TableCell>
										<TableCell>
											<div className='flex gap-2'>
												<Button
													variant='outline'
													size='sm'
													onClick={() => openEditDialog(student)}
												>
													<Edit className='h-4 w-4' />
												</Button>
												<Button
													variant='outline'
													size='sm'
													onClick={() => {
														setSelectedStudentForDelete(student);
														setIsDeleteDialogOpen(true);
													}}
												>
													<Trash2 className='h-4 w-4' />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
			{/* Add Student Dialog */}
			<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
				<DialogContent className='max-w-md'>
					<DialogHeader>
						<DialogTitle>Add New Student</DialogTitle>
						<DialogDescription>
							Add a new student to {selectedDepartment}
						</DialogDescription>
					</DialogHeader>
					<Form {...addForm}>
						<form
							onSubmit={addForm.handleSubmit(handleAddStudent)}
							className='space-y-4'
						>
							<FormField
								control={addForm.control}
								name='studentId'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Student ID *</FormLabel>
										<FormControl>
											<Input placeholder='Enter student ID' {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className='grid grid-cols-2 gap-4'>
								<FormField
									control={addForm.control}
									name='lastName'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Last Name *</FormLabel>
											<FormControl>
												<Input placeholder='Enter last name' {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={addForm.control}
									name='firstName'
									render={({ field }) => (
										<FormItem>
											<FormLabel>First Name *</FormLabel>
											<FormControl>
												<Input placeholder='Enter first name' {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<FormField
								control={addForm.control}
								name='gender'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Gender</FormLabel>
										<Select
											onValueChange={(value) =>
												field.onChange(value === 'true')
											}
											value={field.value.toString()}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder='Select gender' />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value='false'>Male</SelectItem>
												<SelectItem value='true'>Female</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={addForm.control}
								name='classId'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Class ID *</FormLabel>
										<FormControl>
											<Input placeholder='Enter class ID' {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={addForm.control}
								name='dateOfBirth'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Date of Birth</FormLabel>
										<FormControl>
											<Input type='date' {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={addForm.control}
								name='address'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Address</FormLabel>
										<FormControl>
											<Input placeholder='Enter address' {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={addForm.control}
								name='suspended'
								render={({ field }) => (
									<FormItem className='flex flex-row items-start space-x-3 space-y-0'>
										<FormControl>
											<input
												type='checkbox'
												checked={field.value}
												onChange={field.onChange}
												className='rounded'
												aria-label='Suspended'
											/>
										</FormControl>
										<div className='space-y-1 leading-none'>
											<FormLabel>Suspended</FormLabel>
										</div>
									</FormItem>
								)}
							/>
							<div className='flex justify-end gap-2'>
								<Button
									type='button'
									variant='outline'
									onClick={() => {
										setIsAddDialogOpen(false);
										resetAddForm();
									}}
								>
									Cancel
								</Button>
								<Button type='submit'>Add Student</Button>
							</div>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			{/* Edit Student Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className='max-w-md'>
					<DialogHeader>
						<DialogTitle>Edit Student</DialogTitle>
						<DialogDescription>
							Update student information for {editingStudent?.STUDENT_ID}
						</DialogDescription>
					</DialogHeader>
					<Form {...editForm}>
						<form
							onSubmit={editForm.handleSubmit(handleEditStudent)}
							className='space-y-4'
						>
							<FormField
								control={editForm.control}
								name='studentId'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Student ID *</FormLabel>
										<FormControl>
											<Input
												placeholder='Enter student ID'
												{...field}
												disabled
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className='grid grid-cols-2 gap-4'>
								<FormField
									control={editForm.control}
									name='lastName'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Last Name *</FormLabel>
											<FormControl>
												<Input placeholder='Enter last name' {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={editForm.control}
									name='firstName'
									render={({ field }) => (
										<FormItem>
											<FormLabel>First Name *</FormLabel>
											<FormControl>
												<Input placeholder='Enter first name' {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<FormField
								control={editForm.control}
								name='gender'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Gender</FormLabel>
										<Select
											onValueChange={(value) =>
												field.onChange(value === 'true')
											}
											value={field.value.toString()}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder='Select gender' />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value='false'>Male</SelectItem>
												<SelectItem value='true'>Female</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={editForm.control}
								name='classId'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Class ID *</FormLabel>
										<FormControl>
											<Input placeholder='Enter class ID' {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={editForm.control}
								name='dateOfBirth'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Date of Birth</FormLabel>
										<FormControl>
											<Input type='date' {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={editForm.control}
								name='address'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Address</FormLabel>
										<FormControl>
											<Input placeholder='Enter address' {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={editForm.control}
								name='suspended'
								render={({ field }) => (
									<FormItem className='flex flex-row items-start space-x-3 space-y-0'>
										<FormControl>
											<input
												type='checkbox'
												checked={field.value}
												onChange={field.onChange}
												className='rounded'
												aria-label='Suspended'
											/>
										</FormControl>
										<div className='space-y-1 leading-none'>
											<FormLabel>Suspended</FormLabel>
										</div>
									</FormItem>
								)}
							/>
							<div className='flex justify-end gap-2'>
								<Button
									type='button'
									variant='outline'
									onClick={() => {
										setIsEditDialogOpen(false);
										setEditingStudent(null);
										resetEditForm();
									}}
								>
									Cancel
								</Button>
								<Button type='submit'>Update Student</Button>
							</div>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			{/* Delete Student Dialog */}
			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Student</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete student{' '}
							<strong>
								{selectedStudentForDelete?.STUDENT_ID} -{' '}
								{selectedStudentForDelete?.LAST_NAME}{' '}
								{selectedStudentForDelete?.FIRST_NAME}
							</strong>
							? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							onClick={() => {
								setIsDeleteDialogOpen(false);
								setSelectedStudentForDelete(null);
							}}
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteStudent}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						>
							Delete Student
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

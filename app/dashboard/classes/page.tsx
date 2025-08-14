/* The above code is a TypeScript React component for managing classes in a school system. Here is a
summary of what the code does: */
'use client';

import { useState, useEffect } from 'react';
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
	Building,
	GraduationCap,
	Plus,
	Edit,
	Trash2,
	CheckCircle,
	AlertTriangle,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/session';
import { MultiAuthUser } from '@/lib/services/multi-auth.service';

interface Department {
	value: string;
	label: string;
	serverName: string;
}

interface ClassData {
	CLASS_ID: string;
	CLASS_NAME: string;
	COURSE_YEAR: string;
	FACULTY_ID: string;
}

export default function ClassesPage() {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedDepartment, setSelectedDepartment] = useState('');
	const [departments, setDepartments] = useState<Department[]>([]);
	const [classData, setClassData] = useState<ClassData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingClasses, setIsLoadingClasses] = useState(false);
	const [user, setUser] = useState<MultiAuthUser | null>(null);
	const [isDepartmentDisabled, setIsDepartmentDisabled] = useState(false);

	// Modal states
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [selectedClassForDelete, setSelectedClassForDelete] =
		useState<ClassData | null>(null);
	const [editingClass, setEditingClass] = useState<ClassData | null>(null);

	// Form states
	const [formData, setFormData] = useState({
		classId: '',
		className: '',
		courseYear: '',
		facultyId: '',
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
					// Filter out Accounting Department in the classes page only
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

	// Load classes when department changes
	useEffect(() => {
		const loadClasses = async () => {
			if (!selectedDepartment) return;

			setIsLoadingClasses(true);
			try {
				const response = await fetch(
					`/api/classes?department=${encodeURIComponent(selectedDepartment)}`,
				);
				const data = await response.json();

				if (data.success) {
					setClassData(data.classes);
				} else {
					toast.error({
						title: data.error || 'Failed to load classes',
					});
					setClassData([]);
				}
			} catch (error) {
				console.error('Error loading classes:', error);
				toast.error({
					title: 'Failed to load classes',
				});
				setClassData([]);
			} finally {
				setIsLoadingClasses(false);
			}
		};

		loadClasses();
	}, [selectedDepartment]);

	// Filter classes based on search term
	const filteredClasses = classData.filter((cls) => {
		const matchesSearch =
			cls.CLASS_NAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
			cls.CLASS_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
			cls.COURSE_YEAR.toLowerCase().includes(searchTerm.toLowerCase()) ||
			cls.FACULTY_ID.toLowerCase().includes(searchTerm.toLowerCase());
		return matchesSearch;
	});

	// Handle refresh departments
	const handleRefreshDepartments = async () => {
		setIsLoading(true);
		try {
			const response = await fetch('/api/departments');
			const data = await response.json();

			if (data.success) {
				const filteredDepartments = data.departments.filter(
					(dept: Department) =>
						!dept.label.toLowerCase().includes('accounting'),
				);
				setDepartments(filteredDepartments);
				toast.success({
					title: 'Departments refreshed successfully',
				});
			}
		} catch (error) {
			toast.error({
				title: 'Failed to refresh departments',
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Handler functions
	const handleAddClass = async () => {
		if (!user || !selectedDepartment) return;

		try {
			// Fetch Faculty ID from database for the selected department
			const response = await fetch(
				`/api/departments/${encodeURIComponent(selectedDepartment)}/faculty`,
			);
			const data = await response.json();

			let facultyId = 'IT'; // Default fallback
			if (data.success) {
				facultyId = data.facultyId;
			} else {
				console.warn('Failed to get faculty ID:', data.error);
				toast.warning({
					title: 'Could not load faculty ID, using default value.',
				});
			}

			setFormData({
				classId: '',
				className: '',
				courseYear: new Date().getFullYear().toString(),
				facultyId: facultyId,
			});
			setIsAddDialogOpen(true);
		} catch (error) {
			console.error('Error fetching faculty ID:', error);
			toast.error({
				title: 'Failed to load faculty information.',
			});
		}
	};

	const handleEditClass = async (classItem: ClassData) => {
		setEditingClass(classItem);

		try {
			// Fetch Faculty ID from database for the selected department to ensure consistency
			const response = await fetch(
				`/api/departments/${encodeURIComponent(selectedDepartment)}/faculty`,
			);
			const data = await response.json();

			let facultyId = classItem.FACULTY_ID; // Use existing faculty ID as fallback
			if (data.success) {
				facultyId = data.facultyId;
			}

			setFormData({
				classId: classItem.CLASS_ID,
				className: classItem.CLASS_NAME,
				courseYear: classItem.COURSE_YEAR,
				facultyId: facultyId,
			});
			setIsEditDialogOpen(true);
		} catch (error) {
			console.error('Error fetching faculty ID for edit:', error);
			// Fallback to existing data
			setFormData({
				classId: classItem.CLASS_ID,
				className: classItem.CLASS_NAME,
				courseYear: classItem.COURSE_YEAR,
				facultyId: classItem.FACULTY_ID,
			});
			setIsEditDialogOpen(true);
		}
	};

	const handleDeleteClass = async (classItem: ClassData) => {
		setSelectedClassForDelete(classItem);

		// Check if class has students
		try {
			const response = await fetch(
				`/api/classes/${
					classItem.CLASS_ID
				}/students?department=${encodeURIComponent(selectedDepartment)}`,
			);
			const data = await response.json();

			if (data.success && data.hasStudents) {
				toast.warning({
					title: `This class has ${data.studentCount} student(s) enrolled. Please remove students first.`,
				});
				return;
			}
		} catch (error) {
			console.error('Error checking students:', error);
		}

		setIsDeleteDialogOpen(true);
	};

	// Form submission handlers
	const handleSubmitAdd = async () => {
		if (!formData.classId || !formData.className || !formData.courseYear) {
			toast.error({
				title: 'Please fill in all required fields.',
			});
			return;
		}

		try {
			const response = await fetch('/api/classes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					classId: formData.classId,
					className: formData.className,
					courseYear: formData.courseYear,
					facultyId: formData.facultyId,
					departmentName: selectedDepartment,
				}),
			});

			const data = await response.json();

			if (data.success) {
				toast.success({
					title: 'Class added successfully.',
				});
				setIsAddDialogOpen(false);
				// Refresh classes
				const refreshResponse = await fetch(
					`/api/classes?department=${encodeURIComponent(selectedDepartment)}`,
				);
				const refreshData = await refreshResponse.json();
				if (refreshData.success) {
					setClassData(refreshData.classes);
				}
			} else {
				toast.error({
					title: data.error || 'Failed to add class.',
				});
			}
		} catch (error) {
			toast.error({
				title: 'Failed to add class.',
			});
		}
	};

	const handleSubmitEdit = async () => {
		if (!formData.className || !formData.courseYear) {
			toast.error({
				title: 'Please fill in all required fields.',
			});
			return;
		}

		try {
			const response = await fetch(`/api/classes/${formData.classId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					className: formData.className,
					courseYear: formData.courseYear,
					departmentName: selectedDepartment,
				}),
			});

			const data = await response.json();

			if (data.success) {
				toast.success({
					title: 'Class updated successfully.',
				});
				setIsEditDialogOpen(false);
				// Refresh classes
				const refreshResponse = await fetch(
					`/api/classes?department=${encodeURIComponent(selectedDepartment)}`,
				);
				const refreshData = await refreshResponse.json();
				if (refreshData.success) {
					setClassData(refreshData.classes);
				}
			} else {
				toast.error({
					title: data.error || 'Failed to update class.',
				});
			}
		} catch (error) {
			toast.error({
				title: 'Failed to update class.',
			});
		}
	};

	const handleConfirmDelete = async () => {
		if (!selectedClassForDelete) return;

		try {
			const response = await fetch(
				`/api/classes/${
					selectedClassForDelete.CLASS_ID
				}?department=${encodeURIComponent(selectedDepartment)}`,
				{
					method: 'DELETE',
				},
			);

			const data = await response.json();

			if (data.success) {
				toast.success({
					title: 'Class deleted successfully.',
				});
				setIsDeleteDialogOpen(false);
				setSelectedClassForDelete(null);
				// Refresh classes
				const refreshResponse = await fetch(
					`/api/classes?department=${encodeURIComponent(selectedDepartment)}`,
				);
				const refreshData = await refreshResponse.json();
				if (refreshData.success) {
					setClassData(refreshData.classes);
				}
			} else {
				toast.error({
					title: data.error || 'Failed to delete class.',
				});
			}
		} catch (error) {
			toast.error({
				title: 'Failed to delete class.',
			});
		}
	};

	if (isLoading) {
		return (
			<div className='flex items-center justify-center h-64'>
				<div className='text-center'>
					<RefreshCw className='h-8 w-8 animate-spin mx-auto mb-4' />
					<p>Loading departments...</p>
				</div>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold text-gray-900'>Class Management</h1>
					<p className='text-gray-600 mt-1'>
						View and manage classes by department
					</p>
				</div>
				<div className='flex items-center gap-2'>
					<Button
						onClick={handleAddClass}
						className='bg-green-600 hover:bg-green-700 text-white flex items-center gap-2'
					>
						<Plus className='h-4 w-4' />
						Add Class
					</Button>
					<Button
						onClick={handleRefreshDepartments}
						variant='outline'
						className='flex items-center gap-2'
					>
						<RefreshCw className='h-4 w-4' />
						Refresh
					</Button>
				</div>
			</div>

			{/* Department and Search */}
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div>
							<CardTitle className='flex items-center gap-2'>
								<Building className='h-5 w-5' />
								Department Selection
							</CardTitle>
							<CardDescription>
								{isDepartmentDisabled
									? 'Department is automatically set based on your permissions'
									: 'Select a department to view its classes'}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='flex items-center space-x-4'>
						<div className='flex-1'>
							<Select
								value={selectedDepartment}
								onValueChange={setSelectedDepartment}
								disabled={isDepartmentDisabled}
							>
								<SelectTrigger className='w-full'>
									<SelectValue placeholder='Select Department' />
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
						<div className='flex-1 relative'>
							<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
							<Input
								placeholder='Search classes by ID, name, or faculty ID...'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className='pl-10'
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Classes Table */}
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div>
							<CardTitle className='flex items-center gap-2'>
								<GraduationCap className='h-5 w-5' />
								Classes ({filteredClasses.length})
							</CardTitle>
							<CardDescription>
								{selectedDepartment
									? `Classes from ${selectedDepartment} department`
									: 'Select a department to view classes'}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{isLoadingClasses ? (
						<div className='flex items-center justify-center py-8'>
							<RefreshCw className='h-6 w-6 animate-spin mr-2' />
							<span>Loading classes...</span>
						</div>
					) : (
						<div className='rounded-md border'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Class ID</TableHead>
										<TableHead>Class Name</TableHead>
										<TableHead>Course Year</TableHead>
										<TableHead>Faculty ID</TableHead>
										<TableHead className='w-[120px]'>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredClasses.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={5}
												className='text-center py-8 text-gray-500'
											>
												{selectedDepartment
													? 'No classes found for this department'
													: 'Please select a department to view classes'}
											</TableCell>
										</TableRow>
									) : (
										filteredClasses.map((cls, index) => (
											<TableRow key={`${cls.CLASS_ID}-${index}`}>
												<TableCell className='font-medium'>
													{cls.CLASS_ID}
												</TableCell>
												<TableCell>{cls.CLASS_NAME}</TableCell>
												<TableCell>
													<Badge variant='secondary'>{cls.COURSE_YEAR}</Badge>
												</TableCell>
												<TableCell>
													<Badge variant='outline'>{cls.FACULTY_ID}</Badge>
												</TableCell>
												<TableCell>
													<div className='flex items-center gap-1'>
														<Button
															onClick={() => handleEditClass(cls)}
															size='sm'
															variant='outline'
															className='h-8 w-8 p-0'
														>
															<Edit className='h-4 w-4' />
														</Button>
														<Button
															onClick={() => handleDeleteClass(cls)}
															size='sm'
															variant='outline'
															className='h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50'
														>
															<Trash2 className='h-4 w-4' />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Add Class Dialog */}
			<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
				<DialogContent className='sm:max-w-[500px]'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							<Plus className='h-5 w-5 text-green-600' />
							Add New Class
						</DialogTitle>
						<DialogDescription>
							Create a new class for the selected department.
						</DialogDescription>
					</DialogHeader>
					<div className='grid gap-4 py-4'>
						<div className='space-y-2'>
							<Label htmlFor='classId'>Class ID</Label>
							<Input
								id='classId'
								placeholder='e.g., CNTT2024A'
								value={formData.classId}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, classId: e.target.value }))
								}
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='className'>Class Name</Label>
							<Input
								id='className'
								placeholder='e.g., Information Technology 2024A'
								value={formData.className}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										className: e.target.value,
									}))
								}
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='courseYear'>Course Year</Label>
							<Input
								id='courseYear'
								placeholder='e.g., 2024'
								value={formData.courseYear}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										courseYear: e.target.value,
									}))
								}
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='facultyId'>Faculty ID</Label>
							<Input
								id='facultyId'
								value={formData.facultyId}
								disabled
								className='bg-gray-100'
							/>
						</div>
					</div>
					<div className='flex justify-end space-x-2'>
						<Button onClick={() => setIsAddDialogOpen(false)} variant='outline'>
							Cancel
						</Button>
						<Button
							onClick={handleSubmitAdd}
							className='bg-green-600 hover:bg-green-700 text-white'
						>
							<CheckCircle className='h-4 w-4 mr-2' />
							Add Class
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Edit Class Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className='sm:max-w-[500px]'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							<Edit className='h-5 w-5 text-blue-600' />
							Edit Class
						</DialogTitle>
						<DialogDescription>Update the class information.</DialogDescription>
					</DialogHeader>
					<div className='grid gap-4 py-4'>
						<div className='space-y-2'>
							<Label htmlFor='editClassId'>Class ID</Label>
							<Input
								id='editClassId'
								value={formData.classId}
								disabled
								className='bg-gray-100'
							/>
							<p className='text-sm text-gray-500'>
								Class ID cannot be changed
							</p>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='editClassName'>Class Name</Label>
							<Input
								id='editClassName'
								placeholder='e.g., Information Technology 2024A'
								value={formData.className}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										className: e.target.value,
									}))
								}
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='editCourseYear'>Course Year</Label>
							<Input
								id='editCourseYear'
								placeholder='e.g., 2024'
								value={formData.courseYear}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										courseYear: e.target.value,
									}))
								}
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='editFacultyId'>Faculty ID</Label>
							<Input
								id='editFacultyId'
								value={formData.facultyId}
								disabled
								className='bg-gray-100'
							/>
							<p className='text-sm text-gray-500'>
								Faculty ID cannot be changed
							</p>
						</div>
					</div>
					<div className='flex justify-end space-x-2'>
						<Button
							onClick={() => setIsEditDialogOpen(false)}
							variant='outline'
						>
							Cancel
						</Button>
						<Button
							onClick={handleSubmitEdit}
							className='bg-blue-600 hover:bg-blue-700 text-white'
						>
							<CheckCircle className='h-4 w-4 mr-2' />
							Update Class
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className='flex items-center gap-2'>
							<AlertTriangle className='h-5 w-5 text-red-600' />
							Confirm Deletion
						</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete the class &ldquo;
							{selectedClassForDelete?.CLASS_NAME}&rdquo; (ID:{' '}
							{selectedClassForDelete?.CLASS_ID})?
							<br />
							<span className='text-red-600 font-medium'>
								This action cannot be undone.
							</span>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmDelete}
							className='bg-red-600 hover:bg-red-700 text-white'
						>
							<Trash2 className='h-4 w-4 mr-2' />
							Delete Class
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Toaster />
		</div>
	);
}

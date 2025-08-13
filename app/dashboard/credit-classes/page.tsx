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
	DialogTrigger,
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
import { Search, Plus, Edit, Loader2, Trash2 } from 'lucide-react';

// Types
interface CreditClass {
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

interface Subject {
	SUBJECT_ID: string;
	SUBJECT_NAME: string;
	THEORY_HOURS: number;
	PRACTICE_HOURS: number;
}

interface Lecturer {
	LECTURER_ID: string;
	FACULTY_ID: string;
	LAST_NAME: string;
	FIRST_NAME: string;
	FULL_NAME: string;
	ACADEMIC_DEGREE?: string;
	ACADEMIC_TITLE?: string;
	SPECIALIZATION?: string;
	SUBJECT_CODES: string[];
}

interface Department {
	value: string;
	label: string;
	serverName: string;
}

// Dynamic department to faculty mapping (will be populated from API)
const getDepartmentFacultyMapping = (departmentName: string): string => {
	// Map department names to faculty IDs based on common patterns
	if (departmentName.toLowerCase().includes('information technology') || 
	    departmentName.toLowerCase().includes('cntt') ||
	    departmentName.toLowerCase() === 'it') {
		return 'IT';
	}
	if (departmentName.toLowerCase().includes('telecommunication') || 
	    departmentName.toLowerCase().includes('telecom') ||
	    departmentName.toLowerCase().includes('vt')) {
		return 'TELECOM';
	}
	// Default fallback
	return 'IT';
};

// API utility functions
const fetchCreditClasses = async (departmentName: string): Promise<CreditClass[]> => {
	const response = await fetch(`/api/credit-classes?department=${encodeURIComponent(departmentName)}`);
	const data = await response.json();
	if (!data.success) {
		throw new Error(data.error || 'Failed to fetch credit classes');
	}
	return data.creditClasses || [];
};

const fetchSubjects = async (): Promise<Subject[]> => {
	const response = await fetch('/api/subjects');
	const data = await response.json();
	if (!data.success) {
		throw new Error(data.error || 'Failed to fetch subjects');
	}
	return data.subjects || [];
};

const fetchLecturers = async (subjectId?: string): Promise<Lecturer[]> => {
	const url = subjectId ? `/api/lecturers?subjectId=${subjectId}` : '/api/lecturers';
	const response = await fetch(url);
	const data = await response.json();
	if (!data.success) {
		throw new Error(data.error || 'Failed to fetch lecturers');
	}
	return data.lecturers || [];
};

const createCreditClass = async (creditClass: any, departmentName: string) => {
	const response = await fetch('/api/credit-classes', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ...creditClass, departmentName }),
	});
	const data = await response.json();
	if (!data.success) {
		throw new Error(data.error || 'Failed to create credit class');
	}
	return data;
};

const updateCreditClass = async (creditClass: any, departmentName: string) => {
	const response = await fetch('/api/credit-classes', {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ...creditClass, departmentName }),
	});
	const data = await response.json();
	if (!data.success) {
		throw new Error(data.error || 'Failed to update credit class');
	}
	return data;
};

const deleteCreditClass = async (creditClassId: number, departmentName: string) => {
	const response = await fetch(`/api/credit-classes?ids=${creditClassId}&department=${encodeURIComponent(departmentName)}`, {
		method: 'DELETE',
	});
	const data = await response.json();
	if (!data.success) {
		throw new Error(data.error || 'Failed to delete credit class');
	}
	return data;
};



export default function CreditClassesPage() {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedDepartment, setSelectedDepartment] = useState('');
	const [departments, setDepartments] = useState<Department[]>([]);
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [selectedClassForDelete, setSelectedClassForDelete] = useState<CreditClass | null>(null);
	const [creditClassData, setCreditClassData] = useState<CreditClass[]>([]);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editFormData, setEditFormData] = useState<CreditClass | null>(null);

	// Data loading states
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [lecturers, setLecturers] = useState<Lecturer[]>([]);
	const [availableLecturers, setAvailableLecturers] = useState<Lecturer[]>([]);
	const [error, setError] = useState<string | null>(null);

	// Form data for adding credit classes
	const [formData, setFormData] = useState({
		academicYear: '',
		semester: 1,
		groupNumber: 1,
		subjectId: '',
		lecturerId: '',
		facultyId: '',
		minStudents: 20,
		canceledClass: false,
	});

	// Load departments from API (similar to students page)
	useEffect(() => {
		const loadDepartments = async () => {
			try {
				const response = await fetch('/api/departments');
				const data = await response.json();

				if (data.success) {
					// Filter out Accounting Department for credit classes page too
					const filteredDepartments = data.departments.filter(
						(dept: Department) =>
							!dept.label.toLowerCase().includes('accounting'),
					);
					setDepartments(filteredDepartments);

					// Set first department as default if none selected
					if (!selectedDepartment && filteredDepartments.length > 0) {
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
	}, []);

	// Load data when department changes
	useEffect(() => {
		if (selectedDepartment) {
			const loadData = async () => {
				setError(null);
				try {
					const [creditClassesData, subjectsData, lecturersData] = await Promise.all([
						fetchCreditClasses(selectedDepartment),
						fetchSubjects(),
						fetchLecturers(),
					]);
					
					setCreditClassData(creditClassesData);
					setSubjects(subjectsData);
					setLecturers(lecturersData);
				} catch (err) {
					const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
					setError(errorMessage);
					toast.error({
						title: errorMessage,
					});
				}
			};

			loadData();
		}
	}, [selectedDepartment]);

	// Update form data when department changes
	useEffect(() => {
		setFormData(prev => ({
			...prev,
			facultyId: selectedDepartment ? getDepartmentFacultyMapping(selectedDepartment) : '',
		}));
	}, [selectedDepartment]);

	// Filter credit classes (API already filters by department, so we only need search filtering)
	const filteredClasses = creditClassData.filter((cls) => {
		const matchesSearch =
			cls.CREDIT_CLASS_ID.toString().includes(searchTerm.toLowerCase()) ||
			cls.SUBJECT_NAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
			cls.LECTURER_NAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
			cls.GROUP_NUMBER.toString().includes(searchTerm.toLowerCase());
		
		return matchesSearch;
	});

	// Get lecturers for selected subject
	const getAvailableLecturers = async (subjectId: string) => {
		try {
			const lecturersForSubject = await fetchLecturers(subjectId);
			setAvailableLecturers(lecturersForSubject);
		} catch (err) {
			console.error('Error fetching lecturers for subject:', err);
			setAvailableLecturers([]);
		}
	};

	// Handle subject selection
	const handleSubjectChange = (subjectCode: string) => {
		const subject = subjects.find((s) => s.SUBJECT_ID === subjectCode);
		if (subject) {
			setFormData((prev) => ({
				...prev,
				subjectId: subjectCode,
				lecturerId: '',
			}));
			getAvailableLecturers(subjectCode);
		}
	};

	// Handle lecturer selection
	const handleLecturerChange = (lecturerId: string) => {
		setFormData((prev) => ({
			...prev,
			lecturerId: lecturerId,
		}));
	};



	const handleAdd = async () => {
		if (
			!formData.academicYear ||
			!formData.semester ||
			!formData.groupNumber ||
			!formData.subjectId ||
			!formData.lecturerId
		) {
			toast.error({
				title: 'Please fill in all required fields',
			});
			return;
		}

		setIsSubmitting(true);
		try {
			await createCreditClass(formData, selectedDepartment);
			
			// Reload data
			const updatedData = await fetchCreditClasses(selectedDepartment);
			setCreditClassData(updatedData);
			
			// Reset form
			setFormData({
				academicYear: '',
				semester: 1,
				groupNumber: 1,
				subjectId: '',
				lecturerId: '',
				facultyId: selectedDepartment ? getDepartmentFacultyMapping(selectedDepartment) : '',
				minStudents: 20,
				canceledClass: false,
			});
			setAvailableLecturers([]);
			setIsAddDialogOpen(false);

			toast.success({
				title: 'Credit class added successfully',
			});
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to add credit class';
			toast.error({
				title: errorMessage,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	// Handle delete credit class
	const handleDeleteCreditClass = async () => {
		if (!selectedClassForDelete || !selectedDepartment) {
			toast.error({
				title: 'Invalid operation',
			});
			return;
		}

		setIsSubmitting(true);
		try {
			await deleteCreditClass(selectedClassForDelete.CREDIT_CLASS_ID, selectedDepartment);
			
			// Reload data
			const updatedData = await fetchCreditClasses(selectedDepartment);
			setCreditClassData(updatedData);
			
					setIsDeleteDialogOpen(false);
		setSelectedClassForDelete(null);

		toast.success({
			title: 'Credit class deleted successfully',
		});
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Failed to delete credit class';
		toast.error({
			title: errorMessage,
		});
	} finally {
		setIsSubmitting(false);
	}
};

	const handleCreditClassIdClick = (creditClass: CreditClass) => {
		setEditFormData({...creditClass});
		setIsEditModalOpen(true);
		// Load lecturers for the subject
		getAvailableLecturers(creditClass.SUBJECT_ID);
	};

	const handleUpdateCreditClass = async () => {
		if (!editFormData) return;

		// Validation
		if (
			!editFormData.ACADEMIC_YEAR ||
			!editFormData.SEMESTER ||
			!editFormData.GROUP_NUMBER ||
			!editFormData.SUBJECT_ID ||
			!editFormData.LECTURER_ID
		) {
			toast.error({
				title: 'Please fill in all required fields',
			});
			return;
		}

		setIsSubmitting(true);
		try {
			const updateData = {
				creditClassId: editFormData.CREDIT_CLASS_ID,
				academicYear: editFormData.ACADEMIC_YEAR,
				semester: editFormData.SEMESTER,
				subjectId: editFormData.SUBJECT_ID,
				groupNumber: editFormData.GROUP_NUMBER,
				lecturerId: editFormData.LECTURER_ID,
				facultyId: editFormData.FACULTY_ID,
				minStudents: editFormData.MIN_STUDENTS,
				canceledClass: editFormData.CANCELED_CLASS,
			};

			await updateCreditClass(updateData, selectedDepartment);

			// Reload data
			const updatedData = await fetchCreditClasses(selectedDepartment);
			setCreditClassData(updatedData);

			setIsEditModalOpen(false);
			setEditFormData(null);
					setAvailableLecturers([]);
		
		toast.success({
			title: 'Credit class updated successfully',
		});
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Failed to update credit class';
		toast.error({
			title: errorMessage,
		});
	} finally {
		setIsSubmitting(false);
	}
};

	// Handle subject change in edit modal
	const handleEditSubjectChange = (subjectCode: string) => {
		const subject = subjects.find((s) => s.SUBJECT_ID === subjectCode);
		if (subject && editFormData) {
			setEditFormData((prev) =>
				prev
					? {
							...prev,
							SUBJECT_ID: subjectCode,
							SUBJECT_NAME: subject.SUBJECT_NAME,
							LECTURER_ID: '',
							LECTURER_NAME: '',
					  }
					: null,
			);
			getAvailableLecturers(subjectCode);
		}
	};

	// Handle lecturer change in edit modal
	const handleEditLecturerChange = (lecturerId: string) => {
		const lecturer = availableLecturers.find((l) => l.LECTURER_ID === lecturerId);
		if (lecturer && editFormData) {
			setEditFormData((prev) =>
				prev
					? {
							...prev,
							LECTURER_ID: lecturerId,
							LECTURER_NAME: lecturer.FULL_NAME,
					  }
					: null,
			);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin" />
				<span className="ml-2">Loading credit classes...</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center py-8">
				<p className="text-red-600 mb-4">Error: {error}</p>
				<Button onClick={() => window.location.reload()}>Retry</Button>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold text-gray-900'>
						Credit Class Management
					</h1>
					<p className='text-gray-600 mt-1'>
						Manage credit classes for Information Technology and
						Telecommunications faculties
					</p>
				</div>
			</div>

			{/* Filters and Search */}
			<Card>
				<CardHeader>
					<CardTitle>Search and Filter</CardTitle>
					<CardDescription>
						Find credit classes by ID, subject, lecturer, or group
					</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='flex items-center space-x-4'>
						<div className='flex-1 relative'>
							<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
							<Input
								placeholder='Search credit classes...'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className='pl-10'
							/>
						</div>
						<Select
							value={selectedDepartment}
							onValueChange={setSelectedDepartment}
						>
							<SelectTrigger className='w-[300px]'>
								<SelectValue placeholder='Select Faculty' />
							</SelectTrigger>
							<SelectContent>
								{departments.map((dept) => (
									<SelectItem key={dept.value} value={dept.value}>
										{dept.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
							<DialogTrigger asChild>
								<Button className='bg-blue-50 text-blue-600 hover:bg-blue-100'>
									<Plus className='mr-2 h-4 w-4' />
									Add
								</Button>
							</DialogTrigger>
							<DialogContent className='sm:max-w-[600px]'>
								<DialogHeader>
									<DialogTitle>Add New Credit Class</DialogTitle>
									<DialogDescription>
										Create a new credit class for the selected department.
									</DialogDescription>
								</DialogHeader>
								<div className='grid gap-4 py-4'>
									<div className='grid grid-cols-2 gap-4'>
										<div className='space-y-2'>
											<Label htmlFor='facultyId'>Department Code</Label>
											<Input
												id='facultyId'
												value={selectedDepartment ? `${getDepartmentFacultyMapping(selectedDepartment)} - ${selectedDepartment}` : ''}
												readOnly
												className='bg-gray-50 cursor-not-allowed'
											/>
										</div>
										<div className='space-y-2'>
											<Label htmlFor='academicYear'>Academic Year</Label>
											<Input
												id='academicYear'
												placeholder='e.g., 2024-2025'
												value={formData.academicYear}
												onChange={(e) =>
													setFormData((prev) => ({ ...prev, academicYear: e.target.value }))
												}
											/>
										</div>
									</div>

									<div className='grid grid-cols-2 gap-4'>
										<div className='space-y-2'>
											<Label htmlFor='semester'>Semester</Label>
											<Input
												id='semester'
												type='number'
												min='1'
												max='3'
												placeholder='e.g., 1, 2, 3'
												value={formData.semester}
												onChange={(e) =>
													setFormData((prev) => ({ ...prev, semester: parseInt(e.target.value) || 1 }))
												}
											/>
										</div>
										<div className='space-y-2'>
											<Label htmlFor='groupNumber'>Group</Label>
											<Input
												id='groupNumber'
												type='number'
												min='1'
												placeholder='e.g., 1, 2, 3'
												value={formData.groupNumber}
												onChange={(e) =>
													setFormData((prev) => ({
														...prev,
														groupNumber: parseInt(e.target.value) || 1,
													}))
												}
											/>
										</div>
									</div>

									<div className='grid grid-cols-2 gap-4'>
										<div className='space-y-2'>
											<Label htmlFor='subjectName'>Subject Name</Label>
											<Select
												value={formData.subjectId}
												onValueChange={handleSubjectChange}
											>
												<SelectTrigger>
													<SelectValue placeholder='Select subject' />
												</SelectTrigger>
												<SelectContent>
													{subjects.map((subject) => (
														<SelectItem key={subject.SUBJECT_ID} value={subject.SUBJECT_ID}>
															{subject.SUBJECT_NAME}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className='space-y-2'>
											<Label htmlFor='subjectCode'>Subject Code</Label>
											<Input
												id='subjectCode'
												value={formData.subjectId}
												readOnly
												className='bg-gray-50 cursor-not-allowed'
												placeholder='Auto-filled'
											/>
										</div>
									</div>

									<div className='grid grid-cols-2 gap-4'>
										<div className='space-y-2'>
											<Label htmlFor='lecturerName'>Lecturer Name</Label>
											<Select
												value={formData.lecturerId}
												onValueChange={handleLecturerChange}
												disabled={!formData.subjectId}
											>
												<SelectTrigger>
													<SelectValue
														placeholder={
															!formData.subjectId
																? 'Select subject first'
																: 'Select lecturer'
														}
													/>
												</SelectTrigger>
												<SelectContent>
													{availableLecturers.map((lecturer) => (
														<SelectItem key={lecturer.LECTURER_ID} value={lecturer.LECTURER_ID}>
															{lecturer.FULL_NAME}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className='space-y-2'>
											<Label htmlFor='minStudents'>Minimum Students</Label>
											<Input
												id='minStudents'
												type='number'
												min='1'
												value={formData.minStudents}
												onChange={(e) =>
													setFormData((prev) => ({
														...prev,
														minStudents: parseInt(e.target.value) || 1,
													}))
												}
											/>
										</div>
									</div>

									<div className='flex items-center space-x-2'>
										<Checkbox
											id='cancelClass'
											checked={formData.canceledClass}
											onCheckedChange={(checked) =>
												setFormData((prev) => ({
													...prev,
													canceledClass: checked as boolean,
												}))
											}
										/>
										<Label htmlFor='cancelClass'>Cancel this class</Label>
									</div>
								</div>
								<div className='flex justify-end space-x-2'>
									<Button
										onClick={() => setIsAddDialogOpen(false)}
										variant='outline'
										disabled={isSubmitting}
									>
										Cancel
									</Button>
									<Button
										onClick={handleAdd}
										className='bg-blue-50 text-blue-600 hover:bg-blue-100'
										disabled={isSubmitting}
									>
										{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
										Add Credit Class
									</Button>
								</div>
							</DialogContent>
						</Dialog>
					</div>
				</CardContent>
			</Card>

			{/* Edit Credit Class Modal */}
			<Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
				<DialogContent className='sm:max-w-[600px] max-h-[90vh] flex flex-col'>
					<DialogHeader className='flex-shrink-0'>
						<DialogTitle>Edit Credit Class Details</DialogTitle>
						<DialogDescription>
							Update credit class information
						</DialogDescription>
					</DialogHeader>
					{editFormData && (
						<div className='flex-1 overflow-y-auto px-1 scrollbar-hide'>
							<div className='grid gap-4 py-4'>
								<div className='grid grid-cols-2 gap-4'>
									<div className='space-y-2'>
										<Label htmlFor='editClassId'>Credit Class ID</Label>
										<Input
											id='editClassId'
											value={editFormData.CREDIT_CLASS_ID}
											readOnly
											className='bg-gray-50 cursor-not-allowed'
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='editFacultyId'>Department Code</Label>
										<Input
											id='editFacultyId'
											value={selectedDepartment ? `${getDepartmentFacultyMapping(selectedDepartment)} - ${selectedDepartment}` : ''}
											readOnly
											className='bg-gray-50 cursor-not-allowed'
										/>
									</div>
								</div>

								<div className='grid grid-cols-2 gap-4'>
									<div className='space-y-2'>
										<Label htmlFor='editYear'>Academic Year</Label>
										<Input
											id='editYear'
											placeholder='e.g., 2024-2025'
											value={editFormData.ACADEMIC_YEAR}
											onChange={(e) =>
												setEditFormData((prev) =>
													prev ? { ...prev, ACADEMIC_YEAR: e.target.value } : null,
												)
											}
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='editSemester'>Semester</Label>
										<Input
											id='editSemester'
											type='number'
											min='1'
											max='3'
											placeholder='e.g., 1, 2, 3'
											value={editFormData.SEMESTER}
											onChange={(e) =>
												setEditFormData((prev) =>
													prev ? { ...prev, SEMESTER: parseInt(e.target.value) || 1 } : null,
												)
											}
										/>
									</div>
								</div>

								<div className='grid grid-cols-2 gap-4'>
									<div className='space-y-2'>
										<Label htmlFor='editGroup'>Group</Label>
										<Input
											id='editGroup'
											type='number'
											min='1'
											placeholder='e.g., 1, 2, 3'
											value={editFormData.GROUP_NUMBER}
											onChange={(e) =>
												setEditFormData((prev) =>
													prev ? { ...prev, GROUP_NUMBER: parseInt(e.target.value) || 1 } : null,
												)
											}
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='editMinStudents'>Minimum Students</Label>
										<Input
											id='editMinStudents'
											type='number'
											min='1'
											value={editFormData.MIN_STUDENTS}
											onChange={(e) =>
												setEditFormData((prev) =>
													prev
														? {
																...prev,
																MIN_STUDENTS: parseInt(e.target.value) || 1,
														  }
														: null,
												)
											}
										/>
									</div>
								</div>

								<div className='grid grid-cols-2 gap-4'>
									<div className='space-y-2'>
										<Label htmlFor='editSubjectName'>Subject Name</Label>
										<Select
											value={editFormData.SUBJECT_ID}
											onValueChange={handleEditSubjectChange}
										>
											<SelectTrigger>
												<SelectValue placeholder='Select subject' />
											</SelectTrigger>
											<SelectContent>
												{subjects.map((subject) => (
													<SelectItem key={subject.SUBJECT_ID} value={subject.SUBJECT_ID}>
														{subject.SUBJECT_NAME}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='editSubjectCode'>
											Subject Code (readonly)
										</Label>
										<Input
											id='editSubjectCode'
											value={editFormData.SUBJECT_ID}
											readOnly
											className='bg-gray-50 cursor-not-allowed'
										/>
									</div>
								</div>

								<div className='grid grid-cols-2 gap-4'>
									<div className='space-y-2'>
										<Label htmlFor='editLecturerName'>Lecturer Name</Label>
										<Select
											value={editFormData.LECTURER_ID}
											onValueChange={handleEditLecturerChange}
											disabled={!editFormData.SUBJECT_ID}
										>
											<SelectTrigger>
												<SelectValue
													placeholder={
														!editFormData.SUBJECT_ID
															? 'Select subject first'
															: 'Select lecturer'
													}
												/>
											</SelectTrigger>
											<SelectContent>
												{availableLecturers.map((lecturer) => (
													<SelectItem key={lecturer.LECTURER_ID} value={lecturer.LECTURER_ID}>
														{lecturer.FULL_NAME}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='editCancelClass'>Class Status</Label>
										<div className='flex items-center space-x-2 pt-2'>
											<Checkbox
												id='editCancelClass'
												checked={editFormData.CANCELED_CLASS}
												onCheckedChange={(checked) =>
													setEditFormData((prev) =>
														prev
															? { ...prev, CANCELED_CLASS: checked as boolean }
															: null,
													)
												}
											/>
											<Label htmlFor='editCancelClass'>Cancel this class</Label>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}
					<div className='flex justify-end space-x-2 pt-4 border-t flex-shrink-0'>
						<Button
							onClick={() => setIsEditModalOpen(false)}
							variant='outline'
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button
							onClick={handleUpdateCreditClass}
							className='bg-blue-50 text-blue-600 hover:bg-blue-100'
							disabled={isSubmitting}
						>
							{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Update Credit Class
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Credit Classes Table */}
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div>
							<CardTitle>Credit Classes ({filteredClasses.length})</CardTitle>
							<CardDescription>
								{filteredClasses.length} credit classes found
							</CardDescription>
						</div>

					</div>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Class ID</TableHead>
								<TableHead>Academic Year</TableHead>
								<TableHead>Semester</TableHead>
								<TableHead>Subject</TableHead>
								<TableHead>Group</TableHead>
								<TableHead>Lecturer</TableHead>
								<TableHead>Department</TableHead>
								<TableHead>Min Students</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredClasses.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={10}
										className='text-center py-8 text-gray-500'
									>
									No credit classes found matching your criteria
								</TableCell>
							</TableRow>
						) : (
							filteredClasses.map((cls) => (
								<TableRow key={cls.CREDIT_CLASS_ID}>
									<TableCell>
										<button
											onClick={() => handleCreditClassIdClick(cls)}
											className='text-blue-600 hover:text-blue-800 hover:underline font-medium'
										>
											{cls.CREDIT_CLASS_ID}
										</button>
									</TableCell>
									<TableCell>{cls.ACADEMIC_YEAR}</TableCell>
									<TableCell>
										<Badge variant='secondary'>{cls.SEMESTER}</Badge>
									</TableCell>
									<TableCell>
										<div className='max-w-[200px]'>
											<div className='font-medium text-sm'>
												{cls.SUBJECT_NAME}
											</div>
											<div className='text-xs text-gray-500'>
												{cls.SUBJECT_ID}
											</div>
										</div>
									</TableCell>
									<TableCell>
										<Badge variant='outline'>{cls.GROUP_NUMBER}</Badge>
									</TableCell>
									<TableCell>
										<div className='text-sm'>{cls.LECTURER_NAME}</div>
									</TableCell>
									<TableCell>
										<Badge variant='secondary'>{cls.FACULTY_ID}</Badge>
									</TableCell>
									<TableCell>{cls.MIN_STUDENTS}</TableCell>
									<TableCell>
										{cls.CANCELED_CLASS ? (
											<Badge variant='destructive'>Canceled</Badge>
										) : (
											<Badge variant='default'>Active</Badge>
										)}
									</TableCell>
									<TableCell>
										<Button
											onClick={() => {
												setSelectedClassForDelete(cls);
												setIsDeleteDialogOpen(true);
											}}
											size='sm'
											variant='outline'
											className='h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50'
										>
											<Trash2 className='h-4 w-4' />
										</Button>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</CardContent>
		</Card>

		{/* Delete Confirmation Dialog */}
		<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Credit Class</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete credit class{' '}
						<strong>{selectedClassForDelete?.CREDIT_CLASS_ID}</strong>? This action
						cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDeleteCreditClass}
						className='bg-red-600 hover:bg-red-700'
						disabled={isSubmitting}
					>
						{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>

		<Toaster />
	</div>
);
}


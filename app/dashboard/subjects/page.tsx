'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/session';
import { MultiAuthUser } from '@/lib/services/multi-auth.service';
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
	Search,
	RefreshCw,
	Plus,
	Edit,
	Trash2,
	Building,
	BookOpen,
} from 'lucide-react';

interface Department {
	value: string;
	label: string;
	serverName: string;
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
}

export default function SubjectsPage() {
	const [searchTerm, setSearchTerm] = useState('');
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [lecturers, setLecturers] = useState<Lecturer[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Modal states
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [selectedSubjectForDelete, setSelectedSubjectForDelete] =
		useState<Subject | null>(null);
	const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

	// Form states
	const [formData, setFormData] = useState({
		subjectId: '',
		subjectName: '',
		theoryHours: 0,
		practiceHours: 0,
	});

	// Fetch subjects from API
	const fetchSubjects = async () => {
		setIsLoading(true);
		try {
			const response = await fetch('/api/subjects');
			const data = await response.json();

			if (data.success) {
				setSubjects(data.subjects || []);
			} else {
				toast.error({
					title: data.error || 'Failed to load subjects',
				});
			}
		} catch (error) {
			console.error('Error fetching subjects:', error);
			toast.error({
				title: 'Failed to load subjects',
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Fetch lecturers from API
	const fetchLecturers = async () => {
		try {
			const response = await fetch('/api/lecturers');
			const data = await response.json();

			if (data.success) {
				setLecturers(data.lecturers || []);
			} else {
				console.error('Failed to load lecturers:', data.error);
			}
		} catch (error) {
			console.error('Error fetching lecturers:', error);
		}
	};

	// Load subjects on component mount
	useEffect(() => {
		fetchSubjects();
	}, []);

	// Filter subjects based on search term
	const filteredSubjects = subjects.filter(
		(subject) =>
			subject.SUBJECT_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
			subject.SUBJECT_NAME.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	// Handler functions
	const handleAddSubject = async () => {
		setFormData({
			subjectId: '',
			subjectName: '',
			theoryHours: 0,
			practiceHours: 0,
		});
		setIsAddDialogOpen(true);
	};

	const handleEditSubject = async (subject: Subject) => {
		setEditingSubject(subject);
		setFormData({
			subjectId: subject.SUBJECT_ID,
			subjectName: subject.SUBJECT_NAME,
			theoryHours: subject.THEORY_HOURS,
			practiceHours: subject.PRACTICE_HOURS,
		});
		setIsEditDialogOpen(true);
	};

	const handleDeleteSubject = async (subject: Subject) => {
		setSelectedSubjectForDelete(subject);
		setIsDeleteDialogOpen(true);
	};

	// Form submission handlers
	const handleSubmitAdd = async () => {
		if (
			!formData.subjectId ||
			!formData.subjectName ||
			formData.theoryHours < 0 ||
			formData.practiceHours < 0
		) {
			toast.error({
				title: 'Please fill in all required fields.',
			});
			return;
		}

		try {
			const response = await fetch('/api/subjects', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (data.success) {
				toast.success({
					title: 'Subject added successfully.',
				});
				setIsAddDialogOpen(false);
				// Refresh subjects
				await fetchSubjects();
			} else {
				toast.error({
					title: data.error || 'Failed to add subject.',
				});
			}
		} catch (error) {
			toast.error({
				title: 'Failed to add subject.',
			});
		}
	};

	const handleSubmitEdit = async () => {
		if (
			!formData.subjectName ||
			formData.theoryHours < 0 ||
			formData.practiceHours < 0
		) {
			toast.error({
				title: 'Please fill in all required fields.',
			});
			return;
		}

		try {
			const response = await fetch('/api/subjects', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					subjectId: formData.subjectId,
					subjectName: formData.subjectName,
					theoryHours: formData.theoryHours,
					practiceHours: formData.practiceHours,
				}),
			});

			const data = await response.json();

			if (data.success) {
				toast.success({
					title: 'Subject updated successfully.',
				});
				setIsEditDialogOpen(false);
				// Refresh subjects
				await fetchSubjects();
			} else {
				toast.error({
					title: data.error || 'Failed to update subject.',
				});
			}
		} catch (error) {
			toast.error({
				title: 'Failed to update subject.',
			});
		}
	};

	const handleSubmitDelete = async () => {
		if (!selectedSubjectForDelete) return;

		try {
			const response = await fetch(
				`/api/subjects?subjectId=${encodeURIComponent(
					selectedSubjectForDelete.SUBJECT_ID,
				)}`,
				{
					method: 'DELETE',
				},
			);

			const data = await response.json();

			if (data.success) {
				toast.success({
					title: 'Subject deleted successfully.',
				});
				setIsDeleteDialogOpen(false);
				setSelectedSubjectForDelete(null);
				// Refresh subjects
				await fetchSubjects();
			} else {
				toast.error({
					title: data.error || 'Failed to delete subject.',
				});
			}
		} catch (error) {
			toast.error({
				title: 'Failed to delete subject.',
			});
		}
	};

	const handleRefresh = async () => {
		await fetchSubjects();
		toast.success({
			title: 'Subjects refreshed successfully',
		});
	};

	// Form change handler
	const handleFormChange = (field: string, value: string | number) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold text-gray-900'>
						Subject Management
					</h1>
					<p className='text-gray-600 mt-1'>
						Manage academic subjects and their allocated hours
					</p>
				</div>

				{/* Form Functionality Buttons */}
				<div className='flex items-center space-x-2'>
					<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
						<Button
							onClick={handleAddSubject}
							className='bg-green-600 hover:bg-green-700 text-white flex items-center gap-2'
						>
							<Plus className='h-4 w-4' />
							Add Subject
						</Button>
						<DialogContent className='sm:max-w-[500px]'>
							<DialogHeader>
								<DialogTitle>Add New Subject</DialogTitle>
								<DialogDescription>
									Create a new subject with allocated hours.
								</DialogDescription>
							</DialogHeader>
							<div className='grid gap-4 py-4'>
								<div className='space-y-2'>
									<Label htmlFor='subjectCode'>Subject ID</Label>
									<Input
										id='subjectCode'
										placeholder='e.g., CTDL, MMT'
										value={formData.subjectId}
										onChange={(e) =>
											handleFormChange(
												'subjectId',
												e.target.value.toUpperCase(),
											)
										}
										className='border-gray-200 focus:border-gray-300 focus:ring-gray-200'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='subjectName'>Subject Name</Label>
									<Input
										id='subjectName'
										placeholder='e.g., Cấu trúc dữ liệu & Giải thuật'
										value={formData.subjectName}
										onChange={(e) =>
											handleFormChange('subjectName', e.target.value)
										}
										className='border-gray-200 focus:border-gray-300 focus:ring-gray-200'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='theoryHours'>Theory Hours</Label>
									<Input
										id='theoryHours'
										type='number'
										min='0'
										placeholder='e.g., 45'
										value={formData.theoryHours || ''}
										onChange={(e) =>
											handleFormChange(
												'theoryHours',
												parseInt(e.target.value) || 0,
											)
										}
										className='border-gray-200 focus:border-gray-300 focus:ring-gray-200'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='practiceHours'>Practice Hours</Label>
									<Input
										id='practiceHours'
										type='number'
										min='0'
										placeholder='e.g., 15'
										value={formData.practiceHours || ''}
										onChange={(e) =>
											handleFormChange(
												'practiceHours',
												parseInt(e.target.value) || 0,
											)
										}
										className='border-gray-200 focus:border-gray-300 focus:ring-gray-200'
									/>
								</div>
							</div>
							<div className='flex justify-end space-x-2'>
								<Button
									onClick={() => setIsAddDialogOpen(false)}
									variant='outline'
									className='border-sky-300 text-sky-700 hover:bg-sky-50'
								>
									Cancel
								</Button>
								<Button
									onClick={handleSubmitAdd}
									className='bg-sky-600 hover:bg-sky-700 text-white'
								>
									Add Subject
								</Button>
							</div>
						</DialogContent>
					</Dialog>

					{/* Edit Subject Modal */}
					<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
						<DialogContent className='sm:max-w-[500px]'>
							<DialogHeader>
								<DialogTitle>Edit Subject</DialogTitle>
								<DialogDescription>
									Update the subject information.
								</DialogDescription>
							</DialogHeader>
							<div className='grid gap-4 py-4'>
								<div className='space-y-2'>
									<Label htmlFor='editSubjectCode'>Subject Code</Label>
									<Input
										id='editSubjectCode'
										value={formData.subjectId}
										disabled
										className='border-gray-200 bg-gray-50'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='editSubjectName'>Subject Name</Label>
									<Input
										id='editSubjectName'
										placeholder='e.g., Cấu trúc dữ liệu & Giải thuật'
										value={formData.subjectName}
										onChange={(e) =>
											handleFormChange('subjectName', e.target.value)
										}
										className='border-gray-200 focus:border-gray-300 focus:ring-gray-200'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='editTheoryHours'>Theory Hours</Label>
									<Input
										id='editTheoryHours'
										type='number'
										min='0'
										placeholder='e.g., 45'
										value={formData.theoryHours || ''}
										onChange={(e) =>
											handleFormChange(
												'theoryHours',
												parseInt(e.target.value) || 0,
											)
										}
										className='border-gray-200 focus:border-gray-300 focus:ring-gray-200'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='editPracticeHours'>Practice Hours</Label>
									<Input
										id='editPracticeHours'
										type='number'
										min='0'
										placeholder='e.g., 15'
										value={formData.practiceHours || ''}
										onChange={(e) =>
											handleFormChange(
												'practiceHours',
												parseInt(e.target.value) || 0,
											)
										}
										className='border-gray-200 focus:border-gray-300 focus:ring-gray-200'
									/>
								</div>
							</div>
							<div className='flex justify-end space-x-2'>
								<Button
									onClick={() => setIsEditDialogOpen(false)}
									variant='outline'
									className='border-sky-300 text-sky-700 hover:bg-sky-50'
								>
									Cancel
								</Button>
								<Button
									onClick={handleSubmitEdit}
									className='bg-sky-600 hover:bg-sky-700 text-white'
								>
									Update Subject
								</Button>
							</div>
						</DialogContent>
					</Dialog>

					<Button
						onClick={handleRefresh}
						variant='outline'
						size='sm'
						className='border-sky-300 text-sky-700 hover:bg-sky-50'
					>
						<RefreshCw className='mr-2 h-3 w-3' />
						Refresh
					</Button>
				</div>
			</div>

			{/* Search and Filters */}
			<Card>
				<CardHeader>
					<CardTitle>Search & Filter</CardTitle>
					<CardDescription>Find subjects by code or name</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='flex items-center space-x-4'>
						<div className='relative flex-1'>
							<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
							<Input
								placeholder='Search subjects...'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className='pl-10 border-gray-200 focus:border-gray-300 focus:ring-gray-200'
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Subjects Table */}
			<Card>
				<CardHeader>
					<div>
						<CardTitle>Subjects ({filteredSubjects.length})</CardTitle>
						<CardDescription>
							{filteredSubjects.length} subjects found
						</CardDescription>
					</div>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Subject Code</TableHead>
								<TableHead>Subject Name</TableHead>
								<TableHead>Theory Hours</TableHead>
								<TableHead>Practice Hours</TableHead>
								<TableHead className='w-[120px]'>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className='text-center py-8 text-gray-500'
									>
										Loading subjects...
									</TableCell>
								</TableRow>
							) : filteredSubjects.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className='text-center py-8 text-gray-500'
									>
										No subjects found matching your criteria
									</TableCell>
								</TableRow>
							) : (
								filteredSubjects.map((subject) => (
									<TableRow
										key={subject.SUBJECT_ID}
										className='hover:bg-sky-50'
									>
										<TableCell>
											<div className='font-medium text-gray-900'>
												{subject.SUBJECT_ID}
											</div>
										</TableCell>
										<TableCell>
											<div className='font-medium text-gray-900'>
												{subject.SUBJECT_NAME}
											</div>
										</TableCell>
										<TableCell>
											<div className='text-gray-700'>
												{subject.THEORY_HOURS}
											</div>
										</TableCell>
										<TableCell>
											<div className='text-gray-700'>
												{subject.PRACTICE_HOURS}
											</div>
										</TableCell>
										<TableCell>
											<div className='flex items-center gap-1'>
												<Button
													onClick={() => handleEditSubject(subject)}
													size='sm'
													variant='outline'
													className='h-8 w-8 p-0'
												>
													<Edit className='h-4 w-4' />
												</Button>
												<Button
													onClick={() => handleDeleteSubject(subject)}
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
				</CardContent>
			</Card>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Are you sure you want to delete this subject?
						</AlertDialogTitle>
						<AlertDialogDescription>
							You are about to delete &ldquo;
							{selectedSubjectForDelete?.SUBJECT_NAME}&rdquo;. This action
							cannot be undone and will permanently remove this subject from the
							system.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							onClick={() => setIsDeleteDialogOpen(false)}
							className='border-sky-300 text-sky-700 hover:bg-sky-50'
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleSubmitDelete}
							className='bg-red-600 hover:bg-red-700 text-white'
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Toaster />
		</div>
	);
}

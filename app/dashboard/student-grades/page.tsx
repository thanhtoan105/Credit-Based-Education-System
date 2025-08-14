'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/lib/toast';
import { Toaster } from '@/components/ui/sonner';
import { Play, Save, RotateCcw, Loader2 } from 'lucide-react';

// Interfaces
interface Department {
	value: string;
	label: string;
	serverName: string;
}

interface AcademicYear {
	value: string;
	label: string;
}

interface Semester {
	value: string;
	label: string;
}

interface Group {
	value: string;
	label: string;
}

interface Subject {
	SUBJECT_ID: string;
	SUBJECT_NAME: string;
	THEORY_HOURS: number;
	PRACTICE_HOURS: number;
}

interface StudentGrade {
	creditClassId: number;
	studentId: string;
	studentName: string;
	subjectCode: string;
	subjectName: string;
	attendanceGrade: number;
	midtermGrade: number;
	finalGrade: number;
	overallGrade: number;
}

// API utility functions
const fetchDepartments = async (): Promise<Department[]> => {
	const response = await fetch('/api/departments');
	const data = await response.json();
	if (!data.success) {
		throw new Error(data.error || 'Failed to fetch departments');
	}
	return data.departments || [];
};

const fetchAcademicYears = async (
	department: string,
): Promise<AcademicYear[]> => {
	const response = await fetch(
		`/api/academic-years?department=${encodeURIComponent(department)}`,
	);
	const data = await response.json();
	if (!data.success) {
		throw new Error(data.error || 'Failed to fetch academic years');
	}
	return data.academicYears || [];
};

const fetchSemesters = async (
	department: string,
	academicYear: string,
): Promise<Semester[]> => {
	const response = await fetch(
		`/api/semesters?department=${encodeURIComponent(
			department,
		)}&academicYear=${encodeURIComponent(academicYear)}`,
	);
	const data = await response.json();
	if (!data.success) {
		throw new Error(data.error || 'Failed to fetch semesters');
	}
	return data.semesters || [];
};

const fetchGroups = async (
	department: string,
	academicYear: string,
	semester: string,
	subjectId: string,
): Promise<Group[]> => {
	const response = await fetch(
		`/api/groups?department=${encodeURIComponent(
			department,
		)}&academicYear=${encodeURIComponent(
			academicYear,
		)}&semester=${encodeURIComponent(semester)}&subjectId=${encodeURIComponent(
			subjectId,
		)}`,
	);
	const data = await response.json();
	if (!data.success) {
		throw new Error(data.error || 'Failed to fetch groups');
	}
	return data.groups || [];
};

const fetchSubjects = async (): Promise<Subject[]> => {
	const response = await fetch('/api/subjects');
	const data = await response.json();
	if (!data.success) {
		throw new Error(data.error || 'Failed to fetch subjects');
	}
	return data.subjects || [];
};

const fetchEnrollmentList = async (
	department: string,
	academicYear: string,
	semester: string,
	group: string,
	subject: string,
): Promise<StudentGrade[]> => {
	const params = new URLSearchParams({
		department,
		academicYear,
		semester,
		group,
		subject,
	});

	const response = await fetch(`/api/enrollment?${params}`);
	const data = await response.json();
	if (!data.success) {
		throw new Error(data.error || 'Failed to fetch enrollment list');
	}
	return data.enrollmentList || [];
};

const updateGrades = async (
	department: string,
	grades: StudentGrade[],
): Promise<void> => {
	const response = await fetch('/api/grades', {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ department, grades }),
	});
	const data = await response.json();
	if (!data.success) {
		throw new Error(data.error || 'Failed to update grades');
	}
};

export default function StudentGradesPage() {
	// Department and data state
	const [departments, setDepartments] = useState<Department[]>([]);
	const [selectedDepartment, setSelectedDepartment] = useState<string>('');
	const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
	const [semesters, setSemesters] = useState<Semester[]>([]);
	const [groups, setGroups] = useState<Group[]>([]);
	const [subjects, setSubjects] = useState<Subject[]>([]);

	// Form state
	const [selectedYear, setSelectedYear] = useState<string>('');
	const [selectedGroup, setSelectedGroup] = useState<string>('');
	const [selectedSemester, setSelectedSemester] = useState<string>('');
	const [selectedSubject, setSelectedSubject] = useState<string>('');

	// Grades state
	const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
	const [isGradesVisible, setIsGradesVisible] = useState(false);

	// Loading and error states
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	// Editing state
	const [editingCell, setEditingCell] = useState<{
		studentId: string;
		field: string;
	} | null>(null);

	// Load departments on mount
	useEffect(() => {
		const loadDepartments = async () => {
			try {
				const response = await fetchDepartments();
				// Filter out Accounting Department
				const filteredDepartments = response.filter(
					(dept: Department) =>
						!dept.label.toLowerCase().includes('accounting'),
				);
				setDepartments(filteredDepartments);

				// Set first department as default if none selected
				if (!selectedDepartment && filteredDepartments.length > 0) {
					setSelectedDepartment(filteredDepartments[0].value);
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

	// Load academic years and subjects when department changes
	useEffect(() => {
		if (selectedDepartment) {
			const loadData = async () => {
				setError(null);
				try {
					const [academicYearsData, subjectsData] = await Promise.all([
						fetchAcademicYears(selectedDepartment),
						fetchSubjects(),
					]);

					setAcademicYears(academicYearsData);
					setSubjects(subjectsData);
				} catch (err) {
					const errorMessage =
						err instanceof Error ? err.message : 'Failed to load data';
					setError(errorMessage);
					toast.error({
						title: errorMessage,
					});
				}
			};

			loadData();
		}
	}, [selectedDepartment]);

	// Load semesters when department and academic year change
	useEffect(() => {
		if (selectedDepartment && selectedYear) {
			console.log('Loading semesters for:', {
				selectedDepartment,
				selectedYear,
			});
			const loadSemesters = async () => {
				try {
					const semestersData = await fetchSemesters(
						selectedDepartment,
						selectedYear,
					);
					console.log('Received semesters data:', semestersData);
					setSemesters(semestersData);
				} catch (err) {
					console.error('Error loading semesters:', err);
					const errorMessage =
						err instanceof Error ? err.message : 'Failed to load semesters';
					toast.error({
						title: errorMessage,
					});
				}
			};

			loadSemesters();
		} else {
			setSemesters([]);
		}
	}, [selectedDepartment, selectedYear]);

	// Load groups when all required parameters are available
	useEffect(() => {
		if (
			selectedDepartment &&
			selectedYear &&
			selectedSemester &&
			selectedSubject
		) {
			const loadGroups = async () => {
				try {
					const groupsData = await fetchGroups(
						selectedDepartment,
						selectedYear,
						selectedSemester,
						selectedSubject,
					);
					setGroups(groupsData);
				} catch (err) {
					const errorMessage =
						err instanceof Error ? err.message : 'Failed to load groups';
					toast.error({
						title: errorMessage,
					});
				}
			};

			loadGroups();
		} else {
			setGroups([]);
		}
	}, [selectedDepartment, selectedYear, selectedSemester, selectedSubject]);

	// Calculate overall grade
	const calculateOverallGrade = (
		attendance: number,
		midterm: number,
		final: number,
	): number => {
		return (
			Math.round((attendance * 0.1 + midterm * 0.3 + final * 0.6) * 100) / 100
		);
	};

	// Handle start grades
	const handleStart = async () => {
		if (
			!selectedDepartment ||
			!selectedYear ||
			!selectedGroup ||
			!selectedSemester ||
			!selectedSubject
		) {
			toast.error({
				title: 'Please select all required fields',
			});
			return;
		}

		setIsSubmitting(true);
		try {
			const enrollmentList = await fetchEnrollmentList(
				selectedDepartment,
				selectedYear,
				selectedSemester,
				selectedGroup,
				selectedSubject,
			);

			setStudentGrades(enrollmentList);
			setIsGradesVisible(true);

			toast.success({
				title: `Loaded grades for ${enrollmentList.length} students`,
			});
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to load grades';
			toast.error({
				title: errorMessage,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	// Handle grade update
	const handleGradeUpdate = (
		studentId: string,
		field: string,
		value: string,
	) => {
		const numValue = Math.max(0, Math.min(10, parseFloat(value) || 0));

		setStudentGrades((prev) =>
			prev.map((grade) => {
				if (grade.studentId === studentId) {
					const updatedGrade = { ...grade, [field]: numValue };
					// Recalculate overall grade
					updatedGrade.overallGrade = calculateOverallGrade(
						updatedGrade.attendanceGrade,
						updatedGrade.midtermGrade,
						updatedGrade.finalGrade,
					);
					return updatedGrade;
				}
				return grade;
			}),
		);
		setEditingCell(null);
	};

	// Handle save grades
	const handleSave = async () => {
		if (studentGrades.length === 0) {
			toast.error({
				title: 'No grades to save',
			});
			return;
		}

		setIsSubmitting(true);
		try {
			await updateGrades(selectedDepartment, studentGrades);
			toast.success({
				title: 'Grades saved successfully',
			});
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to save grades';
			toast.error({
				title: errorMessage,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	// Handle reset
	const handleReset = () => {
		setStudentGrades([]);
		setIsGradesVisible(false);
		setSelectedYear('');
		setSelectedGroup('');
		setSelectedSemester('');
		setSelectedSubject('');

		toast.success({
			title: 'Form reset successfully',
		});
	};

	// Get grade color based on value
	const getGradeColor = (grade: number) => {
		if (grade >= 8.5) return 'text-green-600 font-semibold';
		if (grade >= 7.0) return 'text-blue-600 font-semibold';
		if (grade >= 5.5) return 'text-yellow-600 font-semibold';
		if (grade >= 4.0) return 'text-orange-600 font-semibold';
		return 'text-red-600 font-semibold';
	};

	const selectedSubjectDetails = subjects.find(
		(s) => s.SUBJECT_ID === selectedSubject,
	);

	// Loading state
	if (isLoading) {
		return (
			<div className='flex items-center justify-center h-64'>
				<Loader2 className='h-8 w-8 animate-spin' />
				<span className='ml-2'>Loading student grades...</span>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className='text-center py-8'>
				<p className='text-red-600 mb-4'>Error: {error}</p>
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
						Student Grades Management
					</h1>
					<p className='text-gray-600 mt-1'>
						Manage student grades for courses across departments
					</p>
				</div>
			</div>

			{/* Selection Form */}
			<Card>
				<CardHeader>
					<CardTitle>Grade Selection Criteria</CardTitle>
					<CardDescription>
						Select the department, year, group, semester and subject to manage
						grades
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid gap-4'>
						<div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
							<div className='space-y-2'>
								<Label htmlFor='department'>Department</Label>
								<Select
									value={selectedDepartment}
									onValueChange={setSelectedDepartment}
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

							<div className='space-y-2'>
								<Label htmlFor='year'>Academic Year</Label>
								<Select
									value={selectedYear}
									onValueChange={setSelectedYear}
									disabled={!selectedDepartment}
								>
									<SelectTrigger>
										<SelectValue placeholder='Select year' />
									</SelectTrigger>
									<SelectContent>
										{academicYears.map((year) => (
											<SelectItem key={year.value} value={year.value}>
												{year.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='semester'>Semester</Label>
								<Select
									value={selectedSemester}
									onValueChange={setSelectedSemester}
									disabled={!selectedDepartment}
								>
									<SelectTrigger>
										<SelectValue placeholder='Select semester' />
									</SelectTrigger>
									<SelectContent>
										{semesters.map((semester) => (
											<SelectItem key={semester.value} value={semester.value}>
												{semester.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className='grid grid-cols-2 gap-4'>
							<div className='space-y-2'>
								<Label htmlFor='subject'>Subject</Label>
								<Select
									value={selectedSubject}
									onValueChange={setSelectedSubject}
									disabled={!selectedSemester}
								>
									<SelectTrigger>
										<SelectValue placeholder='Select subject' />
									</SelectTrigger>
									<SelectContent>
										{subjects.map((subject) => (
											<SelectItem
												key={subject.SUBJECT_ID}
												value={subject.SUBJECT_ID}
											>
												{subject.SUBJECT_NAME} ({subject.SUBJECT_ID})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='group'>Group</Label>
								<Select
									value={selectedGroup}
									onValueChange={setSelectedGroup}
									disabled={!selectedSubject}
								>
									<SelectTrigger>
										<SelectValue placeholder='Select group' />
									</SelectTrigger>
									<SelectContent>
										{groups.map((group) => (
											<SelectItem key={group.value} value={group.value}>
												{group.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* Action Buttons */}
						<div className='flex items-center space-x-3 pt-4'>
							<Button
								onClick={handleStart}
								className='bg-green-50 text-green-600 hover:bg-green-100'
								disabled={
									isSubmitting ||
									!selectedDepartment ||
									!selectedYear ||
									!selectedGroup ||
									!selectedSemester ||
									!selectedSubject
								}
							>
								{isSubmitting ? (
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
								) : (
									<Play className='mr-2 h-4 w-4' />
								)}
								{isSubmitting ? 'Loading...' : 'Start'}
							</Button>

							{isGradesVisible && (
								<>
									<Button
										onClick={handleSave}
										className='bg-blue-50 text-blue-600 hover:bg-blue-100'
										disabled={isSubmitting}
									>
										{isSubmitting ? (
											<Loader2 className='mr-2 h-4 w-4 animate-spin' />
										) : (
											<Save className='mr-2 h-4 w-4' />
										)}
										{isSubmitting ? 'Saving...' : 'Update'}
									</Button>

									<Button
										onClick={handleReset}
										variant='outline'
										className='text-gray-600 hover:bg-gray-50'
									>
										<RotateCcw className='mr-2 h-4 w-4' />
										Reset
									</Button>
								</>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Grades Table */}
			{isGradesVisible && studentGrades.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Student Grades</CardTitle>
						<CardDescription>
							{selectedSubjectDetails && (
								<div className='flex items-center space-x-4 text-sm'>
									<span>
										<strong>Subject:</strong>{' '}
										{selectedSubjectDetails.SUBJECT_NAME}
									</span>
									<span>
										<strong>Code:</strong> {selectedSubjectDetails.SUBJECT_ID}
									</span>
									<span>
										<strong>Department:</strong> {selectedDepartment}
									</span>
									<span>
										<strong>Group:</strong> {selectedGroup}
									</span>
								</div>
							)}
							<div className='mt-2 text-xs text-gray-500'>
								Overall Grade = Attendance × 10% + Midterm × 30% + Final × 60% |
								Click on grade cells to edit
							</div>
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='rounded-md border'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className='w-[100px]'>Student ID</TableHead>
										<TableHead>Student Name</TableHead>
										<TableHead>Subject Code</TableHead>
										<TableHead className='text-center w-[120px]'>
											Attendance (10%)
										</TableHead>
										<TableHead className='text-center w-[120px]'>
											Midterm (30%)
										</TableHead>
										<TableHead className='text-center w-[120px]'>
											Final (60%)
										</TableHead>
										<TableHead className='text-center w-[120px]'>
											Overall Grade
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{studentGrades.map((grade) => (
										<TableRow
											key={grade.studentId}
											className='hover:bg-gray-50'
										>
											<TableCell className='font-medium'>
												{grade.studentId}
											</TableCell>
											<TableCell>{grade.studentName}</TableCell>
											<TableCell>
												<Badge className='bg-blue-100 text-blue-800'>
													{grade.subjectCode}
												</Badge>
											</TableCell>

											{/* Attendance Grade */}
											<TableCell className='text-center'>
												{editingCell?.studentId === grade.studentId &&
												editingCell?.field === 'attendanceGrade' ? (
													<Input
														type='number'
														min='0'
														max='10'
														step='0.1'
														defaultValue={grade.attendanceGrade.toString()}
														className='w-16 h-8 text-center'
														autoFocus
														onBlur={(e) =>
															handleGradeUpdate(
																grade.studentId,
																'attendanceGrade',
																e.target.value,
															)
														}
														onKeyDown={(e) => {
															if (e.key === 'Enter') {
																handleGradeUpdate(
																	grade.studentId,
																	'attendanceGrade',
																	e.currentTarget.value,
																);
															}
														}}
													/>
												) : (
													<div
														className={`cursor-pointer px-2 py-1 rounded hover:bg-gray-100 ${getGradeColor(
															grade.attendanceGrade,
														)}`}
														onClick={() =>
															setEditingCell({
																studentId: grade.studentId,
																field: 'attendanceGrade',
															})
														}
													>
														{grade.attendanceGrade.toFixed(1)}
													</div>
												)}
											</TableCell>

											{/* Midterm Grade */}
											<TableCell className='text-center'>
												{editingCell?.studentId === grade.studentId &&
												editingCell?.field === 'midtermGrade' ? (
													<Input
														type='number'
														min='0'
														max='10'
														step='0.1'
														defaultValue={grade.midtermGrade.toString()}
														className='w-16 h-8 text-center'
														autoFocus
														onBlur={(e) =>
															handleGradeUpdate(
																grade.studentId,
																'midtermGrade',
																e.target.value,
															)
														}
														onKeyDown={(e) => {
															if (e.key === 'Enter') {
																handleGradeUpdate(
																	grade.studentId,
																	'midtermGrade',
																	e.currentTarget.value,
																);
															}
														}}
													/>
												) : (
													<div
														className={`cursor-pointer px-2 py-1 rounded hover:bg-gray-100 ${getGradeColor(
															grade.midtermGrade,
														)}`}
														onClick={() =>
															setEditingCell({
																studentId: grade.studentId,
																field: 'midtermGrade',
															})
														}
													>
														{grade.midtermGrade.toFixed(1)}
													</div>
												)}
											</TableCell>

											{/* Final Grade */}
											<TableCell className='text-center'>
												{editingCell?.studentId === grade.studentId &&
												editingCell?.field === 'finalGrade' ? (
													<Input
														type='number'
														min='0'
														max='10'
														step='0.1'
														defaultValue={grade.finalGrade.toString()}
														className='w-16 h-8 text-center'
														autoFocus
														onBlur={(e) =>
															handleGradeUpdate(
																grade.studentId,
																'finalGrade',
																e.target.value,
															)
														}
														onKeyDown={(e) => {
															if (e.key === 'Enter') {
																handleGradeUpdate(
																	grade.studentId,
																	'finalGrade',
																	e.currentTarget.value,
																);
															}
														}}
													/>
												) : (
													<div
														className={`cursor-pointer px-2 py-1 rounded hover:bg-gray-100 ${getGradeColor(
															grade.finalGrade,
														)}`}
														onClick={() =>
															setEditingCell({
																studentId: grade.studentId,
																field: 'finalGrade',
															})
														}
													>
														{grade.finalGrade.toFixed(1)}
													</div>
												)}
											</TableCell>

											{/* Overall Grade */}
											<TableCell className='text-center'>
												<div
													className={`px-2 py-1 rounded font-bold ${getGradeColor(
														grade.overallGrade,
													)}`}
												>
													{grade.overallGrade.toFixed(2)}
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			)}

			<Toaster />
		</div>
	);
}

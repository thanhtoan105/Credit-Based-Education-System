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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	TableFooter,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	FileText,
	Download,
	Printer,
	Users,
	GraduationCap,
	ClipboardList,
	BookOpen,
	Search,
	Loader2,
} from 'lucide-react';

// Types
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

interface Subject {
	SUBJECT_ID: string;
	SUBJECT_NAME: string;
}

interface Group {
	value: string;
	label: string;
}

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
	REGISTERED_STUDENTS?: number;
}

interface Student {
	id: string;
	lastName: string;
	firstName: string;
	gender: string;
	classCode: string;
}

interface Grade {
	studentId: string;
	lastName: string;
	firstName: string;
	attendance: number;
	midterm: number;
	finalExam: number;
	totalGrade: number;
}

interface StudentGrade {
	creditClassId: number;
	subjectId: string;
	subjectName: string;
	attendance: number;
	midterm: number;
	finalExam: number;
	totalGrade: number;
	letterGrade: string;
	academicYear: string;
	semester: number;
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

const fetchCreditClassesReport = async (
	department: string,
	academicYear?: string,
	semester?: string,
): Promise<CreditClass[]> => {
	const params = new URLSearchParams({ department });
	if (academicYear) params.append('academicYear', academicYear);
	if (semester) params.append('semester', semester);

	const response = await fetch(`/api/reports/credit-classes?${params}`);
	const data = await response.json();
	if (!data.success) {
		throw new Error(data.error || 'Failed to fetch credit classes report');
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

const fetchGroups = async (
	department: string,
	academicYear: string,
	semester: string,
	subjectId: string,
): Promise<Group[]> => {
	const params = new URLSearchParams({
		department,
		academicYear,
		semester,
		subjectId: subjectId,
	});

	const response = await fetch(`/api/groups?${params}`);
	const data = await response.json();
	if (!data.success) {
		throw new Error(data.error || 'Failed to fetch groups');
	}
	return data.groups || [];
};

const fetchClassStudentsReport = async (
	department: string,
	academicYear: string,
	semester: string,
	subjectId: string,
	groupNumber: string,
): Promise<Student[]> => {
	const params = new URLSearchParams({
		department,
		academicYear,
		semester,
		subjectId,
		groupNumber,
	});

	const response = await fetch(`/api/reports/class-students?${params}`);
	const data = await response.json();
	if (!data.success) {
		throw new Error(data.error || 'Failed to fetch class students report');
	}
	return data.students || [];
};

const fetchSubjectGradeReport = async (
	department: string,
	academicYear: string,
	semester: string,
	subjectId: string,
	groupNumber: string,
): Promise<Grade[]> => {
	const params = new URLSearchParams({
		department,
		academicYear,
		semester,
		subjectId,
		groupNumber,
	});

	const response = await fetch(`/api/reports/subject-grades?${params}`);
	const data = await response.json();
	if (!data.success) {
		throw new Error(data.error || 'Failed to fetch subject grade report');
	}
	return data.grades || [];
};

const fetchStudentGradeSlip = async (
	department: string,
	studentId: string,
): Promise<StudentGrade[]> => {
	const params = new URLSearchParams({
		department,
		studentId,
	});

	const response = await fetch(`/api/reports/student-grades?${params}`);
	const data = await response.json();
	if (!data.success) {
		throw new Error(data.error || 'Failed to fetch student grade slip');
	}
	return data.studentGrades || [];
};

const mockStudents: Student[] = [
	{
		id: 'SV001',
		lastName: 'Nguyen',
		firstName: 'Van A',
		gender: 'Male',
		classCode: 'CNTT01',
	},
	{
		id: 'SV002',
		lastName: 'Tran',
		firstName: 'Thi B',
		gender: 'Female',
		classCode: 'CNTT01',
	},
	{
		id: 'SV003',
		lastName: 'Le',
		firstName: 'Van C',
		gender: 'Male',
		classCode: 'CNTT02',
	},
];

export default function ReportsPage() {
	const { toast } = useToast();

	// Department and data state
	const [departments, setDepartments] = useState<Department[]>([]);
	const [selectedDepartment, setSelectedDepartment] = useState<string>('');
	const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
	const [semesters, setSemesters] = useState<Semester[]>([]);
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [groups, setGroups] = useState<Group[]>([]);
	const [isDepartmentDisabled, setIsDepartmentDisabled] =
		useState<boolean>(false);

	// Loading and error states
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	// Form states
	const [report1Form, setReport1Form] = useState({
		academicYear: '',
		semester: '',
		faculty: 'Faculty of Information Technology',
	});
	const [report2Form, setReport2Form] = useState({
		academicYear: '',
		semester: '',
		subject: '',
		group: '',
	});
	const [report3Form, setReport3Form] = useState({
		academicYear: '',
		semester: '',
		subject: '',
		group: '',
	});
	const [report4Form, setReport4Form] = useState({ studentId: '' });

	// Data states
	const [creditClassesData, setCreditClassesData] = useState<CreditClass[]>([]);
	const [studentsData, setStudentsData] = useState<Student[]>([]);
	const [gradesData, setGradesData] = useState<Grade[]>([]);

	const [studentGradeData, setStudentGradeData] = useState<any[]>([]);

	const [loading, setLoading] = useState(false);

	// Get current user and determine if department should be disabled
	useEffect(() => {
		const currentUser = getCurrentUser();
		const isKhoaLevel =
			currentUser?.role && ['KHOA', 'PGV', 'PKT'].includes(currentUser.role);

		if (isKhoaLevel && currentUser.department) {
			// For KHOA users, disable department selection and set to their department
			setIsDepartmentDisabled(true);
			setSelectedDepartment(currentUser.department.branch_name);
		}
	}, []);

	// Load departments from API (excluding Accounting Department)
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

				// If no department is selected yet and user is not KHOA level, select first department
				if (
					!selectedDepartment &&
					filteredDepartments.length > 0 &&
					!isDepartmentDisabled
				) {
					setSelectedDepartment(filteredDepartments[0].value);
				}
			} catch (error) {
				console.error('Error loading departments:', error);
				setError('Failed to load departments');
			} finally {
				setIsLoading(false);
			}
		};

		loadDepartments();
	}, [selectedDepartment, isDepartmentDisabled]);

	// Load academic years and semesters when department changes
	useEffect(() => {
		if (selectedDepartment) {
			const loadData = async () => {
				setError(null);
				try {
					const academicYearsData = await fetchAcademicYears(
						selectedDepartment,
					);
					setAcademicYears(academicYearsData);
				} catch (err) {
					const errorMessage =
						err instanceof Error ? err.message : 'Failed to load data';
					setError(errorMessage);
				}
			};

			loadData();
		}
	}, [selectedDepartment]);

	// Load semesters when department and any academic year change
	useEffect(() => {
		const currentAcademicYear =
			report1Form.academicYear ||
			report2Form.academicYear ||
			report3Form.academicYear;

		if (selectedDepartment && currentAcademicYear) {
			const loadSemesters = async () => {
				try {
					const semestersData = await fetchSemesters(
						selectedDepartment,
						currentAcademicYear,
					);
					setSemesters(semestersData);
				} catch (err) {
					const errorMessage =
						err instanceof Error ? err.message : 'Failed to load semesters';
					console.error(errorMessage);
				}
			};

			loadSemesters();
		} else {
			setSemesters([]);
		}
	}, [
		selectedDepartment,
		report1Form.academicYear,
		report2Form.academicYear,
		report3Form.academicYear,
	]);

	// Load subjects when department changes
	useEffect(() => {
		if (selectedDepartment) {
			const loadSubjects = async () => {
				try {
					const subjectsData = await fetchSubjects();
					setSubjects(subjectsData);
				} catch (err) {
					const errorMessage =
						err instanceof Error ? err.message : 'Failed to load subjects';
					console.error(errorMessage);
				}
			};

			loadSubjects();
		} else {
			setSubjects([]);
		}
	}, [selectedDepartment]);

	// Load groups when department, academic year, semester, and subject change
	useEffect(() => {
		if (
			selectedDepartment &&
			report2Form.academicYear &&
			report2Form.semester &&
			report2Form.subject
		) {
			const loadGroups = async () => {
				try {
					const groupsData = await fetchGroups(
						selectedDepartment,
						report2Form.academicYear,
						report2Form.semester,
						report2Form.subject,
					);
					setGroups(groupsData);
				} catch (err) {
					const errorMessage =
						err instanceof Error ? err.message : 'Failed to load groups';
					console.error(errorMessage);
				}
			};

			loadGroups();
		} else {
			setGroups([]);
		}
	}, [
		selectedDepartment,
		report2Form.academicYear,
		report2Form.semester,
		report2Form.subject,
	]);

	// Load groups when department, academic year, semester, and subject change (for Report 3)
	useEffect(() => {
		if (
			selectedDepartment &&
			report3Form.academicYear &&
			report3Form.semester &&
			report3Form.subject
		) {
			const loadGroups = async () => {
				try {
					const groupsData = await fetchGroups(
						selectedDepartment,
						report3Form.academicYear,
						report3Form.semester,
						report3Form.subject,
					);
					setGroups(groupsData);
				} catch (err) {
					const errorMessage =
						err instanceof Error ? err.message : 'Failed to load groups';
					console.error(errorMessage);
				}
			};

			loadGroups();
		}
	}, [
		selectedDepartment,
		report3Form.academicYear,
		report3Form.semester,
		report3Form.subject,
	]);

	// Generate Report 1: List of Available Credit Classes
	const generateReport1 = async () => {
		if (!report1Form.academicYear || !report1Form.semester) {
			toast({
				title: 'Missing Information',
				description: 'Please select academic year and semester.',
				variant: 'destructive',
			});
			return;
		}

		if (!selectedDepartment) {
			toast({
				title: 'Missing Information',
				description: 'Please select a department.',
				variant: 'destructive',
			});
			return;
		}

		setLoading(true);
		try {
			const creditClasses = await fetchCreditClassesReport(
				selectedDepartment,
				report1Form.academicYear,
				report1Form.semester,
			);

			setCreditClassesData(creditClasses);

			toast({
				title: 'Report Generated',
				description: `Found ${creditClasses.length} credit classes`,
			});
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to generate report';
			toast({
				title: 'Error',
				description: errorMessage,
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	};

	// Generate Report 2: Students Registered for Credit Class
	const generateReport2 = async () => {
		if (
			!report2Form.academicYear ||
			!report2Form.semester ||
			!report2Form.subject ||
			!report2Form.group
		) {
			toast({
				title: 'Missing Information',
				description: 'Please fill in all required fields.',
				variant: 'destructive',
			});
			return;
		}

		if (!selectedDepartment) {
			toast({
				title: 'Missing Information',
				description: 'Please select a department.',
				variant: 'destructive',
			});
			return;
		}

		setLoading(true);
		try {
			const students = await fetchClassStudentsReport(
				selectedDepartment,
				report2Form.academicYear,
				report2Form.semester,
				report2Form.subject,
				report2Form.group,
			);

			// Sort students by last name, then first name
			const sorted = students.sort(
				(a, b) =>
					a.lastName.localeCompare(b.lastName) ||
					a.firstName.localeCompare(b.firstName),
			);

			setStudentsData(sorted);

			toast({
				title: 'Report Generated',
				description: `Found ${sorted.length} registered students`,
			});
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to generate report';
			toast({
				title: 'Error',
				description: errorMessage,
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	};

	// Generate Report 3: Subject Grade Report
	const generateReport3 = async () => {
		if (
			!report3Form.academicYear ||
			!report3Form.semester ||
			!report3Form.subject ||
			!report3Form.group
		) {
			toast({
				title: 'Missing Information',
				description: 'Please fill in all required fields.',
				variant: 'destructive',
			});
			return;
		}

		if (!selectedDepartment) {
			toast({
				title: 'Missing Information',
				description: 'Please select a department.',
				variant: 'destructive',
			});
			return;
		}

		setLoading(true);
		try {
			const grades = await fetchSubjectGradeReport(
				selectedDepartment,
				report3Form.academicYear,
				report3Form.semester,
				report3Form.subject,
				report3Form.group,
			);

			// Sort grades by last name, then first name
			const sorted = grades.sort(
				(a, b) =>
					a.lastName.localeCompare(b.lastName) ||
					a.firstName.localeCompare(b.firstName),
			);

			setGradesData(sorted);

			toast({
				title: 'Report Generated',
				description: `Generated grade report for ${sorted.length} students`,
			});
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to generate grade report';
			toast({
				title: 'Error',
				description: errorMessage,
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	};

	// Generate Report 4: Individual Student Grade Slip
	const generateReport4 = async () => {
		if (!report4Form.studentId) {
			toast({
				title: 'Missing Information',
				description: 'Please enter student ID.',
				variant: 'destructive',
			});
			return;
		}

		if (!selectedDepartment) {
			toast({
				title: 'Missing Information',
				description: 'Please select a department.',
				variant: 'destructive',
			});
			return;
		}

		setLoading(true);
		try {
			const studentGrades = await fetchStudentGradeSlip(
				selectedDepartment,
				report4Form.studentId,
			);

			// Transform the data to match the existing UI structure
			const transformedGrades = studentGrades.map((grade) => ({
				subjectName: grade.subjectName,
				grade: grade.letterGrade,
				totalGrade: grade.totalGrade,
				academicYear: grade.academicYear,
				semester: grade.semester,
			}));

			setStudentGradeData(transformedGrades);

			toast({
				title: 'Report Generated',
				description: `Generated grade slip for student ${report4Form.studentId} with ${studentGrades.length} subjects`,
			});
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: 'Failed to generate student grade slip';
			toast({
				title: 'Error',
				description: errorMessage,
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	};

	// Print function
	const handlePrint = () => {
		window.print();
	};

	// Export to PDF
	const handleExportPDF = async () => {
		if (creditClassesData.length === 0) {
			toast({
				title: 'No Data',
				description: 'No credit classes data to export.',
				variant: 'destructive',
			});
			return;
		}

		try {
			const { exportCreditClassesPDF } = await import('@/lib/pdf-export');

			const departmentName =
				departments.find((d) => d.value === selectedDepartment)?.label ||
				selectedDepartment;

			await exportCreditClassesPDF({
				data: creditClassesData,
				departmentName,
				academicYear: report1Form.academicYear,
				semester: report1Form.semester,
			});

			toast({
				title: 'PDF Exported',
				description: `Report exported successfully`,
			});
		} catch (error) {
			console.error('Error exporting PDF:', error);
			toast({
				title: 'Export Failed',
				description:
					'Failed to export PDF. Please try again or use the print function.',
				variant: 'destructive',
			});
		}
	};

	return (
		<div className='min-h-screen bg-background'>
			<Toaster />

			{/* Header */}
			<div className='border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
				<div className='container mx-auto px-6 py-4'>
					<div className='flex items-center space-x-4'>
						<div className='bg-primary p-2 rounded-md'>
							<FileText className='h-6 w-6 text-primary-foreground' />
						</div>
						<div>
							<h1 className='text-2xl font-bold text-foreground'>
								Reports & Printing
							</h1>
							<p className='text-sm text-muted-foreground'>
								Generate and print various academic reports
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className='container mx-auto px-6 py-6'>
				<Tabs defaultValue='report1' className='space-y-6'>
					<TabsList className='grid w-full grid-cols-4'>
						<TabsTrigger value='report1' className='text-xs'>
							Credit Classes
						</TabsTrigger>
						<TabsTrigger value='report2' className='text-xs'>
							Class Students
						</TabsTrigger>
						<TabsTrigger value='report3' className='text-xs'>
							Grade Report
						</TabsTrigger>
						<TabsTrigger value='report4' className='text-xs'>
							Grade Slip
						</TabsTrigger>
					</TabsList>

					{/* Report 1: List of Available Credit Classes */}
					<TabsContent value='report1'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<BookOpen className='h-5 w-5 text-primary' />
									List of Available Credit Classes
								</CardTitle>
								<CardDescription>
									Generate a list of credit classes by academic year and
									semester
								</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
									<div className='space-y-2'>
										<Label>Department</Label>
										<Input
											value={
												departments.find((d) => d.value === selectedDepartment)
													?.label ||
												selectedDepartment ||
												'Loading...'
											}
											readOnly
											className='bg-muted'
											placeholder='Department will be loaded from your session'
										/>
									</div>
									<div className='space-y-2'>
										<Label>Academic Year</Label>
										<Select
											value={report1Form.academicYear}
											onValueChange={(value) => {
												setReport1Form({
													...report1Form,
													academicYear: value,
													semester: '', // Reset semester when academic year changes
												});
												setCreditClassesData([]);
											}}
											disabled={
												!selectedDepartment || academicYears.length === 0
											}
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
										<Label>Semester</Label>
										<Select
											value={report1Form.semester}
											onValueChange={(value) => {
												setReport1Form({ ...report1Form, semester: value });
												setCreditClassesData([]);
											}}
											disabled={
												!report1Form.academicYear || semesters.length === 0
											}
										>
											<SelectTrigger>
												<SelectValue placeholder='Select semester' />
											</SelectTrigger>
											<SelectContent>
												{semesters.map((semester) => (
													<SelectItem
														key={semester.value}
														value={semester.value}
													>
														{semester.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className='flex items-end'>
										<Button
											onClick={generateReport1}
											disabled={
												loading ||
												!selectedDepartment ||
												!report1Form.academicYear ||
												!report1Form.semester
											}
											className='w-full'
										>
											{loading ? (
												<>
													<Loader2 className='mr-2 h-4 w-4 animate-spin' />
													Loading...
												</>
											) : (
												<>
													<Search className='mr-2 h-4 w-4' />
													Generate Report
												</>
											)}
										</Button>
									</div>
								</div>

								{creditClassesData.length > 0 && (
									<div className='mt-6 space-y-4'>
										<div className='flex justify-between items-center'>
											<h3 className='text-lg font-semibold'>Report Results</h3>
											<div className='flex gap-2'>
												<Button variant='outline' onClick={handlePrint}>
													<Printer className='mr-2 h-4 w-4' />
													Print
												</Button>
												<Button variant='outline' onClick={handleExportPDF}>
													<Download className='mr-2 h-4 w-4' />
													Export PDF
												</Button>
											</div>
										</div>

										<Card className='print-area'>
											<CardContent className='p-6'>
												<div className='text-center mb-6 space-y-1'>
													<h2 className='text-xl font-bold'>
														LIST OF AVAILABLE CREDIT CLASSES
													</h2>
													<p className='text-muted-foreground'>
														DEPARTMENT:{' '}
														{departments.find(
															(d) => d.value === selectedDepartment,
														)?.label || selectedDepartment}
													</p>
													<p className='text-muted-foreground'>
														Academic Year: {report1Form.academicYear} |
														Semester: {report1Form.semester}
													</p>
												</div>

												<Table>
													<TableHeader>
														<TableRow>
															<TableHead className='w-12'>#</TableHead>
															<TableHead>Subject Name</TableHead>
															<TableHead>Group</TableHead>
															<TableHead>Instructor</TableHead>
															<TableHead>Min Students</TableHead>
															<TableHead>Registered Students</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{creditClassesData.map((cls, index) => (
															<TableRow key={cls.CREDIT_CLASS_ID}>
																<TableCell>{index + 1}</TableCell>
																<TableCell className='font-medium'>
																	{cls.SUBJECT_NAME}
																</TableCell>
																<TableCell>{cls.GROUP_NUMBER}</TableCell>
																<TableCell>{cls.LECTURER_NAME}</TableCell>
																<TableCell>{cls.MIN_STUDENTS}</TableCell>
																<TableCell>
																	{cls.REGISTERED_STUDENTS || 0}
																</TableCell>
															</TableRow>
														))}
													</TableBody>
													<TableFooter>
														<TableRow>
															<TableCell
																colSpan={6}
																className='text-center font-semibold'
															>
																Total classes opened: {creditClassesData.length}
															</TableCell>
														</TableRow>
													</TableFooter>
												</Table>
											</CardContent>
										</Card>
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					{/* Report 2: Students Registered for Credit Class */}
					<TabsContent value='report2'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Users className='h-5 w-5 text-primary' />
									Students Registered for Credit Class
								</CardTitle>
								<CardDescription>
									Generate a list of students registered for a specific credit
									class
								</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
									<div className='space-y-2'>
										<Label>Academic Year</Label>
										<Select
											value={report2Form.academicYear}
											onValueChange={(value) => {
												setReport2Form({
													...report2Form,
													academicYear: value,
													semester: '', // Reset dependent fields
													subject: '',
													group: '',
												});
												setStudentsData([]);
											}}
											disabled={
												!selectedDepartment || academicYears.length === 0
											}
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
										<Label>Semester</Label>
										<Select
											value={report2Form.semester}
											onValueChange={(value) => {
												setReport2Form({
													...report2Form,
													semester: value,
													subject: '', // Reset dependent fields
													group: '',
												});
												setStudentsData([]);
											}}
											disabled={
												!report2Form.academicYear || semesters.length === 0
											}
										>
											<SelectTrigger>
												<SelectValue placeholder='Select semester' />
											</SelectTrigger>
											<SelectContent>
												{semesters.map((semester) => (
													<SelectItem
														key={semester.value}
														value={semester.value}
													>
														{semester.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className='space-y-2'>
										<Label>Subject</Label>
										<Select
											value={report2Form.subject}
											onValueChange={(value) => {
												setReport2Form({
													...report2Form,
													subject: value,
													group: '', // Reset dependent field
												});
												setStudentsData([]);
											}}
											disabled={!report2Form.semester || subjects.length === 0}
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
										<Label>Group</Label>
										<Select
											value={report2Form.group}
											onValueChange={(value) => {
												setReport2Form({ ...report2Form, group: value });
												setStudentsData([]);
											}}
											disabled={!report2Form.subject || groups.length === 0}
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
									<div className='flex items-end'>
										<Button
											onClick={generateReport2}
											disabled={
												loading ||
												!selectedDepartment ||
												!report2Form.academicYear ||
												!report2Form.semester ||
												!report2Form.subject ||
												!report2Form.group
											}
											className='w-full'
										>
											{loading ? (
												<>
													<Loader2 className='mr-2 h-4 w-4 animate-spin' />
													Loading...
												</>
											) : (
												<>
													<Search className='mr-2 h-4 w-4' />
													Generate Report
												</>
											)}
										</Button>
									</div>
								</div>

								{studentsData.length > 0 && (
									<div className='mt-6 space-y-4'>
										<div className='flex justify-between items-center'>
											<h3 className='text-lg font-semibold'>Report Results</h3>
											<div className='flex gap-2'>
												<Button variant='outline' onClick={handlePrint}>
													<Printer className='mr-2 h-4 w-4' />
													Print
												</Button>
												<Button variant='outline' onClick={handleExportPDF}>
													<Download className='mr-2 h-4 w-4' />
													Export PDF
												</Button>
											</div>
										</div>

										<Card className='print-area'>
											<CardContent className='p-6'>
												<div className='text-center mb-6 space-y-1'>
													<h2 className='text-xl font-bold'>
														LIST OF STUDENTS REGISTERED FOR CREDIT CLASS
													</h2>
													<p className='text-muted-foreground'>
														FACULTY: Faculty of Information Technology
													</p>
													<p className='text-muted-foreground'>
														Academic Year: {report2Form.academicYear} |
														Semester: {report2Form.semester}
													</p>
													<p className='text-muted-foreground'>
														Subject: {report2Form.subject} – Group:{' '}
														{report2Form.group}
													</p>
												</div>

												<Table>
													<TableHeader>
														<TableRow>
															<TableHead className='w-12'>#</TableHead>
															<TableHead>Student ID</TableHead>
															<TableHead>Last Name</TableHead>
															<TableHead>First Name</TableHead>
															<TableHead>Gender</TableHead>
															<TableHead>Class Code</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{studentsData.map((student, index) => (
															<TableRow key={student.id}>
																<TableCell>{index + 1}</TableCell>
																<TableCell className='font-medium'>
																	{student.id.toUpperCase()}
																</TableCell>
																<TableCell>{student.lastName}</TableCell>
																<TableCell>{student.firstName}</TableCell>
																<TableCell>{student.gender}</TableCell>
																<TableCell>{student.classCode}</TableCell>
															</TableRow>
														))}
													</TableBody>
													<TableFooter>
														<TableRow>
															<TableCell
																colSpan={6}
																className='text-center font-semibold'
															>
																Total students registered: {studentsData.length}
															</TableCell>
														</TableRow>
													</TableFooter>
												</Table>
											</CardContent>
										</Card>
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					{/* Report 3: Subject Grade Report */}
					<TabsContent value='report3'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<ClipboardList className='h-5 w-5 text-primary' />
									Subject Grade Report for Credit Class
								</CardTitle>
								<CardDescription>
									Generate grade report for students in a specific credit class
								</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
									<div className='space-y-2'>
										<Label>Academic Year</Label>
										<Select
											value={report3Form.academicYear}
											onValueChange={(value) => {
												setReport3Form({
													...report3Form,
													academicYear: value,
													semester: '', // Reset dependent fields
													subject: '',
													group: '',
												});
												setGradesData([]);
											}}
											disabled={
												!selectedDepartment || academicYears.length === 0
											}
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
										<Label>Semester</Label>
										<Select
											value={report3Form.semester}
											onValueChange={(value) => {
												setReport3Form({
													...report3Form,
													semester: value,
													subject: '', // Reset dependent fields
													group: '',
												});
												setGradesData([]);
											}}
											disabled={
												!report3Form.academicYear || semesters.length === 0
											}
										>
											<SelectTrigger>
												<SelectValue placeholder='Select semester' />
											</SelectTrigger>
											<SelectContent>
												{semesters.map((semester) => (
													<SelectItem
														key={semester.value}
														value={semester.value}
													>
														{semester.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className='space-y-2'>
										<Label>Subject</Label>
										<Select
											value={report3Form.subject}
											onValueChange={(value) => {
												setReport3Form({
													...report3Form,
													subject: value,
													group: '', // Reset dependent field
												});
												setGradesData([]);
											}}
											disabled={!report3Form.semester || subjects.length === 0}
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
										<Label>Group</Label>
										<Select
											value={report3Form.group}
											onValueChange={(value) => {
												setReport3Form({ ...report3Form, group: value });
												setGradesData([]);
											}}
											disabled={!report3Form.subject || groups.length === 0}
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
									<div className='flex items-end'>
										<Button
											onClick={generateReport3}
											disabled={
												loading ||
												!selectedDepartment ||
												!report3Form.academicYear ||
												!report3Form.semester ||
												!report3Form.subject ||
												!report3Form.group
											}
											className='w-full'
										>
											{loading ? (
												<>
													<Loader2 className='mr-2 h-4 w-4 animate-spin' />
													Loading...
												</>
											) : (
												<>
													<Search className='mr-2 h-4 w-4' />
													Generate Report
												</>
											)}
										</Button>
									</div>
								</div>

								{gradesData.length > 0 && (
									<div className='mt-6 space-y-4'>
										<div className='flex justify-between items-center'>
											<h3 className='text-lg font-semibold'>Grade Report</h3>
											<div className='flex gap-2'>
												<Button variant='outline' onClick={handlePrint}>
													<Printer className='mr-2 h-4 w-4' />
													Print
												</Button>
												<Button variant='outline' onClick={handleExportPDF}>
													<Download className='mr-2 h-4 w-4' />
													Export PDF
												</Button>
											</div>
										</div>

										<Card className='print-area'>
											<CardContent className='p-6'>
												<div className='text-center mb-6 space-y-1'>
													<h2 className='text-xl font-bold'>
														FINAL GRADE REPORT
													</h2>
													<p className='text-muted-foreground'>
														FACULTY: Faculty of Information Technology
													</p>
													<p className='text-muted-foreground'>
														Academic Year: {report3Form.academicYear} |
														Semester: {report3Form.semester}
													</p>
													<p className='text-muted-foreground'>
														Subject: {report3Form.subject} – Group:{' '}
														{report3Form.group}
													</p>
												</div>

												<Table>
													<TableHeader>
														<TableRow>
															<TableHead className='w-12'>#</TableHead>
															<TableHead>Student ID</TableHead>
															<TableHead>Last Name</TableHead>
															<TableHead>First Name</TableHead>
															<TableHead>Attendance (10%)</TableHead>
															<TableHead>Midterm (30%)</TableHead>
															<TableHead>Final Exam (60%)</TableHead>
															<TableHead>Total Grade</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{gradesData.map((grade, index) => (
															<TableRow key={grade.studentId}>
																<TableCell>{index + 1}</TableCell>
																<TableCell className='font-medium'>
																	{grade.studentId.toUpperCase()}
																</TableCell>
																<TableCell>{grade.lastName}</TableCell>
																<TableCell>{grade.firstName}</TableCell>
																<TableCell>{grade.attendance}</TableCell>
																<TableCell>{grade.midterm}</TableCell>
																<TableCell>{grade.finalExam}</TableCell>
																<TableCell className='font-semibold'>
																	{grade.totalGrade}
																</TableCell>
															</TableRow>
														))}
													</TableBody>
													<TableFooter>
														<TableRow>
															<TableCell
																colSpan={8}
																className='text-center font-semibold'
															>
																Total students: {gradesData.length}
															</TableCell>
														</TableRow>
													</TableFooter>
												</Table>
											</CardContent>
										</Card>
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					{/* Report 4: Individual Student Grade Slip */}
					<TabsContent value='report4'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<GraduationCap className='h-5 w-5 text-primary' />
									Individual Student Grade Slip
								</CardTitle>
								<CardDescription>
									Print grade slip for an individual student
								</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div className='space-y-2'>
										<Label>Student ID</Label>
										<Input
											placeholder='Enter Student ID (e.g., SV001)'
											value={report4Form.studentId}
											onChange={(e) =>
												setReport4Form({
													...report4Form,
													studentId: e.target.value.toUpperCase(),
												})
											}
										/>
									</div>
									<div className='flex items-end'>
										<Button
											onClick={generateReport4}
											disabled={loading}
											className='w-full'
										>
											<Search className='mr-2 h-4 w-4' />
											Generate Grade Slip
										</Button>
									</div>
								</div>

								{studentGradeData.length > 0 && (
									<div className='mt-6 space-y-4'>
										<div className='flex justify-between items-center'>
											<h3 className='text-lg font-semibold'>Grade Slip</h3>
											<div className='flex gap-2'>
												<Button variant='outline' onClick={handlePrint}>
													<Printer className='mr-2 h-4 w-4' />
													Print
												</Button>
												<Button variant='outline' onClick={handleExportPDF}>
													<Download className='mr-2 h-4 w-4' />
													Export PDF
												</Button>
											</div>
										</div>

										<Card className='print-area'>
											<CardContent className='p-6'>
												<div className='text-center mb-6 space-y-1'>
													<h2 className='text-xl font-bold'>
														INDIVIDUAL GRADE SLIP
													</h2>
													<p className='text-muted-foreground'>
														Student ID: {report4Form.studentId.toUpperCase()}
													</p>
													<p className='text-muted-foreground'>
														Faculty of Information Technology
													</p>
													<p className='text-xs text-gray-500 mt-2'>
														Total Grade = Attendance × 10% + Midterm × 30% +
														Final × 60%
													</p>
												</div>

												<Table>
													<TableHeader>
														<TableRow>
															<TableHead className='w-12'>#</TableHead>
															<TableHead>Subject Name</TableHead>
															<TableHead>Academic Year</TableHead>
															<TableHead>Semester</TableHead>
															<TableHead>Total Score</TableHead>
															<TableHead>Letter Grade</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{studentGradeData.map((subject, index) => (
															<TableRow key={index}>
																<TableCell>{index + 1}</TableCell>
																<TableCell className='font-medium'>
																	{subject.subjectName}
																</TableCell>
																<TableCell>
																	{subject.academicYear || 'N/A'}
																</TableCell>
																<TableCell>
																	{subject.semester || 'N/A'}
																</TableCell>
																<TableCell>
																	{subject.totalGrade
																		? subject.totalGrade.toFixed(2)
																		: 'N/A'}
																</TableCell>
																<TableCell>
																	<Badge
																		variant={
																			subject.grade.startsWith('A')
																				? 'default' // Green for A/A+
																				: subject.grade.startsWith('B')
																				? 'secondary' // Blue for B/B+
																				: subject.grade.startsWith('C')
																				? 'outline' // Gray for C/C+
																				: 'destructive' // Red for D/D+/F
																		}
																	>
																		{subject.grade}
																	</Badge>
																</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											</CardContent>
										</Card>
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}

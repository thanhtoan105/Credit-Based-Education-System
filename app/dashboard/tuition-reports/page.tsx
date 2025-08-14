'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { FileText, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/toast';
import { Toaster } from '@/components/ui/sonner';
import { getCurrentUser } from '@/lib/session';
import { currencyToWords } from '@/lib/utils/number-to-words';

interface TuitionReportStudent {
	no: number;
	fullName: string;
	tuitionFee: number;
	amountPaid: number;
}

interface TuitionReportData {
	classId: string;
	academicYear: string;
	semester: string;
	facultyName: string;
	students: TuitionReportStudent[];
	summary: {
		totalStudents: number;
		totalAmountPaid: number;
	};
}

interface TuitionReportResponse {
	success: boolean;
	data?: TuitionReportData;
	error?: string;
}

export default function TuitionReportsPage() {
	// Form state
	const [classId, setClassId] = useState('');
	const [academicYear, setAcademicYear] = useState('');
	const [semester, setSemester] = useState('');

	// Report data state
	const [reportData, setReportData] = useState<TuitionReportData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Department state
	const [currentDepartment, setCurrentDepartment] = useState<string | null>(
		null,
	);

	// Get current user's department on component mount
	useEffect(() => {
		const currentUser = getCurrentUser();
		if (currentUser?.department?.branch_name) {
			setCurrentDepartment(currentUser.department.branch_name);
		}
	}, []);

	// Generate tuition report
	const generateReport = useCallback(async () => {
		if (!classId || !academicYear || !semester) {
			toast.error({
				title:
					'Please fill in all required fields: Class ID, Academic Year, and Semester',
			});
			return;
		}

		if (!currentDepartment) {
			toast.error({
				title: 'Department information not available',
			});
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			console.log('Generating tuition report:', {
				classId,
				academicYear,
				semester,
				currentDepartment,
			});

			const response = await fetch(
				`/api/tuition-reports?classId=${encodeURIComponent(
					classId,
				)}&academicYear=${encodeURIComponent(
					academicYear,
				)}&semester=${encodeURIComponent(
					semester,
				)}&department=${encodeURIComponent(currentDepartment)}`,
			);

			const data: TuitionReportResponse = await response.json();

			if (data.success && data.data) {
				setReportData(data.data);
				toast.success({
					title: 'Tuition report generated successfully',
				});
			} else {
				setError(data.error || 'Failed to generate report');
				toast.error({
					title: data.error || 'Failed to generate report',
				});
			}
		} catch (error) {
			console.error('Error generating report:', error);
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to generate report';
			setError(errorMessage);
			toast.error({
				title: errorMessage,
			});
		} finally {
			setIsLoading(false);
		}
	}, [classId, academicYear, semester, currentDepartment]);

	// Utility functions
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('vi-VN', {
			style: 'currency',
			currency: 'VND',
		}).format(amount);
	};

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold text-gray-900'>Tuition Reports</h1>
					<p className='text-gray-600'>
						Generate tuition payment reports by class
					</p>
				</div>
				<div className='flex items-center gap-2'>
					<Button
						variant='outline'
						className='flex items-center gap-2'
						onClick={() => window.print()}
						disabled={!reportData}
					>
						<FileText className='h-4 w-4' />
						Print Report
					</Button>
				</div>
			</div>

			{/* Input Form */}
			<Card>
				<CardHeader>
					<CardTitle>Generate Report</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='classId'>Class ID</Label>
							<Input
								id='classId'
								placeholder='e.g., D15CQCP01'
								value={classId}
								onChange={(e) => setClassId(e.target.value)}
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='academicYear'>Academic Year</Label>
							<Input
								id='academicYear'
								placeholder='e.g., 2024-2025'
								value={academicYear}
								onChange={(e) => setAcademicYear(e.target.value)}
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='semester'>Semester</Label>
							<Select value={semester} onValueChange={setSemester}>
								<SelectTrigger>
									<SelectValue placeholder='Select semester' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='1'>Semester 1</SelectItem>
									<SelectItem value='2'>Semester 2</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className='flex items-end'>
							<Button
								onClick={generateReport}
								disabled={isLoading}
								className='w-full'
							>
								{isLoading ? (
									<>
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
										Generating...
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
				</CardContent>
			</Card>

			{/* Error Display */}
			{error && (
				<Card className='border-red-200 bg-red-50'>
					<CardContent className='pt-6'>
						<div className='text-red-800'>{error}</div>
					</CardContent>
				</Card>
			)}

			{/* Report Display */}
			{reportData && (
				<Card>
					<CardHeader className='text-center'>
						<CardTitle className='text-2xl font-bold'>
							TUITION PAYMENT LIST
						</CardTitle>
						<div className='space-y-1 text-lg'>
							<div>
								<strong>CLASS ID:</strong> {reportData.classId}
							</div>
							<div>
								<strong>FACULTY:</strong> {reportData.facultyName}
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className='rounded-md border'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className='text-center'>No.</TableHead>
										<TableHead>Full Name</TableHead>
										<TableHead className='text-right'>Tuition Fee</TableHead>
										<TableHead className='text-right'>Amount Paid</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{reportData.students.map((student) => (
										<TableRow key={student.no}>
											<TableCell className='text-center font-medium'>
												{student.no}
											</TableCell>
											<TableCell>{student.fullName}</TableCell>
											<TableCell className='text-right'>
												{formatCurrency(student.tuitionFee)}
											</TableCell>
											<TableCell className='text-right'>
												{formatCurrency(student.amountPaid)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>

						{/* Summary */}
						<div className='mt-6 space-y-2 text-lg'>
							<div>
								<strong>Total number of students:</strong>{' '}
								{reportData.summary.totalStudents}
							</div>
							<div>
								<strong>Total amount paid:</strong>{' '}
								{formatCurrency(reportData.summary.totalAmountPaid)} (
								{currencyToWords(reportData.summary.totalAmountPaid)})
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			<Toaster />
		</div>
	);
}

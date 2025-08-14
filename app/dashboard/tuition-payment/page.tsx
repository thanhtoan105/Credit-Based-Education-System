'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getCurrentUser } from '@/lib/session';
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Search,
	User,
	Calendar as CalendarLucide,
	DollarSign,
	Loader2,
	Eye,
	Plus,
	CalendarIcon,
} from 'lucide-react';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Import our new types
import {
	DetailedTuitionFeeResponse,
	TuitionPaymentDetailsResponse,
	StudentInfo,
	DetailedTuitionFeeRecord,
	TuitionPaymentDetail,
	PaymentStatus,
	isSuccessfulTuitionFeeResponse,
	isSuccessfulPaymentDetailsResponse,
} from '@/lib/types/tuition.types';

// Enhanced interfaces for the new implementation
interface TuitionRecordDisplay extends DetailedTuitionFeeRecord {
	id: string;
	studentId: string;
	status: PaymentStatus;
}

interface PaymentDetailsModalState {
	isOpen: boolean;
	studentId: string | null;
	academicYear: string | null;
	semester: number | null;
	isLoading: boolean;
	paymentDetails: TuitionPaymentDetail[];
	error: string | null;
}

// Mock data
const mockStudents: Student[] = [
	{
		id: 'SV001',
		name: 'Nguyen Van An',
		class: 'CNTT-K65-A1',
		departmentCode: 'CNTT',
		year: '2024-2025',
		email: 'an.nv@student.edu',
	},
	{
		id: 'SV002',
		name: 'Tran Thi Binh',
		class: 'CNTT-K65-A1',
		departmentCode: 'CNTT',
		year: '2024-2025',
		email: 'binh.tt@student.edu',
	},
	{
		id: 'SV003',
		name: 'Le Van Cuong',
		class: 'CNTT-K65-A2',
		departmentCode: 'CNTT',
		year: '2024-2025',
		email: 'cuong.lv@student.edu',
	},
	{
		id: 'SV004',
		name: 'Pham Thi Dung',
		class: 'VT-K65-B1',
		departmentCode: 'VT',
		year: '2024-2025',
		email: 'dung.pt@student.edu',
	},
	{
		id: 'SV005',
		name: 'Hoang Van Em',
		class: 'VT-K65-B1',
		departmentCode: 'VT',
		year: '2024-2025',
		email: 'em.hv@student.edu',
	},
];

const initialTuitionRecords: TuitionRecord[] = [
	{
		id: 'TR001',
		studentId: 'SV001',
		academicYear: '2024-2025',
		semester: '1',
		tuitionFee: 15000000,
		amountPaid: 15000000,
		amountDue: 0,
		status: 'paid',
	},
	{
		id: 'TR002',
		studentId: 'SV001',
		academicYear: '2024-2025',
		semester: '2',
		tuitionFee: 15000000,
		amountPaid: 10000000,
		amountDue: 5000000,
		status: 'partial',
	},
	{
		id: 'TR003',
		studentId: 'SV001',
		academicYear: '2023-2024',
		semester: '1',
		tuitionFee: 14000000,
		amountPaid: 14000000,
		amountDue: 0,
		status: 'paid',
	},
];

const initialPaymentDetails: PaymentDetail[] = [
	{
		id: 'PD001',
		tuitionRecordId: 'TR001',
		paymentDate: '2024-01-15',
		amountPaid: 15000000,
		paymentMethod: 'Bank Transfer',
		notes: 'Full payment for semester 1',
	},
	{
		id: 'PD002',
		tuitionRecordId: 'TR002',
		paymentDate: '2024-02-20',
		amountPaid: 10000000,
		paymentMethod: 'Cash',
		notes: 'Partial payment',
	},
	{
		id: 'PD003',
		tuitionRecordId: 'TR003',
		paymentDate: '2023-08-10',
		amountPaid: 14000000,
		paymentMethod: 'Bank Transfer',
		notes: 'Full payment for semester 1',
	},
];

export default function TuitionPaymentPage() {
	// State management for new implementation
	const [studentId, setStudentId] = useState<string>('');
	const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
	const [tuitionRecords, setTuitionRecords] = useState<TuitionRecordDisplay[]>(
		[],
	);

	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [currentDepartment, setCurrentDepartment] = useState<string | null>(
		null,
	);

	// Payment details modal state
	const [paymentModal, setPaymentModal] = useState<PaymentDetailsModalState>({
		isOpen: false,
		studentId: null,
		academicYear: null,
		semester: null,
		isLoading: false,
		paymentDetails: [],
		error: null,
	});

	// Payment form modal state
	const [paymentFormModal, setPaymentFormModal] = useState({
		isOpen: false,
		studentId: '',
		academicYear: '',
		semester: 0,
		isLoading: false,
	});

	// Payment form data
	const [paymentFormData, setPaymentFormData] = useState({
		paymentDate: new Date(),
		amountPaid: 0,
	});

	// Date picker popover state
	const [datePickerOpen, setDatePickerOpen] = useState(false);

	// Get current user's department on component mount
	useEffect(() => {
		const currentUser = getCurrentUser();
		if (currentUser?.department?.branch_name) {
			setCurrentDepartment(currentUser.department.branch_name);
		}
	}, []);

	// API Functions
	const fetchStudentTuitionData = useCallback(
		async (studentIdInput: string) => {
			if (!studentIdInput.trim()) {
				setStudentInfo(null);
				setTuitionRecords([]);
				setError(null);
				return;
			}

			if (!currentDepartment) {
				setError('Department information not available');
				return;
			}

			setIsLoading(true);
			setError(null);

			try {
				const response = await fetch(
					`/api/tuition/detailed-fee?studentId=${encodeURIComponent(
						studentIdInput.trim(),
					)}&department=${encodeURIComponent(currentDepartment)}`,
				);
				const data: DetailedTuitionFeeResponse = await response.json();

				if (isSuccessfulTuitionFeeResponse(data)) {
					setStudentInfo(data.studentInfo);

					// Transform API data to display format
					const displayRecords: TuitionRecordDisplay[] =
						data.tuitionRecords.map((record, index) => ({
							...record,
							id: `TR${index + 1}`,
							studentId: data.studentInfo.STUDENT_ID,
							status: determinePaymentStatus(
								record.FEE_AMOUNT,
								record.AMOUNT_PAID,
							),
						}));

					setTuitionRecords(displayRecords);

					toast.success({
						title: `Loaded ${displayRecords.length} tuition records for ${data.studentInfo.FULL_NAME}`,
					});
				} else {
					setError(data.error || 'Failed to fetch student data');
					setStudentInfo(null);
					setTuitionRecords([]);

					toast.error({
						title: data.error || 'Failed to fetch student data',
					});
				}
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : 'Network error occurred';
				setError(errorMessage);
				setStudentInfo(null);
				setTuitionRecords([]);

				toast.error({
					title: errorMessage,
				});
			} finally {
				setIsLoading(false);
			}
		},
		[currentDepartment],
	);

	const fetchPaymentDetails = useCallback(
		async (studentId: string, academicYear: string, semester: number) => {
			if (!currentDepartment) {
				setPaymentModal((prev) => ({
					...prev,
					isLoading: false,
					error: 'Department information not available',
				}));
				return;
			}

			setPaymentModal((prev) => ({ ...prev, isLoading: true, error: null }));

			try {
				const response = await fetch(
					`/api/tuition/payment-details?studentId=${encodeURIComponent(
						studentId,
					)}&academicYear=${encodeURIComponent(
						academicYear,
					)}&semester=${semester}&department=${encodeURIComponent(
						currentDepartment,
					)}`,
				);
				const data: TuitionPaymentDetailsResponse = await response.json();

				if (isSuccessfulPaymentDetailsResponse(data)) {
					setPaymentModal((prev) => ({
						...prev,
						paymentDetails: data.paymentDetails,
						isLoading: false,
						error: null,
					}));
				} else {
					setPaymentModal((prev) => ({
						...prev,
						paymentDetails: [],
						isLoading: false,
						error: data.error || 'Failed to fetch payment details',
					}));
				}
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : 'Network error occurred';
				setPaymentModal((prev) => ({
					...prev,
					paymentDetails: [],
					isLoading: false,
					error: errorMessage,
				}));
			}
		},
		[currentDepartment],
	);

	// Utility functions
	const determinePaymentStatus = (
		feeAmount: number,
		amountPaid: number,
	): PaymentStatus => {
		if (amountPaid >= feeAmount) return PaymentStatus.PAID;
		if (amountPaid > 0) return PaymentStatus.PARTIAL;
		return PaymentStatus.UNPAID;
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('vi-VN').format(amount);
	};

	const getStatusColor = (status: PaymentStatus) => {
		switch (status) {
			case PaymentStatus.PAID:
				return 'bg-green-100 text-green-800';
			case PaymentStatus.PARTIAL:
				return 'bg-yellow-100 text-yellow-800';
			case PaymentStatus.UNPAID:
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	// Event handlers for new implementation
	const handleStudentIdChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value.toUpperCase();
			setStudentId(value);

			// Clear data when input is empty
			if (value.trim().length === 0) {
				setStudentInfo(null);
				setTuitionRecords([]);
				setError(null);
			}
		},
		[],
	);

	const handleFindStudent = useCallback(() => {
		if (studentId.trim()) {
			fetchStudentTuitionData(studentId.trim());
		}
	}, [studentId, fetchStudentTuitionData]);

	const handleKeyPress = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === 'Enter') {
				handleFindStudent();
			}
		},
		[handleFindStudent],
	);

	const handleViewPaymentDetails = useCallback(
		(record: TuitionRecordDisplay) => {
			setPaymentModal({
				isOpen: true,
				studentId: record.studentId,
				academicYear: record.ACADEMIC_YEAR,
				semester: record.SEMESTER,
				isLoading: false,
				paymentDetails: [],
				error: null,
			});

			// Fetch payment details
			fetchPaymentDetails(
				record.studentId,
				record.ACADEMIC_YEAR,
				record.SEMESTER,
			);
		},
		[fetchPaymentDetails],
	);

	const handleClosePaymentModal = useCallback(() => {
		setPaymentModal({
			isOpen: false,
			studentId: null,
			academicYear: null,
			semester: null,
			isLoading: false,
			paymentDetails: [],
			error: null,
		});
	}, []);

	const handleOpenPaymentForm = useCallback((record: TuitionRecordDisplay) => {
		setPaymentFormModal({
			isOpen: true,
			studentId: record.studentId,
			academicYear: record.ACADEMIC_YEAR,
			semester: parseInt(record.SEMESTER),
			isLoading: false,
		});
		setPaymentFormData({
			paymentDate: new Date(), // Today's date - user can change if needed
			amountPaid: 0,
		});
	}, []);

	const handleClosePaymentForm = useCallback(() => {
		setPaymentFormModal({
			isOpen: false,
			studentId: '',
			academicYear: '',
			semester: 0,
			isLoading: false,
		});
		setPaymentFormData({
			paymentDate: new Date(),
			amountPaid: 0,
		});
		setDatePickerOpen(false);
	}, []);

	const handleSubmitPayment = useCallback(async () => {
		if (!paymentFormData.paymentDate || paymentFormData.amountPaid <= 0) {
			toast.error({
				title: 'Please enter valid payment date and amount',
			});
			return;
		}

		if (!currentDepartment) {
			toast.error({
				title: 'Department information not available',
			});
			return;
		}

		setPaymentFormModal((prev) => ({ ...prev, isLoading: true }));

		try {
			console.log('Submitting payment:', {
				studentId: paymentFormModal.studentId,
				academicYear: paymentFormModal.academicYear,
				semester: paymentFormModal.semester,
				paymentDate: format(paymentFormData.paymentDate, 'yyyy-MM-dd'),
				amountPaid: paymentFormData.amountPaid,
				departmentName: currentDepartment,
			});

			const response = await fetch('/api/tuition-payment/pay', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					studentId: paymentFormModal.studentId,
					academicYear: paymentFormModal.academicYear,
					semester: paymentFormModal.semester,
					paymentDate: format(paymentFormData.paymentDate, 'yyyy-MM-dd'),
					amountPaid: paymentFormData.amountPaid,
					departmentName: currentDepartment,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error('Payment API error:', errorData);
				throw new Error(errorData.error || 'Failed to process payment');
			}

			toast.success({
				title: 'Payment recorded successfully',
			});

			// Close modal and refresh data
			handleClosePaymentForm();
			if (studentId) {
				handleFindStudent();
			}
		} catch (error) {
			console.error('Error processing payment:', error);
			toast.error({
				title: 'Failed to process payment. Please try again.',
			});
		} finally {
			setPaymentFormModal((prev) => ({ ...prev, isLoading: false }));
		}
	}, [
		paymentFormData,
		paymentFormModal,
		handleClosePaymentForm,
		studentId,
		handleFindStudent,
		currentDepartment,
	]);

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold text-gray-900'>
						Tuition Payment Management
					</h1>
					<p className='text-gray-600 mt-1'>
						Manage student tuition payments and records (PkeToan Access Only)
					</p>
				</div>
				<Badge className='bg-purple-100 text-purple-800'>
					<DollarSign className='w-4 h-4 mr-1' />
					Accounting Module
				</Badge>
			</div>

			{/* Student ID Input */}
			<Card>
				<CardHeader>
					<CardTitle>Student Tuition Information</CardTitle>
					<CardDescription>
						Enter a student ID to automatically load their tuition payment
						records
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='space-y-4'>
						<div className='flex gap-2'>
							<div className='relative flex-1'>
								<Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
								<Input
									placeholder='Enter Student ID (e.g., SV001)...'
									value={studentId}
									onChange={handleStudentIdChange}
									onKeyPress={handleKeyPress}
									className='pl-10'
									disabled={isLoading}
								/>
								{isLoading && (
									<Loader2 className='absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400' />
								)}
							</div>
							<Button
								onClick={handleFindStudent}
								disabled={isLoading || !studentId.trim()}
								className='bg-blue-600 hover:bg-blue-700'
							>
								{isLoading ? (
									<>
										<Loader2 className='h-4 w-4 mr-2 animate-spin' />
										Finding...
									</>
								) : (
									<>
										<Search className='h-4 w-4 mr-2' />
										Find
									</>
								)}
							</Button>
						</div>

						{/* Error Display */}
						{error && (
							<div className='bg-red-50 border border-red-200 rounded-lg p-3'>
								<p className='text-sm text-red-600'>{error}</p>
							</div>
						)}

						{/* Student Info Display */}
						{studentInfo && (
							<div className='bg-blue-50 p-4 rounded-lg'>
								<div className='flex items-center space-x-4'>
									<User className='h-8 w-8 text-blue-600' />
									<div>
										<h3 className='font-medium text-blue-900'>
											{studentInfo.FULL_NAME}
										</h3>
										<p className='text-sm text-blue-700'>
											ID: {studentInfo.STUDENT_ID} | Class:{' '}
											{studentInfo.CLASS_ID}
										</p>
										<p className='text-sm text-blue-600'>
											{tuitionRecords.length} tuition record(s) found
										</p>
									</div>
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Tuition Records */}
			{studentInfo && tuitionRecords.length > 0 && (
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<div>
								<CardTitle>Tuition Payment Records</CardTitle>
								<CardDescription>
									Payment history for {studentInfo.FULL_NAME} (ordered by
									academic year and semester)
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className='rounded-md border'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Academic Year</TableHead>
										<TableHead>Semester</TableHead>
										<TableHead className='text-right'>Tuition Fee</TableHead>
										<TableHead className='text-right'>Amount Paid</TableHead>
										<TableHead className='text-right'>Amount Due</TableHead>
										<TableHead className='text-center'>Status</TableHead>
										<TableHead className='text-center'>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{tuitionRecords.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={7}
												className='text-center py-8 text-gray-500'
											>
												No tuition records found for this student
											</TableCell>
										</TableRow>
									) : (
										tuitionRecords.map((record) => (
											<TableRow key={record.id} className='hover:bg-gray-50'>
												<TableCell className='font-medium'>
													{record.ACADEMIC_YEAR}
												</TableCell>
												<TableCell>
													<Badge className='bg-purple-100 text-purple-800'>
														Semester {record.SEMESTER}
													</Badge>
												</TableCell>
												<TableCell className='text-right font-medium'>
													{formatCurrency(record.FEE_AMOUNT)}
												</TableCell>
												<TableCell className='text-right text-green-600 font-medium'>
													{formatCurrency(record.AMOUNT_PAID)}
												</TableCell>
												<TableCell className='text-right text-red-600 font-medium'>
													{formatCurrency(record.AMOUNT_DUE)}
												</TableCell>
												<TableCell className='text-center'>
													<Badge className={getStatusColor(record.status)}>
														{record.status.charAt(0).toUpperCase() +
															record.status.slice(1)}
													</Badge>
												</TableCell>
												<TableCell className='text-center'>
													<div className='flex gap-2 justify-center'>
														<TooltipProvider>
															<Tooltip>
																<TooltipTrigger asChild>
																	<Button
																		variant='outline'
																		size='sm'
																		onClick={(e) => {
																			e.stopPropagation();
																			handleViewPaymentDetails(record);
																		}}
																	>
																		<Eye className='h-4 w-4' />
																	</Button>
																</TooltipTrigger>
																<TooltipContent>
																	<p>View Details</p>
																</TooltipContent>
															</Tooltip>
														</TooltipProvider>
														{record.AMOUNT_DUE > 0 && (
															<TooltipProvider>
																<Tooltip>
																	<TooltipTrigger asChild>
																		<Button
																			variant='outline'
																			size='sm'
																			className='bg-green-50 text-green-600 hover:bg-green-100'
																			onClick={(e) => {
																				e.stopPropagation();
																				handleOpenPaymentForm(record);
																			}}
																		>
																			<Plus className='h-4 w-4' />
																		</Button>
																	</TooltipTrigger>
																	<TooltipContent>
																		<p>Pay / Update</p>
																	</TooltipContent>
																</Tooltip>
															</TooltipProvider>
														)}
													</div>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Payment Details Modal */}
			<Dialog open={paymentModal.isOpen} onOpenChange={handleClosePaymentModal}>
				<DialogContent className='max-w-4xl'>
					<DialogHeader>
						<DialogTitle>Payment Details</DialogTitle>
						<DialogDescription>
							Payment history for {studentInfo?.FULL_NAME} -{' '}
							{paymentModal.academicYear} Semester {paymentModal.semester}
						</DialogDescription>
					</DialogHeader>

					<div className='mt-4'>
						{paymentModal.isLoading ? (
							<div className='flex items-center justify-center py-8'>
								<Loader2 className='h-6 w-6 animate-spin mr-2' />
								<span>Loading payment details...</span>
							</div>
						) : paymentModal.error ? (
							<div className='bg-red-50 border border-red-200 rounded-lg p-4'>
								<p className='text-sm text-red-600'>{paymentModal.error}</p>
							</div>
						) : (
							<div className='rounded-md border'>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Payment Date</TableHead>
											<TableHead className='text-right'>Amount Paid</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{paymentModal.paymentDetails.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={2}
													className='text-center py-8 text-gray-500'
												>
													No payment records found for this period
												</TableCell>
											</TableRow>
										) : (
											paymentModal.paymentDetails.map((payment, index) => (
												<TableRow key={index}>
													<TableCell className='font-medium'>
														<div className='flex items-center'>
															<CalendarLucide className='mr-2 h-4 w-4 text-gray-400' />
															{payment.PAYMENT_DATE}
														</div>
													</TableCell>
													<TableCell className='text-right text-green-600 font-medium'>
														{formatCurrency(payment.AMOUNT_PAID)}
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>

								{paymentModal.paymentDetails.length > 0 && (
									<div className='border-t bg-gray-50 px-4 py-3'>
										<div className='flex justify-between items-center text-sm'>
											<span className='font-medium'>
												Total Payments: {paymentModal.paymentDetails.length}
											</span>
											<span className='font-medium text-green-600'>
												Total Amount:{' '}
												{formatCurrency(
													paymentModal.paymentDetails.reduce(
														(sum, p) => sum + p.AMOUNT_PAID,
														0,
													),
												)}
											</span>
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>

			{/* Payment Form Modal */}
			<Dialog
				open={paymentFormModal.isOpen}
				onOpenChange={handleClosePaymentForm}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Record Payment</DialogTitle>
						<DialogDescription>
							Record a new payment for {studentInfo?.FULL_NAME} -{' '}
							{paymentFormModal.academicYear} Semester{' '}
							{paymentFormModal.semester}
							<br />
							<span className='text-sm text-amber-600 mt-1 block'>
								Note: Each payment date must be unique. If a payment already
								exists for the selected date, please choose a different date.
							</span>
						</DialogDescription>
					</DialogHeader>
					<div className='grid gap-4 py-4'>
						<div className='space-y-2'>
							<Label>Payment Date</Label>
							<Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
								<PopoverTrigger asChild>
									<Button
										variant='outline'
										className={cn(
											'w-full justify-start text-left font-normal',
											!paymentFormData.paymentDate && 'text-muted-foreground',
										)}
										onClick={() => {
											console.log(
												'Date picker button clicked, current state:',
												datePickerOpen,
											);
											setDatePickerOpen(!datePickerOpen);
										}}
									>
										<CalendarIcon className='mr-2 h-4 w-4' />
										{paymentFormData.paymentDate ? (
											format(paymentFormData.paymentDate, 'PPP')
										) : (
											<span>Pick a date</span>
										)}
									</Button>
								</PopoverTrigger>
								<PopoverContent className='w-auto p-0'>
									<Calendar
										mode='single'
										selected={paymentFormData.paymentDate}
										onSelect={(date) => {
											setPaymentFormData((prev) => ({
												...prev,
												paymentDate: date || new Date(),
											}));
											setDatePickerOpen(false);
										}}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='amountPaid'>Amount Paid (VND)</Label>
							<Input
								id='amountPaid'
								type='number'
								placeholder='Enter payment amount'
								value={paymentFormData.amountPaid || ''}
								onChange={(e) =>
									setPaymentFormData((prev) => ({
										...prev,
										amountPaid: parseInt(e.target.value) || 0,
									}))
								}
							/>
						</div>
					</div>
					<div className='flex justify-end space-x-2'>
						<Button variant='outline' onClick={handleClosePaymentForm}>
							Cancel
						</Button>
						<Button
							onClick={handleSubmitPayment}
							disabled={paymentFormModal.isLoading}
							className='bg-green-600 hover:bg-green-700'
						>
							{paymentFormModal.isLoading ? (
								<>
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									Processing...
								</>
							) : (
								'Save Payment'
							)}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			<Toaster />
		</div>
	);
}

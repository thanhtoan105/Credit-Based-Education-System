'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
	FileText,
	Download,
	TrendingUp,
	DollarSign,
	Users,
	Calendar,
	Filter,
} from 'lucide-react';

interface TuitionReport {
	id: string;
	studentId: string;
	studentName: string;
	semester: string;
	totalAmount: number;
	paidAmount: number;
	remainingAmount: number;
	status: 'paid' | 'partial' | 'unpaid' | 'overdue';
	dueDate: string;
	lastPayment: string;
}

export default function TuitionReportsPage() {
	const [reports, setReports] = useState<TuitionReport[]>([]);
	const [selectedSemester, setSelectedSemester] = useState('2024-1');
	const [selectedStatus, setSelectedStatus] = useState('all');
	const [isLoading, setIsLoading] = useState(true);

	// Mock data - replace with actual API call
	useEffect(() => {
		const mockReports: TuitionReport[] = [
			{
				id: '1',
				studentId: 'SV001',
				studentName: 'Nguyễn Văn An',
				semester: '2024-1',
				totalAmount: 15000000,
				paidAmount: 15000000,
				remainingAmount: 0,
				status: 'paid',
				dueDate: '2024-02-15',
				lastPayment: '2024-01-20',
			},
			{
				id: '2',
				studentId: 'SV002',
				studentName: 'Trần Thị Bình',
				semester: '2024-1',
				totalAmount: 15000000,
				paidAmount: 10000000,
				remainingAmount: 5000000,
				status: 'partial',
				dueDate: '2024-02-15',
				lastPayment: '2024-01-15',
			},
			{
				id: '3',
				studentId: 'SV003',
				studentName: 'Lê Văn Cường',
				semester: '2024-1',
				totalAmount: 15000000,
				paidAmount: 0,
				remainingAmount: 15000000,
				status: 'overdue',
				dueDate: '2024-02-15',
				lastPayment: '',
			},
		];

		setTimeout(() => {
			setReports(mockReports);
			setIsLoading(false);
		}, 1000);
	}, [selectedSemester]);

	const filteredReports = reports.filter(
		(report) =>
			selectedStatus === 'all' || report.status === selectedStatus,
	);

	const getStatusBadge = (status: string) => {
		const variants = {
			paid: 'bg-green-100 text-green-800',
			partial: 'bg-yellow-100 text-yellow-800',
			unpaid: 'bg-gray-100 text-gray-800',
			overdue: 'bg-red-100 text-red-800',
		};
		return variants[status as keyof typeof variants] || variants.unpaid;
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('vi-VN', {
			style: 'currency',
			currency: 'VND',
		}).format(amount);
	};

	const totalRevenue = reports.reduce((sum, report) => sum + report.paidAmount, 0);
	const totalOutstanding = reports.reduce((sum, report) => sum + report.remainingAmount, 0);
	const paidCount = reports.filter(r => r.status === 'paid').length;
	const overdueCount = reports.filter(r => r.status === 'overdue').length;

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold text-gray-900'>Tuition Reports</h1>
					<p className='text-gray-600'>Monitor tuition payments and financial status</p>
				</div>
				<div className='flex items-center gap-2'>
					<Button variant='outline' className='flex items-center gap-2'>
						<Filter className='h-4 w-4' />
						Filter
					</Button>
					<Button className='flex items-center gap-2'>
						<Download className='h-4 w-4' />
						Export Report
					</Button>
				</div>
			</div>

			{/* Stats Cards */}
			<div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Total Revenue</CardTitle>
						<DollarSign className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{formatCurrency(totalRevenue)}</div>
						<p className='text-xs text-muted-foreground'>
							+12% from last semester
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Outstanding</CardTitle>
						<TrendingUp className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{formatCurrency(totalOutstanding)}</div>
						<p className='text-xs text-muted-foreground'>
							Pending payments
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Paid Students</CardTitle>
						<Users className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{paidCount}</div>
						<p className='text-xs text-muted-foreground'>
							{((paidCount / reports.length) * 100).toFixed(1)}% completion rate
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Overdue</CardTitle>
						<Calendar className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-red-600'>{overdueCount}</div>
						<p className='text-xs text-muted-foreground'>
							Require immediate attention
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Filters and Reports Table */}
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<CardTitle>Payment Reports</CardTitle>
						<div className='flex items-center gap-4'>
							<Select value={selectedSemester} onValueChange={setSelectedSemester}>
								<SelectTrigger className='w-40'>
									<SelectValue placeholder='Select semester' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='2024-1'>Semester 1 2024</SelectItem>
									<SelectItem value='2023-2'>Semester 2 2023</SelectItem>
									<SelectItem value='2023-1'>Semester 1 2023</SelectItem>
								</SelectContent>
							</Select>
							<Select value={selectedStatus} onValueChange={setSelectedStatus}>
								<SelectTrigger className='w-32'>
									<SelectValue placeholder='Status' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>All Status</SelectItem>
									<SelectItem value='paid'>Paid</SelectItem>
									<SelectItem value='partial'>Partial</SelectItem>
									<SelectItem value='unpaid'>Unpaid</SelectItem>
									<SelectItem value='overdue'>Overdue</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className='rounded-md border'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Student ID</TableHead>
									<TableHead>Student Name</TableHead>
									<TableHead>Total Amount</TableHead>
									<TableHead>Paid Amount</TableHead>
									<TableHead>Remaining</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Due Date</TableHead>
									<TableHead>Last Payment</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading ? (
									<TableRow>
										<TableCell colSpan={8} className='text-center py-8'>
											Loading reports...
										</TableCell>
									</TableRow>
								) : filteredReports.length === 0 ? (
									<TableRow>
										<TableCell colSpan={8} className='text-center py-8'>
											No reports found
										</TableCell>
									</TableRow>
								) : (
									filteredReports.map((report) => (
										<TableRow key={report.id}>
											<TableCell className='font-medium'>
												{report.studentId}
											</TableCell>
											<TableCell>{report.studentName}</TableCell>
											<TableCell>{formatCurrency(report.totalAmount)}</TableCell>
											<TableCell>{formatCurrency(report.paidAmount)}</TableCell>
											<TableCell>
												{report.remainingAmount > 0 ? (
													<span className='text-red-600'>
														{formatCurrency(report.remainingAmount)}
													</span>
												) : (
													<span className='text-green-600'>
														{formatCurrency(0)}
													</span>
												)}
											</TableCell>
											<TableCell>
												<Badge className={getStatusBadge(report.status)}>
													{report.status}
												</Badge>
											</TableCell>
											<TableCell>{report.dueDate}</TableCell>
											<TableCell>
												{report.lastPayment || 'No payment'}
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

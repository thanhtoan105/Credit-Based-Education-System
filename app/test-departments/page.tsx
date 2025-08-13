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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, CheckCircle, XCircle } from 'lucide-react';

interface Department {
	value: string;
	label: string;
	serverName: string;
}

interface TestResult {
	success: boolean;
	departments: Department[];
	message?: string;
	query?: string;
	error?: string;
}

export default function TestDepartmentsPage() {
	const [testResult, setTestResult] = useState<TestResult | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [authTestResult, setAuthTestResult] = useState<any>(null);
	const [isAuthTesting, setIsAuthTesting] = useState(false);

	const runTest = async () => {
		setIsLoading(true);
		setTestResult(null);

		try {
			const response = await fetch('/api/departments');
			const data = await response.json();
			setTestResult(data);
		} catch (error) {
			setTestResult({
				success: false,
				departments: [],
				error: `Network error: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`,
			});
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		runTest();
	}, []);

	return (
		<div className='min-h-screen bg-gray-50 p-4'>
			<div className='max-w-4xl mx-auto space-y-6'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Database className='h-5 w-5' />
							Department Loading Test - VIEW_FRAGMENT_LIST
						</CardTitle>
						<CardDescription>
							Testing the connection to MSI/QLDSV_TC database and
							VIEW_FRAGMENT_LIST query
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='flex gap-2'>
							<Button onClick={runTest} disabled={isLoading}>
								{isLoading ? (
									<>
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
										Testing...
									</>
								) : (
									<>
										<Database className='mr-2 h-4 w-4' />
										Run Test
									</>
								)}
							</Button>
						</div>

						{testResult && (
							<div className='space-y-4'>
								<Alert variant={testResult.success ? 'default' : 'destructive'}>
									{testResult.success ? (
										<CheckCircle className='h-4 w-4' />
									) : (
										<XCircle className='h-4 w-4' />
									)}
									<AlertDescription>
										{testResult.success ? (
											<>
												<strong>Success!</strong> {testResult.message}
											</>
										) : (
											<>
												<strong>Failed:</strong> {testResult.error}
											</>
										)}
									</AlertDescription>
								</Alert>

								{testResult.query && (
									<div className='bg-gray-100 p-3 rounded-md'>
										<p className='text-sm font-medium text-gray-700 mb-1'>
											SQL Query:
										</p>
										<code className='text-sm text-gray-600'>
											{testResult.query}
										</code>
									</div>
								)}

								{testResult.success && testResult.departments.length > 0 && (
									<div>
										<h3 className='text-lg font-medium mb-3'>
											Departments Found ({testResult.departments.length})
										</h3>
										<div className='grid gap-2'>
											{testResult.departments.map((dept, index) => (
												<div
													key={index}
													className='flex justify-between items-center p-3 bg-white rounded border'
												>
													<div>
														<p className='font-medium'>{dept.label}</p>
														<p className='text-sm text-gray-500'>
															Branch Name: {dept.value}
														</p>
													</div>
													<div className='text-right'>
														<p className='text-sm font-mono text-gray-600'>
															{dept.serverName}
														</p>
														<p className='text-xs text-gray-400'>Server Name</p>
													</div>
												</div>
											))}
										</div>
									</div>
								)}

								{testResult.success && testResult.departments.length === 0 && (
									<Alert>
										<AlertDescription>
											No departments found in VIEW_FRAGMENT_LIST. The view might
											be empty or not properly configured.
										</AlertDescription>
									</Alert>
								)}
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Database Configuration</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-2 gap-4 text-sm'>
							<div>
								<p className='font-medium text-gray-700'>Server:</p>
								<p className='text-gray-600'>MSI</p>
							</div>
							<div>
								<p className='font-medium text-gray-700'>Database:</p>
								<p className='text-gray-600'>QLDSV_TC</p>
							</div>
							<div>
								<p className='font-medium text-gray-700'>Username:</p>
								<p className='text-gray-600'>sa</p>
							</div>
							<div>
								<p className='font-medium text-gray-700'>Password:</p>
								<p className='text-gray-600'>123456</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<div className='text-center'>
					<Button
						variant='outline'
						onClick={() => (window.location.href = '/')}
					>
						Back to Login
					</Button>
				</div>
			</div>
		</div>
	);
}

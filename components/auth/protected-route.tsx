'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	User,
	canAccessPage,
	getUnauthorizedMessage,
	getRedirectPath,
	validateSession,
	logAccess,
} from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Shield, ArrowLeft, AlertTriangle, Lock, Home } from 'lucide-react';

interface ProtectedRouteProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
	redirectOnUnauthorized?: boolean;
}

export default function ProtectedRoute({
	children,
	fallback,
	redirectOnUnauthorized = false,
}: ProtectedRouteProps) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [accessDenied, setAccessDenied] = useState(false);
	const router = useRouter();
	const pathname = usePathname();
	const { toast } = useToast();

	useEffect(() => {
		const checkAccess = () => {
			try {
				const userData = localStorage.getItem('user');

				if (!userData) {
					// No user data, redirect to login
					router.push('/');
					return;
				}

				const parsedUser: User = JSON.parse(userData);

				// Validate session
				const sessionValidation = validateSession(parsedUser);
				if (!sessionValidation.valid) {
					toast({
						title: 'Session Invalid',
						description: sessionValidation.reason || 'Please log in again.',
						variant: 'destructive',
					});
					localStorage.removeItem('user');
					router.push('/');
					return;
				}

				setUser(parsedUser);

				// Check page access
				const hasAccess = canAccessPage(parsedUser, pathname);

				// Log access attempt
				logAccess(parsedUser, 'PAGE_ACCESS', pathname, hasAccess);

				if (!hasAccess) {
					setAccessDenied(true);

					if (redirectOnUnauthorized) {
						const redirectPath = getRedirectPath(parsedUser);
						toast({
							title: 'Access Denied',
							description: `Redirecting to ${redirectPath}...`,
							variant: 'destructive',
						});
						setTimeout(() => {
							router.push(redirectPath);
						}, 2000);
					} else {
						toast({
							title: 'Access Denied',
							description: getUnauthorizedMessage(parsedUser, pathname),
							variant: 'destructive',
						});
					}
				}
			} catch (error) {
				console.error('Access check error:', error);
				toast({
					title: 'Authentication Error',
					description: 'Please log in again.',
					variant: 'destructive',
				});
				localStorage.removeItem('user');
				router.push('/');
			} finally {
				setIsLoading(false);
			}
		};

		checkAccess();
	}, [pathname, router, toast, redirectOnUnauthorized]);

	// Loading state
	if (isLoading) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gray-50'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
					<p className='text-gray-600'>Verifying access permissions...</p>
				</div>
			</div>
		);
	}

	// Access denied state
	if (accessDenied && !redirectOnUnauthorized) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
				<Card className='w-full max-w-md'>
					<CardHeader className='text-center'>
						<div className='w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4'>
							<Shield className='w-8 h-8 text-red-600' />
						</div>
						<CardTitle className='flex items-center gap-2 justify-center text-red-800'>
							<Lock className='h-5 w-5' />
							Access Denied
						</CardTitle>
						<CardDescription>
							You don&apos;t have permission to access this page
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<Alert className='border-red-200 bg-red-50'>
							<AlertTriangle className='h-4 w-4 text-red-600' />
							<AlertDescription className='text-red-800'>
								{user && getUnauthorizedMessage(user, pathname)}
							</AlertDescription>
						</Alert>

						{user && (
							<div className='bg-gray-50 p-3 rounded-md'>
								<div className='text-sm text-gray-600'>
									<p>
										<strong>Current Role:</strong> {user.role}
									</p>
									<p>
										<strong>Access Level:</strong>{' '}
										{user.dataPartition.includes('all')
											? 'Full System Access'
											: `Limited to ${user.faculty?.name || 'assigned areas'}`}
									</p>
								</div>
							</div>
						)}

						<div className='flex gap-2'>
							<Button
								onClick={() => router.back()}
								variant='outline'
								className='flex-1'
							>
								<ArrowLeft className='h-4 w-4 mr-2' />
								Go Back
							</Button>
							<Button
								onClick={() =>
									router.push(user ? getRedirectPath(user) : '/dashboard')
								}
								className='flex-1'
							>
								<Home className='h-4 w-4 mr-2' />
								Dashboard
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Access denied with redirect (show message while redirecting)
	if (accessDenied && redirectOnUnauthorized) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gray-50'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4'></div>
					<p className='text-gray-600'>
						Access denied. Redirecting to authorized page...
					</p>
					{user && (
						<p className='text-sm text-gray-500 mt-2'>
							{getUnauthorizedMessage(user, pathname)}
						</p>
					)}
				</div>
			</div>
		);
	}

	// Custom fallback if provided
	if (!user && fallback) {
		return <>{fallback}</>;
	}

	// User not found (shouldn't happen as we redirect to login)
	if (!user) {
		return null;
	}

	// Access granted - render children
	return <>{children}</>;
}

// Higher-order component version for class components or specific use cases
export function withProtectedRoute<P extends object>(
	Component: React.ComponentType<P>,
	options?: {
		redirectOnUnauthorized?: boolean;
		fallback?: React.ReactNode;
	},
) {
	return function ProtectedComponent(props: P) {
		return (
			<ProtectedRoute
				redirectOnUnauthorized={options?.redirectOnUnauthorized}
				fallback={options?.fallback}
			>
				<Component {...props} />
			</ProtectedRoute>
		);
	};
}

// Hook for checking permissions in components
export function usePermissions() {
	const [user, setUser] = useState<User | null>(null);
	const pathname = usePathname();

	useEffect(() => {
		const userData = localStorage.getItem('user');
		if (userData) {
			try {
				const parsedUser: User = JSON.parse(userData);
				const sessionValidation = validateSession(parsedUser);
				if (sessionValidation.valid) {
					setUser(parsedUser);
				}
			} catch (error) {
				console.error('Error parsing user data:', error);
			}
		}
	}, []);

	return {
		user,
		canAccessPage: (pagePath: string) =>
			user ? canAccessPage(user, pagePath) : false,
		canAccessCurrentPage: user ? canAccessPage(user, pathname) : false,
		hasPermission: (permission: string) =>
			user ? user.permissions.includes(permission) : false,
		canCreateAccounts: user ? user.canCreateAccounts : [],
		dataPartition: user ? user.dataPartition : [],
		isAuthenticated: !!user,
	};
}

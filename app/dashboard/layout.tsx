'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { User } from '@/lib/auth';
import { MultiAuthUser } from '@/lib/services/multi-auth.service';
import { getCurrentUser } from '@/lib/session';
import { Toaster } from '@/components/ui/toaster';

import { Separator } from '@/components/ui/separator';
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from '@/components/ui/sidebar';
import { SimpleBreadcrumb } from '@/components/dashboard/simple-breadcrumb';

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [user, setUser] = useState<User | MultiAuthUser | null>(null);
	const router = useRouter();

	useEffect(() => {
		// Try to get user from new session manager first
		const currentUser = getCurrentUser();

		if (currentUser) {
			setUser(currentUser);
		} else {
			// Fallback to legacy localStorage
			const userData = localStorage.getItem('user');
			if (userData) {
				setUser(JSON.parse(userData));
			} else {
				router.push('/');
			}
		}
	}, [router]);

	if (!user) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
					<p className='text-gray-600'>Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
					<div className='flex items-center gap-2 px-4'>
						<SidebarTrigger className='-ml-1' />
						<Separator
							orientation='vertical'
							className='mr-2 data-[orientation=vertical]:h-4'
						/>
						<SimpleBreadcrumb />
					</div>
				</header>
				<div className='flex flex-1 flex-col gap-4 p-4 pt-0'>{children}</div>
			</SidebarInset>
			<Toaster />
		</SidebarProvider>
	);
}

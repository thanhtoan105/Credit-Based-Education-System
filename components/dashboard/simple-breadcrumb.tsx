'use client';

import { usePathname } from 'next/navigation';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Route metadata mapping
const routeMetadata: Record<string, string> = {
	'/dashboard': 'Dashboard',
	'/dashboard/classes': 'Classes',
	'/dashboard/students': 'Students',
	'/dashboard/subjects': 'Subjects',
	'/dashboard/credit-classes': 'Credit Classes',
	'/dashboard/student-grades': 'Student Grades',
	'/dashboard/course-registration': 'Course Registration',
	'/dashboard/tuition-payment': 'Tuition Payment',
	'/dashboard/tuition-reports': 'Tuition Reports',
	'/dashboard/reports': 'Reports',
	'/dashboard/settings': 'Settings',
};

export function SimpleBreadcrumb() {
	const pathname = usePathname();

	// Get the current page title
	const currentPageTitle = routeMetadata[pathname] || 'Current Page';

	// If we're on the dashboard root, show only Dashboard
	if (pathname === '/dashboard') {
		return (
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbPage>Dashboard</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
		);
	}

	// For other pages, show Dashboard > Current Page
	return (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem className='hidden md:block'>
					<BreadcrumbLink href='/dashboard'>Dashboard</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator className='hidden md:block' />
				<BreadcrumbItem>
					<BreadcrumbPage>{currentPageTitle}</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	);
}

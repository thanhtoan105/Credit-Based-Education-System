'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useBreadcrumb } from '@/contexts/breadcrumb-context';

// Route metadata mapping
interface RouteMetadata {
	title: string;
	parent?: string;
}

const routeMetadata: Record<string, RouteMetadata> = {
	'/dashboard': { title: 'Dashboard' },
	'/dashboard/classes': { title: 'Classes' },
	'/dashboard/students': { title: 'Students' },
	'/dashboard/subjects': { title: 'Subjects' },
	'/dashboard/credit-classes': { title: 'Credit Classes' },
	'/dashboard/student-grades': { title: 'Student Grades' },
	'/dashboard/reports': { title: 'Reports' },
	'/dashboard/course-registration': { title: 'Course Registration' },
	'/dashboard/tuition-payment': { title: 'Tuition Payment' },
	'/dashboard/settings': { title: 'Settings' },
};

export function useBreadcrumbNavigation() {
	const pathname = usePathname();
	const { updateBreadcrumbs } = useBreadcrumb();

	useEffect(() => {
		const metadata = routeMetadata[pathname];
		
		if (metadata) {
			updateBreadcrumbs(metadata.title, metadata.parent);
		} else {
			// Fallback for unknown routes
			const pathSegments = pathname.split('/').filter(Boolean);
			const currentPage = pathSegments[pathSegments.length - 1];
			const title = currentPage
				? currentPage.charAt(0).toUpperCase() + currentPage.slice(1).replace(/-/g, ' ')
				: 'Dashboard';
			
			updateBreadcrumbs(title);
		}
	}, [pathname, updateBreadcrumbs]);
}

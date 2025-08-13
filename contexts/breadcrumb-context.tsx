'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface BreadcrumbItem {
	label: string;
	href?: string;
	isCurrentPage?: boolean;
}

interface BreadcrumbContextType {
	breadcrumbs: BreadcrumbItem[];
	setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
	updateBreadcrumbs: (pageTitle: string, parentPath?: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
	const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
		{ label: 'Dashboard', href: '/dashboard' },
		{ label: 'Current Page', isCurrentPage: true }
	]);

	const updateBreadcrumbs = (pageTitle: string, parentPath?: string) => {
		const newBreadcrumbs: BreadcrumbItem[] = [
			{ label: 'Dashboard', href: '/dashboard' }
		];

		// Add parent breadcrumb if provided
		if (parentPath) {
			const parentTitle = getPageTitleFromPath(parentPath);
			newBreadcrumbs.push({ label: parentTitle, href: parentPath });
		}

		// Add current page
		newBreadcrumbs.push({ label: pageTitle, isCurrentPage: true });

		setBreadcrumbs(newBreadcrumbs);
	};

	return (
		<BreadcrumbContext.Provider value={{ breadcrumbs, setBreadcrumbs, updateBreadcrumbs }}>
			{children}
		</BreadcrumbContext.Provider>
	);
}

export function useBreadcrumb() {
	const context = useContext(BreadcrumbContext);
	if (context === undefined) {
		throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
	}
	return context;
}

// Helper function to get page title from path
function getPageTitleFromPath(path: string): string {
	const pathSegments = path.split('/').filter(Boolean);
	const lastSegment = pathSegments[pathSegments.length - 1];
	
	// Map common paths to readable titles
	const pathTitleMap: Record<string, string> = {
		'dashboard': 'Dashboard',
		'classes': 'Classes',
		'students': 'Students',
		'subjects': 'Subjects',
		'credit-classes': 'Credit Classes',
		'student-grades': 'Student Grades',
		'reports': 'Reports',
		'course-registration': 'Course Registration',
		'tuition-payment': 'Tuition Payment',
		'settings': 'Settings'
	};

	return pathTitleMap[lastSegment] || lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
}

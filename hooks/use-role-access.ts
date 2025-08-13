'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import {
	mapAuthRoleToUserRole,
	hasPageAccess,
	UserRole,
	DashboardPage,
	getAllowedPages,
	getRoleInfo,
} from '@/lib/types/role-permissions';
import { MultiAuthUser } from '@/lib/services/multi-auth.service';
import { toast } from '@/lib/toast';

export function useRoleAccess() {
	const [user, setUser] = useState<MultiAuthUser | null>(null);
	const [userRole, setUserRole] = useState<UserRole>('STUDENT');
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const currentUser = getCurrentUser();
		if (currentUser) {
			setUser(currentUser);
			const role = mapAuthRoleToUserRole(
				currentUser.role || currentUser.groupName || 'STUDENT',
			);
			setUserRole(role);
		}
		setIsLoading(false);
	}, []);

	// Check if user has access to a specific page
	const checkPageAccess = (page: DashboardPage): boolean => {
		return hasPageAccess(userRole, page);
	};

	// Redirect to allowed page if current page is not accessible
	const enforcePageAccess = (currentPage: DashboardPage) => {
		if (!checkPageAccess(currentPage)) {
			const allowedPages = getAllowedPages(userRole);
			const roleInfo = getRoleInfo(userRole);

			// Show access denied toast
			toast.error({
				title: `Access denied. ${roleInfo.displayName} role cannot access this page.`,
			});

			// Redirect to first allowed page or dashboard
			if (allowedPages.length > 0) {
				router.push(`/dashboard/${allowedPages[0]}`);
			} else {
				router.push('/dashboard');
			}

			return false;
		}
		return true;
	};

	// Get all pages user can access
	const getAllowedUserPages = (): DashboardPage[] => {
		return getAllowedPages(userRole);
	};

	// Get user role information
	const getUserRoleInfo = () => {
		return getRoleInfo(userRole);
	};

	return {
		user,
		userRole,
		isLoading,
		checkPageAccess,
		enforcePageAccess,
		getAllowedUserPages,
		getUserRoleInfo,
	};
}

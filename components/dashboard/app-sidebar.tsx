'use client';

import * as React from 'react';
import {
	BookOpen,
	Users,
	GraduationCap,
	BarChart3,
	FileText,
	UserCheck,
	CreditCard,
	DollarSign,
	Building2,
	Settings,
	School,
	ChevronRight,
} from 'lucide-react';

import { NavMain } from '@/components/dashboard/nav-main';
import { NavUser } from '@/components/dashboard/nav-user';
import { TeamSwitcher } from '@/components/dashboard/team-switcher';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from '@/components/ui/sidebar';
import { getCurrentUser } from '@/lib/session';
import { MultiAuthUser } from '@/lib/services/multi-auth.service';
import {
	mapAuthRoleToUserRole,
	hasPageAccess,
	UserRole,
	DashboardPage,
} from '@/lib/types/role-permissions';

// Navigation items with role-based access control
const allNavItems = [
	{
		title: 'Academic Management',
		items: [
			{
				title: 'Classes',
				url: '/dashboard/classes',
				icon: School,
				page: 'classes' as DashboardPage,
			},
			{
				title: 'Students',
				url: '/dashboard/students',
				icon: Users,
				page: 'students' as DashboardPage,
			},
			{
				title: 'Subjects',
				url: '/dashboard/subjects',
				icon: BookOpen,
				page: 'subjects' as DashboardPage,
			},
			{
				title: 'Credit Classes',
				url: '/dashboard/credit-classes',
				icon: GraduationCap,
				page: 'credit-classes' as DashboardPage,
			},
			{
				title: 'Student Grades',
				url: '/dashboard/student-grades',
				icon: BarChart3,
				page: 'student-grades' as DashboardPage,
			},
			{
				title: 'Tuition Payment',
				url: '/dashboard/tuition-payment/',
				icon: CreditCard,
				page: 'tuition-payment' as DashboardPage,
			},
		],
	},
	{
		title: 'Student Services',
		items: [
			{
				title: 'Course Registration',
				url: '/dashboard/course-registration',
				icon: UserCheck,
				page: 'course-registration' as DashboardPage,
			},
		],
	},
	{
		title: 'Financial Management',
		items: [
			{
				title: 'Tuition Reports',
				url: '/dashboard/tuition-reports',
				icon: DollarSign,
				page: 'tuition-reports' as DashboardPage,
			},
		],
	},
	{
		title: 'Administration',
		items: [
			{
				title: 'Reports',
				url: '/dashboard/reports/',
				icon: FileText,
				page: 'reports' as DashboardPage,
			},
		],
	},
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const [user, setUser] = React.useState<MultiAuthUser | null>(null);
	const [userRole, setUserRole] = React.useState<UserRole>('STUDENT');

	React.useEffect(() => {
		const currentUser = getCurrentUser();
		if (currentUser) {
			setUser(currentUser);
			// Map the authentication role to permission role
			// Prioritize groupName over role since groupName contains the specific role (PKT, PGV, etc.)
			const authRole = currentUser.groupName || currentUser.role || 'STUDENT';
			const role = mapAuthRoleToUserRole(authRole);

			setUserRole(role);
		}
	}, []);

	// Filter navigation items based on user role
	const filteredNavItems = React.useMemo(() => {
		return allNavItems
			.map((section) => ({
				...section,
				items: section.items.filter((item) =>
					hasPageAccess(userRole, item.page),
				),
			}))
			.filter((section) => section.items.length > 0); // Remove empty sections
	}, [userRole]);

	// Team/Department information
	const teamData = React.useMemo(() => {
		if (!user) return null;

		// Ensure name is always a string
		let departmentName = 'QLDSV System';
		if (user.department) {
			if (typeof user.department === 'string') {
				departmentName = user.department;
			} else if (user.department.branch_name) {
				departmentName = user.department.branch_name;
			}
		}

		// Use the actual RoleName from database instead of hardcoded mappings
		const actualRoleName = user.groupName || 'User';

		return {
			name: departmentName,
			logo: School,
			plan: actualRoleName,
		};
	}, [user]);

	// User data for footer
	const userData = React.useMemo(() => {
		if (!user) return null;

		// Use the actual RoleName from database instead of hardcoded mappings
		const actualRoleName = user.groupName || 'User';

		return {
			name: user.fullName || user.username,
			email: user.username, // Mock email
			avatar: '/avatars/default.jpg', // Default avatar
			role: userRole,
			actualRoleName: actualRoleName, // Add the actual role name from database
		};
	}, [user, userRole]);

	if (!user || !userData || !teamData) {
		return (
			<Sidebar collapsible='icon' {...props}>
				<SidebarHeader>
					<div className='flex h-12 items-center justify-center'>
						<School className='h-6 w-6' />
					</div>
				</SidebarHeader>
				<SidebarContent>
					<div className='p-4 text-center text-sm text-muted-foreground'>
						Loading...
					</div>
				</SidebarContent>
				<SidebarRail />
			</Sidebar>
		);
	}

	return (
		<Sidebar collapsible='icon' {...props}>
			<SidebarHeader>
				<TeamSwitcher team={teamData} />
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={filteredNavItems} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={userData} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}

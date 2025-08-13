'use client';

import { useEffect, useState } from 'react';
import StatsCard from '@/components/dashboard/stats-card';
import ActivityChart from '@/components/dashboard/activity-chart';
import RecentCourses from '@/components/dashboard/recent-courses';
import CalendarWidget from '@/components/dashboard/calendar-widget';
import { Badge } from '@/components/ui/badge';
import {
	GraduationCap,
	Users,
	BookOpen,
	TrendingUp,
	DollarSign,
	Calendar,
	ClipboardList,
	Award,
	Building,
	Shield,
	FileText,
	Database,
} from 'lucide-react';
import { User, getRoleDisplayName, canAccessData } from '@/lib/auth';
import { getCurrentUser } from '@/lib/session';
import { MultiAuthUser } from '@/lib/services/multi-auth.service';
import { toast } from '@/lib/toast';

export default function Dashboard() {
	const [user, setUser] = useState<User | MultiAuthUser | null>(null);
	const [hasShownWelcome, setHasShownWelcome] = useState(false);

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
			}
		}
	}, []);

	// Show welcome toast when user is loaded (but not immediately after login)
	useEffect(() => {
		if (user && !hasShownWelcome) {
			// Check if this is a fresh login (within last 3 seconds)
			const loginTime = localStorage.getItem('loginTime');
			const now = Date.now();
			const isRecentLogin = loginTime && now - parseInt(loginTime) < 3000;

			// Only show welcome toast if it's NOT a recent login (to avoid duplicate with login toast)
			if (!isRecentLogin) {
				const userName = user.fullName;

				// Show welcome toast with user info
				toast.success({
					title: `Welcome back, ${userName}! 👋`,
					duration: 3000,
				});
			}

			setHasShownWelcome(true);
		}
	}, [user, hasShownWelcome]);

	if (!user) return null;

	// Debug: Log user object to console (remove in production)
	console.log('Dashboard user object:', user);

	// Helper function to get role for legacy compatibility
	const getUserRole = (user: User | MultiAuthUser | null): string => {
		if (!user) return 'SV';
		if ('role' in user && typeof user.role === 'string') {
			return user.role; // Legacy User
		} else if ('groupName' in user) {
			// MultiAuthUser - map groupName (from SP_LOGIN_INFO RoleName field) to role
			const multiAuthUser = user as MultiAuthUser;
			const groupToRole: Record<string, string> = {
				SV: 'SV', // Student
				GV: 'KHOA', // Teacher (general)
				ADMIN: 'PGV', // Admin
				KHOA: 'KHOA', // Department head
				PKT: 'PKT', // Academic affairs
				PGV: 'PGV', // Vice principal (from your SQL result)
			};
			return groupToRole[multiAuthUser.groupName] || 'SV';
		}
		return 'SV'; // Default fallback
	};

	const userRole = getUserRole(user);

	// Debug: Log role determination
	console.log('User role determined:', userRole, 'from user:', user);

	const getStatsForRole = (role: string) => {
		const baseStats = {
			PGV: [
				{
					title: 'Total Students',
					value: '2,847',
					change: 12,
					trend: 'up' as const,
					icon: <Users className='h-5 w-5' />,
					description: 'Enrolled across all faculties',
				},
				{
					title: 'Active Classes',
					value: '156',
					change: 8,
					trend: 'up' as const,
					icon: <GraduationCap className='h-5 w-5' />,
					description: 'Currently running courses',
				},
				{
					title: 'Faculty Members',
					value: '89',
					change: 3,
					trend: 'up' as const,
					icon: <Users className='h-5 w-5' />,
					description: 'Teaching staff',
				},
				{
					title: 'Departments',
					value: '8',
					change: 0,
					trend: 'up' as const,
					icon: <Building className='h-5 w-5' />,
					description: 'Academic departments',
				},
			],
			KHOA: [
				{
					title: 'Department Students',
					value: 'faculty' in user && user.faculty ? '487' : '0',
					change: 15,
					trend: 'up' as const,
					icon: <Users className='h-5 w-5' />,
					description: `${
						('faculty' in user && user.faculty?.name) || 'Department'
					} students`,
				},
				{
					title: 'Active Courses',
					value: '23',
					change: 5,
					trend: 'up' as const,
					icon: <BookOpen className='h-5 w-5' />,
					description: 'This semester',
				},
				{
					title: 'Faculty Staff',
					value: '12',
					change: 8,
					trend: 'up' as const,
					icon: <Users className='h-5 w-5' />,
					description: 'Teaching staff',
				},
				{
					title: 'Avg Grade',
					value: '8.2',
					change: 4,
					trend: 'up' as const,
					icon: <Award className='h-5 w-5' />,
					description: 'Department average',
				},
			],
			SV: [
				{
					title: 'Enrolled Credits',
					value: '18',
					change: 20,
					trend: 'up' as const,
					icon: <BookOpen className='h-5 w-5' />,
					description: 'This semester',
				},
				{
					title: 'GPA',
					value: '8.5',
					change: 2,
					trend: 'up' as const,
					icon: <Award className='h-5 w-5' />,
					description: 'Current GPA',
				},
				{
					title: 'Completed',
					value: '67%',
					change: 8,
					trend: 'up' as const,
					icon: <TrendingUp className='h-5 w-5' />,
					description: 'Program completion',
				},
				{
					title: 'Tuition Status',
					value: 'Paid',
					icon: <DollarSign className='h-5 w-5' />,
					description: 'This semester',
				},
			],
			PKT: [
				{
					title: 'Total Revenue',
					value: '₫2.4B',
					change: 18,
					trend: 'up' as const,
					icon: <DollarSign className='h-5 w-5' />,
					description: 'This semester',
				},
				{
					title: 'Paid Students',
					value: '2,156',
					change: 92,
					trend: 'up' as const,
					icon: <Users className='h-5 w-5' />,
					description: 'Payment completed',
				},
				{
					title: 'Pending Payments',
					value: '691',
					change: 15,
					trend: 'down' as const,
					icon: <ClipboardList className='h-5 w-5' />,
					description: 'Awaiting payment',
				},
				{
					title: 'Collection Rate',
					value: '85.2%',
					change: 4,
					trend: 'up' as const,
					icon: <TrendingUp className='h-5 w-5' />,
					description: 'Payment efficiency',
				},
			],
		};

		return baseStats[role as keyof typeof baseStats] || [];
	};

	const getDisplayFaculty = () => {
		if ('selectedFaculty' in user && user.selectedFaculty) {
			return user.selectedFaculty.name;
		}
		if ('faculty' in user && user.faculty) {
			return user.faculty.name;
		}
		return null;
	};

	const getWelcomeMessage = () => {
		const faculty = getDisplayFaculty();
		const messages = {
			PGV: faculty
				? `Managing ${faculty} department with full administrative access`
				: 'Manage academic operations across all departments',
			KHOA: faculty
				? `Overseeing ${faculty} department activities and student management`
				: 'Managing your assigned department',
			SV: 'Track your academic progress and manage course registrations',
			PKT: 'Monitor financial operations and manage tuition payments',
		};
		return messages[userRole];
	};

	const getDataAccessInfo = () => {
		// Handle both legacy and new user types
		if (
			'dataPartition' in user &&
			user.dataPartition &&
			user.dataPartition.includes('all')
		) {
			return 'Full System Access - All Departments';
		}
		if (
			'department' in user &&
			user.department &&
			user.department.branch_name
		) {
			return `${user.department.branch_name} Department Access`;
		}
		const faculty = getDisplayFaculty();
		return faculty ? `${faculty} Department Access` : 'Limited Access';
	};

	const stats = getStatsForRole(userRole);

	return (
		<div className='space-y-6'>
			{/* Welcome Section with Enhanced Role Information */}
			<div className='bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 text-white'>
				<div className='flex items-center justify-between'>
					<div className='flex-1'>
						<div className='flex items-center gap-3 mb-2'>
							<h1 className='text-3xl font-bold'>
								Welcome back, {user.fullName.split(' ')[0]}!
							</h1>
							<Badge className='bg-white/20 text-white border-white/30'>
								{getRoleDisplayName(userRole as any)}
							</Badge>
						</div>
						<p className='text-blue-100 text-lg mb-4'>{getWelcomeMessage()}</p>

						{/* Access Level Information */}
						<div className='flex items-center gap-4 text-sm'>
							<div className='flex items-center gap-2'>
								<Shield className='h-4 w-4' />
								<span className='text-blue-100'>Access Level:</span>
								<span className='text-white font-medium'>
									{getDataAccessInfo()}
								</span>
							</div>

							{getDisplayFaculty() && (
								<div className='flex items-center gap-2'>
									<Building className='h-4 w-4' />
									<span className='text-blue-100'>Department:</span>
									<span className='text-white font-medium'>
										{getDisplayFaculty()}
									</span>
								</div>
							)}
						</div>
					</div>

					<div className='hidden md:block'>
						<div className='w-24 h-24 bg-white/20 rounded-full flex items-center justify-center'>
							<GraduationCap className='w-12 h-12' />
						</div>
					</div>
				</div>

				{/* Role-specific Additional Info */}
				{userRole === 'PGV' &&
					'selectedFaculty' in user &&
					user.selectedFaculty && (
						<div className='mt-4 p-3 bg-white/10 rounded-md'>
							<div className='flex items-center gap-2 text-sm'>
								<Building className='h-4 w-4' />
								<span>
									Currently managing:{' '}
									<strong>{user.selectedFaculty.name}</strong> -{' '}
									{user.selectedFaculty.description}
								</span>
							</div>
						</div>
					)}

				{/* Multi-database Additional Info */}
				{'department' in user && (
					<div className='mt-4 p-3 bg-white/10 rounded-md'>
						<div className='flex items-center gap-2 text-sm'>
							<Database className='h-4 w-4' />
							<span>
								Connected to: <strong>{user.department.branch_name}</strong> (
								{user.serverName})
							</span>
						</div>
					</div>
				)}

				{'canCreateAccounts' in user &&
					user.canCreateAccounts &&
					user.canCreateAccounts.length > 0 && (
						<div className='mt-4 p-3 bg-white/10 rounded-md'>
							<div className='flex items-center gap-2 text-sm'>
								<Users className='h-4 w-4' />
								<span>Can create accounts for: </span>
								<div className='flex gap-1'>
									{user.canCreateAccounts.map((accountType) => (
										<Badge
											key={accountType}
											className='bg-white/20 text-white border-white/30 text-xs'
										>
											{accountType}
										</Badge>
									))}
								</div>
							</div>
						</div>
					)}
			</div>

			{/* Stats Grid */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
				{stats.map((stat, index) => (
					<StatsCard
						key={index}
						title={stat.title}
						value={stat.value}
						change={stat.change}
						trend={stat.trend}
						icon={stat.icon}
						description={stat.description}
					/>
				))}
			</div>

			{/* Main Content Grid */}
			<div className='grid grid-cols-1 lg:grid-cols-7 gap-6'>
				<ActivityChart />
				<RecentCourses />
			</div>

			{/* Secondary Content */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
				<CalendarWidget />

				{/* Role-specific Quick Actions */}
				<div className='bg-white rounded-md p-6 border border-gray-200'>
					<h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
						<GraduationCap className='h-5 w-5' />
						Quick Actions
					</h3>
					<div className='grid grid-cols-2 gap-4'>
						{userRole === 'PGV' && (
							<>
								<button className='p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors group'>
									<Users className='h-8 w-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform' />
									<div className='font-medium text-gray-900'>
										Manage Students
									</div>
									<div className='text-sm text-gray-500'>
										Add or edit student records
									</div>
								</button>
								<button className='p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors group'>
									<GraduationCap className='h-8 w-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform' />
									<div className='font-medium text-gray-900'>
										Create Classes
									</div>
									<div className='text-sm text-gray-500'>
										Set up new academic classes
									</div>
								</button>
								<button className='p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors group'>
									<Building className='h-8 w-8 text-green-600 mb-2 group-hover:scale-110 transition-transform' />
									<div className='font-medium text-gray-900'>Departments</div>
									<div className='text-sm text-gray-500'>
										Manage faculty departments
									</div>
								</button>
								<button className='p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition-colors group'>
									<FileText className='h-8 w-8 text-orange-600 mb-2 group-hover:scale-110 transition-transform' />
									<div className='font-medium text-gray-900'>Reports</div>
									<div className='text-sm text-gray-500'>
										Generate system reports
									</div>
								</button>
							</>
						)}

						{userRole === 'KHOA' && (
							<>
								<button className='p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors group'>
									<ClipboardList className='h-8 w-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform' />
									<div className='font-medium text-gray-900'>Enter Grades</div>
									<div className='text-sm text-gray-500'>
										Update student grades
									</div>
								</button>
								<button className='p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors group'>
									<BookOpen className='h-8 w-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform' />
									<div className='font-medium text-gray-900'>
										Manage Subjects
									</div>
									<div className='text-sm text-gray-500'>
										Edit course catalog
									</div>
								</button>
								<button className='p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors group'>
									<Users className='h-8 w-8 text-green-600 mb-2 group-hover:scale-110 transition-transform' />
									<div className='font-medium text-gray-900'>
										Department Students
									</div>
									<div className='text-sm text-gray-500'>
										View student records
									</div>
								</button>
								<button className='p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition-colors group'>
									<FileText className='h-8 w-8 text-orange-600 mb-2 group-hover:scale-110 transition-transform' />
									<div className='font-medium text-gray-900'>
										Department Reports
									</div>
									<div className='text-sm text-gray-500'>
										Generate department reports
									</div>
								</button>
							</>
						)}

						{userRole === 'SV' && (
							<>
								<button className='p-4 bg-cyan-50 hover:bg-cyan-100 rounded-lg text-left transition-colors group'>
									<Calendar className='h-8 w-8 text-cyan-600 mb-2 group-hover:scale-110 transition-transform' />
									<div className='font-medium text-gray-900'>
										Register Courses
									</div>
									<div className='text-sm text-gray-500'>
										Enroll in new classes
									</div>
								</button>
								<button className='p-4 bg-pink-50 hover:bg-pink-100 rounded-lg text-left transition-colors group'>
									<Award className='h-8 w-8 text-pink-600 mb-2 group-hover:scale-110 transition-transform' />
									<div className='font-medium text-gray-900'>View Grades</div>
									<div className='text-sm text-gray-500'>
										Check your transcript
									</div>
								</button>
								<button className='p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-left transition-colors group'>
									<DollarSign className='h-8 w-8 text-yellow-600 mb-2 group-hover:scale-110 transition-transform' />
									<div className='font-medium text-gray-900'>
										Tuition Status
									</div>
									<div className='text-sm text-gray-500'>
										Check payment status
									</div>
								</button>
								<button className='p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-left transition-colors group'>
									<FileText className='h-8 w-8 text-indigo-600 mb-2 group-hover:scale-110 transition-transform' />
									<div className='font-medium text-gray-900'>
										Academic Records
									</div>
									<div className='text-sm text-gray-500'>
										View your transcript
									</div>
								</button>
							</>
						)}

						{userRole === 'PKT' && (
							<>
								<button className='p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors group'>
									<DollarSign className='h-8 w-8 text-green-600 mb-2 group-hover:scale-110 transition-transform' />
									<div className='font-medium text-gray-900'>
										Tuition Management
									</div>
									<div className='text-sm text-gray-500'>
										Update payment records
									</div>
								</button>
								<button className='p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors group'>
									<TrendingUp className='h-8 w-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform' />
									<div className='font-medium text-gray-900'>
										Financial Reports
									</div>
									<div className='text-sm text-gray-500'>
										Generate payment reports
									</div>
								</button>
								<button className='p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors group'>
									<ClipboardList className='h-8 w-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform' />
									<div className='font-medium text-gray-900'>
										Outstanding Fees
									</div>
									<div className='text-sm text-gray-500'>
										Track pending payments
									</div>
								</button>
								<button className='p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition-colors group'>
									<Users className='h-8 w-8 text-orange-600 mb-2 group-hover:scale-110 transition-transform' />
									<div className='font-medium text-gray-900'>
										Student Accounts
									</div>
									<div className='text-sm text-gray-500'>
										Manage payment accounts
									</div>
								</button>
							</>
						)}
					</div>
				</div>
			</div>

			{/* Data Access Information Footer */}
			<div className='bg-gray-50 rounded-md p-4 border'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<Shield className='h-4 w-4 text-green-600' />
						<span className='text-sm font-medium text-gray-700'>
							Current Session:
						</span>
						<span className='text-sm text-gray-600'>{getDataAccessInfo()}</span>
					</div>
					<div className='flex items-center gap-4 text-xs text-gray-500'>
						<span>
							Permissions:{' '}
							{'permissions' in user && user.permissions
								? user.permissions.length
								: 0}{' '}
							active
						</span>
						{'canCreateAccounts' in user &&
							user.canCreateAccounts &&
							user.canCreateAccounts.length > 0 && (
								<span>
									Account Creation: {user.canCreateAccounts.length} types
								</span>
							)}
					</div>
				</div>
			</div>
		</div>
	);
}

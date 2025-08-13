'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Search,
	Settings,
	LogOut,
	User as UserIcon,
	Moon,
	Sun,
	Building,
	Shield,
} from 'lucide-react';
import { User, getRoleDisplayName, getRoleColor } from '@/lib/auth';
import { MultiAuthUser } from '@/lib/services/multi-auth.service';
import { toast } from '@/lib/toast';

interface HeaderProps {
	user: User | MultiAuthUser;
}

export default function Header({ user }: HeaderProps) {
	const router = useRouter();

	const handleLogout = () => {
		localStorage.removeItem('user');
		toast.success({
			title: 'Logged Out Successfully',
		});
		router.push('/');
	};

	const getDisplayFaculty = () => {
		// Handle User type
		if ('selectedFaculty' in user && user.selectedFaculty) {
			return user.selectedFaculty.name;
		}
		if ('faculty' in user && user.faculty) {
			return user.faculty.name;
		}
		// Handle MultiAuthUser type
		if ('department' in user && user.department) {
			return user.department.branch_name;
		}
		return null;
	};

	const getDataPartitionInfo = () => {
		// Handle User type with dataPartition
		if (
			'dataPartition' in user &&
			user.dataPartition &&
			Array.isArray(user.dataPartition) &&
			user.dataPartition.includes('all')
		) {
			return 'All Departments';
		}
		const faculty = getDisplayFaculty();
		return faculty ? `${faculty} Department` : 'Limited Access';
	};

	return (
		<header className='bg-white border-b border-gray-200 px-6 py-4'>
			<div className='flex items-center justify-between'>
				{/* Search */}
				<div className='flex-1 max-w-md'>
					<div className='relative'>
						<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10' />
						<Input
							type='text'
							placeholder='Search classes...'
							className='w-full pl-10 pr-4 py-2'
						/>
					</div>
				</div>

				{/* Right side */}
				<div className='flex items-center space-x-4'>
					{/* User Menu */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant='ghost'
								className='flex items-center space-x-3 h-auto p-2 hover:bg-gray-100'
							>
								<div className='w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center'>
									<span className='text-xs font-semibold text-gray-700'>
										{user.fullName
											.split(' ')
											.map((n) => n[0])
											.join('')}
									</span>
								</div>
								<div className='text-left'>
									<p className='text-sm font-medium text-gray-900'>
										{user.fullName}
									</p>
									<Badge
										variant='secondary'
										className={`${getRoleColor(user.role as any)} text-xs`}
									>
										{(user as any).groupName || user.role}
									</Badge>
								</div>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end' className='w-72'>
							<DropdownMenuLabel>
								<div className='space-y-2'>
									<div>My Account</div>
									<div className='flex items-center gap-2'>
										<Badge className={getRoleColor(user.role as any)}>
											{(user as any).groupName || user.role}
										</Badge>
										<span className='text-xs text-gray-500'>
											{getRoleDisplayName(user.role as any)}
										</span>
									</div>
									{getDisplayFaculty() && (
										<div className='flex items-center gap-2 text-xs text-gray-600'>
											<Building className='h-3 w-3' />
											<span>{getDisplayFaculty()}</span>
										</div>
									)}
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />

							{/* Access Control Info */}
							<div className='px-2 py-2'>
								<div className='text-xs text-gray-500 mb-1'>Access Level:</div>
								<div className='flex items-center gap-2 text-xs'>
									<Shield className='h-3 w-3 text-green-600' />
									<span className='text-gray-700'>
										{getDataPartitionInfo()}
									</span>
								</div>

								{'canCreateAccounts' in user &&
									user.canCreateAccounts &&
									user.canCreateAccounts.length > 0 && (
										<div className='mt-2'>
											<div className='text-xs text-gray-500 mb-1'>
												Can Create Accounts:
											</div>
											<div className='flex gap-1'>
												{user.canCreateAccounts.map((accountType) => (
													<Badge
														key={accountType}
														variant='outline'
														className='text-xs'
													>
														{accountType}
													</Badge>
												))}
											</div>
										</div>
									)}
							</div>

							<DropdownMenuSeparator />

							<DropdownMenuItem>
								<UserIcon className='mr-2 h-4 w-4' />
								<span>Profile</span>
							</DropdownMenuItem>
							<DropdownMenuItem>
								<Settings className='mr-2 h-4 w-4' />
								<span>Settings</span>
							</DropdownMenuItem>
							<DropdownMenuItem>
								<Sun className='mr-2 h-4 w-4' />
								<span>Theme</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={handleLogout} className='text-red-600'>
								<LogOut className='mr-2 h-4 w-4' />
								<span>Log out</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	);
}

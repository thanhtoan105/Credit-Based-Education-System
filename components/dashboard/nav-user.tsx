'use client';

import {
	BadgeCheck,
	Bell,
	ChevronsUpDown,
	CreditCard,
	LogOut,
	Sparkles,
	User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '@/components/ui/sidebar';
import { clearUserSession } from '@/lib/session';
import { UserRole, getRoleInfo } from '@/lib/types/role-permissions';
import { toast } from '@/lib/toast';

export function NavUser({
	user,
}: {
	user: {
		name: string;
		email: string;
		avatar: string;
		role: UserRole;
		actualRoleName?: string; // Add the actual role name from database
	};
}) {
	const { isMobile, state } = useSidebar();
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const router = useRouter();
	const roleInfo = getRoleInfo(user.role);

	// Close dropdown when sidebar collapses
	useEffect(() => {
		if (state === 'collapsed') {
			setDropdownOpen(false);
		}
	}, [state]);

	const handleLogout = async () => {
		try {
			// Clear user session
			clearUserSession();

			// Show success toast
			toast.success({ title: 'Logged out successfully' });

			// Redirect to login page
			router.push('/');
		} catch (error) {
			console.error('Logout error:', error);
			toast.error({ title: 'Error during logout' });
		}
	};

	const getInitials = (name: string) => {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	};

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size='lg'
							className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
							tooltip={`${user.name} (${
								user.actualRoleName || roleInfo.displayName
							})`}
						>
							<Avatar className='h-8 w-8 rounded-lg'>
								<AvatarImage src={user.avatar} alt={user.name} />
								<AvatarFallback className='rounded-lg'>
									{getInitials(user.name)}
								</AvatarFallback>
							</Avatar>
							<div className='grid flex-1 text-left text-sm leading-tight'>
								<span className='truncate font-medium'>{user.name}</span>
								<span className='truncate text-xs text-muted-foreground'>
									{user.actualRoleName || roleInfo.displayName}
								</span>
							</div>
							<ChevronsUpDown className='ml-auto h-4 w-4' />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
						side={isMobile ? 'bottom' : 'right'}
						align='end'
						sideOffset={4}
					>
						<DropdownMenuLabel className='p-0 font-normal'>
							<div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
								<Avatar className='h-8 w-8 rounded-lg'>
									<AvatarImage src={user.avatar} alt={user.name} />
									<AvatarFallback className='rounded-lg'>
										{getInitials(user.name)}
									</AvatarFallback>
								</Avatar>
								<div className='grid flex-1 text-left text-sm leading-tight'>
									<span className='truncate font-medium'>{user.name}</span>
									<span className='truncate text-xs text-muted-foreground'>
										{user.email}
									</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={handleLogout}
							className='gap-2 text-red-600 focus:text-red-600'
						>
							<LogOut className='h-4 w-4' />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}

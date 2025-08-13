'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
	ChevronLeft,
	ChevronRight,
	GraduationCap,
	Home,
	Building,
	Users,
	BookOpen,
	Calendar,
	FileText,
	Settings,
	ClipboardList,
	CreditCard,
	TrendingUp,
	Shield,
	User as UserIcon,
} from 'lucide-react';
import { User, getMenuItems } from '@/lib/auth';
import { MultiAuthUser } from '@/lib/services/multi-auth.service';

const iconMap = {
	Home,
	Building,
	Users,
	BookOpen,
	Calendar,
	FileText,
	Settings,
	ClipboardList,
	CreditCard,
	TrendingUp,
	GraduationCap,
	Shield,
	UserIcon,
};

interface SidebarProps {
	user: User | MultiAuthUser;
	collapsed: boolean;
	onToggle: () => void;
}

export default function Sidebar({ user, collapsed, onToggle }: SidebarProps) {
	const pathname = usePathname();
	const menuItems = getMenuItems(user);

	return (
		<div
			className={cn(
				'bg-white border-r border-gray-200 flex flex-col transition-all duration-300',
				collapsed ? 'w-16' : 'w-64',
			)}
		>
			{/* Header */}
			<div className='p-4 border-b border-gray-200'>
				<div className='flex items-center justify-between'>
					{!collapsed && (
						<div className='flex items-center space-x-2'>
							<div className='w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-md flex items-center justify-center'>
								<GraduationCap className='w-5 h-5 text-white' />
							</div>
							<div className='flex flex-col'>
								<span className='font-semibold text-gray-900 text-sm'>
									Student System
								</span>
								<span className='text-xs text-gray-500'>Access Control</span>
							</div>
						</div>
					)}
					<Button
						variant='ghost'
						size='sm'
						onClick={onToggle}
						className='h-8 w-8 p-0 hover:bg-gray-100'
					>
						{collapsed ? (
							<ChevronRight className='h-4 w-4' />
						) : (
							<ChevronLeft className='h-4 w-4' />
						)}
					</Button>
				</div>
			</div>

			{/* Navigation Menu */}
			<ScrollArea className='flex-1'>
				<div className='p-2'>
					<nav className='space-y-1'>
						{menuItems.map((item, index) => {
							const Icon = iconMap[item.icon as keyof typeof iconMap] || Home;
							const isActive = pathname === item.href;

							return (
								<Link key={index} href={item.href}>
									<Button
										variant='ghost'
										className={cn(
											'w-full justify-start transition-colors',
											isActive
												? 'bg-blue-50 text-blue-700 border-blue-200 border'
												: 'text-gray-700 hover:bg-gray-100',
											collapsed ? 'px-2' : 'px-3',
										)}
									>
										<Icon className={cn('h-4 w-4', collapsed ? '' : 'mr-3')} />
										{!collapsed && (
											<span className='text-sm font-medium'>{item.label}</span>
										)}
										{!collapsed && isActive && (
											<div className='ml-auto w-1 h-1 bg-blue-600 rounded-full'></div>
										)}
									</Button>
								</Link>
							);
						})}
					</nav>
				</div>
			</ScrollArea>

			{/* Footer - System Info */}
			{!collapsed && (
				<div className='p-4 border-t border-gray-200 bg-gray-50'>
					<div className='text-xs text-gray-500 text-center'>
						Student Management System v1.0
					</div>
				</div>
			)}
		</div>
	);
}

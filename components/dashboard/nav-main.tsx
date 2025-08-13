'use client';

import { ChevronRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from '@/components/ui/sidebar';

export function NavMain({
	items,
}: {
	items: {
		title: string;
		items: {
			title: string;
			url: string;
			icon?: LucideIcon;
			page: string;
		}[];
	}[];
}) {
	const pathname = usePathname();

	return (
		<>
			{items.map((section) => (
				<SidebarGroup key={section.title}>
					<SidebarGroupLabel>{section.title}</SidebarGroupLabel>
					<SidebarMenu>
						{section.items.map((item) => {
							const isActive = pathname === item.url;

							return (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										asChild
										tooltip={item.title}
										isActive={isActive}
									>
										<Link href={item.url}>
											{item.icon && <item.icon className='h-4 w-4' />}
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							);
						})}
					</SidebarMenu>
				</SidebarGroup>
			))}
		</>
	);
}

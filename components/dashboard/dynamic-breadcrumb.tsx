'use client';

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useBreadcrumb } from '@/contexts/breadcrumb-context';
import { useBreadcrumbNavigation } from '@/hooks/use-breadcrumb-navigation';

export function DynamicBreadcrumb() {
	// Initialize breadcrumb navigation
	useBreadcrumbNavigation();
	
	const { breadcrumbs } = useBreadcrumb();

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{breadcrumbs.map((item, index) => (
					<div key={index} className="flex items-center">
						{index > 0 && <BreadcrumbSeparator className='hidden md:block' />}
						<BreadcrumbItem className={index === 0 ? 'hidden md:block' : ''}>
							{item.isCurrentPage ? (
								<BreadcrumbPage>{item.label}</BreadcrumbPage>
							) : (
								<BreadcrumbLink href={item.href || '#'}>
									{item.label}
								</BreadcrumbLink>
							)}
						</BreadcrumbItem>
					</div>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	);
}

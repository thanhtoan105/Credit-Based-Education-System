'use client';

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Video, MapPin } from 'lucide-react';

const events = [
	{
		id: 1,
		title: 'Database Fundamentals',
		time: '10:00-11:00am',
		type: 'class',
		location: 'Room 301',
		attendees: 5,
	},
	{
		id: 2,
		title: 'Web Development Workshop',
		time: '2:00-4:00pm',
		type: 'workshop',
		location: 'Lab 201',
		attendees: 8,
	},
	{
		id: 3,
		title: 'Faculty Meeting',
		time: '4:30-5:30pm',
		type: 'meeting',
		location: 'Conference Room',
		attendees: 12,
	},
];

const getEventColor = (type: string) => {
	switch (type) {
		case 'class':
			return 'bg-blue-100 text-blue-800';
		case 'workshop':
			return 'bg-green-100 text-green-800';
		case 'meeting':
			return 'bg-purple-100 text-purple-800';
		default:
			return 'bg-gray-100 text-gray-800';
	}
};

export default function CalendarWidget() {
	return (
		<Card className='col-span-2'>
			<CardHeader className='flex flex-row items-center justify-between'>
				<div>
					<CardTitle className='flex items-center space-x-2'>
						<Calendar className='h-5 w-5' />
						<span>Today&apos;s Schedule</span>
					</CardTitle>
					<CardDescription>Your upcoming events and classes</CardDescription>
				</div>
				<Badge
					variant='outline'
					className='bg-blue-50 text-blue-700 border-blue-200'
				>
					July 9
				</Badge>
			</CardHeader>
			<CardContent className='space-y-4'>
				{events.map((event) => (
					<div
						key={event.id}
						className='flex items-start space-x-3 p-3 bg-gray-50 rounded-md'
					>
						<div className='flex-shrink-0 w-2 h-12 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full'></div>
						<div className='flex-1 min-w-0'>
							<div className='flex items-start justify-between'>
								<div>
									<h4 className='font-medium text-gray-900 truncate'>
										{event.title}
									</h4>
									<div className='flex items-center space-x-2 mt-1'>
										<div className='flex items-center space-x-1 text-sm text-gray-500'>
											<Clock className='h-4 w-4' />
											<span>{event.time}</span>
										</div>
										<Badge
											variant='secondary'
											className={getEventColor(event.type)}
										>
											{event.type}
										</Badge>
									</div>
									<div className='flex items-center space-x-1 text-sm text-gray-500 mt-1'>
										<MapPin className='h-4 w-4' />
										<span>{event.location}</span>
									</div>
								</div>
								<div className='flex items-center space-x-2'>
									<div className='flex -space-x-2'>
										{Array.from({ length: Math.min(event.attendees, 3) }).map(
											(_, i) => (
												<div
													key={i}
													className='w-6 h-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full border-2 border-white flex items-center justify-center'
												>
													<span className='text-xs font-medium text-gray-600'>
														{String.fromCharCode(65 + i)}
													</span>
												</div>
											),
										)}
										{event.attendees > 3 && (
											<div className='w-6 h-6 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center'>
												<span className='text-xs font-medium text-gray-600'>
													+{event.attendees - 3}
												</span>
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				))}

				<Button variant='outline' className='w-full mt-4'>
					<Calendar className='mr-2 h-4 w-4' />
					View Full Calendar
				</Button>
			</CardContent>
		</Card>
	);
}

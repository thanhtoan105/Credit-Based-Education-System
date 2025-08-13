'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/lib/toast';

export default function TestSonnerPage() {
	const showSuccessToast = () => {
		toast.success({
			title: 'Success! ✅ - Green styling with checkmark icon',
			duration: 4000,
		});
	};

	const showErrorToast = () => {
		toast.error({
			title: 'Error! ❌ - Red styling with error icon',
			duration: 5000,
		});
	};

	const showWarningToast = () => {
		toast.warning({
			title: 'Warning! ⚠️ - Orange styling with warning icon',
			duration: 4000,
		});
	};

	const showInfoToast = () => {
		toast.info({
			title: 'Information ℹ️ - Blue styling with info icon',
			duration: 4000,
		});
	};

	const showToastWithAction = () => {
		toast.success({
			title: 'Toast with action button - Click the button!',
			action: {
				label: 'Click Me',
				onClick: () => {
					toast.info({
						title: 'Action button clicked! ✅',
					});
				},
			},
		});
	};

	const showPromiseToast = () => {
		const promise = new Promise((resolve, reject) => {
			setTimeout(() => {
				if (Math.random() > 0.5) {
					resolve('Success!');
				} else {
					reject('Failed!');
				}
			}, 2000);
		});

		toast.promise(promise, {
			loading: 'Loading...',
			success: 'Promise resolved successfully!',
			error: 'Promise failed!',
		});
	};

	return (
		<div className='container mx-auto p-6 space-y-6'>
			<Card>
				<CardHeader>
					<CardTitle>Sonner Toast Notification Test</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<p className='text-gray-600'>
						Test the different types of Sonner toast notifications implemented
						in your application. Each toast has rich styling, icons, and close
						buttons.
					</p>

					<div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
						<Button
							onClick={showSuccessToast}
							variant='default'
							className='bg-green-600 hover:bg-green-700'
						>
							Success Toast
						</Button>

						<Button onClick={showErrorToast} variant='destructive'>
							Error Toast
						</Button>

						<Button
							onClick={showWarningToast}
							className='bg-orange-600 hover:bg-orange-700 text-white'
						>
							Warning Toast
						</Button>

						<Button
							onClick={showInfoToast}
							className='bg-blue-600 hover:bg-blue-700 text-white'
						>
							Info Toast
						</Button>

						<Button onClick={showToastWithAction} variant='outline'>
							Toast with Action
						</Button>

						<Button onClick={showPromiseToast} variant='secondary'>
							Promise Toast
						</Button>
					</div>

					<div className='mt-6 p-4 bg-gray-50 rounded-lg'>
						<h3 className='font-semibold mb-2'>Features Implemented:</h3>
						<ul className='text-sm text-gray-600 space-y-1'>
							<li>✅ Rich color styling (green, red, orange, blue)</li>
							<li>✅ Custom icons for each notification type</li>
							<li>✅ No close buttons (clean design)</li>
							<li>✅ Action buttons support</li>
							<li>✅ Promise toast for async operations</li>
							<li>✅ Configurable duration</li>
							<li>✅ Global positioning (bottom-right)</li>
							<li>✅ Title-only design (no descriptions)</li>
							<li>✅ Responsive design</li>
						</ul>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

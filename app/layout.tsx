import './globals.css';
import { Toaster } from '@/components/ui/sonner';

export const metadata = {
	title: 'QLDSV_TC - Student Management System',
	description: 'Student Management System for Vietnamese College',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang='en'>
			<body>
				{children}
				<Toaster />
			</body>
		</html>
	);
}

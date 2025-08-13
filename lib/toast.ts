import { toast as sonnerToast } from 'sonner';
import { CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import React from 'react';

interface ToastOptions {
	title: string;
	duration?: number;
	action?: {
		label: string;
		onClick: () => void;
	};
}

export const toast = {
	success: ({ title, duration = 4000, action }: ToastOptions) => {
		return sonnerToast.success(title, {
			duration,
			icon: React.createElement(CheckCircle, {
				size: 16,
				className: 'text-green-600',
			}),
			action: action
				? {
						label: action.label,
						onClick: action.onClick,
				  }
				: undefined,
			className: 'border-green-200 bg-green-50',
		});
	},

	error: ({ title, duration = 5000, action }: ToastOptions) => {
		return sonnerToast.error(title, {
			duration,
			icon: React.createElement(AlertCircle, {
				size: 16,
				className: 'text-red-600',
			}),
			action: action
				? {
						label: action.label,
						onClick: action.onClick,
				  }
				: undefined,
			className: 'border-red-200 bg-red-50',
		});
	},

	warning: ({ title, duration = 4000, action }: ToastOptions) => {
		return sonnerToast.warning(title, {
			duration,
			icon: React.createElement(AlertTriangle, {
				size: 16,
				className: 'text-orange-600',
			}),
			action: action
				? {
						label: action.label,
						onClick: action.onClick,
				  }
				: undefined,
			className: 'border-orange-200 bg-orange-50',
		});
	},

	info: ({ title, duration = 4000, action }: ToastOptions) => {
		return sonnerToast.info(title, {
			duration,
			icon: React.createElement(Info, { size: 16, className: 'text-blue-600' }),
			action: action
				? {
						label: action.label,
						onClick: action.onClick,
				  }
				: undefined,
			className: 'border-blue-200 bg-blue-50',
		});
	},

	// Generic toast for custom styling
	message: ({ title, duration = 4000, action }: ToastOptions) => {
		return sonnerToast(title, {
			duration,
			action: action
				? {
						label: action.label,
						onClick: action.onClick,
				  }
				: undefined,
		});
	},

	// Promise toast for async operations
	promise: <T>(
		promise: Promise<T>,
		{
			loading,
			success,
			error,
		}: {
			loading: string;
			success: string | ((data: T) => string);
			error: string | ((error: any) => string);
		},
	) => {
		return sonnerToast.promise(promise, {
			loading,
			success,
			error,
		});
	},

	// Dismiss all toasts
	dismiss: (id?: string | number) => {
		return sonnerToast.dismiss(id);
	},
};

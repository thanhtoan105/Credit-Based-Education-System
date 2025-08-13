import { MultiAuthUser } from './services/multi-auth.service';

// Session storage keys
const SESSION_KEYS = {
	USER: 'qldsv_user',
	AUTH_TYPE: 'qldsv_auth_type',
	DEPARTMENT: 'qldsv_department',
	SERVER_NAME: 'qldsv_server_name',
} as const;

// Session interface
export interface UserSession {
	user: MultiAuthUser;
	authType: 'multi-database' | 'legacy';
	loginTime: string;
	lastActivity: string;
}

// Session management class
export class SessionManager {
	// Save user session
	static saveSession(
		user: MultiAuthUser,
		authType: 'multi-database' | 'legacy' = 'multi-database',
	): void {
		if (typeof window === 'undefined') return;

		const session: UserSession = {
			user,
			authType,
			loginTime: new Date().toISOString(),
			lastActivity: new Date().toISOString(),
		};

		try {
			// Save new multi-database session format
			localStorage.setItem(SESSION_KEYS.USER, JSON.stringify(session));
			localStorage.setItem(SESSION_KEYS.AUTH_TYPE, authType);
			localStorage.setItem(
				SESSION_KEYS.DEPARTMENT,
				user.department?.branch_name || 'Unknown',
			);
			localStorage.setItem(
				SESSION_KEYS.SERVER_NAME,
				user.serverName || 'Unknown',
			);

			// Also save in legacy format for compatibility with existing protected routes
			const legacyUser = {
				id: user.id,
				username: user.username,
				role: user.isStudent ? ('SV' as const) : ('KHOA' as const),
				fullName: user.fullName,
				email: `${user.username}`,
				permissions: user.isStudent
					? ['read:own-data', 'view:courses', 'submit:assignments']
					: [
							'read:department-data',
							'write:courses',
							'manage:students',
							'view:reports',
					  ],
				dataPartition: user.department?.branch_name
					? [user.department.branch_name]
					: ['limited'],
				canCreateAccounts: user.isStudent ? [] : (['SV'] as const),
				faculty: user.department
					? {
							id: user.department.server_name || 'unknown',
							name: user.department.branch_name || 'Unknown Department',
							code:
								(user.department.server_name || '').split('\\')[1] ||
								user.department.server_name ||
								'unknown',
							description: `${
								user.department.branch_name || 'Unknown'
							} Faculty`,
					  }
					: {
							id: 'unknown',
							name: 'Unknown Department',
							code: 'unknown',
							description: 'Unknown Faculty',
					  },
			};
			localStorage.setItem('user', JSON.stringify(legacyUser));
		} catch (error) {
			console.error('Error saving session:', error);
		}
	}

	// Get current session
	static getSession(): UserSession | null {
		if (typeof window === 'undefined') return null;

		try {
			const sessionData = localStorage.getItem(SESSION_KEYS.USER);
			if (!sessionData) return null;

			const session: UserSession = JSON.parse(sessionData);

			// Update last activity
			session.lastActivity = new Date().toISOString();
			localStorage.setItem(SESSION_KEYS.USER, JSON.stringify(session));

			return session;
		} catch (error) {
			console.error('Error getting session:', error);
			return null;
		}
	}

	// Get current user
	static getCurrentUser(): MultiAuthUser | null {
		const session = this.getSession();
		return session?.user || null;
	}

	// Check if user is authenticated
	static isAuthenticated(): boolean {
		return this.getCurrentUser() !== null;
	}

	// Get current department
	static getCurrentDepartment(): string | null {
		if (typeof window === 'undefined') return null;
		return localStorage.getItem(SESSION_KEYS.DEPARTMENT);
	}

	// Get current server name
	static getCurrentServerName(): string | null {
		if (typeof window === 'undefined') return null;
		return localStorage.getItem(SESSION_KEYS.SERVER_NAME);
	}

	// Get auth type
	static getAuthType(): 'multi-database' | 'legacy' | null {
		if (typeof window === 'undefined') return null;
		const authType = localStorage.getItem(SESSION_KEYS.AUTH_TYPE);
		return authType as 'multi-database' | 'legacy' | null;
	}

	// Clear session
	static clearSession(): void {
		if (typeof window === 'undefined') return;

		try {
			// Clear new session format
			Object.values(SESSION_KEYS).forEach((key) => {
				localStorage.removeItem(key);
			});

			// Clear legacy session format
			localStorage.removeItem('user');
		} catch (error) {
			console.error('Error clearing session:', error);
		}
	}

	// Check if session is expired (optional - implement based on your requirements)
	static isSessionExpired(): boolean {
		const session = this.getSession();
		if (!session) return true;

		// Example: session expires after 8 hours
		const loginTime = new Date(session.loginTime);
		const now = new Date();
		const diffHours = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);

		return diffHours > 8;
	}

	// Refresh session activity
	static refreshActivity(): void {
		const session = this.getSession();
		if (session) {
			session.lastActivity = new Date().toISOString();
			localStorage.setItem(SESSION_KEYS.USER, JSON.stringify(session));
		}
	}

	// Get session info for debugging
	static getSessionInfo(): {
		isAuthenticated: boolean;
		user?: MultiAuthUser;
		department?: string;
		serverName?: string;
		authType?: string;
		loginTime?: string;
		lastActivity?: string;
	} {
		const session = this.getSession();

		return {
			isAuthenticated: this.isAuthenticated(),
			user: session?.user,
			department: this.getCurrentDepartment() || undefined,
			serverName: this.getCurrentServerName() || undefined,
			authType: this.getAuthType() || undefined,
			loginTime: session?.loginTime,
			lastActivity: session?.lastActivity,
		};
	}
}

// Convenience functions
export const saveUserSession = (
	user: MultiAuthUser,
	authType?: 'multi-database' | 'legacy',
) => SessionManager.saveSession(user, authType);

export const getCurrentUser = () => SessionManager.getCurrentUser();
export const isAuthenticated = () => SessionManager.isAuthenticated();
export const getCurrentDepartment = () => SessionManager.getCurrentDepartment();
export const getCurrentServerName = () => SessionManager.getCurrentServerName();
export const clearUserSession = () => SessionManager.clearSession();
export const getSessionInfo = () => SessionManager.getSessionInfo();

// React hook for session management (optional)
export const useSession = () => {
	if (typeof window === 'undefined') {
		return {
			user: null,
			isAuthenticated: false,
			department: null,
			serverName: null,
			authType: null,
			clearSession: () => {},
			refreshActivity: () => {},
		};
	}

	return {
		user: getCurrentUser(),
		isAuthenticated: isAuthenticated(),
		department: getCurrentDepartment(),
		serverName: getCurrentServerName(),
		authType: SessionManager.getAuthType(),
		clearSession: clearUserSession,
		refreshActivity: SessionManager.refreshActivity,
	};
};

// Session validation middleware (for API routes)
export const validateSession = async (
	request: Request,
): Promise<{
	isValid: boolean;
	user?: MultiAuthUser;
	error?: string;
}> => {
	try {
		// In a real application, you would validate the session token from headers
		// For now, we'll implement basic validation

		const authHeader = request.headers.get('authorization');
		if (!authHeader) {
			return { isValid: false, error: 'No authorization header' };
		}

		// Extract session data from header (implement based on your session strategy)
		// This is a simplified example
		return { isValid: true };
	} catch (error) {
		return { isValid: false, error: 'Session validation failed' };
	}
};

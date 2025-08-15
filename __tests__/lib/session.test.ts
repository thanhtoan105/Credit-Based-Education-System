import { getCurrentUser } from '@/lib/session';

// Mock localStorage
const localStorageMock = {
	getItem: jest.fn(),
	setItem: jest.fn(),
	removeItem: jest.fn(),
	clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock,
});

describe('Session Management', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should return null when no user is stored', () => {
		localStorageMock.getItem.mockReturnValue(null);

		const user = getCurrentUser();

		expect(user).toBeNull();
		expect(localStorageMock.getItem).toHaveBeenCalledWith('qldsv_user');
	});

	it('should return user when valid user data is stored', () => {
		const mockUser = {
			id: 'SV001',
			username: 'SV001',
			isStudent: true,
			fullName: 'Test User',
			department: {
				branch_name: 'IT Department',
				server_name: 'IT_SERVER',
			},
		};

		const mockSession = {
			user: mockUser,
			authType: 'multi-database',
			loginTime: new Date().toISOString(),
			lastActivity: new Date().toISOString(),
		};

		localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSession));

		const user = getCurrentUser();

		expect(user).toEqual(mockUser);
		expect(localStorageMock.getItem).toHaveBeenCalledWith('qldsv_user');
	});

	it('should return null when invalid JSON is stored', () => {
		localStorageMock.getItem.mockReturnValue('invalid json');

		const user = getCurrentUser();

		expect(user).toBeNull();
	});

	it('should handle localStorage errors gracefully', () => {
		localStorageMock.getItem.mockImplementation(() => {
			throw new Error('localStorage error');
		});

		const user = getCurrentUser();

		expect(user).toBeNull();
	});
});

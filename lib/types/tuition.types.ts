// TypeScript interfaces for tuition payment system
// These interfaces match the stored procedure outputs and API responses

// ===== STORED PROCEDURE RESPONSE INTERFACES =====

/**
 * Interface for SP_DETAILED_TUITION_FEE stored procedure response
 * Represents a single tuition fee record for a student
 */
export interface DetailedTuitionFeeRecord {
	/** Academic year in format YYYY-YYYY (e.g., "2024-2025") */
	ACADEMIC_YEAR: string;
	/** Semester number (1, 2, or 3) */
	SEMESTER: number;
	/** Total tuition fee amount for the semester */
	FEE_AMOUNT: number;
	/** Total amount paid by student for this semester */
	AMOUNT_PAID: number;
	/** Remaining amount due (FEE_AMOUNT - AMOUNT_PAID) */
	AMOUNT_DUE: number;
}

/**
 * Interface for SP_DETAILED_TUITION_PAYMENT_INFO stored procedure response
 * Represents a single payment transaction
 */
export interface TuitionPaymentDetail {
	/** Payment date formatted as dd/mm/yyyy */
	PAYMENT_DATE: string;
	/** Amount paid in this transaction */
	AMOUNT_PAID: number;
}

// ===== STUDENT INFORMATION INTERFACES =====

/**
 * Student information retrieved from database
 */
export interface StudentInfo {
	/** Student ID (primary key) */
	STUDENT_ID: string;
	/** Full name (LAST_NAME + ' ' + FIRST_NAME) */
	FULL_NAME: string;
	/** Class ID the student belongs to */
	CLASS_ID: string;
}

/**
 * Extended student information for UI display
 */
export interface StudentDisplayInfo extends StudentInfo {
	/** Department code for display purposes */
	departmentCode?: string;
	/** Academic year for context */
	year?: string;
	/** Email address if available */
	email?: string;
}

// ===== API RESPONSE INTERFACES =====

/**
 * Response from /api/tuition/detailed-fee endpoint
 */
export interface DetailedTuitionFeeResponse {
	success: boolean;
	studentInfo?: StudentInfo;
	tuitionRecords?: DetailedTuitionFeeRecord[];
	error?: string;
}

/**
 * Response from /api/tuition/payment-details endpoint
 */
export interface TuitionPaymentDetailsResponse {
	success: boolean;
	paymentDetails?: TuitionPaymentDetail[];
	totalPayments?: number;
	totalAmount?: number;
	error?: string;
}

// ===== UI STATE INTERFACES =====

/**
 * Enhanced tuition record for UI display with computed properties
 */
export interface TuitionRecordDisplay extends DetailedTuitionFeeRecord {
	/** Unique identifier for React keys */
	id: string;
	/** Student ID for reference */
	studentId: string;
	/** Payment status based on amounts */
	status: 'paid' | 'partial' | 'unpaid';
	/** Formatted academic year for display */
	academicYearDisplay: string;
	/** Formatted semester for display */
	semesterDisplay: string;
}

/**
 * Payment detail for UI display with additional formatting
 */
export interface PaymentDetailDisplay extends TuitionPaymentDetail {
	/** Unique identifier for React keys */
	id: string;
	/** Reference to parent tuition record */
	tuitionRecordId: string;
	/** Original date object for sorting */
	dateObject: Date;
	/** Formatted amount for display */
	formattedAmount: string;
}

// ===== FORM INTERFACES =====

/**
 * Form data for student ID input
 */
export interface StudentSearchForm {
	studentId: string;
	isLoading: boolean;
	error: string | null;
}

/**
 * Modal state for payment details
 */
export interface PaymentDetailsModalState {
	isOpen: boolean;
	studentId: string | null;
	academicYear: string | null;
	semester: number | null;
	isLoading: boolean;
	error: string | null;
}

// ===== UTILITY INTERFACES =====

/**
 * API request parameters for tuition fee endpoint
 */
export interface TuitionFeeRequestParams {
	studentId: string;
	departmentName?: string;
}

/**
 * API request parameters for payment details endpoint
 */
export interface PaymentDetailsRequestParams {
	studentId: string;
	academicYear: string;
	semester: number;
	departmentName?: string;
}

/**
 * Currency formatting options
 */
export interface CurrencyFormatOptions {
	locale: string;
	currency: string;
	minimumFractionDigits?: number;
	maximumFractionDigits?: number;
}

// ===== CONSTANTS AND ENUMS =====

/**
 * Payment status enumeration
 */
export enum PaymentStatus {
	PAID = 'paid',
	PARTIAL = 'partial',
	UNPAID = 'unpaid'
}

/**
 * Semester options
 */
export enum Semester {
	FIRST = 1,
	SECOND = 2,
	THIRD = 3
}

/**
 * Default currency format for Vietnamese Dong
 */
export const DEFAULT_CURRENCY_FORMAT: CurrencyFormatOptions = {
	locale: 'vi-VN',
	currency: 'VND',
	minimumFractionDigits: 0,
	maximumFractionDigits: 0
};

// ===== UTILITY TYPE GUARDS =====

/**
 * Type guard to check if a response is a successful tuition fee response
 */
export function isSuccessfulTuitionFeeResponse(
	response: DetailedTuitionFeeResponse
): response is DetailedTuitionFeeResponse & { 
	success: true; 
	studentInfo: StudentInfo; 
	tuitionRecords: DetailedTuitionFeeRecord[] 
} {
	return response.success && !!response.studentInfo && !!response.tuitionRecords;
}

/**
 * Type guard to check if a response is a successful payment details response
 */
export function isSuccessfulPaymentDetailsResponse(
	response: TuitionPaymentDetailsResponse
): response is TuitionPaymentDetailsResponse & { 
	success: true; 
	paymentDetails: TuitionPaymentDetail[];
	totalPayments: number;
	totalAmount: number;
} {
	return response.success && !!response.paymentDetails && 
		   typeof response.totalPayments === 'number' && 
		   typeof response.totalAmount === 'number';
}

// ===== HELPER FUNCTIONS TYPES =====

/**
 * Function type for formatting currency amounts
 */
export type CurrencyFormatter = (amount: number, options?: Partial<CurrencyFormatOptions>) => string;

/**
 * Function type for determining payment status
 */
export type PaymentStatusCalculator = (feeAmount: number, amountPaid: number) => PaymentStatus;

/**
 * Function type for formatting dates
 */
export type DateFormatter = (dateString: string, format?: string) => string;

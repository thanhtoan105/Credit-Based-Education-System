// Vietnamese number to words conversion
const ones = [
	'', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'
];

const tens = [
	'', '', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 
	'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'
];

const scales = [
	'', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'
];

function convertHundreds(num: number): string {
	let result = '';
	
	const hundreds = Math.floor(num / 100);
	const remainder = num % 100;
	const tensDigit = Math.floor(remainder / 10);
	const onesDigit = remainder % 10;
	
	if (hundreds > 0) {
		result += ones[hundreds] + ' trăm';
	}
	
	if (tensDigit > 1) {
		result += (result ? ' ' : '') + tens[tensDigit];
		if (onesDigit > 0) {
			if (onesDigit === 1) {
				result += ' một';
			} else if (onesDigit === 5 && tensDigit > 1) {
				result += ' lăm';
			} else {
				result += ' ' + ones[onesDigit];
			}
		}
	} else if (tensDigit === 1) {
		result += (result ? ' ' : '') + 'mười';
		if (onesDigit > 0) {
			if (onesDigit === 5) {
				result += ' lăm';
			} else {
				result += ' ' + ones[onesDigit];
			}
		}
	} else if (onesDigit > 0) {
		if (hundreds > 0) {
			result += ' lẻ ' + ones[onesDigit];
		} else {
			result += ones[onesDigit];
		}
	}
	
	return result.trim();
}

export function numberToWords(num: number): string {
	if (num === 0) return 'không';
	
	if (num < 0) return 'âm ' + numberToWords(-num);
	
	const groups: number[] = [];
	let tempNum = num;
	
	// Split number into groups of 3 digits
	while (tempNum > 0) {
		groups.unshift(tempNum % 1000);
		tempNum = Math.floor(tempNum / 1000);
	}
	
	let result = '';
	
	for (let i = 0; i < groups.length; i++) {
		const group = groups[i];
		const scaleIndex = groups.length - 1 - i;
		
		if (group > 0) {
			const groupWords = convertHundreds(group);
			
			if (result) {
				result += ' ';
			}
			
			result += groupWords;
			
			if (scaleIndex > 0 && scaleIndex < scales.length) {
				result += ' ' + scales[scaleIndex];
			}
		}
	}
	
	// Capitalize first letter
	return result.charAt(0).toUpperCase() + result.slice(1);
}

// Format currency amount to words
export function currencyToWords(amount: number): string {
	const words = numberToWords(amount);
	return words + ' đồng';
}

const { parseReceiptText, extractAmount, extractDate, extractMerchant, guessCategory } = require('../../utils/ocrParser');

describe('ocrParser - extractAmount', () => {
  test('extracts amount from a "Grand Total" line with a simple 3-digit value', () => {
    expect(extractAmount('Grand Total   389.00')).toBe(389);
  });

  test('correctly extracts 4+ digit amounts without a thousands separator (e.g. 1200.50)', () => {
    expect(extractAmount('Amount Payable 1200.50')).toBe(1200.5);
  });

  test('correctly extracts amounts with comma thousands separators (e.g. 45,999.00)', () => {
    expect(extractAmount('Grand Total  Rs. 45,999.00')).toBe(45999);
  });

  test('falls back to the largest number in the text when no "total" keyword line exists', () => {
    const text = 'Item A 50\nItem B 120\nItem C 30';
    expect(extractAmount(text)).toBe(120);
  });

  test('returns null when no numbers are present', () => {
    expect(extractAmount('Thank you for shopping with us')).toBeNull();
  });
});

describe('ocrParser - extractDate', () => {
  test('parses DD/MM/YYYY (Indian format) correctly, not as MM/DD/YYYY', () => {
    const date = extractDate('Date: 15/07/2026');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(6); // July = index 6
    expect(date.getDate()).toBe(15);
  });

  test('parses DD-MM-YYYY with dashes', () => {
    const date = extractDate('05-06-2026');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(5); // June
    expect(date.getDate()).toBe(5);
  });

  test('parses ISO format YYYY-MM-DD', () => {
    const date = extractDate('2026-08-01');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(7); // August
    expect(date.getDate()).toBe(1);
  });

  test('parses textual month format like "12 Aug 2025"', () => {
    const date = extractDate('12 Aug 2025');
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(7); // August
    expect(date.getDate()).toBe(12);
  });

  test('falls back to today when no recognizable date is present', () => {
    const date = extractDate('no date here at all');
    const today = new Date();
    expect(date.getFullYear()).toBe(today.getFullYear());
    expect(date.getMonth()).toBe(today.getMonth());
  });
});

describe('ocrParser - extractMerchant', () => {
  test('picks the first meaningful non-numeric line as the merchant name', () => {
    const text = 'Big Bazaar Supermarket\nTax Invoice\nDate: 15/07/2026\nGrand Total 389.00';
    expect(extractMerchant(text)).toBe('Big Bazaar Supermarket');
  });

  test('falls back to "Unknown Merchant" when nothing usable is found', () => {
    const text = '123456\n789.00\nInvoice';
    expect(extractMerchant(text)).toBe('Unknown Merchant');
  });
});

describe('ocrParser - guessCategory', () => {
  test('detects Groceries from supermarket keywords', () => {
    expect(guessCategory('Big Bazaar Supermarket', '')).toBe('Groceries');
  });

  test('detects Transport from petrol pump keywords', () => {
    expect(guessCategory('Reliance Petrol Pump', '')).toBe('Transport');
  });

  test('detects Health from pharmacy keywords', () => {
    expect(guessCategory('Apollo Pharmacy', '')).toBe('Health');
  });

  test('defaults to Other when nothing matches', () => {
    expect(guessCategory('XYZ Enterprises', '')).toBe('Other');
  });
});

describe('ocrParser - parseReceiptText (end-to-end)', () => {
  test('correctly parses a realistic Indian grocery bill', () => {
    const bill = `Big Bazaar Supermarket
Tax Invoice
Date: 15/07/2026
Item 1        120.00
Item 2        250.50
Subtotal      370.50
Tax           18.50
Grand Total   389.00
Thank you for shopping`;

    const result = parseReceiptText(bill);
    expect(result.title).toBe('Big Bazaar Supermarket');
    expect(result.amount).toBe(389);
    expect(result.category).toBe('Groceries');
    expect(result.date.getMonth()).toBe(6); // July
    expect(result.date.getDate()).toBe(15);
  });

  test('flags low confidence when no amount could be found', () => {
    const result = parseReceiptText('Just some random unrelated text with no numbers');
    expect(result.confidence).toBe('low');
    expect(result.amount).toBe(0);
  });
});

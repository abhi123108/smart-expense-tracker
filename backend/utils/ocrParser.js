/**
 * Parses raw OCR text extracted from a bill/receipt image and attempts
 * to pull out the total amount, date, and merchant name using pattern matching.
 * This is a heuristic parser (no cloud AI) tuned for common Indian retail bills.
 */

// Keywords that usually precede the final payable amount on a bill
const TOTAL_KEYWORDS = [
  'grand total',
  'total amount',
  'net amount',
  'net payable',
  'amount payable',
  'total payable',
  'bill total',
  'total',
  'amount due',
];

function extractAmount(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  // Matches whole-number or comma-grouped amounts with an optional 1-2 digit decimal,
  // e.g. 389, 1200.50, 1,200.50 - without truncating numbers longer than 3 digits.
  const amountRegex = /(?:rs\.?|inr|₹|\$)?\s?([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i;

  let bestAmount = null;

  // First pass: look for lines containing total keywords
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (TOTAL_KEYWORDS.some((kw) => lower.includes(kw))) {
      const match = line.match(amountRegex);
      if (match) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(val) && val > 0) {
          bestAmount = val; // keep updating; last "total" match tends to be most accurate
        }
      }
    }
  }

  // Fallback: pick the largest numeric value found anywhere (often the grand total)
  if (bestAmount === null) {
    const allMatches = [...text.matchAll(/([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/g)];
    const numbers = allMatches
      .map((m) => parseFloat(m[1].replace(/,/g, '')))
      .filter((n) => !isNaN(n) && n > 0 && n < 1000000);
    if (numbers.length) bestAmount = Math.max(...numbers);
  }

  return bestAmount;
}

function extractDate(text) {
  // Indian bills are almost always DD/MM/YYYY (or DD-MM-YYYY) - parse this explicitly
  // first since JS's native Date() assumes MM/DD/YYYY and silently misparses or
  // rejects valid Indian-format dates like 15/07/2026.
  const ddmmyyyy = text.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/);
  if (ddmmyyyy) {
    let [, day, month, year] = ddmmyyyy;
    day = parseInt(day, 10);
    month = parseInt(month, 10);
    year = parseInt(year, 10);
    if (year < 100) year += 2000;
    // Guard against genuinely MM/DD/YYYY-style input: if "month" > 12, swap
    if (month > 12 && day <= 12) [day, month] = [month, day];
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const parsed = new Date(year, month - 1, day);
      if (!isNaN(parsed.getTime())) return parsed;
    }
  }

  // ISO-style YYYY-MM-DD
  const isoMatch = text.match(/\b(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch.map(Number);
    const parsed = new Date(year, month - 1, day);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  // Textual month, e.g. "12 Aug 2025"
  const textMatch = text.match(/(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s(\d{2,4})/i);
  if (textMatch) {
    const parsed = new Date(`${textMatch[2]} ${textMatch[1]}, ${textMatch[3]}`);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  return new Date(); // fallback to today if nothing recognizable was found
}

function extractMerchant(text) {
  // Heuristic: the merchant name is usually one of the first non-empty lines
  // that isn't purely numeric and isn't a common receipt header word.
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const skipWords = ['invoice', 'receipt', 'bill', 'tax invoice', 'cash memo'];

  for (const line of lines.slice(0, 5)) {
    const lower = line.toLowerCase();
    const isNumericOnly = /^[\d\s.,\-\/₹$]+$/.test(line);
    const isSkipWord = skipWords.some((w) => lower === w);
    if (line.length > 2 && !isNumericOnly && !isSkipWord) {
      return line;
    }
  }
  return 'Unknown Merchant';
}

function guessCategory(merchant, fullText) {
  const text = (merchant + ' ' + fullText).toLowerCase();
  const rules = [
    { category: 'Groceries', keywords: ['mart', 'grocery', 'supermarket', 'bazaar', 'kirana'] },
    { category: 'Food', keywords: ['restaurant', 'cafe', 'food', 'swiggy', 'zomato', 'pizza', 'hotel'] },
    { category: 'Transport', keywords: ['uber', 'ola', 'petrol', 'fuel', 'diesel', 'metro', 'cab', 'taxi'] },
    { category: 'Shopping', keywords: ['mall', 'fashion', 'store', 'apparel', 'electronics', 'amazon', 'flipkart'] },
    { category: 'Bills', keywords: ['electricity', 'water bill', 'broadband', 'recharge', 'telecom', 'gas'] },
    { category: 'Health', keywords: ['pharmacy', 'medical', 'hospital', 'clinic', 'medicine', 'chemist'] },
    { category: 'Entertainment', keywords: ['cinema', 'movie', 'multiplex', 'netflix', 'game'] },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((kw) => text.includes(kw))) return rule.category;
  }
  return 'Other';
}

/**
 * Main entry point: takes raw OCR text and returns structured expense data.
 */
function parseReceiptText(rawText) {
  const amount = extractAmount(rawText);
  const date = extractDate(rawText);
  const merchant = extractMerchant(rawText);
  const category = guessCategory(merchant, rawText);

  return {
    title: merchant,
    amount: amount || 0,
    date,
    category,
    confidence: amount ? 'medium' : 'low', // simple confidence flag for the frontend to show a warning
  };
}

module.exports = { parseReceiptText, extractAmount, extractDate, extractMerchant, guessCategory };

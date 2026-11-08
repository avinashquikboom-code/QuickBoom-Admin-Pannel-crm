export const CURRENCY_CODE = 'INR';
export const CURRENCY_SYMBOL = '₹';
export const CURRENCY_LOCALE = 'en-IN';
export const CURRENCY_LABEL = `${CURRENCY_CODE} (${CURRENCY_SYMBOL})`;

export const currencyFormatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: 'currency',
    currency: CURRENCY_CODE,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

// Presentation only: amounts are already rupees; never convert exchange rates.
// Missing or invalid values stay visibly unavailable rather than becoming zero.
export function formatCurrency(amount) {
    if (amount == null || (typeof amount === 'string' && amount.trim() === '') ||
        (typeof amount !== 'number' && typeof amount !== 'string')) return '—';
    const value = typeof amount === 'number' ? amount : Number(amount);
    return Number.isFinite(value) ? currencyFormatter.format(value) : '—';
}

/**
 * Currency formatter using custom symbol image
 * Returns HTML string with currency symbol image + formatted amount
 */
export function formatCurrency(amount: number): string {
    // Use custom currency symbol SVG from static folder
    const symbol = "/currency-symbol.svg";
    
    // Format the number with proper locale formatting
    const formattedAmount = Number(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    // Return HTML with image symbol + formatted amount
    return `<img src="${symbol}" alt="SAR" class="currency-symbol" /> ${formattedAmount}`;
}

/**
 * Currency formatter for plain text (no HTML)
 * Fallback for contexts where HTML is not supported
 */
export function formatCurrencyText(amount: number): string {
    const formattedAmount = Number(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    return `﷼ ${formattedAmount}`;
}

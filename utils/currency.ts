
const currencyMap: { [country: string]: { code: string; symbol: string } } = {
    'Brasil': { code: 'BRL', symbol: 'R$' },
    'Moçambique': { code: 'MZN', symbol: 'MT' },
    'Angola': { code: 'AOA', symbol: 'Kz' },
    'Portugal': { code: 'EUR', symbol: '€' },
    'Cabo Verde': { code: 'CVE', symbol: 'Esc' },
    'São Tomé e Príncipe': { code: 'STN', symbol: 'Db' },
};

export const getCurrencyForCountry = (country: string): { code: string; symbol: string } => {
    return currencyMap[country] || { code: 'USD', symbol: '$' };
};

export const formatPrice = (price: number, country: string): string => {
    const currency = getCurrencyForCountry(country);
    // Fallback for environments that might not support all currency codes in Intl
    try {
        return new Intl.NumberFormat('pt-BR', { // Using a consistent locale for formatting
            style: 'currency',
            currency: currency.code,
        }).format(price);
    } catch (e) {
        return `${currency.symbol} ${price.toFixed(2)}`;
    }
}
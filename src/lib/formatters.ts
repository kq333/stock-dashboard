export const getLocale = (language?: string) => (language === 'pl' ? 'pl-PL' : 'en-US')

export function formatNumber(value: number, decimals: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

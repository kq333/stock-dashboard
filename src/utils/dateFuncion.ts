const dateFunction = (datetime: number, locale: string): string =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(datetime * 1000))

export default dateFunction

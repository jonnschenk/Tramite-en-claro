// Convierte "2026-11-10" en "10 de noviembre de 2026".
// Se arma la fecha con año, mes y día locales: new Date("2026-11-10") se lee como medianoche UTC y en CDMX (UTC-6) se mostraría como el 9 de noviembre.

const formatter = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return formatter.format(new Date(year, month - 1, day));
}
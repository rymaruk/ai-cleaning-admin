export const formatPriceUAH = new Intl.NumberFormat("uk-UA", {
  style: "currency",
  currency: "UAH",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrice(price: number | null): string {
  return price != null ? formatPriceUAH.format(price) : "—";
}

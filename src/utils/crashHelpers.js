export function formatStars(value) {
  const num = Number(value || 0)
  return new Intl.NumberFormat("ru-RU").format(num)
}

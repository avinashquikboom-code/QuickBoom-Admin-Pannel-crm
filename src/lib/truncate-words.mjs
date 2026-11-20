export function truncateWords(value, maxWords = 10) {
  if (value == null) return '';
  const text = String(value);
  const limit = Number.isFinite(Number(maxWords)) ? Math.max(1, Math.floor(Number(maxWords))) : 10;
  const words = [...text.matchAll(/\S+/g)];
  if (words.length <= limit) return text;
  const end = words[limit - 1].index + words[limit - 1][0].length;
  return `${text.slice(0, end)}...`;
}

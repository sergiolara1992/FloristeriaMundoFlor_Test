export function parseMoneyToNumber(text: string): number {
  const cleaned = text
    .replace(/[^\d,.-]/g, '')                   
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')        
    .replace(/,/, '.');                        
  const n = Number(cleaned);
  if (Number.isNaN(n)) throw new Error(`Cannot parse money from: "${text}"`);
  return n;
}

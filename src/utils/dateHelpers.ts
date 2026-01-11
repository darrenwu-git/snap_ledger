export const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  // Handle ISO string or YYYY-MM-DD by taking the first part
  const cleanDate = dateStr.split('T')[0];
  const [year, month, day] = cleanDate.split('-').map(Number);
  // Note: month is 0-indexed in Date constructor (0=Jan, 11=Dec)
  return new Date(year, month - 1, day);
};

/**
 * Tablo verilerini CSV / Excel formatında dışa aktarmak için yardımcı fonksiyon.
 * Türkçe karakter uyumluluğu için UTF-8 BOM (\uFEFF) eklenir.
 * 
 * @param filename İndirilecek dosya adı (örn: 'gemiler.csv')
 * @param headers Sütun başlıkları dizisi (örn: ['Gemi Adı', 'IMO', 'Bayrak'])
 * @param rows Satır verileri dizisi
 */
export function exportToCsv(filename: string, headers: string[], rows: (string | number | undefined | null)[][]) {
  const escapeCell = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCell).join(';');
  const rowLines = rows.map((row) => row.map(escapeCell).join(';'));
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

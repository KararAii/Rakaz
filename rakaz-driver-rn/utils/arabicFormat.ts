import type { Coordinate } from '@/types/models';

const arabicDigitChars = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/** Converts Western digits to Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩). */
export function arabicDigits(value: string): string {
  return value.replace(/[0-9]/g, (d) => arabicDigitChars[Number(d)] ?? d);
}

/** Converts Arabic-Indic digits back to Western digits (for dialing / validation). */
export function westernDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (d) => String(arabicDigitChars.indexOf(d)));
}

const weekdays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const months = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const pad2 = (n: number): string => n.toString().padStart(2, '0');

export const ArabicFormat = {
  time(millis: number): string {
    const d = new Date(millis);
    return arabicDigits(`${pad2(d.getHours())}:${pad2(d.getMinutes())}`);
  },

  number(value: number): string {
    return arabicDigits(Math.trunc(value).toString());
  },

  km(meters: number): string {
    return arabicDigits((Math.max(0, meters) / 1000).toFixed(1));
  },

  /** "EEEE d MMMM" in Arabic, e.g. "الثلاثاء ٦ أكتوبر". */
  day(millis: number): string {
    const d = new Date(millis);
    return arabicDigits(`${weekdays[d.getDay()] ?? ''} ${d.getDate()} ${months[d.getMonth()] ?? ''}`);
  },

  relative(millis: number): string {
    const seconds = Math.floor((Date.now() - millis) / 1000);
    if (seconds < 60) return 'الآن';
    if (seconds < 3600) return `منذ ${ArabicFormat.number(Math.floor(seconds / 60))} د`;
    if (seconds < 86_400) return `منذ ${ArabicFormat.number(Math.floor(seconds / 3600))} س`;
    return `منذ ${ArabicFormat.number(Math.floor(seconds / 86_400))} يوم`;
  },

  coordinate(c: Coordinate): string {
    return arabicDigits(`${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}`);
  },
};

/** Arabic-first formatting helpers (Arabic-Indic digits, Iraqi dinar, 12h clock with صباحاً/مساءً). */

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

const WEEKDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

/** Converts Western digits to Arabic-Indic digits. */
function digits(text: string): string {
  return text.replace(/[0-9]/g, (d) => ARABIC_DIGITS[Number(d)]);
}

/** Converts Arabic-Indic / Persian digits back to Western digits (for input normalization). */
function latinDigits(text: string): string {
  let out = '';
  for (const ch of text) {
    const a = ARABIC_DIGITS.indexOf(ch);
    const p = PERSIAN_DIGITS.indexOf(ch);
    out += a >= 0 ? String(a) : p >= 0 ? String(p) : ch;
  }
  return out;
}

/** Decimal with "٬" grouping and at most one fraction digit. */
function number(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const negative = rounded < 0;
  const [intPart, frac] = Math.abs(rounded).toString().split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
  return digits(`${negative ? '-' : ''}${grouped}${frac ? `.${frac}` : ''}`);
}

function money(value: number): string {
  return `${number(value)} د.ع`;
}

const pad = (n: number): string => n.toString().padStart(2, '0');

function clock(date: number): string {
  const d = new Date(date);
  const h = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12;
  return digits(`${pad(h)}:${pad(d.getMinutes())}`);
}

function period(date: number): string {
  return new Date(date).getHours() < 12 ? 'صباحاً' : 'مساءً';
}

function time(date: number): string {
  return `${clock(date)} ${period(date)}`;
}

function dayDate(date: number): string {
  const d = new Date(date);
  return digits(`${WEEKDAYS[d.getDay()]}، ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`);
}

function date(value: number): string {
  const d = new Date(value);
  return digits(`${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`);
}

function shortDay(value: number): string {
  const d = new Date(value);
  return digits(`${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`);
}

/** Short weekday name ("EEE" in Arabic is the full weekday name). */
function weekday(value: number): string {
  return WEEKDAYS[new Date(value).getDay()];
}

interface UnitForms {
  one: string;
  two: string;
  few: string;
  many: string;
}

const UNITS: { seconds: number; forms: UnitForms }[] = [
  { seconds: 365 * 86_400, forms: { one: 'سنة واحدة', two: 'سنتين', few: 'سنوات', many: 'سنة' } },
  { seconds: 30 * 86_400, forms: { one: 'شهر واحد', two: 'شهرين', few: 'أشهر', many: 'شهرًا' } },
  { seconds: 7 * 86_400, forms: { one: 'أسبوع واحد', two: 'أسبوعين', few: 'أسابيع', many: 'أسبوعًا' } },
  { seconds: 86_400, forms: { one: 'يوم واحد', two: 'يومين', few: 'أيام', many: 'يومًا' } },
  { seconds: 3_600, forms: { one: 'ساعة واحدة', two: 'ساعتين', few: 'ساعات', many: 'ساعة' } },
  { seconds: 60, forms: { one: 'دقيقة واحدة', two: 'دقيقتين', few: 'دقائق', many: 'دقيقة' } },
  { seconds: 1, forms: { one: 'ثانية واحدة', two: 'ثانيتين', few: 'ثوانٍ', many: 'ثانية' } },
];

function quantity(n: number, forms: UnitForms): string {
  if (n === 1) return forms.one;
  if (n === 2) return forms.two;
  if (n >= 3 && n <= 10) return `${digits(String(n))} ${forms.few}`;
  return `${digits(String(n))} ${forms.many}`;
}

/** Relative time such as "قبل ٥ دقائق" / "خلال ساعتين"; "الآن" within 45 seconds. */
function relative(value: number): string {
  const delta = (value - Date.now()) / 1000;
  if (Math.abs(delta) < 45) return 'الآن';
  const abs = Math.abs(delta);
  const unit = UNITS.find((u) => abs >= u.seconds) ?? UNITS[UNITS.length - 1];
  const n = Math.max(1, Math.round(abs / unit.seconds));
  const phrase = quantity(n, unit.forms);
  return delta < 0 ? `قبل ${phrase}` : `خلال ${phrase}`;
}

function coordinate(value: number): string {
  return value.toFixed(6);
}

function minutes(value: number): string {
  return `${digits(String(value))} دقيقة`;
}

export const Fmt = {
  digits,
  latinDigits,
  number,
  money,
  clock,
  period,
  time,
  dayDate,
  date,
  shortDay,
  weekday,
  relative,
  coordinate,
  minutes,
};

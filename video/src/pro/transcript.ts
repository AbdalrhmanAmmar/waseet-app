import raw from './data/whisper-words.json';

type Token = { text: string; startMs: number; endMs: number };

/**
 * whisper large-v3 word timings for waseet.mp4 (scripts/transcribe.mjs). The full pass drops the
 * final sentence, so its four words come from a second pass over the last 2.2 s (offset 63.8 s).
 */
export const TOKENS: Token[] = [
  ...(raw as Token[]),
  { text: 'تواصل', startMs: 65100, endMs: 65280 },
  { text: 'معانا', startMs: 65280, endMs: 65480 },
  { text: 'على', startMs: 65480, endMs: 65810 },
  { text: 'الواتساب', startMs: 65810, endMs: 66000 },
];

/**
 * Captions, verbatim in the spoken Egyptian dialect. Whisper rewrites speech into MSA, so each row maps a
 * token range [from, to] (inclusive) to what is actually said. Words inside `*…*` are keywords (tinted);
 * ` / ` marks a caption line break (each caption line is a 2–4 word phrase).
 */
export const LINES: [number, number, string][] = [
  [0, 2, 'لو كان عندك'],
  [3, 3, '*منتجات* /'],
  [4, 5, 'وكنت عايز تبيعها /'],
  [6, 12, 'من غير ما تصرف / فلوس على *الإعلانات*، /'],
  [13, 17, 'خلّي *التجار* يبيعوهالك. /'],
  [18, 21, 'وتعالى أشرحلك إزاي. /'],
  [22, 28, 'وده بالظبط اللي عملناه / لعميل من *سوريا*. /'],
  [29, 34, 'الأدمن بيرفع المنتجات / وبيحدد *تلات* *أسعار*. /'],
  [35, 41, 'سعر المنتج الأصلي، / واللي يكون *100* *دولار*، /'],
  [42, 49, 'السعر اللي هياخده التاجر، / واللي يكون *120* *دولار*، /'],
  [50, 53, 'والسعر *المقترح* / للتاجر للبيع. /'],
  [54, 61, 'بس التاجر هو اللي / بيحدد *سعر* *البيع* للعميل، /'],
  [62, 68, 'هو يزود / زي ما هو عاوز / وياخد *عمولته*. /'],
  [69, 72, 'النظام فيه *أربع* *أدوار*: /'],
  [73, 78, '*التاجر*، *موظف* *مبيعات*، / *إدارة*، و*مندوب* *توصيل*. /'],
  [79, 85, 'وكل حساب جديد / لازم *الإدارة* *توافق* عليه. /'],
  [86, 88, 'التاجر بيفتح *التطبيق*، /'],
  [89, 90, 'وبيختار *المنتجات*، /'],
  [91, 95, 'وبيسجل طلب العميل / في *ثواني*. /'],
  [96, 102, 'ومن هنا، الإدارة / بتتابع الطلب لحد *التسليم*. /'],
  [103, 110, 'وكمان ربطنا النظام / *بشركة* *شحن* / في مناطق معينة. /'],
  [111, 122, 'يعني في مناطق *الأدمن* / هو اللي هيبعت / مندوب التوصيل / عشان يوصّل الأوردر، /'],
  [123, 131, 'وفي مناطق تانية / *شركة* *التوصيل* / هي اللي هتبعت المندوب. /'],
  [132, 140, 'والأهم من ده كله، / إن الطلب / لما يتأكد *تسليمه*، /'],
  [141, 144, 'مكسب التاجر / بيتضاف *لمحفظته*، /'],
  [145, 148, 'وبيقدر يطلب *سحب* *أرباحه*، /'],
  [149, 153, 'والإدارة بتراجع الطلب / *وبتوافق* عليه. /'],
  [154, 162, 'يعني *المنتجات*، / *والتجار*، *والطلبات*، / *والتوصيل*، *والعمولة* / في *مكان* *واحد*. /'],
  [163, 169, 'وده الفرق بين / إنك تعمل *متجر* *إلكتروني*، /'],
  [170, 175, 'وإنك تبني *منظومة* / تساعدك توسّع *مبيعاتك*. /'],
  [176, 185, 'ولو إنت عندك منتجات / وعايز *تجار* يبيعولك / ويزوّدوا *مبيعاتك*، /'],
  [186, 189, 'تواصل معانا على *WhatsApp*. /'],
];

export type SrcWord = { text: string; key: boolean; br: boolean; start: number; end: number }; // source seconds

/** One word per token when counts match; otherwise spread across the token span weighted by length. */
export const SOURCE_WORDS: SrcWord[] = LINES.flatMap(([a, b, line]) => {
  const parts = line.split(' ');
  const words = parts.flatMap((w, i) => (w === '/' ? [] : [{ text: w.replace(/\*/g, ''), key: w.includes('*'), br: parts[i + 1] === '/' }]));
  if (b - a + 1 === words.length) {
    return words.map((w, i) => ({ ...w, start: TOKENS[a + i].startMs / 1000, end: TOKENS[a + i].endMs / 1000 }));
  }
  const start = TOKENS[a].startMs / 1000;
  const end = TOKENS[b].endMs / 1000;
  const weights = words.map((w) => w.text.replace(/[،.:]/g, '').length + 1);
  const total = weights.reduce((s, x) => s + x, 0);
  let acc = 0;
  return words.map((w, i) => {
    const s = start + ((end - start) * acc) / total;
    acc += weights[i];
    return { ...w, start: s, end: start + ((end - start) * acc) / total };
  });
});

/** Source second where token i starts. */
export const tokenAt = (i: number) => TOKENS[i].startMs / 1000;

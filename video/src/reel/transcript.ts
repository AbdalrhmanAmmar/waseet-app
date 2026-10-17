import raw from './data/whisper-words.json';

/**
 * Caption text in the spoken Egyptian dialect, aligned to whisper's word timings.
 * whisper large-v3 gives accurate timings but rewrites speech into MSA, so each row maps a
 * range of its tokens [from, to] (inclusive indices into data/whisper-words.json) to what is said.
 * Edit the text here to correct captions — timings follow automatically.
 */
export const LINES: [number, number, string][] = [
  [0, 2, 'لو كان عندك'],
  [3, 3, 'منتجات'],
  [4, 5, 'وكنت عايز'],
  [6, 6, 'تبيعها'],
  [7, 9, 'من غير ما'],
  [10, 13, 'تصرف فلوس على الإعلانات،'],
  [14, 17, 'خلّي التجار يبيعوهالك.'],
  [18, 21, 'وتعالى أشرحلك إزاي.'],
  [22, 28, 'وده بالظبط اللي عملناه لعميل من سوريا.'],
  [29, 34, 'الأدمن بيرفع المنتجات وبيحدد تلات أسعار.'],
  [35, 41, 'سعر المنتج الأصلي، واللي يكون 100 دولار،'],
  [42, 49, 'السعر اللي هياخده التاجر، واللي يكون 120 دولار،'],
  [50, 53, 'والسعر المقترح للتاجر للبيع.'],
  [54, 61, 'بس التاجر هو اللي بيحدد سعر البيع للعميل،'],
  [62, 69, 'هو يزود زي ما هو عاوز وياخد عمولته.'],
  [70, 73, 'النظام فيه أربع أدوار:'],
  [74, 79, 'التاجر، موظف مبيعات، إدارة، ومندوب توصيل.'],
  [80, 86, 'وكل حساب جديد لازم الإدارة توافق عليه.'],
  [87, 89, 'التاجر بيفتح التطبيق،'],
  [90, 91, 'وبيختار المنتجات،'],
  [92, 96, 'وبيسجل طلب العميل في ثواني.'],
  [97, 103, 'ومن هنا، الإدارة بتتابع الطلب لحد التسليم.'],
  [104, 111, 'وكمان ربطنا النظام بشركة شحن في مناطق معينة.'],
  [112, 123, 'يعني في مناطق الأدمن هو اللي هيبعت مندوب التوصيل عشان يوصّل الأوردر،'],
  [124, 132, 'وفي مناطق تانية شركة التوصيل هي اللي هتبعت المندوب.'],
  [133, 141, 'والأهم من ده كله، إن الطلب لما يتأكد تسليمه،'],
  [142, 145, 'مكسب التاجر بيتضاف لمحفظته،'],
  [146, 150, 'وبيقدر يطلب سحب أرباحه،'],
  [151, 155, 'والإدارة بتراجع الطلب وبتوافق عليه.'],
  [156, 164, 'يعني المنتجات، والتجار، والطلبات، والتوصيل، والعمولة في مكان واحد.'],
  [165, 171, 'وده الفرق بين إنك تعمل متجر إلكتروني،'],
  [172, 177, 'وإنك تبني منظومة تساعدك توسّع مبيعاتك.'],
  [178, 187, 'ولو انت عندك منتجات وعايز تجار يبيعولك ويزوّدوا مبيعاتك،'],
  [188, 191, 'تواصل معانا على الواتساب.'],
];

type Token = { text: string; startMs: number; endMs: number };
const TOKENS = raw as Token[];

export type SrcWord = { text: string; start: number; end: number }; // source seconds

/** Spread each line's words across its token span, weighted by word length. */
export const SOURCE_WORDS: SrcWord[] = LINES.flatMap(([a, b, text]) => {
  const start = TOKENS[a].startMs / 1000;
  const end = TOKENS[b].endMs / 1000;
  const words = text.split(' ');
  if (b - a + 1 === words.length) {
    return words.map((w, i) => ({ text: w, start: TOKENS[a + i].startMs / 1000, end: TOKENS[a + i].endMs / 1000 }));
  }
  const weights = words.map((w) => w.replace(/[،.:]/g, '').length + 1);
  const total = weights.reduce((s, x) => s + x, 0);
  let acc = 0;
  return words.map((w, i) => {
    const s = start + ((end - start) * acc) / total;
    acc += weights[i];
    return { text: w, start: s, end: start + ((end - start) * acc) / total };
  });
});

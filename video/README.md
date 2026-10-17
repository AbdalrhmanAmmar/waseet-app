# فيديو وسيط — Remotion

فيديو موشن جرافيك مدته 20 ثانية (1920×1080، 30fps) بهوية وسيط: الأخضر `#147D64` والبرتقالي `#F29A4A` وخط Tajawal والشعار من `../assets/branding/logo.svg`.

المشروع مستقل عن تطبيق Expo: له `package.json` وlockfile خاصين، ومستثنى من `tsconfig.json` و`eslint.config.js` في الجذر.

## التشغيل

```sh
npm install
npm run dev      # Remotion Studio للمعاينة والتعديل
npm run render   # out/waseet.mp4
npm run sfx      # إعادة توليد الموسيقى والمؤثرات الصوتية في public/sfx
```

## المشاهد

| الإطارات | المشهد | الملف |
| --- | --- | --- |
| 0–165 | البوابة: شهاب برتقالي يتحول إلى مكعب الطرد، «تجارتك تبدأ من هنا» | `src/scenes/Scene1Portal.tsx` |
| 150–315 | الجزر الطائرة: الطرد يقفز بين التاجر والمبيعات والإدارة والمندوب مع حالات الطلب | `src/scenes/Scene2Islands.tsx` |
| 300–450 | الكوكبة: شبكة الفريق وكارت الرصيد، «فريق واحد. عمل منظم.» | `src/scenes/Scene3Constellation.tsx` |
| 450–600 | ميلاد الشعار: النجوم الثلاث تصبح عُقد الشعار، الفجر، «وسيط · تفاصيل أقل، إنجاز أكثر» | `src/scenes/Scene4Logo.tsx` |

المشاهد تتداخل 15 إطارًا للانتقال. الخلفية الليلية المشتركة في `src/components/Sky.tsx`، والألوان في `src/theme.ts` (منسوخة من `../src/theme/tokens.ts`؛ حدّثها يدويًا إذا تغيّرت الهوية).

## الصوت

كل الأصوات مولّدة برمجيًا في `scripts/generate-sfx.mjs`، دون عينات خارجية أو تراخيص: موسيقى خلفية بسلّم D major تتغير كوردتها مع كل مشهد، ونغمات Whoosh وImpact وRiser وChimes وPop وCoin وShimmer، وضربة الشعار.

مواقع المؤثرات في `src/Soundtrack.tsx`، ومربوطة بثوابت التوقيت في المشاهد (`HOPS`، `COIN_FRAME`، `HIT`). لذلك يبقى الصوت متزامنًا عند تعديل توقيت أي حركة.

---

# ريل «الوسيط» — 4K عمودي

مونتاج فيديو الشرح (`/Users/pro/Desktop/waseet/video/الوسيط.mp4`) مع موشن جرافيك من الهوية، وكابشن، ومؤثرات صوتية، وكارت واتساب في النهاية. الإخراج 2160×3840 بـ 30fps.

```sh
cp "/Users/pro/Desktop/waseet/video/الوسيط.mp4" public/footage/waseet-talk.mp4   # مرة واحدة؛ public/footage خارج git
node scripts/master-voice.mjs   # صوت أنظف وأعلى → public/footage/voice-master.wav
npm run render:reel             # out/waseet-reel-4k.mp4
```

| الملف | الدور |
| --- | --- |
| `src/reel/transcript.ts` | نص الكابشن بالعامية مربوط بتوقيت كل كلمة، وتصحيح أي كلمة يتم هنا |
| `src/reel/reel-data.tsx` | القصّات، ومواقع مشاهد الموشن، والكروت، وتوقيت كل مؤثر صوتي، وكلها مربوطة بكلمات الكلام |
| `src/reel/inserts.tsx` | مشاهد الشرح: الأسعار، الأدوار، التطبيق، لوحة التحكم، الشحن، المحفظة، «كل حاجة في مكان واحد»، المقارنة |
| `src/reel/screens/` | شاشات التطبيق ولوحة التحكم، مبنية بألوان ونصوص المشروعين الحقيقية |
| `src/reel/WhatsAppCard.tsx` | كارت التواصل (الرقم والاسم في `CONTACT`) |
| `scripts/transcribe.mjs` | تفريغ محلي بـ whisper.cpp (large-v3، والموديل في `whisper/` خارج git) |

---

# «وسيط» — النسخة الاحترافية (WaseetPro)

مونتاج `waseet.mp4` (المونتاج اللي فيه لقطات التطبيق ولوحة التحكم). المقاس 2160×3840 بـ 30fps، والتصدير H.264 مع صوت AAC بتردد 48kHz. لقطات تسجيل الشاشة اتشالت، ومكانها موشن بيعيد نفس الخطوات على شاشات مبنية بالكود: موبايل نحيف للتطبيق، ونافذة متصفح للوحة التحكم. الموشن فيه دخول 3D، وطفو هادئ، وزووم على العنصر المهم مع إبرازه، ومؤشر ضغط، وcallouts. مفيش موسيقى؛ صوت المتكلم متنضّف ومستواه حوالي ‎-14 LUFS، والمؤثرات أوطى منه بـ 18 dB أو أكتر.

```sh
node scripts/prepare-pro.mjs ../../waseet.mp4                                   # المصدر وصور المنتج وفريم النهاية → public/footage
node scripts/master-voice-pro.mjs                                                # تنظيف الصوت وضبطه على ‎-14 LUFS ← public/footage/voice-pro.wav
node scripts/transcribe.mjs public/footage/waseet-pro.mp4 src/pro/data/whisper-words.json
npm run sfx:pro                                                                  # المؤثرات ← public/sfx/pro
npm run render:pro                                                               # ← out/waseet-pro-4k.mp4
```

| الملف | الدور |
| --- | --- |
| `src/pro/transcript.ts` | نص الكابشن بالعامية حرفيًا. `*كلمة*` للكلمة المفتاحية، و` / ` لكسر السطر |
| `src/pro/timeline.ts` | القصّة (بتشيل الفريم الأسود عند 38.3 ث)، ومراحل الموشن، وسطور الكابشن |
| `src/pro/scenes.tsx` | الكوريوجرافيا: الكاميرا، والإبراز، ومؤشر الضغط، والـ callouts، وكلها مربوطة بفريمات الكلام |
| `src/pro/screens/` | شاشات التطبيق ولوحة التحكم، منقولة من التسجيل الأصلي بنفس النصوص والأرقام |
| `src/pro/kit.tsx` | الخلفية، وإطار الموبايل والمتصفح، وحامل الكاميرا، والإبراز، والمؤشر، والـ Callout |
| `src/pro/Pro.tsx` | التركيب، وانتقالات المراحل، وجدول المؤثرات (مع منع تكرار نفس المؤثر مرتين ورا بعض) |

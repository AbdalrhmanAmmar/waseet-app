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

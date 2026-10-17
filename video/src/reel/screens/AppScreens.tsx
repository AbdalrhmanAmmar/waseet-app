import {
  mdiAccountOutline,
  mdiArrowRight,
  mdiBellOutline,
  mdiCheck,
  mdiCheckDecagram,
  mdiClipboardCheckOutline,
  mdiHomeVariant,
  mdiKeyboardReturn,
  mdiMapMarkerOutline,
  mdiMotorbike,
  mdiPackageVariantClosed,
  mdiPhone,
  mdiPlusBoxOutline,
  mdiStorefrontOutline,
} from '@mdi/js';
import type { CSSProperties, ReactNode } from 'react';
import { Easing, interpolate, useVideoConfig } from 'remotion';
import { LogoMark } from '../../components/LogoMark';
import { Icon } from '../../components/Text';
import { pop } from '../anim';
import { StatusBar } from '../Phone';
import { C, clamp } from '../theme';

const font: CSSProperties = { fontFamily: 'Tajawal', direction: 'rtl' };

export const STATUS = {
  created: { text: 'تم إنشاء الطلب', fg: C.primary, bg: C.soft },
  preparing: { text: 'قيد التجهيز', fg: '#B86A1E', bg: C.warm },
  courier: { text: 'مع المندوب', fg: '#2F6FA8', bg: '#E6F0FA' },
  delivered: { text: 'تم التسليم', fg: C.primary, bg: C.soft },
};

const Chip = ({ s }: { s: keyof typeof STATUS }) => (
  <span style={{ padding: '5px 11px', borderRadius: 999, background: STATUS[s].bg, color: STATUS[s].fg, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
    {STATUS[s].text}
  </span>
);

const Rise = ({ t, at, children, style }: { t: number; at: number; children: ReactNode; style?: CSSProperties }) => {
  const { fps } = useVideoConfig();
  const p = pop(t, at, fps, 15);
  return <div style={{ opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 24}px)`, ...style }}>{children}</div>;
};

const TabBar = ({ active = 0 }: { active?: number }) => (
  <div
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 84,
      background: C.surface,
      borderTop: `1px solid ${C.border}`,
      display: 'flex',
      justifyContent: 'space-around',
      paddingTop: 12,
      direction: 'rtl',
    }}
  >
    {[
      [mdiHomeVariant, 'الرئيسية'],
      [mdiPackageVariantClosed, 'الطلبات'],
      [mdiStorefrontOutline, 'المنتجات'],
      [mdiAccountOutline, 'حسابي'],
    ].map(([icon, label], i) => (
      <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontFamily: 'Tajawal', fontSize: 12, fontWeight: 700, color: i === active ? C.primary : C.muted }}>
        <Icon path={icon} size={26} color={i === active ? C.primary : C.muted} />
        {label}
      </div>
    ))}
  </div>
);

/** Merchant home: balance card, quick actions, recent orders. */
export const AppHome = ({ t, balance = 12480.5 }: { t: number; balance?: number }) => {
  const value = balance * Easing.out(Easing.cubic)(interpolate(t, [8, 40], [0, 1], clamp));
  return (
    <div style={{ ...font, width: 390, height: 844, background: C.background, position: 'relative' }}>
      <StatusBar />
      <div style={{ padding: '6px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LogoMark size={40} id="home-mark" tile />
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.ink }}>مرحبًا، أحمد</div>
            <div style={{ fontSize: 13, color: C.muted }}>تفاصيل أقل، إنجاز أكثر</div>
          </div>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: C.surface, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <Icon path={mdiBellOutline} size={24} color={C.ink} />
          <span style={{ position: 'absolute', top: 9, right: 10, width: 9, height: 9, borderRadius: 5, background: C.accent }} />
        </div>
      </div>

      <Rise t={t} at={2} style={{ margin: '18px 18px 0' }}>
        <div style={{ borderRadius: 26, padding: '20px 22px', background: `linear-gradient(225deg, ${C.deep}, #19614D)`, color: '#fff', boxShadow: '0 16px 30px rgba(16,62,50,0.25)' }}>
          <div style={{ fontSize: 15, color: C.mint }}>رصيد حسابك</div>
          <div style={{ direction: 'ltr', textAlign: 'right', fontSize: 40, fontWeight: 700, marginTop: 4 }}>
            <span style={{ fontSize: 15, color: C.mint, marginRight: 8 }}>USD</span>
            {value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <div style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 14, background: '#fff', color: C.deep, fontSize: 15, fontWeight: 700 }}>سحب الرصيد</div>
            <div style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 14, background: 'rgba(255,255,255,0.12)', fontSize: 15, fontWeight: 700 }}>كشف الحساب</div>
          </div>
        </div>
      </Rise>

      <div style={{ display: 'flex', gap: 10, margin: '18px 18px 0' }}>
        {[
          [mdiPlusBoxOutline, 'طلب جديد'],
          [mdiPackageVariantClosed, 'الطلبات'],
          [mdiStorefrontOutline, 'المنتجات'],
          [mdiKeyboardReturn, 'المرتجعات'],
        ].map(([icon, label], i) => (
          <Rise key={label} t={t} at={8 + i * 3} style={{ flex: 1 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: '14px 0 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: i === 0 ? C.warm : C.soft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon path={icon} size={24} color={i === 0 ? C.accent : C.primary} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{label}</span>
            </div>
          </Rise>
        ))}
      </div>

      <div style={{ margin: '22px 22px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>آخر الطلبات</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>عرض الكل</span>
      </div>
      {(
        [
          ['#WS-1024', 'محمد سامي · القاهرة', 'courier', '85.00'],
          ['#WS-1023', 'سارة علي · الجيزة', 'delivered', '42.50'],
          ['#WS-1022', 'خالد حسن · الإسكندرية', 'preparing', '120.00'],
        ] as const
      ).map(([id, who, s, amount], i) => (
        <Rise key={id} t={t} at={16 + i * 4} style={{ margin: '0 18px 10px' }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: C.soft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon path={mdiPackageVariantClosed} size={24} color={C.primary} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, direction: 'ltr', textAlign: 'right' }}>{id}</div>
              <div style={{ fontSize: 13, color: C.muted }}>{who}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
              <Chip s={s} />
              <span style={{ fontSize: 13, fontWeight: 700, color: C.ink, direction: 'ltr' }}>${amount}</span>
            </div>
          </div>
        </Rise>
      ))}
      <TabBar />
    </div>
  );
};

const STEPS = [
  { icon: mdiPackageVariantClosed, s: 'created' as const, time: '10:12 ص' },
  { icon: mdiClipboardCheckOutline, s: 'preparing' as const, time: '10:40 ص' },
  { icon: mdiMotorbike, s: 'courier' as const, time: '12:05 م' },
  { icon: mdiCheckDecagram, s: 'delivered' as const, time: '1:30 م' },
];

/** Order tracking: stylised map, live route and status timeline. `progress` 0..3 steps. */
export const AppTrack = ({ t }: { t: number }) => {
  const { fps } = useVideoConfig();
  const progress = interpolate(t, [14, 90], [0, 3], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const route = interpolate(t, [6, 90], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const ROUTE = 'M300 170 C 250 150, 240 90, 180 96 S 100 60, 80 40';
  return (
    <div style={{ ...font, width: 390, height: 844, background: C.background, position: 'relative' }}>
      <StatusBar />
      <div style={{ padding: '4px 20px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 13, background: C.surface, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon path={mdiArrowRight} size={22} color={C.ink} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.ink }}>تتبع الطلب</div>
        <div style={{ marginRight: 'auto', fontSize: 15, fontWeight: 700, color: C.primary, direction: 'ltr' }}>#WS-1024</div>
      </div>
      <div style={{ margin: '0 18px', height: 220, borderRadius: 24, overflow: 'hidden', position: 'relative', background: '#E3EFE8', border: `1px solid ${C.border}` }}>
        <svg width={354} height={220} viewBox="0 0 354 220" style={{ position: 'absolute' }}>
          {[30, 75, 120, 165, 210].map((y) => (
            <path key={y} d={`M0 ${y} Q 177 ${y + 18} 354 ${y - 10}`} stroke="#fff" strokeWidth={9} fill="none" opacity={0.85} />
          ))}
          {[50, 140, 230, 310].map((x) => (
            <path key={x} d={`M${x} 0 Q ${x + 14} 110 ${x - 10} 220`} stroke="#fff" strokeWidth={7} fill="none" opacity={0.75} />
          ))}
          <rect x={200} y={120} width={70} height={50} rx={10} fill="#CFE5D9" />
          <rect x={30} y={130} width={60} height={60} rx={10} fill="#CFE5D9" />
          <path d={ROUTE} stroke={C.primary} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.25} />
          <path d={ROUTE} stroke={C.primary} strokeWidth={6} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${route} 1`} />
          <circle cx={80} cy={40} r={10} fill={C.accent} stroke="#fff" strokeWidth={4} />
        </svg>
        <div style={{ position: 'absolute', left: 14, bottom: 14, padding: '8px 12px', borderRadius: 14, background: C.surface, fontSize: 13, fontWeight: 700, color: C.ink, display: 'flex', gap: 6, alignItems: 'center', boxShadow: '0 6px 16px rgba(0,0,0,0.08)' }}>
          <Icon path={mdiMapMarkerOutline} size={18} color={C.accent} />
          مدينة نصر، القاهرة
        </div>
      </div>

      <div style={{ margin: '16px 18px 0', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, padding: '18px 18px 6px' }}>
        {STEPS.map((st, i) => {
          const done = progress >= i;
          const current = Math.floor(progress) === i;
          const check = pop(t, 14 + (i * 76) / 3, fps, 10);
          const fill = interpolate(progress, [i, i + 1], [0, 1], clamp);
          return (
            <div key={st.s} style={{ display: 'flex', gap: 14, position: 'relative', paddingBottom: i < 3 ? 22 : 12 }}>
              {i < 3 && (
                <div style={{ position: 'absolute', right: 19, top: 42, width: 3, height: 'calc(100% - 44px)', background: C.border, borderRadius: 2 }}>
                  <div style={{ width: '100%', height: `${fill * 100}%`, background: C.primary, borderRadius: 2 }} />
                </div>
              )}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  background: done ? C.primary : C.soft,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `scale(${done ? 0.8 + 0.2 * Math.min(1.2, check) : 0.9})`,
                  boxShadow: current && i < 3 ? `0 0 0 ${6 + 4 * Math.sin(t / 5)}px rgba(20,125,100,0.15)` : undefined,
                }}
              >
                <Icon path={done ? (i === 3 ? mdiCheck : st.icon) : st.icon} size={22} color={done ? '#fff' : C.muted} />
              </div>
              <div style={{ flex: 1, paddingTop: 2 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: done ? C.ink : C.muted }}>{STATUS[st.s].text}</div>
                <div style={{ fontSize: 13, color: C.muted }}>{done ? st.time : 'في الانتظار'}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ margin: '14px 18px 0', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 46, height: 46, borderRadius: 23, background: C.warm, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon path={mdiMotorbike} size={26} color={C.accent} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>محمود · مندوب التوصيل</div>
          <div style={{ fontSize: 13, color: C.muted }}>على بُعد 1.2 كم</div>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon path={mdiPhone} size={22} color="#fff" />
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value, typed, focus }: { label: string; value: string; typed: number; focus: boolean }) => {
  const n = Math.round(value.length * typed);
  return (
    <div style={{ margin: '0 18px 14px' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 6 }}>{label}</div>
      <div
        style={{
          height: 50,
          borderRadius: 16,
          background: C.surface,
          border: `1.5px solid ${focus ? C.primary : C.border}`,
          boxShadow: focus ? '0 0 0 4px rgba(20,125,100,0.12)' : undefined,
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          fontSize: 16,
          color: C.ink,
        }}
      >
        {value.slice(0, n)}
        {focus && <span style={{ width: 2, height: 22, background: C.primary, marginRight: 2 }} />}
      </div>
    </div>
  );
};

/** Create order form that fills itself, then the submit button gets pressed. */
export const AppCreateOrder = ({ t }: { t: number }) => {
  const { fps } = useVideoConfig();
  const fields = [
    { label: 'اسم العميل', value: 'محمد سامي', from: 6, to: 22 },
    { label: 'رقم الهاتف', value: '01012345678', from: 24, to: 40 },
    { label: 'المحافظة / المدينة', value: 'القاهرة · مدينة نصر', from: 42, to: 56 },
    { label: 'المنتج', value: 'سماعة لاسلكية × 2', from: 58, to: 70 },
  ];
  const press = interpolate(t, [76, 80, 86], [1, 0.94, 1], clamp);
  const done = pop(t, 84, fps, 10);
  return (
    <div style={{ ...font, width: 390, height: 844, background: C.background, position: 'relative' }}>
      <StatusBar />
      <div style={{ padding: '4px 20px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 13, background: C.surface, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon path={mdiArrowRight} size={22} color={C.ink} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.ink }}>إنشاء طلب جديد</div>
      </div>
      {fields.map((f) => (
        <Field key={f.label} label={f.label} value={f.value} typed={interpolate(t, [f.from, f.to], [0, 1], clamp)} focus={t >= f.from && t < f.to + 2} />
      ))}
      <div style={{ margin: '4px 18px 0', background: C.warm, borderRadius: 18, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', fontSize: 15, color: C.ink }}>
        <span>إجمالي التحصيل</span>
        <span style={{ fontWeight: 700, direction: 'ltr' }}>$85.00</span>
      </div>
      <div
        style={{
          margin: '22px 18px 0',
          height: 56,
          borderRadius: 18,
          background: `linear-gradient(90deg, ${C.primary}, #126B57)`,
          color: '#fff',
          fontSize: 18,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${press})`,
          boxShadow: '0 12px 24px rgba(20,125,100,0.3)',
        }}
      >
        إنشاء الطلب
      </div>
      {done > 0.01 && (
        <div style={{ position: 'absolute', inset: 0, background: `rgba(248,250,247,${Math.min(0.94, done)})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ width: 110, height: 110, borderRadius: 55, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${done})`, boxShadow: `0 0 0 ${18 * done}px rgba(20,125,100,0.12)` }}>
            <Icon path={mdiCheck} size={64} color="#fff" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.ink, opacity: done }}>تم إنشاء الطلب</div>
          <div style={{ fontSize: 16, color: C.muted, opacity: done, direction: 'ltr' }}>#WS-1025</div>
        </div>
      )}
    </div>
  );
};

const PRODUCTS = [
  { name: 'سماعة لاسلكية', icon: 'M12,1C7,1 3,5 3,10V17A3,3 0 0,0 6,20H9V12H5V10A7,7 0 0,1 12,3A7,7 0 0,1 19,10V12H15V20H18A3,3 0 0,0 21,17V10C21,5 16.97,1 12,1Z', merchant: 120, suggested: 150, tint: C.warm },
  { name: 'ساعة ذكية', icon: 'M6,0H18V4.5A6.5,6.5 0 0,1 18,19.5V24H6V19.5A6.5,6.5 0 0,1 6,4.5V0M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z', merchant: 85, suggested: 110, tint: C.soft },
  { name: 'شاحن سريع', icon: 'M11,9.47V11H14.76L13,14.53V13H9.24L11,9.47M13,1L6,15H11V23L18,9H13V1Z', merchant: 18, suggested: 25, tint: '#E6F0FA' },
  { name: 'حقيبة لابتوب', icon: 'M20,6H16V4A2,2 0 0,0 14,2H10A2,2 0 0,0 8,4V6H4A2,2 0 0,0 2,8V19A2,2 0 0,0 4,21H20A2,2 0 0,0 22,19V8A2,2 0 0,0 20,6M10,4H14V6H10V4Z', merchant: 40, suggested: 55, tint: C.warm },
];

/** Product catalog with merchant price vs suggested price; the first product gets picked. */
export const AppProducts = ({ t, pickAt = 14 }: { t: number; pickAt?: number }) => {
  const { fps } = useVideoConfig();
  const picked = t >= pickAt;
  const tap = interpolate(t, [pickAt - 3, pickAt, pickAt + 4], [1, 0.95, 1], clamp);
  const badge = pop(t, pickAt + 2, fps, 9);
  return (
    <div style={{ ...font, width: 390, height: 844, background: C.background, position: 'relative' }}>
      <StatusBar />
      <div style={{ padding: '4px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.ink }}>المنتجات</div>
        <div style={{ position: 'relative', width: 44, height: 44, borderRadius: 14, background: C.surface, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon path={mdiPackageVariantClosed} size={24} color={C.ink} />
          {picked && (
            <span style={{ position: 'absolute', top: -6, left: -6, width: 22, height: 22, borderRadius: 11, background: C.accent, color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${badge})` }}>1</span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '0 18px' }}>
        {PRODUCTS.map((p, i) => (
          <Rise key={p.name} t={t} at={i * 3} style={{ width: 171 }}>
            <div
              style={{
                background: C.surface,
                border: `1.5px solid ${i === 0 && picked ? C.primary : C.border}`,
                borderRadius: 20,
                padding: 10,
                transform: i === 0 ? `scale(${tap})` : undefined,
                boxShadow: i === 0 && picked ? '0 0 0 4px rgba(20,125,100,0.12)' : undefined,
              }}
            >
              <div style={{ height: 120, borderRadius: 14, background: p.tint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon path={p.icon} size={60} color={i % 2 ? C.primary : C.accent} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginTop: 8 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>سعرك ${p.merchant} · المقترح ${p.suggested}</div>
              <div
                style={{
                  marginTop: 8,
                  height: 34,
                  borderRadius: 11,
                  background: i === 0 && picked ? C.primary : C.soft,
                  color: i === 0 && picked ? '#fff' : C.primary,
                  fontSize: 14,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                {i === 0 && picked ? <><Icon path={mdiCheck} size={16} color="#fff" />أُضيف للطلب</> : 'أضف للطلب'}
              </div>
            </div>
          </Rise>
        ))}
      </div>
      <TabBar active={2} />
    </div>
  );
};

/** Wallet: delivered order → profit lands in the balance → withdrawal request → approved. */
export const AppWallet = ({ t, creditAt, requestAt, approvedAt }: { t: number; creditAt: number; requestAt: number; approvedAt: number }) => {
  const { fps } = useVideoConfig();
  const credited = Easing.out(Easing.cubic)(interpolate(t, [creditAt, creditAt + 18], [0, 1], clamp));
  const balance = 1250 + 30 * credited;
  const toast = pop(t, creditAt - 16, fps, 12);
  const toastOut = interpolate(t, [creditAt + 30, creditAt + 40], [0, 1], clamp);
  const coin = interpolate(t, [creditAt - 4, creditAt + 6], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const press = interpolate(t, [requestAt - 4, requestAt, requestAt + 4], [1, 0.94, 1], clamp);
  const sheet = pop(t, requestAt + 2, fps, 14);
  const approved = t >= approvedAt;
  const approvedPop = pop(t, approvedAt, fps, 9);
  return (
    <div style={{ ...font, width: 390, height: 844, background: C.background, position: 'relative', overflow: 'hidden' }}>
      <StatusBar />
      <div style={{ padding: '4px 20px 14px', fontSize: 22, fontWeight: 700, color: C.ink }}>محفظتي</div>
      <div style={{ margin: '0 18px', borderRadius: 26, padding: '22px', background: `linear-gradient(225deg, ${C.deep}, #19614D)`, color: '#fff', position: 'relative' }}>
        <div style={{ fontSize: 15, color: C.mint }}>أرباحك المتاحة</div>
        <div style={{ direction: 'ltr', textAlign: 'right', fontSize: 44, fontWeight: 700, marginTop: 4, transform: `scale(${1 + 0.06 * Math.sin(Math.min(1, credited) * Math.PI)})`, transformOrigin: '100% 50%' }}>
          <span style={{ fontSize: 16, color: C.mint, marginRight: 8 }}>USD</span>
          {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        {credited > 0 && (
          <div style={{ position: 'absolute', left: 22, top: 22, padding: '6px 12px', borderRadius: 999, background: C.accent, fontSize: 15, fontWeight: 700, direction: 'ltr', opacity: Math.min(1, credited * 3) }}>+$30.00</div>
        )}
        <div style={{ marginTop: 16, height: 50, borderRadius: 16, background: '#fff', color: C.deep, fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${press})` }}>طلب سحب الأرباح</div>
      </div>
      <div style={{ margin: '22px 22px 10px', fontSize: 17, fontWeight: 700, color: C.ink }}>آخر الحركات</div>
      {[
        ['عمولة طلب #WS-1025', '+$30.00', credited > 0],
        ['عمولة طلب #WS-1019', '+$45.00', true],
        ['سحب أرباح', '-$600.00', true],
      ].map(([label, amount, show], i) => (
        <div key={i} style={{ margin: '0 18px 10px', padding: '14px 16px', borderRadius: 18, background: C.surface, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', opacity: show ? 1 : 0.35 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{label}</span>
          <span style={{ fontSize: 15, fontWeight: 700, direction: 'ltr', color: String(amount).startsWith('+') ? C.primary : C.danger }}>{amount}</span>
        </div>
      ))}

      {/* "order delivered" toast + coin flying into the balance */}
      {toast > 0.01 && toastOut < 1 && (
        <div style={{ position: 'absolute', top: 60, left: 18, right: 18, padding: '14px 16px', borderRadius: 18, background: C.ink, color: '#fff', display: 'flex', alignItems: 'center', gap: 12, transform: `translateY(${(1 - toast) * -120 - toastOut * 120}px)`, boxShadow: '0 16px 30px rgba(0,0,0,0.25)' }}>
          <div style={{ width: 38, height: 38, borderRadius: 19, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon path={mdiCheck} size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>تم تسليم الطلب #WS-1025</div>
            <div style={{ fontSize: 13, color: C.mint }}>عمولتك اتضافت لمحفظتك</div>
          </div>
        </div>
      )}
      {coin > 0 && coin < 1 && (
        <div style={{ position: 'absolute', left: 60 + coin * 40, top: 110 + coin * 60, width: 40, height: 40, borderRadius: 20, background: `radial-gradient(circle at 35% 35%, #FFD9A8, ${C.accent})`, boxShadow: '0 0 20px rgba(242,154,74,0.7)', opacity: 1 - coin * 0.3 }} />
      )}

      {/* withdrawal sheet */}
      {sheet > 0.01 && (
        <>
          <div style={{ position: 'absolute', inset: 0, background: `rgba(16,30,25,${0.35 * Math.min(1, sheet)})` }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 360, borderRadius: '30px 30px 0 0', background: C.surface, transform: `translateY(${(1 - sheet) * 360}px)`, padding: '26px 22px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 90, height: 90, borderRadius: 45, background: approved ? C.primary : C.warm, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${approved ? approvedPop : 1})` }}>
              <Icon path={approved ? mdiCheck : mdiClipboardCheckOutline} size={50} color={approved ? '#fff' : C.accent} />
            </div>
            <div style={{ marginTop: 16, fontSize: 22, fontWeight: 700, color: C.ink }}>{approved ? 'تمت الموافقة على السحب' : 'طلب السحب قيد المراجعة'}</div>
            <div style={{ marginTop: 6, fontSize: 15, color: C.muted }}>{approved ? 'هيوصلك المبلغ قريبًا' : 'الإدارة بتراجع طلبك دلوقتي'}</div>
            <div style={{ marginTop: 18, fontSize: 32, fontWeight: 700, color: C.ink, direction: 'ltr' }}>$1,280.00</div>
          </div>
        </>
      )}
    </div>
  );
};

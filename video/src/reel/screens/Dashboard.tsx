import {
  mdiAccountGroupOutline,
  mdiCashMultiple,
  mdiChartDonut,
  mdiCheckDecagram,
  mdiMagnify,
  mdiMapMarkerRadiusOutline,
  mdiPackageVariantClosed,
  mdiStorefrontOutline,
  mdiTagMultipleOutline,
  mdiViewDashboardOutline,
} from '@mdi/js';
import { Easing, interpolate, useVideoConfig } from 'remotion';
import { LogoMark } from '../../components/LogoMark';
import { Icon } from '../../components/Text';
import { pop } from '../anim';
import { clamp, D } from '../theme';

export const DASH_W = 1280;
export const DASH_H = 700;

// Labels mirror ../../dashboard (SmartSidebar + Dashboard page).
const NAV = [
  [mdiViewDashboardOutline, 'لوحة التحكم'],
  [mdiPackageVariantClosed, 'إدارة الطلبات'],
  [mdiStorefrontOutline, 'إدارة المنتجات'],
  [mdiAccountGroupOutline, 'إدارة المستخدمين'],
  [mdiMapMarkerRadiusOutline, 'مناطق التوصيل'],
  [mdiTagMultipleOutline, 'قوائم الأسعار'],
];

export const KPIS = [
  { icon: mdiPackageVariantClosed, label: 'إجمالي الطلبات', value: 1284, fmt: (v: number) => Math.round(v).toLocaleString('en-US'), tone: D.primary },
  { icon: mdiCheckDecagram, label: 'الطلبات المسلّمة', value: 1102, fmt: (v: number) => Math.round(v).toLocaleString('en-US'), tone: D.success },
  { icon: mdiCashMultiple, label: 'الإيرادات المسلّمة', value: 48920, fmt: (v: number) => `$${Math.round(v).toLocaleString('en-US')}`, tone: D.warning },
  { icon: mdiChartDonut, label: 'معدل التسليم', value: 86, fmt: (v: number) => `${Math.round(v)}%`, tone: D.info },
];

const SERIES = [32, 40, 36, 52, 48, 61, 58, 72, 69, 84, 80, 96];

const ROWS = [
  ['#WS-1024', 'متجر النور', 'القاهرة', 'مع المندوب', D.info],
  ['#WS-1023', 'بيت الأناقة', 'الجيزة', 'تم التسليم', D.success],
  ['#WS-1022', 'تك ستور', 'الإسكندرية', 'قيد التجهيز', D.warning],
  ['#WS-1021', 'متجر النور', 'المنصورة', 'تم التسليم', D.success],
] as const;

const LIVE_STEPS = [
  ['تم الإنشاء', D.primary],
  ['قيد التجهيز', D.warning],
  ['مع المندوب', D.info],
  ['تم التسليم', D.success],
] as const;

/** `live` (0..3) adds the merchant's new order on top of the table and walks it through its statuses. */
export const Dashboard = ({ t, live }: { t: number; live?: number }) => {
  const { fps } = useVideoConfig();
  const count = Easing.out(Easing.cubic)(interpolate(t, [10, 46], [0, 1], clamp));
  const draw = interpolate(t, [18, 70], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const W = 560;
  const H = 190;
  const pts = SERIES.map((v, i) => [(i / (SERIES.length - 1)) * W, H - (v / 100) * H]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const donut = [
    { v: 0.62, c: D.success },
    { v: 0.2, c: D.info },
    { v: 0.13, c: D.warning },
    { v: 0.05, c: D.danger },
  ];
  let acc = 0;

  return (
    <div style={{ width: DASH_W, height: DASH_H, background: D.bg, display: 'flex', direction: 'rtl', fontFamily: 'Tajawal', color: D.fg }}>
      <div style={{ width: 250, background: D.sidebar, borderLeft: `1px solid ${D.border}`, padding: '22px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 26 }}>
          <LogoMark size={40} id="dash-mark" tile />
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>الوسيط الذكي</div>
            <div style={{ fontSize: 12, color: D.muted }}>مدير النظام</div>
          </div>
        </div>
        {NAV.map(([icon, label], i) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 12px',
              borderRadius: 12,
              marginBottom: 4,
              background: i === 0 ? D.primarySoft : 'transparent',
              color: i === 0 ? D.primary : D.fgSoft,
              fontSize: 15,
              fontWeight: i === 0 ? 700 : 500,
              opacity: interpolate(t, [i * 2, i * 2 + 8], [0, 1], clamp),
            }}
          >
            <Icon path={icon} size={22} color={i === 0 ? D.primary : D.muted} />
            {label}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, padding: '20px 26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 700 }}>لوحة التحكم</div>
            <div style={{ fontSize: 14, color: D.muted }}>نظرة شاملة على أداء المنصة والطلبات والأرباح</div>
          </div>
          <div style={{ width: 260, height: 42, borderRadius: 12, background: D.card, border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', color: D.muted, fontSize: 14 }}>
            <Icon path={mdiMagnify} size={20} color={D.muted} />
            ابحث في القائمة...
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 18 }}>
          {KPIS.map((k, i) => {
            const p = pop(t, 4 + i * 4, fps, 14);
            return (
              <div key={k.label} style={{ flex: 1, background: D.card, border: `1px solid ${D.border}`, borderRadius: 16, padding: '14px 16px', opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 20}px)` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: D.muted }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `${k.tone}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon path={k.icon} size={19} color={k.tone} />
                  </div>
                  {k.label}
                </div>
                <div style={{ fontSize: 30, fontWeight: 700, marginTop: 8, direction: 'ltr', textAlign: 'right' }}>{k.fmt(k.value * count)}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 14 }}>
          <div style={{ flex: 1.7, background: D.card, border: `1px solid ${D.border}`, borderRadius: 16, padding: '14px 18px' }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>الطلبات المنشأة</div>
            <div style={{ fontSize: 12, color: D.muted, marginBottom: 10 }}>كل الطلبات خلال الفترة</div>
            <svg width={W} height={H + 10} style={{ direction: 'ltr', display: 'block' }}>
              <defs>
                <linearGradient id="dash-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={D.primary} stopOpacity={0.28} />
                  <stop offset="1" stopColor={D.primary} stopOpacity={0} />
                </linearGradient>
                <clipPath id="dash-clip">
                  <rect width={W * draw} height={H + 10} />
                </clipPath>
              </defs>
              {[0.25, 0.5, 0.75].map((g) => (
                <line key={g} x1={0} x2={W} y1={H * g} y2={H * g} stroke={D.divider} />
              ))}
              <g clipPath="url(#dash-clip)">
                <path d={`${line} L${W} ${H} L0 ${H} Z`} fill="url(#dash-area)" />
                <path d={line} fill="none" stroke={D.primary} strokeWidth={3.5} strokeLinejoin="round" />
              </g>
              {draw > 0.98 && <circle cx={pts.at(-1)![0] - 4} cy={pts.at(-1)![1] + 4} r={6} fill="#F29A4A" stroke="#fff" strokeWidth={3} />}
            </svg>
          </div>
          <div style={{ flex: 1, background: D.card, border: `1px solid ${D.border}`, borderRadius: 16, padding: '14px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ alignSelf: 'stretch', fontSize: 16, fontWeight: 700 }}>معدل التسليم</div>
            <svg width={170} height={170} viewBox="-1 -1 2 2" style={{ marginTop: 14, transform: 'rotate(-90deg)' }}>
              {donut.map((d, i) => {
                const start = acc;
                acc += d.v;
                const len = Math.max(0, Math.min(d.v, draw - start));
                return <circle key={i} r={0.78} fill="none" stroke={d.c} strokeWidth={0.32} pathLength={1} strokeDasharray={`${len} 1`} strokeDashoffset={-start} />;
              })}
            </svg>
            <div style={{ marginTop: -112, fontSize: 30, fontWeight: 700, direction: 'ltr' }}>{Math.round(86 * count)}%</div>
          </div>
        </div>

        <div style={{ marginTop: 14, background: D.card, border: `1px solid ${D.border}`, borderRadius: 16, padding: '6px 18px' }}>
          {live !== undefined && (() => {
            const [label, tone] = LIVE_STEPS[Math.min(3, Math.floor(live))];
            return (
              <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', margin: '6px -12px 0', borderRadius: 12, background: `${tone}14`, boxShadow: `inset 0 0 0 2px ${tone}55`, fontSize: 15 }}>
                <span style={{ width: 120, fontWeight: 700, direction: 'ltr', textAlign: 'right' }}>#WS-1025</span>
                <span style={{ flex: 1, fontWeight: 700 }}>متجر النور</span>
                <span style={{ flex: 1, color: D.muted }}>مدينة نصر</span>
                <span style={{ padding: '4px 12px', borderRadius: 999, background: tone, color: '#fff', fontWeight: 700, fontSize: 13 }}>{label}</span>
              </div>
            );
          })()}
          {ROWS.slice(0, live === undefined ? 4 : 3).map(([id, shop, city, status, tone], i) => (
            <div
              key={id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: i < ROWS.length - 1 ? `1px solid ${D.divider}` : undefined,
                fontSize: 15,
                opacity: interpolate(t, [30 + i * 4, 40 + i * 4], [0, 1], clamp),
              }}
            >
              <span style={{ width: 120, fontWeight: 700, direction: 'ltr', textAlign: 'right' }}>{id}</span>
              <span style={{ flex: 1 }}>{shop}</span>
              <span style={{ flex: 1, color: D.muted }}>{city}</span>
              <span style={{ padding: '4px 12px', borderRadius: 999, background: `${tone}1A`, color: tone, fontWeight: 700, fontSize: 13 }}>{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

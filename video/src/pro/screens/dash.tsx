import {
  mdiAlertCircleOutline,
  mdiArrowLeft,
  mdiArrowRight,
  mdiBellOutline,
  mdiCartOutline,
  mdiCheck,
  mdiCheckCircle,
  mdiCheckCircleOutline,
  mdiCloseCircleOutline,
  mdiCubeOutline,
  mdiCurrencyUsd,
  mdiFileDocumentOutline,
  mdiImagePlusOutline,
  mdiInformationOutline,
  mdiLinkVariant,
  mdiMapMarkerOutline,
  mdiMinus,
  mdiMotorbike,
  mdiPencilOutline,
  mdiPlus,
  mdiRefresh,
  mdiShieldCheckOutline,
  mdiStorefrontOutline,
  mdiTrendingUp,
  mdiTruckFastOutline,
} from '@mdi/js';
import type { CSSProperties } from 'react';
import { Img, staticFile } from 'remotion';
import { Icon } from '../../components/Text';
import { count, lerp, press, prog, sp, typed } from '../motion';
import { C, D, FONT, OUT } from '../theme';

export const DW = 760;
export const DH = 958;

const base: CSSProperties = { position: 'absolute', inset: 0, background: D.bg, fontFamily: FONT, direction: 'rtl', color: D.fg, overflow: 'hidden' };
const abs = (s: CSSProperties): CSSProperties => ({ position: 'absolute', ...s });
const card: CSSProperties = { position: 'absolute', background: '#fff', border: `1px solid ${D.border}`, borderRadius: 22, boxShadow: '0 2px 8px rgba(16,62,50,0.04)' };

const Tile = ({ path, tone = D.primary, size = 46 }: { path: string; tone?: string; size?: number }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.3, background: `${tone}17`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <Icon path={path} size={size * 0.55} color={tone} />
  </div>
);

/** Sticky app bar of the dashboard (title on the right, currency switch + avatar on the left). */
const AppBar = ({ title, back = false }: { title: string; back?: boolean }) => (
  <div style={abs({ top: 0, left: 0, right: 0, height: 66, background: '#fff', borderBottom: `1px solid ${D.divider}`, display: 'flex', alignItems: 'center', padding: '0 22px', gap: 12, zIndex: 8 })}>
    {back && (
      <div style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon path={mdiArrowRight} size={22} color={D.fg} />
      </div>
    )}
    <div style={{ fontSize: 21, fontWeight: 800 }}>{title}</div>
    <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 12, direction: 'ltr' }}>
      <div style={{ width: 42, height: 42, borderRadius: 13, background: D.primary, color: '#fff', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>AM</div>
      <div style={{ height: 40, borderRadius: 12, border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', fontSize: 13, fontWeight: 800, color: D.primary }}>
        USD
        <div style={{ width: 46, height: 24, borderRadius: 12, background: '#E3EFE9', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 3, top: 3, width: 18, height: 18, borderRadius: 9, background: D.primary }} />
        </div>
        <span style={{ color: D.muted }}>SYP</span>
      </div>
      <div style={{ width: 42, height: 42, borderRadius: 13, border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon path={mdiBellOutline} size={22} color={D.fgSoft} />
      </div>
    </div>
  </div>
);

const Toast = ({ f, at, text, sub }: { f: number; at: number; text: string; sub?: string }) => {
  if (f < at) return null;
  const p = sp(f, at, 15);
  return (
    <div style={abs({ left: 24, bottom: 24, width: 330, padding: '16px 18px', borderRadius: 18, background: '#10241D', color: '#fff', display: 'flex', alignItems: 'center', gap: 14, zIndex: 30, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 40}px)` })}>
      <div style={{ width: 40, height: 40, borderRadius: 20, background: D.success, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon path={mdiCheck} size={24} color="#fff" />
      </div>
      <div>
        <div style={{ fontSize: 17, fontWeight: 800 }}>{text}</div>
        {sub && <div style={{ fontSize: 13.5, color: '#BFE3D5' }}>{sub}</div>}
      </div>
    </div>
  );
};

// ─── 1 · overview ───────────────────────────────────────────────────────────

export const DASH_HOME = { add: { x: 130, y: 154 } };

const BARS = [2, 0, 5, 1, 0, 7, 3, 0, 4, 9, 2, 0, 15, 6, 8, 1, 0, 5, 3, 0, 2, 8, 4, 0, 6, 2, 1, 3, 0, 2];

export const DashHome = ({ f, addAt }: { f: number; addAt: number }) => {
  const k = (v: number) => count(f, v, 4, 34);
  const grow = prog(f, 6, 40, OUT);
  return (
    <div style={base}>
      <AppBar title="لوحة التحكم" />
      <div style={{ ...card, top: 84, left: 20, right: 20, height: 150, background: 'linear-gradient(120deg, #FFFFFF 40%, #EAF6F0 100%)', overflow: 'hidden' }}>
        <div style={abs({ top: 22, right: 24, fontSize: 15, fontWeight: 700, color: D.primary })}>مرحبًا بك</div>
        <div style={abs({ top: 48, right: 24, fontSize: 29, fontWeight: 800 })}>مرحبًا بك في الوسيط الذكي</div>
        <div style={abs({ top: 96, right: 24, fontSize: 15, color: D.muted })}>تابع أداء المنصة والطلبات والمخزون من مكان واحد</div>
        <div style={abs({ top: 44, left: 24, height: 52, padding: '0 22px', borderRadius: 16, background: D.primary, color: '#fff', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 10px 22px rgba(12,135,107,0.3)', transform: `scale(${press(f, addAt)})` })}>
          <Icon path={mdiPlus} size={22} color="#fff" />
          إضافة منتج
        </div>
      </div>
      {(
        [
          [mdiCartOutline, 'إجمالي الطلبات', `${Math.round(k(105))}`, 'كل الطلبات خلال الفترة'],
          [mdiCheckCircleOutline, 'الطلبات المسلّمة', `${Math.round(k(20))}`, 'معدل التسليم 19.0%'],
          [mdiCurrencyUsd, 'الإيرادات المكتملة', `$${Math.round(k(3458)).toLocaleString('en-US')}`, 'من الطلبات المسلّمة'],
          [mdiTrendingUp, 'أرباح المنصة', `$${Math.round(k(350))}`, '10% من الإيرادات'],
          [mdiStorefrontOutline, 'أرباح التجار', `$${Math.round(k(241))}`, '7.0% من الإيرادات'],
          [mdiAlertCircleOutline, 'طلبات انضمام', `${Math.round(k(14))}`, 'بانتظار المراجعة'],
        ] as const
      ).map(([icon, label, value, sub], i) => {
        const p = sp(f, 2 + i * 2, 16);
        return (
          <div key={label} style={{ ...card, top: 252 + Math.floor(i / 3) * 142, right: 20 + (i % 3) * 245, width: 229, height: 128, opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 18}px)` }}>
            <div style={abs({ top: 18, right: 18, fontSize: 15, fontWeight: 700, color: D.fgSoft })}>{label}</div>
            <div style={abs({ top: 46, right: 18, fontSize: 30, fontWeight: 800, direction: 'ltr' })}>{value}</div>
            <div style={abs({ top: 92, right: 18, fontSize: 12.5, fontWeight: 700, color: D.primary })}>{sub}</div>
            <div style={abs({ top: 20, left: 18 })}>
              <Tile path={icon} tone={i === 5 ? D.warning : D.primary} size={44} />
            </div>
          </div>
        );
      })}
      <div style={{ ...card, top: 552, left: 20, right: 20, height: 380 }}>
        <div style={abs({ top: 20, right: 24, fontSize: 20, fontWeight: 800 })}>الإيرادات والأرباح خلال آخر 30 يومًا</div>
        <div style={abs({ top: 50, right: 24, fontSize: 14, color: D.muted })}>متابعة الطلبات المكتملة والعائد المالي</div>
        <div style={abs({ top: 22, left: 24, padding: '6px 14px', borderRadius: 12, border: `1px solid ${D.border}`, fontSize: 13.5, color: D.fgSoft })}>آخر 30 يوم</div>
        <svg width={680} height={250} style={abs({ top: 96, left: 40, direction: 'ltr' })}>
          {[0, 1, 2, 3].map((g) => (
            <line key={g} x1={0} x2={680} y1={20 + g * 70} y2={20 + g * 70} stroke={D.divider} />
          ))}
          {BARS.map((v, i) => {
            const h = (v / 15) * 200 * grow;
            return <rect key={i} x={10 + i * 22.4} y={230 - h} width={10} height={h} rx={3} fill={i % 7 === 3 ? D.primary : '#5B9BD5'} opacity={0.9} />;
          })}
          <path
            d={BARS.map((v, i) => `${i ? 'L' : 'M'}${15 + i * 22.4} ${230 - (v / 15) * 170 * grow - 6}`).join(' ')}
            fill="none"
            stroke={D.success}
            strokeWidth={3}
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={`${prog(f, 12, 46)} 1`}
          />
        </svg>
      </div>
    </div>
  );
};

// ─── 2 · add product ────────────────────────────────────────────────────────

export const ADD = {
  scrollTo: 560,
  name: { x: 44, y: 210, w: 672, h: 54 },
  pricing: { x: 20, y: 722, w: 720, h: 222 },
  fields: [
    { x: 506, y: 806, w: 210, h: 56 }, // السعر الأصلي (right)
    { x: 276, y: 806, w: 210, h: 56 }, // سعر البيع للتاجر
    { x: 44, y: 806, w: 212, h: 56 }, // سعر البيع المتوقع للعميل (left)
  ],
  preview: { x: 20, y: 964, w: 720, h: 420 },
  publish: { x: 140, y: 916 },
};

const PriceField = ({ f, label, value, from, x, hint }: { f: number; label: string; value: string; from: number; x: number; hint?: string }) => {
  const v = typed(f, value, from, from + 6);
  const focus = f >= from - 3 && f < from + 12;
  const done = v === value;
  return (
    <>
      <div style={abs({ top: 776, left: x, width: 210, textAlign: 'right', fontSize: 15, fontWeight: 800 })}>
        {label} <span style={{ color: D.danger }}>*</span>
      </div>
      <div
        style={abs({
          top: 806,
          left: x,
          width: 210,
          height: 56,
          borderRadius: 16,
          background: '#fff',
          border: `1.5px solid ${focus ? D.primary : D.border}`,
          boxShadow: focus ? '0 0 0 4px rgba(12,135,107,0.13)' : undefined,
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          gap: 8,
          direction: 'ltr',
          boxSizing: 'border-box',
          fontSize: 22,
          fontWeight: 800,
        })}
      >
        <span style={{ color: D.muted, fontSize: 16, fontWeight: 700 }}>$</span>
        <span style={{ display: 'inline-block', transform: done ? `scale(${lerp(1.18, 1, sp(f, from + 6, 12))})` : undefined, transformOrigin: 'left center' }}>{v}</span>
        {focus && <span style={{ width: 2, height: 24, background: D.primary, opacity: Math.floor(f / 8) % 2 ? 0.25 : 1 }} />}
      </div>
      {hint && <div style={abs({ top: 870, left: x, width: 210, textAlign: 'right', fontSize: 12, color: D.muted })}>{hint}</div>}
    </>
  );
};

/** Add product: name → photos → (scroll) → 3 prices typed on cue → live preview with the price chain → publish. */
export const AddProduct = ({
  f,
  nameFrom,
  photosAt,
  scrollAt,
  p1,
  p2,
  p3,
  publishAt,
}: {
  f: number;
  nameFrom: number;
  photosAt: number;
  scrollAt: number;
  p1: number;
  p2: number;
  p3: number;
  publishAt: number;
}) => {
  const scroll = prog(f, scrollAt, scrollAt + 20) * ADD.scrollTo;
  const name = typed(f, 'حقيبة المدرسة', nameFrom, nameFrom + 14);
  const balanced = f >= p3 + 8;
  const chain = [
    { v: '$100', l: 'التكلفة', at: p1 + 6, c: D.warning },
    { v: '$120', l: 'التاجر', at: p2 + 6, c: D.primary },
    { v: '$150', l: 'العميل', at: p3 + 6, c: D.success },
  ];
  const profit = f >= p3 + 6 ? 30 * prog(f, p3 + 6, p3 + 22, OUT) : 0;
  const uploading = f >= publishAt && f < publishAt + 12;
  return (
    <div style={base}>
      <AppBar title="إضافة منتج جديد" back />
      <div style={abs({ top: 66, left: 0, right: 0, height: 2000, transform: `translateY(${-scroll}px)` })}>
        {/* product info */}
        <div style={{ ...card, top: 18, left: 20, right: 20, height: 300 }}>
          <div style={abs({ top: 20, right: 22, display: 'flex', gap: 14, alignItems: 'center' })}>
            <Tile path={mdiCubeOutline} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>معلومات المنتج</div>
              <div style={{ fontSize: 13.5, color: D.muted }}>البيانات الأساسية اللي هيشوفها التاجر والعميل</div>
            </div>
          </div>
          <div style={abs({ top: 96, right: 24, fontSize: 15, fontWeight: 800 })}>
            اسم المنتج <span style={{ color: D.danger }}>*</span>
          </div>
          <div style={abs({ top: 126 - 18, left: 24, right: 24, height: 54, borderRadius: 16, border: `1.5px solid ${f >= nameFrom - 2 && f < nameFrom + 18 ? D.primary : D.border}`, boxShadow: f >= nameFrom - 2 && f < nameFrom + 18 ? '0 0 0 4px rgba(12,135,107,0.13)' : undefined, display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: 19, fontWeight: 700, boxSizing: 'border-box', marginTop: 18 })}>
            {name}
            {f >= nameFrom - 2 && f < nameFrom + 18 && <span style={{ width: 2, height: 24, background: D.primary, marginRight: 2, opacity: Math.floor(f / 8) % 2 ? 0.25 : 1 }} />}
          </div>
          <div style={abs({ top: 198, right: 24, fontSize: 15, fontWeight: 800 })}>
            وصف المنتج <span style={{ color: D.danger }}>*</span>
          </div>
          <div style={abs({ top: 226, left: 24, right: 24, height: 52, borderRadius: 16, border: `1.5px solid ${D.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: 15, color: D.muted })}>حقيبة مدرسية خفيفة بخامة جلد عالية الجودة</div>
        </div>
        {/* media */}
        <div style={{ ...card, top: 336, left: 20, right: 20, height: 250 }}>
          <div style={abs({ top: 20, right: 22, display: 'flex', gap: 14, alignItems: 'center' })}>
            <Tile path={mdiImagePlusOutline} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>وسائط المنتج</div>
              <div style={{ fontSize: 13.5, color: D.muted }}>أضف حتى 10 صور وفيديوهات للمنتج</div>
            </div>
          </div>
          {['bag-1.jpg', 'bag-2.jpg', 'bag-3.jpg'].map((src, i) => {
            const p = sp(f, photosAt + i * 4, 14);
            const up = prog(f, photosAt + i * 4, photosAt + i * 4 + 16);
            return (
              <div key={src} style={abs({ top: 92, right: 24 + i * 232, width: 216, height: 136, borderRadius: 16, overflow: 'hidden', border: `1px solid ${D.border}`, background: '#EEF3F0', opacity: Math.min(1, p * 1.5), transform: `scale(${lerp(0.85, 1, p)})` })}>
                <Img src={staticFile(`footage/pro/${src}`)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {i === 0 && <div style={abs({ top: 8, right: 8, padding: '3px 10px', borderRadius: 8, background: D.primary, color: '#fff', fontSize: 12, fontWeight: 800 })}>الرئيسية</div>}
                <div style={abs({ left: 10, right: 10, bottom: 10, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.6)', opacity: up < 1 ? 1 : 0 })}>
                  <div style={{ width: `${up * 100}%`, height: '100%', borderRadius: 3, background: D.primary }} />
                </div>
              </div>
            );
          })}
        </div>
        {/* stock */}
        <div style={{ ...card, top: 604, left: 20, right: 20, height: 100 }}>
          <div style={abs({ top: 26, right: 22, display: 'flex', gap: 14, alignItems: 'center' })}>
            <Tile path={mdiCubeOutline} />
            <div style={{ fontSize: 20, fontWeight: 800 }}>المخزون</div>
          </div>
          <div style={abs({ top: 28, left: 150, display: 'flex', alignItems: 'center', gap: 0, direction: 'ltr' })}>
            <div style={{ width: 44, height: 44, borderRadius: '12px 0 0 12px', background: D.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon path={mdiMinus} size={22} color="#fff" />
            </div>
            <div style={{ width: 70, height: 44, border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 800, boxSizing: 'border-box' }}>5</div>
            <div style={{ width: 44, height: 44, borderRadius: '0 12px 12px 0', background: D.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon path={mdiPlus} size={22} color="#fff" />
            </div>
          </div>
          <div style={abs({ top: 40, left: 26, fontSize: 13, fontWeight: 700, color: D.success })}>● متوفر</div>
        </div>
        {/* pricing */}
        <div style={{ ...card, top: 722 - 66 + 0, left: 20, right: 20, height: 222 }}>
          <div style={abs({ top: 18, right: 22, display: 'flex', gap: 14, alignItems: 'center' })}>
            <Tile path={mdiTrendingUp} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>التسعير والأرباح</div>
              <div style={{ fontSize: 13.5, color: D.muted }}>حدّد الأسعار بالدولار وهامش الربح المناسب للتاجر</div>
            </div>
          </div>
        </div>
        <div style={abs({ top: -66, left: 0, right: 0 })}>
          <PriceField f={f} label="السعر الأصلي" value="100" from={p1} x={506} />
          <PriceField f={f} label="سعر البيع للتاجر" value="120" from={p2} x={276} hint="السعر اللي بيدفعه التاجر" />
          <PriceField f={f} label="السعر المقترح للعميل" value="150" from={p3} x={46} hint="لازم يكون أعلى من سعر التاجر" />
        </div>
        <div style={abs({ top: 836, left: 44, right: 44, height: 40, borderRadius: 12, background: balanced ? '#E9F6F0' : '#F4F7F5', border: `1px solid ${balanced ? '#BFE3D5' : D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14.5, fontWeight: 800, color: balanced ? D.success : D.muted, opacity: balanced ? 1 : 0 })}>
          <Icon path={mdiCheck} size={18} color={D.success} /> الأسعار متوازنة وتوفر هامش ربح جيد
        </div>
        {/* live preview */}
        <div style={{ ...card, top: 898, left: 20, right: 20, height: 420, overflow: 'hidden' }}>
          <div style={abs({ top: 18, right: 22, fontSize: 18, fontWeight: 800 })}>معاينة المنتج</div>
          <div style={abs({ top: 20, left: 22, padding: '3px 12px', borderRadius: 10, background: '#E9F6F0', color: D.success, fontSize: 12.5, fontWeight: 800 })}>● تحديث مباشر</div>
          <div style={abs({ top: 56, left: 22, right: 22, height: 128, borderRadius: 16, overflow: 'hidden' })}>
            <Img src={staticFile('footage/pro/bag-1.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 40%' }} />
          </div>
          <div style={abs({ top: 196, right: 22, fontSize: 20, fontWeight: 800 })}>{name || 'اسم المنتج'}</div>
          <div style={abs({ top: 236, right: 22, width: 300, height: 92, borderRadius: 18, background: '#EAF6F0', border: '1px solid #CBE8DB' })}>
            <div style={abs({ top: 12, right: 16, fontSize: 13.5, color: D.fgSoft })}>ربح التاجر المتوقع</div>
            <div style={abs({ top: 36, right: 16, fontSize: 34, fontWeight: 800, color: D.success, direction: 'ltr' })}>${Math.round(profit)}</div>
          </div>
          <div style={abs({ top: 248, left: 30, display: 'flex', alignItems: 'center', direction: 'rtl' })}>
            {chain.map((c, i) => {
              const p = sp(f, c.at, 12);
              return (
                <div key={c.l} style={{ display: 'flex', alignItems: 'center' }}>
                  {i > 0 && <div style={{ width: 22, height: 3, background: f >= c.at ? D.primary : D.border }} />}
                  <div style={{ width: 82, height: 82, borderRadius: 41, border: `2.5px solid ${c.c}`, background: i === 1 && f >= c.at ? D.primary : '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `scale(${f >= c.at ? lerp(0.6, 1, p) : 0.85})`, opacity: f >= c.at ? 1 : 0.35 }}>
                    <span style={{ fontSize: 19, fontWeight: 800, color: i === 1 && f >= c.at ? '#fff' : c.c }}>{f >= c.at ? c.v : '$0'}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: i === 1 && f >= c.at ? '#DDF2EA' : D.muted }}>{c.l}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={abs({ top: 346, left: 22, right: 22, height: 54, borderRadius: 14, background: balanced ? '#E9F6F0' : '#FDECEB', border: `1px solid ${balanced ? '#BFE3D5' : '#F3C4C0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 16, fontWeight: 800, color: balanced ? D.success : D.danger })}>
            <Icon path={balanced ? mdiCheckCircle : mdiCloseCircleOutline} size={24} color={balanced ? D.success : D.danger} />
            {balanced ? 'تسعير جيد · هامش ربح مناسب للتاجر' : 'راجع الأسعار'}
          </div>
        </div>
      </div>
      {/* sticky publish bar */}
      <div style={abs({ left: 0, right: 0, bottom: 0, height: 84, background: '#fff', borderTop: `1px solid ${D.divider}`, zIndex: 9 })}>
        <div style={abs({ top: 16, right: 24, fontSize: 15, color: D.muted })}>
          {f >= publishAt + 12 ? 'تم نشر المنتج للتجار' : 'أكمل الحقول المطلوبة ثم اضغط إضافة المنتج'}
        </div>
        <div style={abs({ top: 40, right: 24, fontSize: 13, color: D.muted })}>{name ? `${name} · 3 صور` : ''}</div>
        <div style={abs({ top: 14, left: 24, height: 56, width: 232, borderRadius: 16, background: uploading ? '#7DBBA5' : D.primary, color: '#fff', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transform: `scale(${press(f, publishAt)})`, boxShadow: '0 10px 22px rgba(12,135,107,0.3)' })}>
          {uploading ? 'جارٍ رفع المنتج…' : 'إضافة المنتج'}
          {!uploading && <Icon path={mdiArrowLeft} size={22} color="#fff" />}
        </div>
      </div>
      <Toast f={f} at={publishAt + 12} text="تم نشر المنتج بنجاح" sub="حقيبة المدرسة · متاح للتجار الآن" />
    </div>
  );
};

// ─── 3 · order details: confirm → track → shipping partner ──────────────────

export const ORDER_D = {
  confirm: { x: 566, y: 743 },
  dialogConfirm: { x: 447, y: 663 },
  track: { x: 20, y: 284, w: 720, h: 150 },
  delivery: { x: 20, y: 452, w: 720, h: 168 },
};

const STEPS = ['تم الإنشاء', 'قيد المعالجة', 'مؤكد', 'مع المندوب', 'تم التسليم'];

export const DashOrder = ({
  f,
  confirmAt,
  dialogOkAt,
  trackAt,
  linkAt,
  partnerAt,
  zonesAt,
}: {
  f: number;
  confirmAt: number;
  dialogOkAt: number;
  trackAt: number;
  linkAt: number;
  partnerAt: number;
  zonesAt: number;
}) => {
  const dlg = f >= confirmAt + 2 && f < dialogOkAt + 16 ? prog(f, confirmAt + 2, confirmAt + 14, OUT) * (1 - prog(f, dialogOkAt + 6, dialogOkAt + 16)) : 0;
  const confirmed = f >= dialogOkAt + 8;
  const flip = sp(f, dialogOkAt + 8, 11);
  const reached = confirmed ? 2 : 1;
  const run = prog(f, trackAt, trackAt + 26); // light travelling to «تم التسليم»
  const link = prog(f, linkAt, linkAt + 20);
  const partner = sp(f, partnerAt, 13);
  const zones = [sp(f, zonesAt, 14), sp(f, zonesAt + 6, 14)];
  return (
    <div style={base}>
      <AppBar title="تفاصيل الطلب" back />
      {/* header */}
      <div style={{ ...card, top: 84, left: 20, right: 20, height: 182 }}>
        <div style={abs({ top: 20, right: 24, fontSize: 27, fontWeight: 800 })}>
          تفاصيل الطلب <span style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>#305376</span>
        </div>
        <div
          style={abs({
            top: 22,
            left: 24,
            height: 38,
            padding: '0 16px',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 16,
            fontWeight: 800,
            background: confirmed ? '#E9F6F0' : '#FDF1E4',
            color: confirmed ? D.success : '#B8651C',
            transform: confirmed ? `scale(${lerp(0.8, 1, flip)})` : undefined,
          })}
        >
          {confirmed && <Icon path={mdiCheck} size={18} color={D.success} />}
          {confirmed ? 'مؤكد' : 'قيد المعالجة'}
        </div>
        <div style={abs({ top: 66, right: 24, fontSize: 14.5, color: D.muted })}>
          مصدر الطلب: <b style={{ color: D.fg }}>Abdaal</b> · تاجر · <span style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>10/10/2026</span>
        </div>
        {(
          [
            [mdiRefresh, 'تحديث التفاصيل'],
            [mdiFileDocumentOutline, 'بوليصة الشحن'],
            [mdiPencilOutline, 'تعديل الطلب'],
          ] as const
        ).map(([icon, label], i) => (
          <div key={label} style={abs({ top: 112, right: 24 + i * 186, width: 172, height: 48, borderRadius: 14, border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 15, fontWeight: 700 })}>
            <Icon path={icon} size={20} color={D.fgSoft} />
            {label}
          </div>
        ))}
      </div>
      {/* tracking */}
      <div style={{ ...card, top: 284, left: 20, right: 20, height: 150 }}>
        <div style={abs({ top: 18, right: 24, fontSize: 18, fontWeight: 800 })}>مسار الطلب</div>
        <div style={abs({ top: 84, right: 76, left: 76, height: 4, borderRadius: 2, background: D.divider })}>
          <div style={abs({ top: 0, right: 0, height: 4, borderRadius: 2, width: `${(reached / 4) * 100}%`, background: D.primary })} />
          {run > 0 && run < 1 && (
            <div style={abs({ top: -6, right: `calc(${lerp(reached / 4, 1, run) * 100}% - 8px)`, width: 16, height: 16, borderRadius: 8, background: C.accent, boxShadow: '0 0 16px 4px rgba(242,154,74,0.6)' })} />
          )}
          {run > 0 && <div style={abs({ top: 0, right: `${(reached / 4) * 100}%`, height: 4, width: `${(1 - reached / 4) * run * 100}%`, background: 'repeating-linear-gradient(90deg, rgba(242,154,74,0.9) 0 8px, transparent 8px 14px)' })} />}
        </div>
        {STEPS.map((s, i) => {
          const done = i <= reached;
          const last = i === 4 && run >= 1;
          return (
            <div key={s} style={abs({ top: 64, right: 52 + i * 154 - 24, width: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 })}>
              <div style={{ width: 44, height: 44, borderRadius: 22, background: done ? D.primary : last ? '#FFF1E2' : '#fff', border: `2.5px solid ${done ? D.primary : last ? C.accent : D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: last ? `0 0 0 ${6 + 3 * Math.sin(f / 6)}px rgba(242,154,74,0.18)` : undefined }}>
                {done ? <Icon path={mdiCheck} size={22} color="#fff" /> : <Icon path={i === 4 ? mdiCheckCircleOutline : mdiMotorbike} size={22} color={last ? C.accent : D.muted} />}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: done ? D.fg : last ? '#B8651C' : D.muted, whiteSpace: 'nowrap' }}>{s}</div>
            </div>
          );
        })}
      </div>
      {/* delivery & shipping partner */}
      <div style={{ ...card, top: 452, left: 20, right: 20, height: 168, overflow: 'hidden' }}>
        <div style={abs({ top: 18, right: 24, display: 'flex', alignItems: 'center', gap: 12 })}>
          <Tile path={mdiShieldCheckOutline} size={42} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>طريقة التوصيل</div>
            <div style={{ fontSize: 13, color: D.muted }}>حسب منطقة العميل</div>
          </div>
        </div>
        {/* two routes */}
        <div style={abs({ top: 80, right: 24, width: 300, height: 68, borderRadius: 16, border: `1.5px solid ${D.primary}`, background: '#F1F9F5', display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', boxSizing: 'border-box', opacity: lerp(0.4, 1, zones[0]), transform: `translateY(${(1 - zones[0]) * 10}px)` })}>
          <Icon path={mdiMotorbike} size={28} color={D.primary} />
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 800 }}>توصيل داخلي · دمشق</div>
            <div style={{ fontSize: 12.5, color: D.muted }}>الإدارة بتبعت المندوب</div>
          </div>
        </div>
        <div style={abs({ top: 80, left: 24, width: 300, height: 68, borderRadius: 16, border: `1.5px solid ${partner > 0.5 ? C.accent : D.border}`, background: partner > 0.5 ? '#FFF6EC' : '#fff', display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', boxSizing: 'border-box', opacity: lerp(0.35, 1, Math.max(partner, zones[1])), transform: `scale(${lerp(0.94, 1, partner)})` })}>
          <Icon path={mdiTruckFastOutline} size={28} color={partner > 0.5 ? C.accentDark : D.muted} />
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 800 }}>شركة الشحن</div>
            <div style={{ fontSize: 12.5, color: D.muted }}>مناطق تانية · مندوب الشركة</div>
          </div>
          {partner > 0.05 && (
            <div style={abs({ top: 8, left: 10, padding: '2px 8px', borderRadius: 8, background: D.success, color: '#fff', fontSize: 11.5, fontWeight: 800, transform: `scale(${partner})` })}>متصل</div>
          )}
        </div>
        {/* connector */}
        <svg width={DW - 40} height={168} style={abs({ top: 0, left: 0, direction: 'ltr', pointerEvents: 'none' })}>
          <path d="M 396 114 L 324 114" stroke={C.accent} strokeWidth={3} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${link} 1`} />
          {link > 0.98 && <circle cx={360} cy={114} r={13} fill="#fff" stroke={C.accent} strokeWidth={2} />}
          {link > 0.98 && <path d={mdiLinkVariant} transform="translate(351 105) scale(0.75)" fill={C.accentDark} />}
        </svg>
      </div>
      {/* next step */}
      <div style={{ ...card, top: 638, left: 20, right: 20, height: 150 }}>
        <div style={abs({ top: 18, right: 24, fontSize: 13.5, color: D.muted })}>إدارة الطلب الداخلي</div>
        <div style={abs({ top: 38, right: 24, fontSize: 20, fontWeight: 800 })}>الخطوة التالية</div>
        <div style={abs({ top: 76, right: 24, width: 300, height: 58, borderRadius: 16, background: confirmed ? '#fff' : D.primary, border: confirmed ? `1px solid ${D.border}` : undefined, color: confirmed ? D.fg : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 18, fontWeight: 800, transform: `scale(${press(f, confirmAt)})`, boxShadow: confirmed ? undefined : '0 10px 22px rgba(12,135,107,0.3)' })}>
          <Icon path={confirmed ? mdiTruckFastOutline : mdiCheckCircleOutline} size={24} color={confirmed ? D.primary : '#fff'} />
          {confirmed ? 'إخراج للتوصيل' : 'تأكيد الطلب'}
        </div>
        <div style={abs({ top: 76, left: 196, width: 160, height: 58, borderRadius: 16, border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 })}>تجهيز للإرسال</div>
        <div style={abs({ top: 76, left: 24, width: 160, height: 58, borderRadius: 16, border: '1px solid #F3C4C0', color: D.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 })}>إلغاء الطلب</div>
      </div>
      {/* totals */}
      {(
        [
          ['إجمالي الطلب', '103.00', 'USD'],
          ['عدد القطع', '2', ''],
          ['ربح التاجر', '34.00', 'USD'],
        ] as const
      ).map(([l, v, u], i) => (
        <div key={l} style={{ ...card, top: 806, right: 20 + i * 245, width: 229, height: 104 }}>
          <div style={abs({ top: 18, right: 18, fontSize: 14.5, color: D.muted })}>{l}</div>
          <div style={abs({ top: 46, right: 18, fontSize: 26, fontWeight: 800, direction: 'ltr' })}>
            {v} <span style={{ fontSize: 14, color: D.muted }}>{u}</span>
          </div>
        </div>
      ))}
      {/* confirm dialog */}
      {dlg > 0 && (
        <>
          <div style={abs({ inset: 0, background: `rgba(12,30,24,${0.45 * dlg})`, zIndex: 20 })} />
          <div style={abs({ top: 250, left: 120, width: 520, height: 470, borderRadius: 24, background: '#fff', zIndex: 21, boxShadow: '0 40px 80px rgba(0,0,0,0.3)', opacity: dlg, transform: `translateY(${(1 - dlg) * 30}px) scale(${lerp(0.94, 1, dlg)})` })}>
            <div style={abs({ top: 26, right: 28, fontSize: 25, fontWeight: 800 })}>تأكيد الطلب</div>
            <div style={abs({ top: 64, right: 28, fontSize: 14.5, color: D.muted })}>
              طلب <span style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>#305376</span> · Abdaal
            </div>
            <div style={abs({ top: 104, left: 28, right: 28, height: 92, borderRadius: 16, background: '#F2F9F5', border: '1px solid #CFE8DC' })}>
              <div style={abs({ top: 14, right: 18, fontSize: 13, color: D.muted })}>الحالة الحالية</div>
              <div style={abs({ top: 40, right: 18, padding: '6px 14px', borderRadius: 10, background: '#FDF1E4', color: '#B8651C', fontSize: 15, fontWeight: 800 })}>قيد المعالجة</div>
              <div style={abs({ top: 44, left: 210 })}>
                <Icon path={mdiArrowLeft} size={26} color={D.primary} />
              </div>
              <div style={abs({ top: 14, left: 18, fontSize: 13, color: D.muted })}>بعد التأكيد</div>
              <div style={abs({ top: 40, left: 18, padding: '6px 14px', borderRadius: 10, background: '#E9F6F0', color: D.success, fontSize: 15, fontWeight: 800 })}>مؤكد</div>
            </div>
            <div style={abs({ top: 214, left: 28, right: 28, height: 92, borderRadius: 16, background: '#F4F7F5', border: `1px solid ${D.border}` })}>
              <div style={abs({ top: 16, right: 18, display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800 })}>
                <Icon path={mdiInformationOutline} size={22} color={D.primary} /> ما الذي سيحدث؟
              </div>
              <div style={abs({ top: 52, right: 18, fontSize: 14, color: D.muted })}>سيتم تأكيد الطلب وتجهيزه للمرحلة التالية من المتابعة.</div>
            </div>
            <div style={abs({ top: 334, right: 28, fontSize: 14.5, fontWeight: 700, color: D.fgSoft, display: 'flex', alignItems: 'center', gap: 8 })}>
              <Icon path={mdiMapMarkerOutline} size={20} color={D.muted} /> دمشق · توصيل داخلي
            </div>
            <div style={abs({ top: 384, right: 28, width: 330, height: 58, borderRadius: 16, background: f >= dialogOkAt ? '#7DBBA5' : D.primary, color: '#fff', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${press(f, dialogOkAt)})` })}>
              {f >= dialogOkAt ? 'جارٍ التنفيذ…' : 'تأكيد الطلب'}
            </div>
            <div style={abs({ top: 384, left: 28, width: 120, height: 58, borderRadius: 16, border: `1px solid ${D.border}`, fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' })}>رجوع</div>
          </div>
        </>
      )}
      <Toast f={f} at={dialogOkAt + 10} text="تم تنفيذ الإجراء" sub="الطلب أصبح مؤكدًا" />
    </div>
  );
};

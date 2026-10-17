import {
  mdiAccountGroupOutline,
  mdiAccountTieOutline,
  mdiApi,
  mdiCartOutline,
  mdiCashMultiple,
  mdiCellphone,
  mdiChartBoxOutline,
  mdiCheck,
  mdiCheckDecagram,
  mdiLightningBolt,
  mdiMapMarkerOutline,
  mdiMonitorDashboard,
  mdiMotorbike,
  mdiPackageVariantClosed,
  mdiStorefrontOutline,
  mdiTagMultipleOutline,
  mdiTrendingUp,
  mdiTruckFastOutline,
  mdiWalletOutline,
} from '@mdi/js';
import type { ReactNode } from 'react';
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { LogoMark } from '../components/LogoMark';
import { Icon } from '../components/Text';
import { pop } from './anim';
import { Phone } from './Phone';
import { AppCreateOrder, AppHome, AppProducts, AppWallet } from './screens/AppScreens';
import { Dashboard, DASH_H, DASH_W } from './screens/Dashboard';
import { Callout, Stage } from './Stage';
import { C, CAPTION_FONT, clamp, D } from './theme';

const PHONE_W = 470;
const PHONE_X = (1080 - PHONE_W) / 2;
const PHONE_Y = 350;

const Card = ({ children, style }: { children: ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: C.surface, borderRadius: 34, boxShadow: '0 40px 90px rgba(0,0,0,0.35)', direction: 'rtl', fontFamily: 'Tajawal', ...style }}>{children}</div>
);

const IconTile = ({ path, size = 84, bg = C.soft, color = C.primary }: { path: string; size?: number; bg?: string; color?: string }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.3, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <Icon path={path} size={size * 0.56} color={color} />
  </div>
);

/** Slides screens in from the left (RTL push) at the given frames. */
const Screens = ({ frame, at, children }: { frame: number; at: number[]; children: ReactNode[] }) => (
  <>
    {children.map((child, i) => {
      const start = at[i];
      const next = at[i + 1];
      if (frame < start - 1 || (next !== undefined && frame >= next + 10)) return null;
      const inP = i === 0 ? 1 : Easing.out(Easing.cubic)(interpolate(frame, [start, start + 10], [0, 1], clamp));
      const outP = next === undefined ? 0 : Easing.out(Easing.cubic)(interpolate(frame, [next, next + 10], [0, 1], clamp));
      return (
        <div key={i} style={{ position: 'absolute', inset: 0, transform: `translateX(${(1 - inP) * -390 + outP * 120}px)`, filter: outP > 0 ? `brightness(${1 - outP * 0.3})` : undefined }}>
          {child}
        </div>
      );
    })}
  </>
);

// ─── 1 · three prices per product ────────────────────────────────────────────

export const PricingInsert = ({ len, cue }: { len: number; cue: { client: number; admin: number; p1: number; p2: number; p3: number } }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const panel = pop(f, cue.admin, fps, 15);
  const rows = [
    { at: cue.p1, label: 'سعر المنتج الأصلي', sub: 'تكلفة المنتج عليك', value: 100, color: C.primary300 },
    { at: cue.p2, label: 'سعر التاجر', sub: 'التاجر بيشتري بيه', value: 120, color: C.primary },
    { at: cue.p3, label: 'السعر المقترح للبيع', sub: 'للعميل النهائي', value: 150, color: C.accent },
  ];
  const margins = pop(f, cue.p3 + 24, fps, 12);
  return (
    <Stage duration={len} label="3 أسعار لكل منتج" icon={mdiTagMultipleOutline}>
      <Callout icon={mdiMapMarkerOutline} title="مشروع لعميل من سوريا" x={250} y={360} at={cue.client} width={580} />
      <Card style={{ position: 'absolute', left: 70, right: 70, top: 540, padding: '34px 38px', opacity: Math.min(1, panel * 1.4), transform: `translateY(${(1 - panel) * 80}px) scale(${0.92 + panel * 0.08})` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <IconTile path="M12,1C7,1 3,5 3,10V17A3,3 0 0,0 6,20H9V12H5V10A7,7 0 0,1 12,3A7,7 0 0,1 19,10V12H15V20H18A3,3 0 0,0 21,17V10C21,5 16.97,1 12,1Z" size={110} bg={C.warm} color={C.accent} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 26, color: C.muted, display: 'flex', alignItems: 'center', gap: 8 }}>
              <LogoMark size={30} id="pricing-mark" />
              لوحة التحكم · إضافة منتج جديد
            </div>
            <div style={{ fontSize: 46, fontWeight: 700, color: C.ink }}>سماعة لاسلكية</div>
          </div>
        </div>
        <div style={{ height: 2, background: C.border, margin: '26px 0' }} />
        {rows.map((r, i) => {
          const p = pop(f, r.at, fps, 13);
          const count = Easing.out(Easing.cubic)(interpolate(f, [r.at, r.at + 16], [0, 1], clamp));
          return (
            <div key={r.label} style={{ marginBottom: i < 2 ? 26 : 0, opacity: Math.min(1, p * 1.5) * (f >= r.at ? 1 : 0), transform: `translateX(${(1 - p) * 60}px)` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: C.ink }}>{r.label}</div>
                  <div style={{ fontSize: 24, color: C.muted }}>{r.sub}</div>
                </div>
                <div style={{ fontFamily: CAPTION_FONT, fontWeight: 800, fontSize: 64, color: r.color, direction: 'ltr' }}>${Math.round(r.value * count)}</div>
              </div>
              <div style={{ height: 16, borderRadius: 8, background: C.soft, marginTop: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(r.value / 150) * 100 * count}%`, borderRadius: 8, background: r.color }} />
              </div>
            </div>
          );
        })}
      </Card>
      {margins > 0.01 && (
        <div style={{ position: 'absolute', top: 1240, width: 1080, display: 'flex', justifyContent: 'center', gap: 20, direction: 'rtl', opacity: Math.min(1, margins * 1.5) }}>
          {[
            ['+$20 ربحك', C.primary],
            ['+$30 عمولة التاجر', C.accent],
          ].map(([text, bg], i) => (
            <div key={text} style={{ padding: '14px 26px', borderRadius: 999, background: bg, color: '#fff', fontFamily: CAPTION_FONT, fontWeight: 800, fontSize: 34, transform: `scale(${pop(f, cue.p3 + 24 + i * 5, fps, 10)})` }}>
              {text}
            </div>
          ))}
        </div>
      )}
    </Stage>
  );
};

// ─── 2 · four roles + account approval ──────────────────────────────────────

const ROLES = [
  { icon: mdiStorefrontOutline, name: 'التاجر', desc: 'بيبيع ويكسب عمولة' },
  { icon: mdiAccountTieOutline, name: 'موظف المبيعات', desc: 'بيتابع التجار' },
  { icon: mdiChartBoxOutline, name: 'الإدارة', desc: 'بتتحكم في كل حاجة' },
  { icon: mdiMotorbike, name: 'مندوب التوصيل', desc: 'بيوصّل الأوردر' },
];

export const RolesInsert = ({ len, cue }: { len: number; cue: { roles: number[]; join: number; approve: number } }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const join = pop(f, cue.join, fps, 14);
  const approved = f >= cue.approve;
  const press = interpolate(f, [cue.approve - 4, cue.approve, cue.approve + 4], [1, 0.92, 1], clamp);
  return (
    <Stage duration={len} label="4 أدوار في نظام واحد" icon={mdiAccountGroupOutline}>
      <div style={{ position: 'absolute', top: 390, left: 60, right: 60, display: 'flex', flexWrap: 'wrap', gap: 24, direction: 'rtl' }}>
        {ROLES.map((r, i) => {
          const p = pop(f, cue.roles[i], fps, 11);
          const lit = f >= cue.roles[i] && f < (cue.roles[i + 1] ?? cue.join);
          return (
            <Card
              key={r.name}
              style={{
                width: 468,
                height: 290,
                padding: 30,
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: Math.min(1, p * 1.5),
                transform: `scale(${0.6 + p * 0.4 + (lit ? 0.03 : 0)})`,
                boxShadow: lit ? `0 0 0 6px ${C.accent}, 0 40px 90px rgba(0,0,0,0.35)` : undefined,
              }}
            >
              <IconTile path={r.icon} size={96} bg={lit ? C.warm : C.soft} color={lit ? C.accent : C.primary} />
              <div>
                <div style={{ fontSize: 44, fontWeight: 700, color: C.ink }}>{r.name}</div>
                <div style={{ fontSize: 28, color: C.muted }}>{r.desc}</div>
              </div>
            </Card>
          );
        })}
      </div>
      {join > 0.01 && (
        <Card style={{ position: 'absolute', left: 60, right: 60, top: 1050, padding: '26px 30px', display: 'flex', alignItems: 'center', gap: 22, transform: `translateY(${(1 - join) * 200}px)`, opacity: Math.min(1, join * 1.5) }}>
          <div style={{ width: 92, height: 92, borderRadius: 46, background: C.deep, color: '#fff', fontSize: 42, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>م</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 26, color: C.muted }}>طلب انضمام جديد · تاجر</div>
            <div style={{ fontSize: 40, fontWeight: 700, color: C.ink }}>متجر النور</div>
          </div>
          <div
            style={{
              padding: '18px 30px',
              borderRadius: 22,
              background: approved ? C.soft : C.primary,
              color: approved ? C.primary : '#fff',
              fontSize: 32,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              transform: `scale(${press})`,
            }}
          >
            {approved && <Icon path={mdiCheck} size={34} color={C.primary} />}
            {approved ? 'تمت الموافقة' : 'موافقة'}
          </div>
        </Card>
      )}
    </Stage>
  );
};

// ─── 3 · merchant app: open → pick products → create order ───────────────────

export const AppInsert = ({ len, cue }: { len: number; cue: { products: number; pick: number; create: number } }) => {
  const f = useCurrentFrame();
  return (
    <Stage duration={len} label="تطبيق التاجر" icon={mdiCellphone}>
      <div style={{ position: 'absolute', left: PHONE_X, top: PHONE_Y, transform: `translateY(${Math.sin(f / 22) * 6}px)` }}>
        <Phone width={PHONE_W}>
          <Screens frame={f} at={[0, cue.products, cue.create]}>
            <AppHome t={f} />
            <AppProducts t={f - cue.products} pickAt={cue.pick - cue.products} />
            <AppCreateOrder t={(f - cue.create) * 1.45} />
          </Screens>
        </Phone>
      </div>
      <Callout icon={mdiCartOutline} title="بيختار المنتجات" sub="سعره والسعر المقترح قدامه" x={30} y={760} at={cue.products + 6} until={cue.create} width={500} />
      <Callout icon={mdiLightningBolt} title="طلب في ثواني" x={560} y={1010} at={cue.create + 8} accent width={420} />
    </Stage>
  );
};

// ─── 4 · dashboard follows the order until delivery ──────────────────────────

export const DashInsert = ({ len, cue }: { len: number; cue: { delivered: number } }) => {
  const f = useCurrentFrame();
  const live = interpolate(f, [6, cue.delivered], [0, 3], clamp);
  const zoom = interpolate(f, [0, len * 0.7], [1.02, 1.3], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const w = 1000;
  const s = w / DASH_W;
  return (
    <Stage duration={len} label="لوحة التحكم" icon={mdiMonitorDashboard}>
      <div style={{ position: 'absolute', left: 40, top: 540, width: w, height: DASH_H * s, transform: `scale(${zoom})`, transformOrigin: '0% 92%' }}>
        <div style={{ width: w, height: DASH_H * s, borderRadius: 26, overflow: 'hidden', boxShadow: '0 50px 120px rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.15)' }}>
          <div style={{ transform: `scale(${s})`, transformOrigin: '0 0' }}>
            <Dashboard t={f + 30} live={live} />
          </div>
        </div>
      </div>
      <Callout icon={mdiCheckDecagram} title="لحد التسليم" sub="الإدارة متابعة كل خطوة" x={300} y={1140} at={cue.delivered} accent width={480} />
    </Stage>
  );
};

// ─── 5 · shipping company integration ────────────────────────────────────────

export const ShippingInsert = ({ len, cue }: { len: number; cue: { link: number } }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = pop(f, 2, fps, 12);
  const b = pop(f, cue.link, fps, 12);
  const line = interpolate(f, [cue.link + 4, cue.link + 22], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const node = (x: number, label: string, child: ReactNode, p: number) => (
    <div style={{ position: 'absolute', left: x, top: 560, width: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, transform: `scale(${p})`, opacity: Math.min(1, p * 1.5) }}>
      <div style={{ width: 250, height: 250, borderRadius: 70, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 40px 90px rgba(0,0,0,0.35)' }}>{child}</div>
      <div style={{ fontFamily: CAPTION_FONT, fontWeight: 800, fontSize: 40, color: '#fff' }}>{label}</div>
    </div>
  );
  return (
    <Stage duration={len} label="ربط مع شركة الشحن" icon={mdiTruckFastOutline}>
      <svg width={1080} height={1920} style={{ position: 'absolute' }}>
        <path d="M680 685 C 600 600, 480 600, 400 685" fill="none" stroke={C.mint} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={`${line} 1`} opacity={0.9} />
        {line >= 1 &&
          [0, 0.33, 0.66].map((o) => {
            const p = (f / 26 + o) % 1;
            const x = (1 - p) ** 3 * 680 + 3 * (1 - p) ** 2 * p * 600 + 3 * (1 - p) * p ** 2 * 480 + p ** 3 * 400;
            const y = (1 - p) ** 3 * 685 + 3 * (1 - p) ** 2 * p * 600 + 3 * (1 - p) * p ** 2 * 600 + p ** 3 * 685;
            return <circle key={o} cx={x} cy={y} r={12} fill={C.accentLight} />;
          })}
      </svg>
      {node(640, 'نظام وسيط', <LogoMark size={190} id="ship-mark" />, a)}
      {node(100, 'شركة الشحن', <IconTile path={mdiTruckFastOutline} size={180} bg={C.warm} color={C.accent} />, b)}
      <div style={{ position: 'absolute', top: 520, width: 1080, display: 'flex', justifyContent: 'center', opacity: line }}>
        <div style={{ padding: '10px 22px', borderRadius: 999, background: C.accent, color: '#fff', fontFamily: CAPTION_FONT, fontWeight: 800, fontSize: 30, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon path={mdiApi} size={34} color="#fff" />
          ربط مباشر
        </div>
      </div>
    </Stage>
  );
};

/** Overlay on the talking-head shot: who delivers in which zone. */
export const ZonesCard = ({ len, cue }: { len: number; cue: { a: number; b: number } }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(f, 0, fps, 14);
  const out = interpolate(f, [len - 10, len], [0, 1], clamp);
  const rows = [
    { at: cue.a, icon: mdiMotorbike, zone: 'مناطق الإدارة', who: 'مندوب من عندك', color: C.primary },
    { at: cue.b, icon: mdiTruckFastOutline, zone: 'مناطق تانية', who: 'شركة الشحن بتبعت مندوب', color: C.accent },
  ];
  return (
    <Card style={{ position: 'absolute', left: 70, right: 70, top: 880, padding: '28px 30px', opacity: Math.min(1, p * 1.5) * (1 - out), transform: `translateY(${(1 - p) * 120 + out * 60}px)`, background: 'rgba(255,255,255,0.96)' }}>
      <div style={{ fontFamily: CAPTION_FONT, fontWeight: 800, fontSize: 38, color: C.ink, marginBottom: 18 }}>مين بيوصّل الأوردر؟</div>
      {rows.map((r, i) => {
        const on = f >= r.at;
        const k = pop(f, r.at, fps, 10);
        return (
          <div key={r.zone} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '16px 18px', borderRadius: 24, marginTop: i ? 12 : 0, background: on ? `${r.color}14` : C.background, boxShadow: on ? `inset 0 0 0 3px ${r.color}` : undefined, transform: `scale(${on ? 1 + 0.03 * Math.sin(Math.min(1, k) * Math.PI) : 0.98})`, opacity: on ? 1 : 0.55 }}>
            <IconTile path={r.icon} size={74} bg={on ? r.color : C.soft} color={on ? '#fff' : C.muted} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 34, fontWeight: 700, color: C.ink }}>{r.zone}</div>
              <div style={{ fontSize: 27, color: C.muted }}>{r.who}</div>
            </div>
            {on && <Icon path={mdiCheck} size={44} color={r.color} />}
          </div>
        );
      })}
    </Card>
  );
};

// ─── 6 · wallet: profit → withdrawal → admin approval ────────────────────────

export const WalletInsert = ({ len, cue }: { len: number; cue: { credit: number; request: number; review: number; approve: number } }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const admin = pop(f, cue.review, fps, 13);
  const approved = f >= cue.approve;
  const press = interpolate(f, [cue.approve - 4, cue.approve, cue.approve + 4], [1, 0.9, 1], clamp);
  return (
    <Stage duration={len} label="محفظة التاجر" icon={mdiWalletOutline}>
      <div style={{ position: 'absolute', left: PHONE_X + 90, top: PHONE_Y, transform: `translateY(${Math.sin(f / 22) * 6}px)` }}>
        <Phone width={PHONE_W}>
          <AppWallet t={f} creditAt={cue.credit} requestAt={cue.request} approvedAt={cue.approve + 4} />
        </Phone>
      </div>
      {admin > 0.01 && (
        <Card style={{ position: 'absolute', left: 36, top: 1020, width: 500, padding: '24px 26px', transform: `translateX(${(1 - admin) * -200}px) rotate(${(1 - admin) * -6}deg)`, opacity: Math.min(1, admin * 1.5) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 24, color: D.muted }}>
            <LogoMark size={34} id="wallet-mark" />
            لوحة التحكم · طلبات السحب
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, color: C.ink, marginTop: 10 }}>متجر النور</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <span style={{ fontFamily: CAPTION_FONT, fontWeight: 800, fontSize: 44, color: C.ink, direction: 'ltr' }}>$1,280</span>
            <span style={{ padding: '14px 24px', borderRadius: 18, background: approved ? C.soft : D.primary, color: approved ? D.primary : '#fff', fontSize: 28, fontWeight: 700, transform: `scale(${press})`, display: 'flex', gap: 6, alignItems: 'center' }}>
              {approved && <Icon path={mdiCheck} size={30} color={D.primary} />}
              {approved ? 'تمت الموافقة' : 'موافقة'}
            </span>
          </div>
        </Card>
      )}
      <Callout icon={mdiCashMultiple} title="المكسب في المحفظة" x={40} y={560} at={cue.credit + 4} until={cue.review} accent width={470} />
    </Stage>
  );
};

// ─── 7 · everything in one place → logo ──────────────────────────────────────

const ALL = [
  { icon: mdiPackageVariantClosed, label: 'المنتجات' },
  { icon: mdiStorefrontOutline, label: 'التجار' },
  { icon: mdiCartOutline, label: 'الطلبات' },
  { icon: mdiTruckFastOutline, label: 'التوصيل' },
  { icon: mdiCashMultiple, label: 'العمولة' },
];

export const AllInOneInsert = ({ len, cue }: { len: number; cue: { items: number[]; one: number } }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const merge = Easing.inOut(Easing.cubic)(interpolate(f, [cue.one, cue.one + 16], [0, 1], clamp));
  const logo = pop(f, cue.one + 10, fps, 9);
  const CX = 540;
  const CY = 820;
  return (
    <Stage duration={len} label="كل حاجة في مكان واحد" icon={mdiCheckDecagram}>
      {logo > 0.01 && (
        <>
          <div style={{ position: 'absolute', left: CX - 330, top: CY - 330, width: 660, height: 660, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(248,250,247,0.95), rgba(248,250,247,0.75) 60%, transparent)', transform: `scale(${logo})` }} />
          <div style={{ position: 'absolute', left: CX - 150, top: CY - 190, transform: `scale(${logo})` }}>
            <LogoMark size={300} id="all-mark" />
          </div>
          <div style={{ position: 'absolute', top: CY + 120, width: 1080, textAlign: 'center', fontFamily: CAPTION_FONT, fontWeight: 800, fontSize: 96, color: C.deep, opacity: Math.min(1, logo) }}>وسيط</div>
        </>
      )}
      {ALL.map((it, i) => {
        const p = pop(f, cue.items[i], fps, 10);
        if (f < cue.items[i]) return null;
        const ang = -Math.PI / 2 + (i / ALL.length) * Math.PI * 2;
        const r = 330 * (1 - merge);
        const x = CX + Math.cos(ang) * r;
        const y = CY + Math.sin(ang) * r;
        return (
          <div key={it.label} style={{ position: 'absolute', left: x - 110, top: y - 110, width: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transform: `scale(${p * (1 - merge * 0.8)})`, opacity: 1 - merge }}>
            <div style={{ width: 150, height: 150, borderRadius: 46, background: i % 2 ? C.accent : C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 30px 60px rgba(0,0,0,0.35)' }}>
              <Icon path={it.icon} size={84} color={i % 2 ? '#fff' : C.primary} />
            </div>
            <div style={{ fontFamily: CAPTION_FONT, fontWeight: 800, fontSize: 36, color: '#fff' }}>{it.label}</div>
          </div>
        );
      })}
    </Stage>
  );
};

// ─── 8 · online store vs a full system ───────────────────────────────────────

export const CompareInsert = ({ len, cue }: { len: number; cue: { store: number; system: number; grow: number } }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = pop(f, cue.store, fps, 13);
  const b = pop(f, cue.system, fps, 13);
  const grow = Easing.out(Easing.cubic)(interpolate(f, [cue.grow - 6, cue.grow + 20], [0, 1], clamp));
  const col = (p: number, dim: boolean, children: ReactNode) => (
    <div style={{ width: 450, height: 640, borderRadius: 40, padding: 30, boxSizing: 'border-box', background: dim ? 'rgba(255,255,255,0.08)' : C.surface, border: dim ? '2px solid rgba(255,255,255,0.18)' : undefined, boxShadow: dim ? undefined : `0 0 0 6px ${C.accent}, 0 50px 100px rgba(0,0,0,0.4)`, opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 80}px) scale(${dim ? 0.95 : 1.02})`, display: 'flex', flexDirection: 'column', alignItems: 'center', direction: 'rtl', fontFamily: 'Tajawal' }}>
      {children}
    </div>
  );
  const pts = [0, 0.08, 0.18, 0.3, 0.46, 0.66, 0.9].map((v, i) => `${i ? 'L' : 'M'}${i * 60} ${200 - v * 190 * grow}`).join(' ');
  return (
    <Stage duration={len} label="الفرق" icon={mdiTrendingUp}>
      <div style={{ position: 'absolute', top: 420, left: 60, right: 60, display: 'flex', justifyContent: 'space-between', direction: 'rtl' }}>
        {col(
          a,
          true,
          <>
            <IconTile path={mdiStorefrontOutline} size={130} bg="rgba(255,255,255,0.12)" color={C.mint} />
            <div style={{ fontSize: 44, fontWeight: 700, color: '#fff', marginTop: 24 }}>متجر إلكتروني</div>
            <div style={{ fontSize: 28, color: C.mint, marginTop: 8, textAlign: 'center' }}>إنت لوحدك بتبيع</div>
            <svg width={380} height={200} style={{ marginTop: 40 }}>
              <path d="M0 160 L60 150 L120 158 L180 148 L240 156 L300 150 L360 152" fill="none" stroke={C.mint} strokeWidth={6} strokeLinecap="round" opacity={0.6} />
            </svg>
          </>,
        )}
        {col(
          b,
          false,
          <>
            <LogoMark size={140} id="cmp-mark" tile />
            <div style={{ fontSize: 44, fontWeight: 700, color: C.ink, marginTop: 14 }}>منظومة كاملة</div>
            <div style={{ fontSize: 28, color: C.muted, marginTop: 8, textAlign: 'center' }}>تجار بيبيعوا معاك</div>
            <svg width={380} height={210} style={{ marginTop: 34, direction: 'ltr' }}>
              <path d={pts} fill="none" stroke={C.accent} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
              {grow > 0.95 && <circle cx={360} cy={200 - 0.9 * 190} r={12} fill={C.accent} stroke="#fff" strokeWidth={4} />}
            </svg>
          </>,
        )}
      </div>
      {grow > 0.05 && (
        <div style={{ position: 'absolute', top: 1110, width: 1080, display: 'flex', justifyContent: 'center' }}>
          <div style={{ padding: '18px 34px', borderRadius: 999, background: C.accent, color: '#fff', fontFamily: CAPTION_FONT, fontWeight: 800, fontSize: 42, display: 'flex', alignItems: 'center', gap: 12, transform: `scale(${pop(f, cue.grow, fps, 9)})` }}>
            <Icon path={mdiTrendingUp} size={48} color="#fff" />
            وسّع مبيعاتك
          </div>
        </div>
      )}
    </Stage>
  );
};

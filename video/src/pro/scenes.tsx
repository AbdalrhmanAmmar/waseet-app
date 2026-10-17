import {
  mdiAccountGroupOutline,
  mdiAccountMultipleOutline,
  mdiAccountTieOutline,
  mdiArrowUpBold,
  mdiBullhornOutline,
  mdiCartOutline,
  mdiCashMultiple,
  mdiCellphone,
  mdiCheckCircle,
  mdiClipboardListOutline,
  mdiClipboardTextClockOutline,
  mdiLightningBolt,
  mdiMapMarkerOutline,
  mdiMonitorDashboard,
  mdiMotorbike,
  mdiPackageVariantClosed,
  mdiShieldCheckOutline,
  mdiStorefrontOutline,
  mdiTagMultipleOutline,
  mdiTrendingUp,
  mdiTruckFastOutline,
  mdiWalletOutline,
} from '@mdi/js';
import type { ReactNode } from 'react';
import { interpolate } from 'remotion';
import { LogoMark } from '../components/LogoMark';
import { Icon } from '../components/Text';
import { BROWSER, BrowserFrame, Callout, Cursor, Focus, PHONE, PhoneFrame, Pages, Rig, Taps } from './kit';
import { camera, type CamKey, type FocusKey, lerp, prog, sp } from './motion';
import { CreateOrder, Home, Login, OrderDetails, ROLE_CARD, ROLES, SignUp, Welcome, WithdrawSheet } from './screens/app';
import { AddProduct, DashHome, DashOrder } from './screens/dash';
import { C, FONT, GLOW, IN, OUT } from './theme';

const B_SCALE = 1.16;
const P_SCALE = 1.33;
/** content px → camera point (relative to the device frame centre) */
const bc = (at: number, s: number, x: number, y: number, dur?: number): CamKey => ({ at, s, x: x - BROWSER.w / 2, y: y + BROWSER.bar - BROWSER.h / 2, dur });
const pc = (at: number, s: number, x: number, y: number, dur?: number): CamKey => ({ at, s, x: x + 11 - (PHONE.w + 22) / 2, y: y + 11 - (PHONE.h + 22) / 2, dur });

const TOP = 112; // callout row above the devices
const PHONE_FRAME = { w: PHONE.w + 22, h: PHONE.h + 22 };

/** Content layer of a browser: pages + highlight + cursor, all in content px. */
const BrowserContent = ({ children }: { children: ReactNode }) => <div style={{ position: 'absolute', inset: 0 }}>{children}</div>;

// ═══ Stage 1 · admin adds a product with three prices ═══════════════════════

export const DashScene1 = ({ f }: { f: number }) => {
  const cam = camera(f, [
    bc(216, 1, 380, 453),
    bc(268, 1.32, 380, 237, 16),
    bc(296, 1, 380, 453, 16),
    bc(328, 1.7, 611, 274, 18),
    bc(403, 1.7, 381, 274, 16),
    bc(446, 1.7, 151, 274, 16),
    bc(472, 1.28, 380, 688, 18),
    bc(490, 1, 380, 500, 16),
  ]);
  const focus: FocusKey[] = [
    { at: 272, until: 292, x: 44, y: 210, w: 672, h: 54, r: 16 },
    { at: 338, until: 404, x: 506, y: 246, w: 210, h: 56, r: 16 },
    { at: 406, until: 448, x: 276, y: 246, w: 210, h: 56, r: 16 },
    { at: 450, until: 472, x: 46, y: 246, w: 210, h: 56, r: 16 },
    { at: 476, until: 492, x: 40, y: 628, w: 680, h: 114, r: 20 },
  ];
  return (
    <>
      <Callout f={f} at={228} until={286} x={540} y={TOP} icon={mdiMonitorDashboard} title="لوحة تحكم الإدارة" />
      <Callout f={f} at={296} until={468} x={540} y={TOP} icon={mdiTagMultipleOutline} title="3 أسعار لكل منتج" sub="التكلفة · سعر التاجر · السعر المقترح" />
      <Callout f={f} at={478} until={522} x={540} y={TOP} icon={mdiTrendingUp} title="ربح التاجر المتوقع $30" tone="accent" />
      <Rig f={f} enterAt={216} cam={cam} scale={B_SCALE} size={BROWSER}>
        <BrowserFrame scale={B_SCALE}>
          <BrowserContent>
            <Pages
              f={f}
              width={BROWSER.w}
              pages={[
                { at: 0, el: <DashHome f={f - 216} addAt={262 - 216} /> },
                { at: 266, el: <AddProduct f={f} nameFrom={272} photosAt={288} scrollAt={300} p1={346} p2={419} p3={462} publishAt={496} /> },
              ]}
            />
            <Focus f={f} keys={focus} />
            <Cursor
              f={f}
              from={234}
              keys={[
                { at: 234, x: 520, y: 640 },
                { at: 260, x: 130, y: 154, click: true, travel: 20 },
                { at: 298, x: 430, y: 420, travel: 18 },
                { at: 342, x: 611, y: 274, click: true, travel: 16 },
                { at: 415, x: 381, y: 274, click: true, travel: 14 },
                { at: 458, x: 151, y: 274, click: true, travel: 14 },
                { at: 494, x: 140, y: 916, click: true, travel: 18 },
                { at: 514, x: 300, y: 760, travel: 14 },
              ]}
            />
          </BrowserContent>
        </BrowserFrame>
      </Rig>
    </>
  );
};

// ═══ Stage 2 · roles, approval, merchant app → admin follows the order ══════

const ROLE_AT = [694, 711, 736, 748];

export const AppScene1 = ({ f }: { f: number }) => {
  const cam = camera(f, [
    pc(652, 1, 195, 422),
    pc(676, 1.42, 195, 441, 20),
    pc(766, 1, 195, 422, 16),
    pc(802, 1.45, 195, 495, 16),
    pc(836, 1, 195, 422, 12),
    pc(846, 1.3, 195, 434, 14),
    pc(866, 1, 195, 422, 12),
    pc(906, 1.38, 195, 400, 16),
    pc(933, 1.42, 195, 578, 18),
    pc(952, 1, 195, 460, 14),
  ]);
  const lit = ROLE_AT.flatMap((t, i) => (f >= t && f < 770 ? [i] : []));
  const focus: FocusKey[] = [
    ...ROLES.map((r, i) => ({ at: ROLE_AT[i], until: (ROLE_AT[i + 1] ?? 768) - 1, x: r.x, y: r.y, w: ROLE_CARD.w, h: ROLE_CARD.h, r: 20 })),
    { at: 806, until: 836, x: 55, y: 468, w: 280, h: 54, r: 27 },
    { at: 846, until: 858, x: 38, y: 408, w: 314, h: 52, r: 16 },
    { at: 910, until: 930, x: 34, y: 330, w: 322, h: 52, r: 16 },
    { at: 942, until: 956, x: 30, y: 566, w: 330, h: 40, r: 12 },
  ];
  const exit = prog(f, 980, 996, IN);
  if (f >= 998) return null;
  return (
    <>
      <Callout f={f} at={683} until={766} x={540} y={TOP} icon={mdiAccountGroupOutline} title="4 أدوار في النظام" />
      <Callout f={f} at={806} until={840} x={540} y={TOP} icon={mdiShieldCheckOutline} title="موافقة الإدارة على كل حساب" />
      <Callout f={f} at={846} until={904} x={540} y={TOP} icon={mdiCellphone} title="تطبيق التاجر" />
      <Callout f={f} at={912} until={978} x={540} y={TOP} icon={mdiLightningBolt} title="طلب جديد في ثواني" tone="accent" />
      <Rig f={f} enterAt={652} cam={cam} scale={P_SCALE} size={PHONE_FRAME} exit={{ p: exit, dir: 'left' }}>
        <PhoneFrame scale={P_SCALE}>
          <Pages
            f={f}
            width={PHONE.w}
            pages={[
              { at: 0, el: <SignUp f={f} lit={lit} pickAt={772} scrollAt={776} nameFrom={780} nextAt={794} /> },
              { at: 798, el: <Welcome f={f} approveAt={820} loginAt={840} /> },
              { at: 844, el: <Login f={f} typeAt={846} submitAt={864} /> },
              { at: 868, el: <Home f={f} createAt={884} />, kind: 'fade' },
              { at: 888, el: <CreateOrder f={f} addAt={892} plusAt={903} priceFrom={912} colorFrom={920} scrollAt={931} reviewAt={958} /> },
            ]}
          />
          <Focus f={f} keys={focus} />
          <Taps
            f={f}
            keys={[
              { at: 772, x: 284, y: 365 },
              { at: 794, x: 195, y: 743 },
              { at: 840, x: 195, y: 589 },
              { at: 864, x: 195, y: 617 },
              { at: 884, x: 195, y: 427 },
              { at: 892, x: 195, y: 192 },
              { at: 903, x: 318, y: 258 },
              { at: 958, x: 195, y: 798 },
            ]}
          />
        </PhoneFrame>
      </Rig>
    </>
  );
};

export const DashScene2 = ({ f }: { f: number }) => {
  if (f < 984) return null;
  const cam = camera(f, [bc(986, 1, 380, 453), bc(1033, 1.26, 380, 359, 18), bc(1062, 1.22, 380, 536, 18)]);
  const focus: FocusKey[] = [
    { at: 1035, until: 1058, x: 20, y: 284, w: 720, h: 150, r: 22 },
    { at: 1064, until: 1150, x: 20, y: 452, w: 720, h: 168, r: 22 },
  ];
  return (
    <>
      <Callout f={f} at={1000} until={1058} x={540} y={TOP} icon={mdiClipboardTextClockOutline} title="الإدارة بتتابع كل طلب" />
      <Callout f={f} at={1094} until={1160} x={540} y={TOP} icon={mdiTruckFastOutline} title="ربط مع شركة شحن" tone="accent" />
      <Rig f={f} enterAt={986} cam={cam} scale={B_SCALE} size={BROWSER} from="right">
        <BrowserFrame scale={B_SCALE}>
          <BrowserContent>
            <DashOrder f={f} confirmAt={1008} dialogOkAt={1024} trackAt={1031} linkAt={1067} partnerAt={1094} zonesAt={1122} />
            <Focus f={f} keys={focus} dim={0.32} />
            <Cursor
              f={f}
              from={992}
              keys={[
                { at: 992, x: 420, y: 600 },
                { at: 1008, x: 566, y: 743, click: true, travel: 14 },
                { at: 1024, x: 447, y: 663, click: true, travel: 12 },
                { at: 1046, x: 660, y: 560, travel: 16 },
              ]}
            />
          </BrowserContent>
        </BrowserFrame>
      </Rig>
    </>
  );
};

// ═══ Stage 3 · delivered → profit → withdrawal → admin approves ═════════════

/** Floating admin window that approves the withdrawal — designed at stage scale so it reads on a phone. */
const ApprovalCard = ({ f, at, approveAt }: { f: number; at: number; approveAt: number }) => {
  if (f < at - 1) return null;
  const p = sp(f, at, 18, 1, 110);
  const out = prog(f, 1586, 1598, IN);
  const ok = f >= approveAt + 2;
  const flip = sp(f, approveAt + 2, 11);
  const W = 560;
  return (
    <div
      style={{
        position: 'absolute',
        left: 770,
        top: 520,
        zIndex: 50,
        opacity: Math.min(1, p * 1.5) * (1 - out),
        transform: `translate(-50%, -50%) perspective(2000px) rotateY(${(1 - p) * -18}deg) translateX(${(1 - p) * 260 + out * 120}px) scale(${lerp(0.9, 1, p)})`,
      }}
    >
      <div style={{ width: W, borderRadius: 26, overflow: 'hidden', background: '#fff', boxShadow: '0 40px 90px -10px rgba(0,0,0,0.55), 0 12px 30px rgba(0,0,0,0.25)', position: 'relative', fontFamily: FONT, direction: 'rtl' }}>
        <div style={{ height: 50, background: '#EEF3F0', borderBottom: '1px solid #DCE6E0', display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px', direction: 'ltr' }}>
          {['#FF6159', '#FFBD2E', '#29C941'].map((c) => (
            <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c, opacity: 0.85 }} />
          ))}
          <div style={{ flex: 1, textAlign: 'center', fontSize: 19, fontWeight: 700, color: '#4B5E56', direction: 'rtl' }}>لوحة الإدارة · طلبات السحب</div>
        </div>
        <div style={{ padding: '26px 28px 28px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 70, height: 70, borderRadius: 35, background: C.deep, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800 }}>A</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: C.ink }}>Abdaal · تاجر</div>
              <div style={{ fontSize: 21, color: C.muted }}>طلب سحب أرباح</div>
            </div>
            <div style={{ fontSize: 40, fontWeight: 900, color: C.primary800, direction: 'ltr' }}>
              34.00 <span style={{ fontSize: 20, color: C.muted }}>USD</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 24 }}>
            <div style={{ flex: 1, height: 76, borderRadius: 20, background: ok ? '#E6F5EE' : C.primary, color: ok ? C.primary : '#fff', fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transform: `scale(${ok ? lerp(0.9, 1, flip) : interpolate(f, [approveAt - 3, approveAt, approveAt + 5], [1, 0.95, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })})`, boxShadow: ok ? undefined : '0 12px 26px rgba(20,125,100,0.3)' }}>
              <Icon path={mdiCheckCircle} size={32} color={ok ? C.primary : '#fff'} />
              {ok ? 'تمت الموافقة' : 'موافقة'}
            </div>
            <div style={{ width: 150, height: 76, borderRadius: 20, border: '2px solid #F1C6C2', color: '#C2453D', fontSize: 26, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>رفض</div>
          </div>
          <Cursor
            f={f}
            from={at + 8}
            keys={[
              { at: at + 8, x: 120, y: 200 },
              { at: approveAt, x: 260, y: 170, click: true, travel: 16 },
              { at: approveAt + 20, x: 120, y: 230, travel: 14 },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export const AppScene2 = ({ f }: { f: number }) => {
  if (f >= 1606) return null;
  const cam = camera(f, [pc(1344, 1, 195, 422), pc(1414, 1.5, 290, 150, 14), pc(1430, 1, 195, 422, 14), pc(1446, 1.45, 195, 258, 16), pc(1494, 1, 195, 422, 14)]);
  const focus: FocusKey[] = [
    { at: 1418, until: 1428, x: 220, y: 126, w: 140, h: 48, r: 16 },
    { at: 1452, until: 1492, x: 16, y: 140, w: 358, h: 236, r: 26 },
    { at: 1506, until: 1515, x: 22, y: 524, w: 346, h: 96, r: 20 },
  ];
  const side = prog(f, 1530, 1550);
  const exit = prog(f, 1586, 1602, IN);
  return (
    <>
      <Callout f={f} at={1384} until={1426} x={540} y={TOP} icon={mdiCheckCircle} title="تأكيد التسليم" />
      <Callout f={f} at={1453} until={1496} x={540} y={TOP} icon={mdiWalletOutline} title="العمولة بتتضاف للمحفظة" tone="accent" />
      <Callout f={f} at={1501} until={1530} x={540} y={TOP} icon={mdiCashMultiple} title="طلب سحب الأرباح" />
      <Callout f={f} at={1536} until={1590} x={540} y={TOP} icon={mdiShieldCheckOutline} title="مراجعة وموافقة الإدارة" />
      <Rig f={f} enterAt={1344} cam={cam} scale={P_SCALE * lerp(1, 0.86, side)} cx={lerp(540, 330, side)} size={PHONE_FRAME} exit={{ p: exit, dir: 'shrink' }}>
        <PhoneFrame scale={P_SCALE}>
          <Pages
            f={f}
            width={PHONE.w}
            pages={[
              { at: 0, el: <OrderDetails f={f} updateAt={1387} pickAt={1403} saveAt={1412} /> },
              {
                at: 1428,
                kind: 'back',
                el: <Home f={f} credit={{ at: 1452, amount: 34 }} withdrawAt={1500} sheet={<WithdrawSheet f={f} at={1503} confirmAt={1516} approveAt={1574} amount={34} />} />,
              },
            ]}
          />
          <Focus f={f} keys={focus} />
          <Taps
            f={f}
            keys={[
              { at: 1387, x: 195, y: 649 },
              { at: 1403, x: 195, y: 701 },
              { at: 1412, x: 195, y: 789 },
              { at: 1500, x: 195, y: 333 },
              { at: 1516, x: 195, y: 733 },
            ]}
          />
        </PhoneFrame>
      </Rig>
      <ApprovalCard f={f} at={1536} approveAt={1570} />
    </>
  );
};

// ═══ «everything in one place» ══════════════════════════════════════════════

const TILES = [
  { label: 'المنتجات', icon: mdiPackageVariantClosed, at: 1603, x: 540, y: 430 },
  { label: 'التجار', icon: mdiAccountMultipleOutline, at: 1622, x: 842, y: 640 },
  { label: 'الطلبات', icon: mdiClipboardListOutline, at: 1639, x: 728, y: 1000 },
  { label: 'التوصيل', icon: mdiTruckFastOutline, at: 1658, x: 352, y: 1000 },
  { label: 'العمولة', icon: mdiCashMultiple, at: 1674, x: 238, y: 640 },
];
const HUB = { x: 540, y: 760 };

export const AllInOne = ({ f }: { f: number }) => {
  if (f < 1592 || f >= 1740) return null;
  const merge = prog(f, 1689, 1705);
  const logo = sp(f, 1697, 13, 0.9);
  const ring = prog(f, 1699, 1724, OUT);
  const out = prog(f, 1726, 1738, IN);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 1 - out, transform: `scale(${lerp(1, 0.9, out)})`, filter: out > 0 ? `blur(${out * 8}px)` : undefined }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <circle cx={HUB.x} cy={HUB.y} r={322} fill="none" stroke="rgba(198,231,219,0.18)" strokeWidth={2} strokeDasharray="6 10" style={{ opacity: prog(f, 1596, 1612) * (1 - merge) }} />
        {TILES.map((t) => {
          const p = prog(f, t.at, t.at + 14);
          return <line key={t.label} x1={HUB.x} y1={HUB.y} x2={lerp(HUB.x, t.x, p)} y2={lerp(HUB.y, t.y, p)} stroke="rgba(242,154,74,0.45)" strokeWidth={2.5} style={{ opacity: 1 - merge }} />;
        })}
      </svg>
      {TILES.map((t) => {
        const p = sp(f, t.at, 14, 0.7, 150);
        if (f < t.at - 1) return null;
        const x = lerp(t.x, HUB.x, merge);
        const y = lerp(t.y, HUB.y, merge);
        return (
          <div key={t.label} style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${lerp(0.6, 1, p) * lerp(1, 0.3, merge)})`, opacity: Math.min(1, p * 1.6) * (1 - prog(f, 1697, 1705)) }}>
            <div style={{ width: 196, height: 176, borderRadius: 34, background: 'rgba(255,255,255,0.97)', boxShadow: '0 26px 60px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ width: 76, height: 76, borderRadius: 24, background: C.soft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon path={t.icon} size={44} color={C.primary} />
              </div>
              <div style={{ fontFamily: FONT, fontSize: 30, fontWeight: 800, color: C.ink }}>{t.label}</div>
            </div>
          </div>
        );
      })}
      {f >= 1695 && (
        <div style={{ position: 'absolute', left: HUB.x, top: HUB.y, transform: 'translate(-50%, -50%)' }}>
          <div style={{ position: 'absolute', left: -230 * ring, top: -230 * ring, width: 460 * ring, height: 460 * ring, borderRadius: '50%', border: `3px solid rgba(242,154,74,${0.7 * (1 - ring)})` }} />
          <div style={{ width: 260, height: 260, borderRadius: 72, background: '#F8FAF7', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translate(-50%, -50%) scale(${logo})`, position: 'absolute', boxShadow: `0 30px 80px rgba(0,0,0,0.4), 0 0 ${60 * logo}px rgba(109,209,187,0.45)` }}>
            <LogoMark size={190} id="hub-mark" />
          </div>
          <div style={{ position: 'absolute', top: 160, left: -300, width: 600, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 92, color: '#fff', opacity: prog(f, 1700, 1710), transform: `translateY(${(1 - prog(f, 1700, 1712, OUT)) * 20}px)` }}>وسيط</div>
        </div>
      )}
    </div>
  );
};

// ═══ e-commerce store vs. an ecosystem ══════════════════════════════════════

const NODES = [
  { label: 'تاجر', icon: mdiStorefrontOutline, a: -150 },
  { label: 'تاجر', icon: mdiStorefrontOutline, a: -110 },
  { label: 'تاجر', icon: mdiStorefrontOutline, a: -70 },
  { label: 'الإدارة', icon: mdiAccountTieOutline, a: -30 },
  { label: 'مندوب', icon: mdiMotorbike, a: 30 },
  { label: 'شركة الشحن', icon: mdiTruckFastOutline, a: 150 },
];

export const Compare = ({ f }: { f: number }) => {
  if (f < 1732) return null;
  const store = sp(f, 1734, 16, 0.9);
  const shrink = prog(f, 1766, 1782);
  const sys = sp(f, 1770, 18, 1, 110);
  const grow = prog(f, 1812, 1838, OUT);
  const cx = 540;
  const cy = 1000;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* the store */}
      <div
        style={{
          position: 'absolute',
          left: 540,
          top: lerp(560, 300, shrink),
          transform: `translate(-50%, -50%) scale(${lerp(0.85, 1, store) * lerp(1, 0.78, shrink)})`,
          opacity: Math.min(1, store * 1.5) * lerp(1, 0.6, shrink),
        }}
      >
        <div style={{ width: 760, height: 250, borderRadius: 36, background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(198,231,219,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 54px', boxSizing: 'border-box', direction: 'rtl' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <div style={{ width: 110, height: 110, borderRadius: 30, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon path={mdiStorefrontOutline} size={64} color="#D7EAE2" />
            </div>
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 44, color: '#fff' }}>متجر إلكتروني</div>
              <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 26, color: '#A9C9BC' }}>إنت لوحدك بتبيع وبتصرف على الإعلانات</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.8 }}>
            <Icon path={mdiBullhornOutline} size={40} color="#A9C9BC" />
            <div style={{ width: 50, height: 3, background: 'rgba(198,231,219,0.4)' }} />
            <Icon path={mdiCartOutline} size={40} color="#A9C9BC" />
          </div>
        </div>
      </div>
      {f >= 1764 && (
        <div style={{ position: 'absolute', left: 540, top: 470, transform: `translate(-50%, -50%) scale(${sp(f, 1766, 12)})`, fontFamily: FONT, fontWeight: 900, fontSize: 34, color: GLOW, padding: '8px 22px', borderRadius: 999, background: 'rgba(242,154,74,0.14)', border: '2px solid rgba(242,154,74,0.4)' }}>
          مقابل
        </div>
      )}
      {/* the ecosystem */}
      {f >= 1768 && (
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, opacity: Math.min(1, sys * 1.4), transform: `translateY(${(1 - sys) * 120}px)` }}>
          <div style={{ position: 'absolute', left: 90, top: 560, width: 900, height: 840, borderRadius: 48, background: 'linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))', border: '2px solid rgba(198,231,219,0.26)', boxShadow: '0 40px 100px rgba(0,0,0,0.35)' }} />
          <div style={{ position: 'absolute', left: 140, top: 600, right: 140, display: 'flex', justifyContent: 'space-between', alignItems: 'center', direction: 'rtl', fontFamily: FONT }}>
            <div style={{ fontWeight: 900, fontSize: 48, color: '#fff' }}>منظومة متكاملة</div>
            <div style={{ fontWeight: 700, fontSize: 26, color: C.secondary300 }}>بتكبر معاك</div>
          </div>
          <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
            {NODES.map((n, i) => {
              const p = prog(f, 1787 + i * 3, 1801 + i * 3);
              const r = 270;
              const x = cx + Math.cos((n.a * Math.PI) / 180) * r;
              const y = cy - 40 + Math.sin((n.a * Math.PI) / 180) * r * 0.62;
              return <line key={i} x1={cx} y1={cy - 40} x2={lerp(cx, x, p)} y2={lerp(cy - 40, y, p)} stroke="rgba(109,209,187,0.6)" strokeWidth={3} />;
            })}
            {/* growth line */}
            <path d="M 170 1330 C 330 1320, 420 1280, 540 1240 S 780 1150, 910 1060" stroke={GLOW} strokeWidth={6} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${grow} 1`} />
          </svg>
          {NODES.map((n, i) => {
            const p = sp(f, 1789 + i * 3, 14);
            const r = 270;
            const x = cx + Math.cos((n.a * Math.PI) / 180) * r;
            const y = cy - 40 + Math.sin((n.a * Math.PI) / 180) * r * 0.62;
            return (
              <div key={i} style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${p})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 84, height: 84, borderRadius: 26, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 14px 30px rgba(0,0,0,0.3)' }}>
                  <Icon path={n.icon} size={46} color={C.primary} />
                </div>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 24, color: '#E6F4EE', whiteSpace: 'nowrap' }}>{n.label}</div>
              </div>
            );
          })}
          <div style={{ position: 'absolute', left: cx, top: cy - 40, transform: `translate(-50%, -50%) scale(${sp(f, 1782, 12)})` }}>
            <div style={{ width: 150, height: 150, borderRadius: 44, background: '#F8FAF7', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 ${10 + 4 * Math.sin(f / 8)}px rgba(109,209,187,0.18), 0 24px 60px rgba(0,0,0,0.4)` }}>
              <LogoMark size={110} id="sys-mark" />
            </div>
          </div>
          {f >= 1816 && (
            <div style={{ position: 'absolute', left: 850, top: 1150, transform: `translate(-50%, -50%) scale(${sp(f, 1826, 12)})`, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 20, background: `linear-gradient(135deg, ${GLOW}, #E2823A)`, fontFamily: FONT, fontWeight: 900, fontSize: 34, color: '#fff', boxShadow: '0 18px 40px rgba(0,0,0,0.3)', direction: 'rtl' }}>
              <Icon path={mdiArrowUpBold} size={34} color="#fff" />
              مبيعات أكتر
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ═══ overlays on the talking head / desk footage ═══════════════════════════

/** Merchant sets the selling price: $120 → $150 = +$30 commission. */
export const PriceFormula = ({ f, at, commissionAt, until }: { f: number; at: number; commissionAt: number; until: number }) => {
  if (f < at - 1 || f > until + 12) return null;
  const p = sp(f, at, 16, 0.8);
  const c = sp(f, commissionAt, 12);
  const out = prog(f, until, until + 10);
  const Pill = ({ v, l, tone, k }: { v: string; l: string; tone: 'w' | 'g' | 'o'; k: number }) => (
    <div style={{ width: 210, height: 128, borderRadius: 28, background: tone === 'o' ? `linear-gradient(135deg, ${GLOW}, #E2823A)` : tone === 'g' ? C.primary : 'rgba(255,255,255,0.97)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 22px 50px rgba(0,0,0,0.35)', transform: `scale(${lerp(0.7, 1, k)})`, opacity: Math.min(1, k * 1.6) }}>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 46, color: tone === 'w' ? C.ink : '#fff', direction: 'ltr' }}>{v}</div>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 24, color: tone === 'w' ? C.muted : 'rgba(255,255,255,0.9)' }}>{l}</div>
    </div>
  );
  return (
    <div style={{ position: 'absolute', left: 540, top: 1110, transform: `translate(-50%, -50%) translateY(${(1 - p) * 40}px)`, opacity: 1 - out, filter: out > 0 ? `blur(${out * 6}px)` : undefined, display: 'flex', alignItems: 'center', gap: 18, direction: 'rtl' }}>
      <Pill v="$120" l="سعر التاجر" tone="w" k={p} />
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 50, color: '#fff', opacity: p, textShadow: '0 4px 14px rgba(0,0,0,0.5)' }}>←</div>
      <Pill v="$150" l="سعر البيع" tone="g" k={sp(f, at + 8, 16, 0.8)} />
      {f >= commissionAt - 1 && <Pill v="+$30" l="عمولته" tone="o" k={c} />}
    </div>
  );
};

export const ZoneChips = ({ f, a, b, until }: { f: number; a: number; b: number; until: number }) => (
  <>
    <Callout f={f} at={a} until={until} x={540} y={1010} icon={mdiMotorbike} title="مناطق الإدارة" sub="الأدمن بيبعت مندوب التوصيل" />
    <Callout f={f} at={b} until={until} x={540} y={1150} icon={mdiTruckFastOutline} title="مناطق شركة الشحن" sub="الشركة بتبعت المندوب" tone="accent" />
  </>
);

export const TalkCallouts = ({ f }: { f: number }) => (
  <>
    <Callout f={f} at={41} until={88} x={540} y={1110} icon={mdiBullhornOutline} title="من غير مصاريف إعلانات" />
    <Callout f={f} at={90} until={160} x={540} y={1110} icon={mdiAccountGroupOutline} title="التجار يبيعولك" tone="accent" />
    <Callout f={f} at={178} until={212} x={540} y={1110} icon={mdiMapMarkerOutline} title="مشروع لعميل من سوريا" />
  </>
);

export const AskCard = ({ f, at, until }: { f: number; at: number; until: number }) => (
  <Callout f={f} at={at} until={until} x={540} y={1110} icon={mdiAccountGroupOutline} title="عايز تجار يبيعولك؟" sub="ويزوّدوا مبيعاتك" tone="dark" />
);


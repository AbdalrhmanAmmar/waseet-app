import {
  mdiAccountOutline,
  mdiAccountTieOutline,
  mdiArrowLeft,
  mdiArrowRight,
  mdiBankTransferOut,
  mdiCheck,
  mdiCheckCircle,
  mdiCheckDecagramOutline,
  mdiChevronLeft,
  mdiChevronRight,
  mdiClipboardCheckOutline,
  mdiClipboardTextOutline,
  mdiClockOutline,
  mdiCubeOutline,
  mdiEmailOutline,
  mdiEyeOutline,
  mdiFileDocumentEditOutline,
  mdiHomeVariant,
  mdiLockOutline,
  mdiMinus,
  mdiPlus,
  mdiRefresh,
  mdiStorefrontOutline,
  mdiTrashCanOutline,
  mdiTruckFastOutline,
} from '@mdi/js';
import type { CSSProperties, ReactNode } from 'react';
import { interpolate } from 'remotion';
import { LogoMark } from '../../components/LogoMark';
import { Icon } from '../../components/Text';
import { lerp, press, prog, sp, typed } from '../motion';
import { C, clamp, FONT, OUT } from '../theme';

const base: CSSProperties = { position: 'absolute', inset: 0, background: '#F6FAF7', fontFamily: FONT, direction: 'rtl', color: C.ink, overflow: 'hidden' };
const abs = (s: CSSProperties): CSSProperties => ({ position: 'absolute', ...s });
const usd = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const StatusBar = ({ dark = false }: { dark?: boolean }) => (
  <div style={abs({ top: 0, left: 0, right: 0, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 34px 0', fontFamily: FONT, fontWeight: 700, fontSize: 16, color: dark ? '#fff' : C.ink, direction: 'ltr', zIndex: 5 })}>
    <span>9:41</span>
    <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <svg width={18} height={12} viewBox="0 0 18 12">
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={i * 4.6} y={9 - i * 3} width={3.2} height={3 + i * 3} rx={1} fill={dark ? '#fff' : C.ink} />
        ))}
      </svg>
      <span style={{ width: 25, height: 12, borderRadius: 4, border: `1.5px solid ${dark ? '#fff' : C.ink}`, padding: 1.5, boxSizing: 'border-box' }}>
        <span style={{ display: 'block', width: '80%', height: '100%', borderRadius: 1.5, background: dark ? '#fff' : C.ink }} />
      </span>
    </span>
  </div>
);

const Brand = ({ top = 58 }: { top?: number }) => (
  <div style={abs({ top, right: 22, display: 'flex', alignItems: 'center', gap: 8 })}>
    <LogoMark size={40} id={`brand-${top}`} />
    <span style={{ fontSize: 28, fontWeight: 800, color: C.ink }}>وسيط</span>
  </div>
);

const IconBtn = ({ path, style }: { path: string; style?: CSSProperties }) => (
  <div style={{ width: 46, height: 46, borderRadius: 15, background: '#fff', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
    <Icon path={path} size={22} color={C.ink} />
  </div>
);

const Primary = ({ children, style, scale = 1, dim = false }: { children: ReactNode; style?: CSSProperties; scale?: number; dim?: boolean }) => (
  <div
    style={{
      height: 58,
      borderRadius: 18,
      background: dim ? '#7DBBA5' : C.primary,
      color: '#fff',
      fontSize: 19,
      fontWeight: 800,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      transform: `scale(${scale})`,
      boxShadow: dim ? undefined : '0 10px 22px rgba(20,125,100,0.28)',
      ...style,
    }}
  >
    {children}
  </div>
);

const Caret = ({ f, color = C.primary }: { f: number; color?: string }) => (
  <span style={{ display: 'inline-block', width: 2, height: 20, background: color, marginRight: 2, verticalAlign: 'middle', opacity: Math.floor(f / 8) % 2 ? 0.2 : 1 }} />
);

const Input = ({ value, f, focus, style, ltr, placeholder }: { value: string; f: number; focus: boolean; style: CSSProperties; ltr?: boolean; placeholder?: string }) => (
  <div
    style={{
      position: 'absolute',
      height: 52,
      borderRadius: 16,
      background: '#fff',
      border: `1.5px solid ${focus ? C.primary : C.border}`,
      boxShadow: focus ? '0 0 0 4px rgba(20,125,100,0.12)' : undefined,
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      fontSize: 17,
      fontWeight: 500,
      color: value ? C.ink : '#9AABA3',
      direction: ltr ? 'ltr' : 'rtl',
      boxSizing: 'border-box',
      ...style,
    }}
  >
    {value || (!focus ? placeholder : '')}
    {focus && <Caret f={f} />}
  </div>
);

// ─── 1 · sign-up: account type ───────────────────────────────────────────────

export const ROLES = [
  { key: 'merchant', title: 'تاجر', sub: 'منتجاتك ومبيعاتك وأرباحك', icon: mdiStorefrontOutline, x: 200, y: 296 },
  { key: 'sales', title: 'موظف مبيعات', sub: 'إنشاء الطلبات ومتابعة البيع', icon: mdiAccountTieOutline, x: 22, y: 296 },
  { key: 'admin', title: 'موظف إدارة', sub: 'تنظيم الطلبات ومتابعة حالتها', icon: mdiClipboardCheckOutline, x: 200, y: 448 },
  { key: 'courier', title: 'مندوب توصيل', sub: 'استلام مهام التوصيل وتنفيذها', icon: mdiTruckFastOutline, x: 22, y: 448 },
] as const;
export const ROLE_CARD = { w: 168, h: 138 };

/** Account type grid. `lit` = role index currently being named, `pickAt` = merchant tapped, `scroll` reveals personal data. */
export const SignUp = ({ f, lit, pickAt, scrollAt, nameFrom, nextAt }: { f: number; lit: number[]; pickAt: number; scrollAt: number; nameFrom: number; nextAt: number }) => {
  const picked = f >= pickAt;
  const check = sp(f, pickAt, 11);
  const scroll = prog(f, scrollAt, scrollAt + 16) * 290;
  const name = typed(f, 'Abdaal', nameFrom, nameFrom + 10);
  return (
    <div style={base}>
      <StatusBar />
      <div style={abs({ top: 0, left: 0, right: 0, height: 700, transform: `translateY(${-scroll}px)` })}>
        <IconBtn path={mdiArrowRight} style={abs({ top: 58, left: 22 })} />
        <Brand />
        <div style={abs({ top: 122, right: 22, fontSize: 31, fontWeight: 800 })}>إنشاء حساب جديد</div>
        <div style={abs({ top: 166, right: 22, fontSize: 15, color: C.muted })}>اختر نوع حسابك وأخبرنا قليلًا عنك.</div>
        {['1. الحساب', '2. التواصل', '3. التأكيد'].map((s, i) => (
          <div key={s} style={abs({ top: 206, right: 22 + i * 118, width: 110 })}>
            <div style={{ height: 5, borderRadius: 3, background: i === 0 ? C.primary : '#DCE7E1' }} />
            <div style={{ marginTop: 8, fontSize: 13, fontWeight: i === 0 ? 800 : 500, color: i === 0 ? C.primary : C.muted }}>{s}</div>
          </div>
        ))}
        <div style={abs({ top: 258, right: 22, fontSize: 19, fontWeight: 800 })}>نوع الحساب</div>
        {ROLES.map((r, i) => {
          const sel = i === 0 && picked;
          const on = lit.includes(i);
          const lift = on ? 1 : 0;
          return (
            <div
              key={r.key}
              style={abs({
                top: r.y,
                left: r.x,
                width: ROLE_CARD.w,
                height: ROLE_CARD.h,
                borderRadius: 20,
                background: sel ? '#EAF5EF' : '#fff',
                border: `1.5px solid ${sel ? C.primary : C.border}`,
                boxSizing: 'border-box',
                padding: '16px 16px',
                transform: `translateY(${-lift * 3}px) scale(${i === 0 ? press(f, pickAt) : 1})`,
                boxShadow: on ? '0 14px 26px rgba(16,62,50,0.16)' : '0 2px 6px rgba(16,62,50,0.04)',
              })}
            >
              <Icon path={r.icon} size={30} color={sel || on ? C.primary : '#4A5E56'} />
              <div style={{ marginTop: 10, fontSize: 20, fontWeight: 800 }}>{r.title}</div>
              <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.45, color: C.muted }}>{r.sub}</div>
              {sel && (
                <div style={abs({ top: 12, left: 12, width: 26, height: 26, borderRadius: 13, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${check})` })}>
                  <Icon path={mdiCheck} size={18} color="#fff" />
                </div>
              )}
            </div>
          );
        })}
        <div style={abs({ top: 612, left: 22, right: 22, height: 250, borderRadius: 22, background: '#fff', border: `1px solid ${C.border}` })}>
          <div style={abs({ top: 18, right: 18, fontSize: 19, fontWeight: 800 })}>البيانات الشخصية</div>
          <div style={abs({ top: 58, right: 18, fontSize: 14, fontWeight: 700 })}>الاسم الأول</div>
          <Input f={f} value={name} focus={f >= nameFrom - 2 && f < nextAt} placeholder="الاسم الأول" ltr={!!name} style={{ top: 84, left: 18, right: 18 }} />
          <div style={abs({ top: 150, right: 18, fontSize: 14, fontWeight: 700 })}>اسم العائلة</div>
          <Input f={f} value="" focus={false} placeholder="اسم العائلة" style={{ top: 176, left: 18, right: 18 }} />
        </div>
      </div>
      <div style={abs({ top: 700, left: 0, right: 0, bottom: 0, background: '#fff', borderTop: `1px solid ${C.border}` })}>
        <Primary scale={press(f, nextAt)} style={abs({ top: 14, left: 16, right: 16 })}>
          متابعة <Icon path={mdiArrowLeft} size={22} color="#fff" />
        </Primary>
        <div style={abs({ top: 84, left: 0, right: 0, textAlign: 'center', fontSize: 13, color: C.muted })}>الخطوة 1 من 3 · الحساب</div>
      </div>
    </div>
  );
};

// ─── 2 · welcome + admin approval ───────────────────────────────────────────

export const Welcome = ({ f, approveAt, loginAt }: { f: number; approveAt: number; loginAt: number }) => {
  const badge = sp(f, 4, 12);
  const ok = f >= approveAt;
  const flip = sp(f, approveAt, 11);
  return (
    <div style={base}>
      <StatusBar />
      <Brand />
      <div style={abs({ top: 150, left: 120, width: 150, height: 150, borderRadius: 75, background: '#E8F4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${lerp(0.6, 1, badge)})` })}>
        <Icon path={mdiCheckDecagramOutline} size={74} color={C.primary} />
      </div>
      <div style={abs({ top: 334, left: 0, right: 0, textAlign: 'center', fontSize: 32, fontWeight: 800 })}>أهلًا بك في وسيط</div>
      <div style={abs({ top: 386, left: 34, right: 34, textAlign: 'center', fontSize: 15.5, lineHeight: 1.7, color: C.muted })}>تم إنشاء حسابك بنجاح. سجّل الدخول للاطلاع على حالة الحساب وبدء استخدام التطبيق.</div>
      <div
        style={abs({
          top: 468,
          left: 55,
          right: 55,
          height: 54,
          borderRadius: 27,
          background: ok ? '#E6F5EE' : C.warm,
          border: `1.5px solid ${ok ? '#9BD3BE' : '#F5C99C'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          fontSize: 16.5,
          fontWeight: 800,
          color: ok ? C.primary : '#B8651C',
          transform: `scale(${ok ? lerp(0.92, 1, flip) : 1})`,
        })}
      >
        <Icon path={ok ? mdiCheckCircle : mdiClockOutline} size={24} color={ok ? C.primary : '#D9803A'} />
        {ok ? 'وافقت الإدارة على حسابك' : 'بانتظار موافقة الإدارة'}
      </div>
      <Primary scale={press(f, loginAt)} style={abs({ top: 560, left: 22, right: 22 })}>
        تسجيل الدخول <Icon path={mdiArrowLeft} size={22} color="#fff" />
      </Primary>
    </div>
  );
};

// ─── 3 · login ──────────────────────────────────────────────────────────────

export const Login = ({ f, typeAt, submitAt }: { f: number; typeAt: number; submitAt: number }) => {
  const email = typed(f, 'abdaal@dev.com', typeAt, typeAt + 9);
  const dots = Math.round(interpolate(f, [typeAt + 10, typeAt + 15], [0, 10], clamp));
  return (
    <div style={{ ...base, background: 'linear-gradient(180deg, #EEF6F1 0%, #F6FAF7 40%)' }}>
      <StatusBar />
      <div style={abs({ top: 92, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 })}>
        <LogoMark size={92} id="login-mark" />
        <div style={{ fontSize: 36, fontWeight: 900, color: C.primary800 }}>وسيط</div>
      </div>
      <div style={abs({ top: 270, left: 0, right: 0, textAlign: 'center', fontSize: 31, fontWeight: 800 })}>أهلًا بعودتك</div>
      <div style={abs({ top: 316, left: 0, right: 0, textAlign: 'center', fontSize: 15, color: C.muted })}>سجّل دخولك لمتابعة أعمالك مع وسيط.</div>
      <div style={abs({ top: 362, left: 20, right: 20, height: 318, borderRadius: 24, background: '#fff', border: `1px solid ${C.border}`, boxShadow: '0 10px 30px rgba(16,62,50,0.06)' })}>
        <div style={abs({ top: 20, right: 20, fontSize: 14.5, fontWeight: 700 })}>البريد الإلكتروني</div>
        <Input f={f} value={email} ltr focus={f >= typeAt - 2 && f < typeAt + 10} style={{ top: 46, left: 18, right: 18 }} />
        <div style={abs({ top: 62, left: 34 })}>
          <Icon path={mdiEmailOutline} size={22} color="#8FA39A" />
        </div>
        <div style={abs({ top: 116, right: 20, fontSize: 14.5, fontWeight: 700 })}>كلمة المرور</div>
        <Input f={f} value={'•'.repeat(dots)} ltr focus={f >= typeAt + 10 && f < submitAt} style={{ top: 142, left: 18, right: 18, letterSpacing: 3 }} />
        <div style={abs({ top: 158, right: 34 })}>
          <Icon path={mdiLockOutline} size={22} color="#8FA39A" />
        </div>
        <Primary scale={press(f, submitAt)} style={abs({ top: 226, left: 18, right: 18, background: C.primary800 })}>
          تسجيل الدخول <Icon path={mdiArrowLeft} size={22} color="#fff" />
        </Primary>
      </div>
    </div>
  );
};

// ─── 4 · home ───────────────────────────────────────────────────────────────

const TabBar = () => (
  <div style={abs({ top: 760, left: 0, right: 0, bottom: 0, background: '#fff', borderTop: `1px solid ${C.border}`, direction: 'rtl' })}>
    {(
      [
        [mdiHomeVariant, 'الرئيسية', 330],
        [mdiCubeOutline, 'المنتجات', 255],
        [mdiClipboardTextOutline, 'الطلبات', 110],
        [mdiAccountOutline, 'حسابي', 34],
      ] as const
    ).map(([icon, label, x], i) => (
      <div key={label} style={abs({ top: 14, left: x - 4, width: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700, color: i === 0 ? C.primary : C.muted })}>
        <div style={{ width: 48, height: 30, borderRadius: 15, background: i === 0 ? '#E3F2EB' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon path={icon} size={23} color={i === 0 ? C.primary : C.muted} />
        </div>
        {label}
      </div>
    ))}
    <div style={abs({ top: -22, left: 165, width: 60, height: 60, borderRadius: 30, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 18px rgba(20,125,100,0.35)', border: '4px solid #fff' })}>
      <Icon path={mdiPlus} size={30} color="#fff" />
    </div>
    <div style={abs({ top: 46, left: 160, width: 70, textAlign: 'center', fontSize: 12, fontWeight: 800, color: C.primary })}>طلب جديد</div>
  </div>
);

export const HOME = { balance: { x: 16, y: 140, w: 358, h: 236 }, withdraw: { x: 195, y: 330 }, create: { x: 195, y: 428 } };

/** Merchant home. `credit` animates the balance from 0 → amount; `withdrawAt` taps «طلب سحب»; `createAt` taps «إنشاء طلب جديد». */
export const Home = ({ f, credit, createAt, withdrawAt, sheet }: { f: number; credit?: { at: number; amount: number }; createAt?: number; withdrawAt?: number; sheet?: ReactNode }) => {
  const v = credit ? credit.amount * prog(f, credit.at, credit.at + 22, OUT) : 0;
  const chip = credit ? sp(f, credit.at + 4, 12) : 0;
  const spin = f * 9;
  return (
    <div style={base}>
      <StatusBar />
      <div style={abs({ top: 62, right: 22, fontSize: 14, color: C.muted })}>مساء الخير، Abdaal</div>
      <div style={abs({ top: 84, right: 22, fontSize: 29, fontWeight: 800, color: C.primary800 })}>نظرة على حسابك</div>
      <div style={abs({ top: 66, left: 20, width: 52, height: 52, borderRadius: 26, background: C.deep, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800 })}>A</div>
      <div style={abs({ top: 140, left: 16, right: 16, height: 236, borderRadius: 26, background: 'linear-gradient(225deg, #1C6E57, #0E4134)', color: '#fff', overflow: 'hidden', boxShadow: '0 16px 30px rgba(16,62,50,0.25)' })}>
        <div style={abs({ top: -80, left: -60, width: 240, height: 240, borderRadius: 120, background: 'radial-gradient(closest-side, rgba(255,255,255,0.10), transparent)' })} />
        <div style={abs({ top: 26, right: 22, fontSize: 16, color: '#CFE8DE' })}>رصيد حسابك</div>
        {[mdiEyeOutline, mdiRefresh].map((p, i) => (
          <div key={p} style={abs({ top: 18, left: 20 + i * 52, width: 44, height: 44, borderRadius: 22, border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: i === 1 && credit && f >= credit.at - 14 && f < credit.at ? `rotate(${spin}deg)` : undefined })}>
            <Icon path={p} size={22} color="#fff" />
          </div>
        ))}
        <div style={abs({ top: 72, right: 22, direction: 'ltr', display: 'flex', alignItems: 'baseline', gap: 8 })}>
          <span style={{ fontSize: 15, color: '#CFE8DE', fontWeight: 700 }}>USD</span>
          <span style={{ fontSize: 46, fontWeight: 800, transform: `scale(${1 + 0.05 * Math.sin(Math.min(1, chip) * Math.PI)})`, display: 'inline-block' }}>{usd(v)}</span>
        </div>
        {credit && f >= credit.at && (
          <div style={abs({ top: 84, left: 22, padding: '5px 12px', borderRadius: 999, background: C.accent, fontSize: 15, fontWeight: 800, direction: 'ltr', transform: `scale(${chip}) translateY(${(1 - chip) * 10}px)` })}>
            +{usd(credit.amount)}
          </div>
        )}
        <div style={abs({ top: 140, right: 22, fontSize: 13, color: '#CFE8DE', display: 'flex', alignItems: 'center', gap: 8 })}>
          <span style={{ width: 7, height: 7, borderRadius: 4, background: '#7BE0B4' }} />
          آخر تحديث: الآن
        </div>
        <div style={abs({ top: 168, left: 22, right: 22, height: 50, borderRadius: 16, background: '#fff', color: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 18, fontWeight: 800, transform: `scale(${withdrawAt ? press(f, withdrawAt) : 1})` })}>
          طلب سحب <Icon path={mdiBankTransferOut} size={22} color={C.ink} />
        </div>
      </div>
      <Primary scale={createAt ? press(f, createAt) : 1} style={abs({ top: 398, left: 16, right: 16 })}>
        إنشاء طلب جديد <Icon path={mdiPlus} size={22} color="#fff" />
      </Primary>
      <div style={abs({ top: 470, left: 16, right: 16, height: 54, borderRadius: 18, background: '#fff', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 18, fontWeight: 800, color: C.primary })}>
        متابعة الطلبات <Icon path={mdiChevronLeft} size={22} color={C.primary} />
      </div>
      {(
        [
          [mdiClipboardTextOutline, 'كل الطلبات', '1', C.ink],
          [mdiClockOutline, 'قيد المعالجة', '1', '#C27628'],
          [mdiCheckCircle, 'تم التسليم', credit && f >= credit.at ? '1' : '0', C.primary],
        ] as const
      ).map(([icon, label, n, col], i) => (
        <div key={label} style={abs({ top: 542, right: 16 + i * 122, width: 112, height: 112, borderRadius: 20, background: '#fff', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 })}>
          <Icon path={icon} size={26} color={col} />
          <div style={{ fontSize: 22, fontWeight: 800 }}>{n}</div>
          <div style={{ fontSize: 12.5, color: C.muted }}>{label}</div>
        </div>
      ))}
      <TabBar />
      {sheet}
    </div>
  );
};

/** Withdrawal bottom sheet over Home: request → pending review → approved. */
export const WithdrawSheet = ({ f, at, confirmAt, approveAt, amount }: { f: number; at: number; confirmAt: number; approveAt: number; amount: number }) => {
  if (f < at) return null;
  const p = prog(f, at, at + 14, OUT);
  const sent = f >= confirmAt + 4;
  const ok = f >= approveAt;
  const pop = sp(f, ok ? approveAt : confirmAt + 4, 11);
  return (
    <>
      <div style={abs({ inset: 0, background: `rgba(10,30,24,${0.4 * p})`, zIndex: 20 })} />
      <div style={abs({ left: 0, right: 0, bottom: 0, height: 430, borderRadius: '30px 30px 0 0', background: '#fff', transform: `translateY(${(1 - p) * 440}px)`, zIndex: 21, padding: '0 22px', boxSizing: 'border-box' })}>
        <div style={abs({ top: 10, left: 175, width: 40, height: 5, borderRadius: 3, background: '#D5DFDA' })} />
        {!sent ? (
          <>
            <div style={abs({ top: 36, right: 22, fontSize: 22, fontWeight: 800 })}>طلب سحب الأرباح</div>
            <div style={abs({ top: 72, right: 22, fontSize: 14.5, color: C.muted })}>الرصيد المتاح للسحب</div>
            <div style={abs({ top: 110, left: 22, right: 22, height: 96, borderRadius: 20, background: '#F1F8F4', border: `1.5px solid ${C.primary}`, display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'ltr', gap: 10 })}>
              <span style={{ fontSize: 42, fontWeight: 800, color: C.primary800 }}>{usd(amount)}</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: C.muted }}>USD</span>
            </div>
            <div style={abs({ top: 226, right: 22, fontSize: 14, color: C.muted })}>هتراجع الإدارة الطلب وتحوّل المبلغ بعد الموافقة.</div>
            <Primary scale={press(f, confirmAt)} style={abs({ top: 290, left: 22, right: 22 })}>
              تأكيد طلب السحب
            </Primary>
          </>
        ) : (
          <div style={abs({ top: 40, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' })}>
            <div style={{ width: 104, height: 104, borderRadius: 52, background: ok ? C.primary : C.warm, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${lerp(0.7, 1, pop)})`, boxShadow: ok ? `0 0 0 ${14 * pop}px rgba(20,125,100,0.12)` : undefined }}>
              <Icon path={ok ? mdiCheck : mdiClockOutline} size={56} color={ok ? '#fff' : '#D9803A'} />
            </div>
            <div style={{ marginTop: 20, fontSize: 23, fontWeight: 800 }}>{ok ? 'تمت الموافقة على السحب' : 'طلبك قيد المراجعة'}</div>
            <div style={{ marginTop: 8, fontSize: 15, color: C.muted }}>{ok ? 'المبلغ في طريقه إليك' : 'الإدارة بتراجع طلب السحب الآن'}</div>
            <div style={{ marginTop: 18, fontSize: 32, fontWeight: 800, direction: 'ltr', color: C.primary800 }}>{usd(amount)} USD</div>
          </div>
        )}
      </div>
    </>
  );
};

// ─── 5 · create order ───────────────────────────────────────────────────────

export const CREATE = { content: 112, footer: 724 };

/** Create order: add product → qty 2 → sale price 50 → color → summary 103.00 USD → review. */
export const CreateOrder = ({
  f,
  addAt,
  plusAt,
  priceFrom,
  colorFrom,
  scrollAt,
  reviewAt,
}: {
  f: number;
  addAt: number;
  plusAt: number;
  priceFrom: number;
  colorFrom: number;
  scrollAt: number;
  reviewAt: number;
}) => {
  const card = sp(f, addAt + 3, 16);
  const hasCard = f >= addAt + 3;
  const qty = f >= plusAt ? 2 : 1;
  const price = typed(f, '50', priceFrom, priceFrom + 5);
  const color = typed(f, 'أسود', colorFrom, colorFrom + 8);
  const lineTotal = price === '50' ? qty * 50 : 0;
  const scroll = prog(f, scrollAt, scrollAt + 18) * 330;
  const done = sp(f, reviewAt + 6, 13);
  const loading = f >= reviewAt && f < reviewAt + 6;
  return (
    <div style={base}>
      <StatusBar />
      <div style={abs({ top: 50, left: 0, right: 0, height: 62, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, background: '#F6FAF7', zIndex: 3 })}>
        إنشاء طلب جديد
        <IconBtn path={mdiArrowRight} style={abs({ top: 8, right: 18, background: '#EAF3EE', border: 'none' })} />
        <div style={abs({ top: 18, left: 24 })}>
          <Icon path={mdiFileDocumentEditOutline} size={26} color={C.primary} />
        </div>
      </div>
      <div style={abs({ top: CREATE.content, left: 0, right: 0, height: 1000, transform: `translateY(${-scroll}px)` })}>
        <div style={abs({ top: 6, left: 16, right: 16, height: hasCard ? 470 : 120, borderRadius: 24, background: '#fff', border: `1px solid ${C.border}`, overflow: 'hidden' })}>
          {!hasCard && (
            <>
              <div style={abs({ top: 16, right: 18, fontSize: 18, fontWeight: 800 })}>المنتجات</div>
              <div style={abs({ top: 48, left: 16, right: 16, height: 52, borderRadius: 16, background: '#EEF6F1', border: `1px solid #D7E9DF`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 17, fontWeight: 800, color: C.primary, transform: `scale(${press(f, addAt)})` })}>
                إضافة منتج <Icon path={mdiPlus} size={20} color={C.primary} />
              </div>
            </>
          )}
          {hasCard && (
            <div style={{ position: 'absolute', inset: 0, opacity: Math.min(1, card * 1.4), transform: `translateY(${(1 - card) * 30}px)` }}>
              <div style={abs({ top: 18, right: 18, width: 50, height: 50, borderRadius: 15, background: '#E8F4EE', display: 'flex', alignItems: 'center', justifyContent: 'center' })}>
                <Icon path={mdiCubeOutline} size={28} color={C.primary} />
              </div>
              <div style={abs({ top: 18, right: 80, fontSize: 17, fontWeight: 800 })}>الجهاز المصفح KGTEL 8800</div>
              <div style={abs({ top: 44, right: 80, fontSize: 13.5, color: C.muted })}>#187140 · متاح 193 قطعة</div>
              <div style={abs({ top: 22, left: 16, width: 40, height: 40, borderRadius: 12, background: '#FBEDEC', display: 'flex', alignItems: 'center', justifyContent: 'center' })}>
                <Icon path={mdiTrashCanOutline} size={22} color="#B83D3D" />
              </div>
              <div style={abs({ top: 88, left: 0, right: 0, textAlign: 'center', fontSize: 15, fontWeight: 700 })}>الكمية</div>
              <div style={abs({ top: 114, right: 30, width: 52, height: 52, borderRadius: 16, background: '#E8F4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${press(f, plusAt)})` })}>
                <Icon path={mdiPlus} size={26} color={C.primary} />
              </div>
              <div style={abs({ top: 114, left: 120, width: 118, height: 52, borderRadius: 16, background: '#F3F8F5', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800 })}>
                <span style={{ display: 'inline-block', transform: `scale(${f >= plusAt ? lerp(1.35, 1, sp(f, plusAt, 12)) : 1})` }}>{qty}</span>
              </div>
              <div style={abs({ top: 114, left: 30, width: 52, height: 52, borderRadius: 16, background: '#E8F4EE', display: 'flex', alignItems: 'center', justifyContent: 'center' })}>
                <Icon path={mdiMinus} size={26} color={C.primary} />
              </div>
              <div style={abs({ top: 186, right: 22, fontSize: 15, fontWeight: 700 })}>سعر البيع للعميل (USD)</div>
              <Input f={f} value={price} ltr focus={f >= priceFrom - 2 && f < colorFrom - 1} style={{ top: 212, left: 18, right: 18, background: '#F6FAF7' }} />
              <div style={abs({ top: 272, right: 22, fontSize: 13.5, color: C.muted })}>
                فرق السعر المتوقع للقطعة: <b style={{ color: price === '50' ? C.primary : C.muted, direction: 'ltr', unicodeBidi: 'isolate' }}>17.00 USD</b>
              </div>
              <div style={abs({ top: 306, right: 22, fontSize: 15, fontWeight: 700 })}>اللون *</div>
              <Input f={f} value={color} focus={f >= colorFrom - 2 && f < scrollAt} style={{ top: 332, left: 18, right: 18, background: '#F6FAF7' }} />
              <div style={abs({ top: 410, right: 22, fontSize: 15, color: C.muted })}>إجمالي المنتج</div>
              <div style={abs({ top: 404, left: 22, fontSize: 21, fontWeight: 800, direction: 'ltr' })}>{usd(lineTotal)} USD</div>
            </div>
          )}
        </div>
        {hasCard && (
          <>
            <div style={abs({ top: 492, left: 16, right: 16, height: 52, borderRadius: 16, background: '#EEF6F1', border: `1px solid #D7E9DF`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 17, fontWeight: 800, color: C.primary })}>
              إضافة منتج <Icon path={mdiPlus} size={20} color={C.primary} />
            </div>
            <div style={abs({ top: 562, left: 16, right: 16, height: 300, borderRadius: 24, background: '#fff', border: `1px solid ${C.border}` })}>
              <div style={abs({ top: 20, right: 20, fontSize: 20, fontWeight: 800 })}>ملخص الطلب</div>
              {(
                [
                  ['عدد المنتجات', '1'],
                  ['عدد القطع', String(qty)],
                  ['قيمة المنتجات', `${usd(lineTotal)} USD`],
                  ['رسوم التوصيل', '3.00 USD'],
                  ['الإجمالي المتوقع', `${usd(lineTotal + 3)} USD`],
                ] as const
              ).map(([k, v], i) => (
                <div key={k} style={abs({ top: 66 + i * 42, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', fontSize: i === 4 ? 17 : 15.5, color: i === 4 ? C.ink : C.muted, fontWeight: i === 4 ? 800 : 500 })}>
                  <span>{k}</span>
                  <span style={{ direction: 'ltr', fontWeight: 800, color: C.ink, fontSize: i === 4 ? 19 : 16 }}>{v}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div style={abs({ top: CREATE.footer, left: 0, right: 0, bottom: 0, background: '#fff', borderTop: `1px solid ${C.border}`, zIndex: 3 })}>
        <div style={abs({ top: 14, right: 20, fontSize: 15, color: C.muted })}>الإجمالي المتوقع</div>
        <div style={abs({ top: 10, left: 20, fontSize: 21, fontWeight: 800, direction: 'ltr' })}>{usd(lineTotal + (hasCard ? 3 : 0))} USD</div>
        <Primary dim={loading} scale={press(f, reviewAt)} style={abs({ top: 46, left: 16, right: 16, height: 56 })}>
          {loading ? '...' : (
            <>
              مراجعة الطلب <Icon path={mdiArrowLeft} size={22} color="#fff" />
            </>
          )}
        </Primary>
      </div>
      {f >= reviewAt + 6 && (
        <div style={abs({ inset: 0, zIndex: 10, background: `rgba(246,250,247,${Math.min(0.96, done)})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 })}>
          <div style={{ width: 120, height: 120, borderRadius: 60, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${done})`, boxShadow: `0 0 0 ${18 * done}px rgba(20,125,100,0.12)` }}>
            <Icon path={mdiCheck} size={70} color="#fff" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, opacity: done }}>تم إنشاء الطلب</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.muted, opacity: done, direction: 'ltr' }}>#305376 · 103.00 USD</div>
        </div>
      )}
    </div>
  );
};

// ─── 6 · order details + status update ──────────────────────────────────────

export const ORDER = { status: { x: 228, y: 128, w: 130, h: 40 }, update: { x: 195, y: 616 } };

const STATUS_OPTIONS = [
  { label: 'مؤكد', sub: 'الطلب جاهز للتجهيز', icon: mdiCheckDecagramOutline },
  { label: 'مع المندوب', sub: 'خرج للتوصيل', icon: mdiTruckFastOutline },
  { label: 'تم التسليم', sub: 'وصل الطلب للعميل', icon: mdiCheckCircle },
];

export const OrderDetails = ({ f, updateAt, pickAt, saveAt }: { f: number; updateAt: number; pickAt: number; saveAt: number }) => {
  const sheet = f >= updateAt + 2 && f < saveAt + 14 ? prog(f, updateAt + 2, updateAt + 16, OUT) * (1 - prog(f, saveAt + 2, saveAt + 14)) : 0;
  const delivered = f >= saveAt + 6;
  const flip = sp(f, saveAt + 6, 10);
  return (
    <div style={base}>
      <StatusBar />
      <div style={abs({ top: 52, left: 0, right: 0, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, borderBottom: `1px solid ${C.border}` })}>
        <span>
          طلب <span style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>#305376</span>
        </span>
        <div style={abs({ top: 6, left: 16, width: 42, height: 42, borderRadius: 13, background: '#fff', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' })}>
          <Icon path={mdiChevronRight} size={24} color={C.ink} />
        </div>
      </div>
      <div style={abs({ top: 116, left: 20, right: 20, height: 280, borderRadius: 26, background: delivered ? '#E7F5EE' : '#EEF5F1', transition: undefined })}>
        <div
          style={abs({
            top: 14,
            right: 16,
            height: 40,
            padding: '0 16px',
            borderRadius: 14,
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 16,
            fontWeight: 800,
            color: delivered ? '#fff' : C.primary,
            ...(delivered ? { background: C.primary, transform: `scale(${lerp(0.85, 1, flip)})`, boxShadow: `0 0 0 ${8 * flip}px rgba(20,125,100,0.14)` } : {}),
          })}
        >
          {delivered && <Icon path={mdiCheck} size={18} color="#fff" />}
          {delivered ? 'تم التسليم' : 'قيد المعالجة'}
        </div>
        <div style={abs({ top: 20, left: 22 })}>
          <Icon path={mdiCubeOutline} size={32} color={C.primary} />
        </div>
        <div style={abs({ top: 70, right: 18, fontSize: 13.5, color: C.muted, direction: 'ltr' })}>10/10/2026 · 4:06 م</div>
        <div style={abs({ top: 104, right: 18, fontSize: 15, color: C.muted })}>إجمالي الطلب المسجل</div>
        <div style={abs({ top: 132, right: 18, fontSize: 38, fontWeight: 800, color: C.primary800, direction: 'ltr' })}>103.00 USD</div>
        <div style={abs({ top: 200, right: 18, fontSize: 15, color: C.muted })}>عدد القطع: 2</div>
        <div style={abs({ top: 228, right: 18, fontSize: 15, color: C.muted })}>
          ربح التاجر: <b style={{ color: C.primary, direction: 'ltr', unicodeBidi: 'isolate' }}>34.00 USD</b>
        </div>
      </div>
      <div style={abs({ top: 412, left: 20, right: 20, height: 128, borderRadius: 24, background: '#fff', border: `1px solid ${C.border}` })}>
        <div style={abs({ top: 20, right: 20, fontSize: 22, fontWeight: 800 })}>توصيل داخلي</div>
        <div style={abs({ top: 58, right: 20, left: 20, fontSize: 14.5, lineHeight: 1.6, color: C.muted })}>تظهر الإجراءات المسموحة حسب دورك وحالة الطلب وملكيته.</div>
      </div>
      <div style={abs({ top: 556, left: 20, right: 20, height: 150, borderRadius: 24, background: '#fff', border: `1px solid ${C.border}` })}>
        <div style={abs({ top: 18, right: 20, fontSize: 22, fontWeight: 800 })}>إجراءات الطلب</div>
        <Primary scale={press(f, updateAt)} style={abs({ top: 64, left: 18, right: 18 })}>
          تحديث حالة الطلب
        </Primary>
      </div>
      {sheet > 0 && (
        <>
          <div style={abs({ inset: 0, background: `rgba(10,30,24,${0.38 * sheet})`, zIndex: 20 })} />
          <div style={abs({ left: 0, right: 0, bottom: 0, height: 400, borderRadius: '30px 30px 0 0', background: '#fff', transform: `translateY(${(1 - sheet) * 410}px)`, zIndex: 21 })}>
            <div style={abs({ top: 10, left: 175, width: 40, height: 5, borderRadius: 3, background: '#D5DFDA' })} />
            <div style={abs({ top: 30, right: 22, fontSize: 21, fontWeight: 800 })}>تحديث حالة الطلب</div>
            {STATUS_OPTIONS.map((o, i) => {
              const sel = i === 2 && f >= pickAt;
              return (
                <div key={o.label} style={abs({ top: 78 + i * 74, left: 18, right: 18, height: 62, borderRadius: 18, border: `1.5px solid ${sel ? C.primary : C.border}`, background: sel ? '#EAF5EF' : '#fff', display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', transform: `scale(${i === 2 ? press(f, pickAt) : 1})` })}>
                  <Icon path={o.icon} size={26} color={sel ? C.primary : '#5B6F66'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, fontWeight: 800 }}>{o.label}</div>
                    <div style={{ fontSize: 13, color: C.muted }}>{o.sub}</div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: 11, border: `2px solid ${sel ? C.primary : '#B9C8C1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {sel && <div style={{ width: 11, height: 11, borderRadius: 6, background: C.primary }} />}
                  </div>
                </div>
              );
            })}
            <Primary scale={press(f, saveAt)} style={abs({ top: 316, left: 18, right: 18 })}>
              حفظ الحالة
            </Primary>
          </div>
        </>
      )}
    </div>
  );
};

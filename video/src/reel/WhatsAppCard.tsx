import { mdiWhatsapp } from '@mdi/js';
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Icon } from '../components/Text';
import { C, CAPTION_FONT, clamp } from './theme';

export const CONTACT = { handle: '@abdaal.dev', phone: '+20 101 740 4798' };
const WA = '#25D366';

export const TYPE_START = 16;
export const TYPE_FRAMES_PER_CHAR = 1.3;

/** End card: same beats as the reference (card rises, avatar, handle, number), rebuilt in Waseet's identity. */
export const WhatsAppCard = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame, fps, config: { damping: 15, mass: 1 } });
  const avatar = spring({ frame: frame - 6, fps, config: { damping: 10 } });
  const handle = spring({ frame: frame - 11, fps, config: { damping: 14 } });
  const typed = Math.max(0, Math.floor((frame - TYPE_START) / TYPE_FRAMES_PER_CHAR));
  const button = spring({ frame: frame - (TYPE_START + CONTACT.phone.length * TYPE_FRAMES_PER_CHAR + 4), fps, config: { damping: 11 } });
  const ring = frame * 3;
  const dim = interpolate(frame, [0, 12], [0, 0.45], clamp);

  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: `rgba(4,22,16,${dim})` }} />
      <div
        style={{
          position: 'absolute',
          left: 170,
          width: 740,
          top: 640,
          transform: `translateY(${(1 - rise) * 900}px) rotate(${(1 - rise) * -6}deg)`,
          borderRadius: 56,
          padding: '64px 48px 52px',
          background: `linear-gradient(160deg, ${C.deep} 0%, #0B2C23 70%)`,
          border: '2px solid rgba(198,231,219,0.22)',
          boxShadow: '0 60px 140px rgba(0,0,0,0.55), 0 0 120px rgba(37,211,102,0.12)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: -200, left: -120, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(242,154,74,0.22), transparent)' }} />
        <div style={{ position: 'relative', width: 250, height: 250, transform: `scale(${avatar})` }}>
          <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', background: `conic-gradient(from ${ring}deg, ${C.accent}, ${C.primary300}, ${WA}, ${C.accent})` }} />
          <div style={{ position: 'absolute', inset: -2, borderRadius: '50%', background: C.deep }} />
          <Img src={staticFile('footage/avatar.png')} style={{ position: 'absolute', inset: 6, width: 238, height: 238, borderRadius: '50%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 4, width: 76, height: 76, borderRadius: 38, background: WA, border: `6px solid ${C.deep}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon path={mdiWhatsapp} size={44} color="#fff" />
          </div>
        </div>
        <div style={{ marginTop: 34, fontFamily: CAPTION_FONT, fontWeight: 800, fontSize: 64, color: '#fff', direction: 'ltr', opacity: handle, transform: `translateY(${(1 - handle) * 24}px)` }}>
          {CONTACT.handle}
        </div>
        <div style={{ marginTop: 6, fontFamily: CAPTION_FONT, fontWeight: 600, fontSize: 32, color: C.mint, opacity: handle }}>تواصل معايا على الواتساب</div>
        <div
          style={{
            marginTop: 34,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '18px 30px',
            borderRadius: 28,
            background: 'rgba(37,211,102,0.12)',
            border: '2px solid rgba(37,211,102,0.35)',
            opacity: interpolate(frame, [TYPE_START - 4, TYPE_START], [0, 1], clamp),
            direction: 'ltr',
            minWidth: 520,
            justifyContent: 'center',
          }}
        >
          <Icon path={mdiWhatsapp} size={46} color={WA} />
          <span style={{ fontFamily: CAPTION_FONT, fontWeight: 800, fontSize: 50, color: WA, letterSpacing: 1 }}>
            {CONTACT.phone.slice(0, typed)}
            <span style={{ opacity: typed < CONTACT.phone.length && Math.floor(frame / 8) % 2 === 0 ? 1 : 0 }}>|</span>
          </span>
        </div>
        <div
          style={{
            marginTop: 30,
            padding: '20px 64px',
            borderRadius: 26,
            background: `linear-gradient(90deg, ${C.accent}, #E8843A)`,
            fontFamily: CAPTION_FONT,
            fontWeight: 800,
            fontSize: 40,
            color: '#fff',
            transform: `scale(${button})`,
            boxShadow: '0 16px 40px rgba(242,154,74,0.35)',
          }}
        >
          ابعتلي رسالة
        </div>
      </div>
    </>
  );
};

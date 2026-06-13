/* Matter Mac Agent — refined UI screens.
   Light/Dark tokens, Lucide-style inline icons, macOS window chrome,
   four screen contents, two navigation layouts (top tabs / sidebar),
   and the comparison canvas. */

const { useState } = React;

/* ----------------------------------------------------------------- tokens */
const FONT = '-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Segoe UI", system-ui, sans-serif';
const MONO = '"SF Mono", ui-monospace, "JetBrains Mono", Menlo, monospace';

const TOKENS = {
  light: {
    pageframe: '#ffffff',
    winBg: '#F4F4F6',
    titlebar: 'rgba(247,247,249,0.86)',
    titleText: '#1D1D1F',
    hairline: 'rgba(0,0,0,0.08)',
    card: '#FFFFFF',
    cardBorder: 'rgba(0,0,0,0.055)',
    cardShadow: '0 1px 2px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(0,0,0,0.04)',
    text: '#1D1D1F',
    text2: '#62626A',
    text3: '#9A9AA1',
    accent: '#0E9E73',
    accentHover: '#0C8C66',
    accentText: '#0C7C57',
    accentSoft: 'rgba(14,158,115,0.12)',
    accentSoftBorder: 'rgba(14,158,115,0.22)',
    fieldBg: '#FFFFFF',
    fieldBorder: 'rgba(0,0,0,0.16)',
    fieldShadow: '0 1px 1px rgba(0,0,0,0.04)',
    okBg: '#E3F5EC', okText: '#0E7A57',
    okDotColor: '#1AAB6E',
    warnBg: '#FBEFD6', warnText: '#8A5A00',
    sidebarBg: 'rgba(244,244,247,0.92)',
    sidebarItemText: '#3A3A3F',
    sidebarHover: 'rgba(0,0,0,0.05)',
    track: '#E4E4E8',
    grip: '#C8C8CE',
    qrBg: '#FFFFFF',
    qrMod: '#1A1A1A',
  },
  dark: {
    pageframe: '#0E0E10',
    winBg: '#1C1C1E',
    titlebar: 'rgba(42,42,45,0.86)',
    titleText: '#F5F5F7',
    hairline: 'rgba(255,255,255,0.10)',
    card: '#2A2A2D',
    cardBorder: 'rgba(255,255,255,0.075)',
    cardShadow: '0 1px 2px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(0,0,0,0.3)',
    text: '#F5F5F7',
    text2: '#9C9CA3',
    text3: '#6A6A70',
    accent: '#30D69B',
    accentHover: '#48E0AC',
    accentText: '#56DDA8',
    accentSoft: 'rgba(48,214,155,0.16)',
    accentSoftBorder: 'rgba(48,214,155,0.28)',
    fieldBg: '#1F1F22',
    fieldBorder: 'rgba(255,255,255,0.16)',
    fieldShadow: 'none',
    okBg: 'rgba(48,214,155,0.16)', okText: '#56DDA8',
    okDotColor: '#36D89E',
    warnBg: 'rgba(240,184,74,0.18)', warnText: '#F0B84A',
    sidebarBg: 'rgba(32,32,35,0.94)',
    sidebarItemText: '#C7C7CD',
    sidebarHover: 'rgba(255,255,255,0.06)',
    track: '#3A3A3E',
    grip: '#4A4A50',
    qrBg: '#FFFFFF',
    qrMod: '#1A1A1A',
  },
};

/* ------------------------------------------------------------------ icons */
function Svg({ d, size = 18, sw = 1.7, fill, children, vb = 24, style }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} fill={fill || 'none'}
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flex: 'none', ...style }}>
      {children || <path d={d} />}
    </svg>
  );
}
const IconHome = (p) => <Svg {...p}><path d="M3 10.2 12 3l9 7.2" /><path d="M5 9.4V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.4" /></Svg>;
const IconSwitch = (p) => <Svg {...p}><rect x="2.5" y="7" width="19" height="10" rx="5" /><circle cx="16.5" cy="12" r="2.6" fill="currentColor" stroke="none" /></Svg>;
const IconMacro = (p) => <Svg {...p}><path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6Z" /><path d="M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z" /></Svg>;
const IconSettings = (p) => <Svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 13.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V20a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1.05-1.5 1.6 1.6 0 0 0-1.77.32l-.1.1a2 2 0 1 1-2.83-2.83l.1-.1a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.5-1.02H4a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1.06 1.6 1.6 0 0 0-.32-1.77l-.1-.1A2 2 0 1 1 8 2.4l.1.1a1.6 1.6 0 0 0 1.77.32H10a1.6 1.6 0 0 0 1-1.5V1a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.77-.32l.1-.1a2 2 0 1 1 2.83 2.83l-.1.1a1.6 1.6 0 0 0-.32 1.77V8a1.6 1.6 0 0 0 1.5 1H23a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" /></Svg>;
const IconServer = (p) => <Svg {...p}><rect x="3" y="4" width="18" height="7" rx="2" /><rect x="3" y="13" width="18" height="7" rx="2" /><path d="M7 7.5h.01M7 16.5h.01" /></Svg>;
const IconShield = (p) => <Svg {...p}><path d="M12 3 5 6v5.5c0 4.2 2.9 7.6 7 8.5 4.1-.9 7-4.3 7-8.5V6Z" /><path d="m9.2 11.8 2 2 3.6-4" /></Svg>;
const IconChevrons = (p) => <Svg {...p} sw={1.9}><path d="m8 9 4-4 4 4" /><path d="m16 15-4 4-4-4" /></Svg>;
const IconPlus = (p) => <Svg {...p} sw={2}><path d="M12 5v14M5 12h14" /></Svg>;
const IconCopy = (p) => <Svg {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></Svg>;
const IconPower = (p) => <Svg {...p}><path d="M12 3v8" /><path d="M6.3 6.3a8 8 0 1 0 11.4 0" /></Svg>;
const IconAdjust = (p) => <Svg {...p}><path d="M5 8h9M18 8h1M5 16h1M10 16h9" /><circle cx="16" cy="8" r="2" /><circle cx="8" cy="16" r="2" /></Svg>;
const IconBolt = (p) => <Svg {...p} fill="currentColor" sw={0}><path d="M13 2 4 14h6l-1 8 9-12h-6Z" /></Svg>;

/* --------------------------------------------------------------- faux QR */
function FauxQR({ c, size = 156 }) {
  const n = 25;
  const cells = [];
  const isFinder = (x, y) => {
    const inBox = (ox, oy) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
    for (const [ox, oy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
      if (inBox(ox, oy)) {
        const lx = x - ox, ly = y - oy;
        const edge = lx === 0 || lx === 6 || ly === 0 || ly === 6;
        const core = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4;
        return edge || core;
      }
    }
    return null;
  };
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const f = isFinder(x, y);
      let on;
      if (f !== null) on = f;
      else on = ((x * 7 + y * 13 + ((x ^ y) * 5) + x * y) % 3 === 0);
      cells.push(on);
    }
  }
  return (
    <div style={{ background: c.qrBg, padding: 12, borderRadius: 12, boxShadow: c.cardShadow, border: `0.5px solid ${c.cardBorder}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, width: size, height: size, gap: 0 }}>
        {cells.map((on, i) => (
          <div key={i} style={{ background: on ? c.qrMod : 'transparent', borderRadius: 0.5 }} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- primitives */
function Card({ c, children, style, pad = 18 }) {
  return (
    <div style={{ background: c.card, borderRadius: 13, border: `0.5px solid ${c.cardBorder}`, boxShadow: c.cardShadow, padding: pad, ...style }}>
      {children}
    </div>
  );
}
function CardTitle({ c, icon, children, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
      {icon ? <span style={{ color: c.accent, display: 'flex' }}>{icon}</span> : null}
      <span style={{ fontSize: 14.5, fontWeight: 650, letterSpacing: '.01em', color: c.text }}>{children}</span>
      {right ? <div style={{ marginLeft: 'auto' }}>{right}</div> : null}
    </div>
  );
}
function Badge({ c, kind = 'ok', children }) {
  const map = {
    ok: { bg: c.okBg, fg: c.okText, dot: c.okDotColor },
    warn: { bg: c.warnBg, fg: c.warnText, dot: null },
  };
  const s = map[kind];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: s.bg, color: s.fg, fontSize: 11.5, fontWeight: 650, padding: '4px 9px', borderRadius: 100, lineHeight: 1 }}>
      {s.dot ? <span style={{ width: 6, height: 6, borderRadius: 6, background: s.dot }} /> : null}
      {children}
    </span>
  );
}
function Toggle({ c, on }) {
  return (
    <div style={{ width: 38, height: 23, borderRadius: 100, background: on ? c.accent : c.track, position: 'relative', transition: 'background .2s', flex: 'none', boxShadow: on ? 'none' : 'inset 0 0 0 0.5px rgba(0,0,0,0.06)' }}>
      <div style={{ position: 'absolute', top: 2, left: on ? 17 : 2, width: 19, height: 19, borderRadius: 100, background: '#fff', boxShadow: '0 1px 2.5px rgba(0,0,0,0.28)', transition: 'left .2s' }} />
    </div>
  );
}
function SelectField({ c, value, placeholder, w }) {
  const empty = !value;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: c.fieldBg, border: `0.5px solid ${c.fieldBorder}`, borderRadius: 7, padding: '7px 9px 7px 11px', boxShadow: c.fieldShadow, width: w || '100%' }}>
      <span style={{ fontSize: 13, color: empty ? c.text3 : c.text, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value || placeholder}</span>
      <span style={{ color: c.text2, opacity: 0.65 }}><IconChevrons size={14} /></span>
    </div>
  );
}
function Button({ c, kind = 'secondary', icon, children, size = 'md' }) {
  const pad = size === 'sm' ? '6px 11px' : '8px 14px';
  const fs = size === 'sm' ? 12.5 : 13;
  const base = { display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: FONT, fontSize: fs, fontWeight: 600, padding: pad, borderRadius: 8, cursor: 'pointer', border: 'none', lineHeight: 1, whiteSpace: 'nowrap' };
  const styles = {
    primary: { ...base, background: c.accent, color: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.12)' },
    secondary: { ...base, background: c.fieldBg, color: c.text, border: `0.5px solid ${c.fieldBorder}`, boxShadow: c.fieldShadow },
  };
  return <button style={styles[kind]}>{icon}{children}</button>;
}
function MetaItem({ c, label, value, copy }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 650, letterSpacing: '.07em', color: c.text3, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 500, color: c.text, letterSpacing: '.01em' }}>{value}</span>
        {copy ? <span style={{ color: c.text3, cursor: 'pointer', display: 'flex' }}><IconCopy size={14} /></span> : null}
      </div>
    </div>
  );
}

/* --------------------------------------------------------- screen content */
function HomeContent({ c }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Matter server */}
      <Card c={c}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: c.accentSoft, border: `0.5px solid ${c.accentSoftBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.accent }}>
            <IconServer size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 650, color: c.text }}>Matter サーバー</div>
            <div style={{ fontSize: 12, color: c.text2, marginTop: 2 }}>ローカルネットワークで待機中</div>
          </div>
          <Badge c={c} kind="ok">Online</Badge>
        </div>
      </Card>

      {/* Pairing */}
      <Card c={c}>
        <CardTitle c={c}>ペアリング</CardTitle>
        <div style={{ display: 'flex', gap: 26 }}>
          <FauxQR c={c} size={150} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 4, flex: 1 }}>
            <MetaItem c={c} label="Manual Pairing Code" value="0450-175-0567" copy />
            <MetaItem c={c} label="Setup PIN" value="8284 9753" copy />
            <MetaItem c={c} label="Discriminator" value="753" />
          </div>
        </div>
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `0.5px solid ${c.hairline}`, fontSize: 12, color: c.text2, lineHeight: 1.55 }}>
          Google Home / Apple Home アプリで QR コードをスキャンしてください。10 個の仮想スイッチが自動登録されます。
        </div>
      </Card>

      {/* macOS permission */}
      <Card c={c}>
        <CardTitle c={c}>macOS 権限</CardTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: c.text2, display: 'flex' }}><IconShield size={18} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 550, color: c.text }}>アクセシビリティ</div>
            <div style={{ fontSize: 11.5, color: c.text2, marginTop: 2 }}>ショートカットや AppleScript の実行に必要です。</div>
          </div>
          <Badge c={c} kind="warn">未付与</Badge>
          <Button c={c} kind="secondary" size="sm">設定を開く</Button>
        </div>
      </Card>
    </div>
  );
}

function SwitchCard({ c, n }) {
  return (
    <Card c={c} pad={15}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 13 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: c.accentSoft, color: c.accentText, fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, flex: 'none' }}>{n}</div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: c.text, flex: 1 }}>仮想スイッチ {n}</div>
        <Toggle c={c} on={false} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: c.text3, letterSpacing: '.02em', marginBottom: 6 }}>割り当てマクロ</div>
      <SelectField c={c} placeholder="未割り当て" />
    </Card>
  );
}
function SwitchContent({ c, cols = 3 }) {
  return (
    <div>
      <p style={{ fontSize: 12.5, color: c.text2, margin: '0 0 16px', lineHeight: 1.5 }}>各スイッチに名前とマクロを割り当てます。変更はスマートホーム側の再ペアリングなしで反映されます。</p>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 13 }}>
        {Array.from({ length: 10 }, (_, i) => <SwitchCard key={i} c={c} n={i + 1} />)}
      </div>
    </div>
  );
}

function MacroContent({ c }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 22 }}>
        <Button c={c} kind="primary" icon={<IconPlus size={15} />}>新規マクロ</Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '54px 20px', borderRadius: 14, border: `1px dashed ${c.hairline}`, background: c.card, gap: 4 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: c.accentSoft, border: `0.5px solid ${c.accentSoftBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.accent, marginBottom: 12 }}>
          <IconMacro size={26} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 650, color: c.text }}>マクロがありません</div>
        <div style={{ fontSize: 12.5, color: c.text2, maxWidth: 280, lineHeight: 1.55 }}>マクロを作成すると、スイッチに割り当てて Mac の操作を自動化できます。</div>
      </div>
    </div>
  );
}

function SettingsRow({ c, title, desc, on, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 18px', borderBottom: last ? 'none' : `0.5px solid ${c.hairline}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 550, color: c.text }}>{title}</div>
        <div style={{ fontSize: 11.5, color: c.text2, marginTop: 3, lineHeight: 1.45 }}>{desc}</div>
      </div>
      <Toggle c={c} on={on} />
    </div>
  );
}
function SettingsContent({ c }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 650, color: c.text3, letterSpacing: '.04em', margin: '0 4px 8px', textTransform: 'uppercase' }}>一般</div>
        <Card c={c} pad={0}>
          <SettingsRow c={c} title="ログイン時に自動起動" desc="Mac ログイン時に Matter Mac Agent を自動的に起動します。" on={true} />
          <SettingsRow c={c} title="開発者モード" desc="シェルコマンドと AppleScript アクションを有効にします。" on={false} last />
        </Card>
      </div>
    </div>
  );
}

const SCREENS = {
  home: { label: 'ホーム', icon: IconHome, Comp: HomeContent },
  switch: { label: 'スイッチ', icon: IconSwitch, Comp: SwitchContent },
  macro: { label: 'マクロ', icon: IconMacro, Comp: MacroContent },
  settings: { label: '設定', icon: IconSettings, Comp: IconSettings && SettingsContent },
};
const ORDER = ['home', 'switch', 'macro', 'settings'];

/* ----------------------------------------------------------- window chrome */
function TrafficLights() {
  const dot = (bg) => ({ width: 12, height: 12, borderRadius: 12, background: bg, boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.12)' });
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <span style={dot('#FF5F57')} /><span style={dot('#FEBC2E')} /><span style={dot('#28C840')} />
    </div>
  );
}
function WindowShell({ c, theme, children, height }) {
  return (
    <div style={{ width: 840, borderRadius: 12, overflow: 'hidden', background: c.winBg, boxShadow: theme === 'dark' ? '0 22px 60px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(255,255,255,0.06)' : '0 22px 60px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.06)', fontFamily: FONT, color: c.text }}>
      {children}
    </div>
  );
}
function TitleBar({ c }) {
  return (
    <div style={{ height: 38, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, background: c.titlebar, borderBottom: `0.5px solid ${c.hairline}`, backdropFilter: 'blur(20px)' }}>
      <TrafficLights />
      <span style={{ fontSize: 12.5, fontWeight: 550, color: c.text2, letterSpacing: '.01em' }}>Matter Mac Agent</span>
    </div>
  );
}

/* ---------------------------------------------------- layout A: top tabs */
function TabsScreen({ theme, initial = 'home' }) {
  const c = TOKENS[theme];
  const [active, setActive] = useState(initial);
  const Comp = SCREENS[active].Comp;
  const cols = active === 'switch' ? 3 : 3;
  return (
    <WindowShell c={c} theme={theme}>
      <TitleBar c={c} />
      <div style={{ padding: '22px 28px 14px' }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.01em', color: c.text }}>Matter Mac Agent</div>
        <div style={{ fontSize: 13, color: c.text2, marginTop: 2 }}>Mac をスマートホームから操作</div>
      </div>
      {/* tab bar */}
      <div style={{ display: 'flex', gap: 4, padding: '0 24px', borderBottom: `0.5px solid ${c.hairline}` }}>
        {ORDER.map((k) => {
          const sel = k === active;
          const Ico = SCREENS[k].icon;
          return (
            <button key={k} onClick={() => setActive(k)} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: sel ? 650 : 500, color: sel ? c.accent : c.text2, padding: '9px 12px 11px', position: 'relative' }}>
              <Ico size={15} />
              {SCREENS[k].label}
              {sel ? <span style={{ position: 'absolute', left: 8, right: 8, bottom: -0.5, height: 2.5, borderRadius: 3, background: c.accent }} /> : null}
            </button>
          );
        })}
      </div>
      <div style={{ padding: '22px 28px 28px', minHeight: 300 }}>
        <Comp c={c} cols={cols} />
      </div>
    </WindowShell>
  );
}

/* --------------------------------------------------- layout B: sidebar */
function SidebarScreen({ theme, initial = 'home' }) {
  const c = TOKENS[theme];
  const [active, setActive] = useState(initial);
  const Comp = SCREENS[active].Comp;
  return (
    <WindowShell c={c} theme={theme}>
      <div style={{ display: 'flex', minHeight: 540 }}>
        {/* sidebar */}
        <div style={{ width: 196, background: c.sidebarBg, borderRight: `0.5px solid ${c.hairline}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 38, display: 'flex', alignItems: 'center', padding: '0 14px' }}>
            <TrafficLights />
          </div>
          <div style={{ padding: '10px 14px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(160deg, ${c.accent}, ${c.accentHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                <IconBolt size={15} />
              </div>
              <div style={{ lineHeight: 1.15 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: c.text }}>Matter</div>
                <div style={{ fontSize: 10.5, color: c.text2 }}>Mac Agent</div>
              </div>
            </div>
          </div>
          <div style={{ padding: '2px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {ORDER.map((k) => {
              const sel = k === active;
              const Ico = SCREENS[k].icon;
              return (
                <button key={k} onClick={() => setActive(k)} style={{ display: 'flex', alignItems: 'center', gap: 10, border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: sel ? 600 : 500, color: sel ? '#fff' : c.sidebarItemText, background: sel ? c.accent : 'transparent', padding: '7px 10px', borderRadius: 7, textAlign: 'left', width: '100%' }}>
                  <Ico size={16} />
                  {SCREENS[k].label}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 'auto', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: 7, background: c.okDotColor }} />
            <span style={{ fontSize: 11, color: c.text2 }}>サーバー稼働中</span>
          </div>
        </div>
        {/* content */}
        <div style={{ flex: 1, background: c.winBg, display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 50, display: 'flex', alignItems: 'center', padding: '0 26px', borderBottom: `0.5px solid ${c.hairline}`, gap: 10 }}>
            <span style={{ fontSize: 15.5, fontWeight: 650, color: c.text }}>{SCREENS[active].label}</span>
          </div>
          <div style={{ padding: '24px 26px 28px', flex: 1 }}>
            <Comp c={c} cols={2} />
          </div>
        </div>
      </div>
    </WindowShell>
  );
}

/* ------------------------------------------------------------- canvas */
function Frame({ label, sub, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
        <span style={{ fontSize: 13.5, fontWeight: 650, color: '#1D1D1F' }}>{label}</span>
        {sub ? <span style={{ fontSize: 12, color: '#86868B' }}>{sub}</span> : null}
      </div>
      {children}
    </div>
  );
}
function SectionHead({ kicker, title, desc }) {
  return (
    <div style={{ marginBottom: 26 }}>
      {kicker ? <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', color: '#0E9E73', textTransform: 'uppercase', marginBottom: 8 }}>{kicker}</div> : null}
      <div style={{ fontSize: 26, fontWeight: 750, letterSpacing: '-.02em', color: '#1D1D1F' }}>{title}</div>
      {desc ? <div style={{ fontSize: 14, color: '#62626A', marginTop: 6, maxWidth: 720, lineHeight: 1.55 }}>{desc}</div> : null}
    </div>
  );
}

function MatterCanvas() {
  const rowGap = { display: 'flex', flexWrap: 'wrap', gap: 48 };
  return (
    <div style={{ fontFamily: FONT, background: '#EDEDF0', minHeight: '100vh', padding: '56px 64px 96px', boxSizing: 'border-box' }}>
      {/* page header */}
      <div style={{ maxWidth: 980, marginBottom: 54 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '.1em', color: '#0E9E73', textTransform: 'uppercase' }}>UI Refresh Proposal</div>
        <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.025em', color: '#1D1D1F', margin: '12px 0 0' }}>Matter Mac Agent — UI リファイン</h1>
        <p style={{ fontSize: 15.5, color: '#52525A', lineHeight: 1.6, margin: '14px 0 0' }}>
          macOS ネイティブの質感を軸に、余白・カードの陰影・タイポグラフィを整理し、Matter らしいティール／グリーンのアクセントを与えました。
          ナビゲーションは <b>2 案</b>（上部タブ洗練版 / サイドバー版）を用意。各ウィンドウのタブ・サイドバーは<b>クリックで画面切替</b>できます。
        </p>
        <div style={{ display: 'flex', gap: 22, marginTop: 22, flexWrap: 'wrap' }}>
          {[['アクセント', '#0E9E73'], ['ホバー/濃', '#0C8C66'], ['Online', '#1AAB6E'], ['注意', '#E0A93B']].map(([n, col]) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 16, height: 16, borderRadius: 5, background: col, boxShadow: '0 0 0 0.5px rgba(0,0,0,0.08)' }} />
              <span style={{ fontSize: 12.5, color: '#52525A' }}>{n}</span>
              <span style={{ fontFamily: MONO, fontSize: 11.5, color: '#9A9AA1' }}>{col}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Option A — tabs (light) */}
      <SectionHead kicker="案 A" title="上部タブ（洗練版）" desc="既存のタブ構成を踏襲しつつ、ヘッダー・タブバー・カードを整理。乗り換えコストが小さく、現行ユーザーに優しい方向。" />
      <div style={{ ...rowGap, marginBottom: 80 }}>
        <Frame label="ホーム" sub="ペアリング & 権限"><TabsScreen theme="light" initial="home" /></Frame>
        <Frame label="スイッチ" sub="10 個の仮想スイッチ"><TabsScreen theme="light" initial="switch" /></Frame>
        <Frame label="マクロ" sub="空の状態"><TabsScreen theme="light" initial="macro" /></Frame>
        <Frame label="設定" sub="グループ化リスト"><TabsScreen theme="light" initial="settings" /></Frame>
      </div>

      {/* Option B — sidebar (light) */}
      <SectionHead kicker="案 B" title="サイドバー（NavigationSplitView 風）" desc="モダンな macOS アプリの定番。左にナビ、右に内容。識別性が高く、項目が増えても破綻しにくい方向。" />
      <div style={{ ...rowGap, marginBottom: 80 }}>
        <Frame label="ホーム"><SidebarScreen theme="light" initial="home" /></Frame>
        <Frame label="スイッチ"><SidebarScreen theme="light" initial="switch" /></Frame>
        <Frame label="マクロ"><SidebarScreen theme="light" initial="macro" /></Frame>
        <Frame label="設定"><SidebarScreen theme="light" initial="settings" /></Frame>
      </div>

      {/* Dark mode */}
      <div style={{ background: '#1D1D1F', borderRadius: 24, padding: '48px 48px 56px', margin: '0 -16px' }}>
        <div style={{ marginBottom: 30 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', color: '#30D69B', textTransform: 'uppercase', marginBottom: 8 }}>ダークモード</div>
          <div style={{ fontSize: 26, fontWeight: 750, letterSpacing: '-.02em', color: '#F5F5F7' }}>同じシステムをダークで</div>
          <div style={{ fontSize: 14, color: '#9C9CA3', marginTop: 6, maxWidth: 720, lineHeight: 1.55 }}>背景・カード・アクセントをダーク用に再調整。アクセントは視認性のため少し明るいティールに。</div>
        </div>
        <div style={rowGap}>
          <Frame label={<span style={{ color: '#F5F5F7' }}>案 A · ホーム</span>}><TabsScreen theme="dark" initial="home" /></Frame>
          <Frame label={<span style={{ color: '#F5F5F7' }}>案 B · ホーム</span>}><SidebarScreen theme="dark" initial="home" /></Frame>
          <Frame label={<span style={{ color: '#F5F5F7' }}>案 A · スイッチ</span>}><TabsScreen theme="dark" initial="switch" /></Frame>
          <Frame label={<span style={{ color: '#F5F5F7' }}>案 B · 設定</span>}><SidebarScreen theme="dark" initial="settings" /></Frame>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MatterCanvas });

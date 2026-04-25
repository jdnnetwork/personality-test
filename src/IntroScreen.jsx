// ═══ Fintech 인트로 디자인 ═══
// Intro Screen.html 이식 (Linear/Stripe 다크 + indigo accent)
export default function IntroScreen({ onStart }) {
  return (
    <div className="intro-page">
      <style>{INTRO_CSS}</style>
      <div className="intro-haze" />
      <div className="intro-content">
        <div className="intro-topbar">
          <div className="intro-brand"><span className="intro-brand-dot" />457DEEP · 딥둥이</div>
          <div className="intro-version">v 2.1.0</div>
        </div>

        <div className="intro-card">
          <span className="intro-corner tl" />
          <span className="intro-corner tr" />
          <span className="intro-corner bl" />
          <span className="intro-corner br" />

          <div className="intro-hero">
            <img src="/deepdungi.png" alt="딥둥이" />
          </div>

          <div className="intro-eyebrow">INSIGHT REPORT</div>
          <h1 className="intro-title">딥둥이 <em>모의 인성검사</em></h1>

          <div className="intro-meta">
            <div className="intro-meta-cell">
              <div className="intro-meta-val">200</div>
              <div className="intro-meta-lbl">문항</div>
            </div>
            <div className="intro-meta-cell">
              <div className="intro-meta-val">AI</div>
              <div className="intro-meta-lbl">맞춤 분석</div>
            </div>
            <div className="intro-meta-cell">
              <div className="intro-meta-val">~30<span className="intro-meta-unit">MIN</span></div>
              <div className="intro-meta-lbl">소요</div>
            </div>
          </div>

          <button className="intro-cta" onClick={onStart}>
            검사 시작하기
            <span className="intro-arrow">→</span>
          </button>
        </div>

        <div className="intro-powered">POWERED BY 457DEEP · 딥둥이</div>
      </div>
    </div>
  );
}

const INTRO_CSS = `
.intro-page {
  --accent: #818cf8;
  --accent-soft: rgba(129,140,248,0.12);
  --accent-glow: rgba(129,140,248,0.3);
  --bg: #0a0c10;
  --border: rgba(255,255,255,0.07);
  --border-strong: rgba(255,255,255,0.14);
  --text: #e5e7eb;
  --text-muted: #8b92a0;
  --text-dim: #5c6370;
  position: relative;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Noto Sans KR', sans-serif;
  letter-spacing: -0.01em;
  overflow-x: hidden;
}
.intro-page, .intro-page * { box-sizing: border-box; }

.intro-haze {
  position: fixed; inset: 0;
  background:
    radial-gradient(ellipse 80% 50% at 50% 0%, var(--accent-soft), transparent 60%),
    radial-gradient(ellipse 60% 40% at 50% 100%, rgba(129,140,248,0.06), transparent 60%);
  pointer-events: none;
  z-index: 0;
}

.intro-content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
}

/* TOP BAR */
.intro-topbar {
  width: 100%;
  max-width: 820px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.intro-brand { color: var(--text-muted); display: inline-flex; align-items: center; }
.intro-brand-dot {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--accent);
  margin-right: 8px;
  box-shadow: 0 0 8px var(--accent-glow);
}
.intro-version { color: var(--text-dim); }

/* CARD */
.intro-card {
  width: 100%;
  max-width: 560px;
  margin-top: 80px;
  background:
    radial-gradient(circle at 50% 0%, var(--accent-soft) 0%, transparent 60%),
    linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
  border: 1px solid var(--border-strong);
  border-radius: 16px;
  padding: 48px 44px 40px;
  text-align: center;
  box-shadow: 0 1px 0 rgba(255,255,255,0.06) inset, 0 24px 60px rgba(0,0,0,0.4);
  position: relative;
}

/* Corner marks */
.intro-corner {
  position: absolute;
  width: 16px; height: 16px;
  border-color: var(--accent);
  border-style: solid;
  opacity: 0.5;
}
.intro-corner.tl { top: 12px; left: 12px; border-width: 1px 0 0 1px; }
.intro-corner.tr { top: 12px; right: 12px; border-width: 1px 1px 0 0; }
.intro-corner.bl { bottom: 12px; left: 12px; border-width: 0 0 1px 1px; }
.intro-corner.br { bottom: 12px; right: 12px; border-width: 0 1px 1px 0; }

/* Hero badge */
.intro-hero {
  position: relative;
  width: 120px; height: 120px;
  margin: 0 auto 24px;
  border: 1px solid var(--border-strong);
  border-radius: 20px;
  background: radial-gradient(circle at 50% 40%, var(--accent-soft), transparent 70%);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.intro-hero::before {
  content: "";
  position: absolute; inset: 0;
  background: radial-gradient(circle at 50% 100%, var(--accent-soft), transparent 60%);
}
.intro-hero img {
  width: 88px; height: 88px;
  object-fit: contain;
  border-radius: 50%;
  position: relative; z-index: 1;
  filter: drop-shadow(0 8px 20px rgba(0,0,0,0.4));
}

.intro-eyebrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--accent);
  letter-spacing: 0.35em;
  text-transform: uppercase;
  margin-bottom: 14px;
  font-weight: 500;
}

.intro-title {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.025em;
  margin: 0 0 20px;
  color: var(--text);
  line-height: 1.15;
}
.intro-title em {
  font-style: normal;
  color: var(--accent);
  text-shadow: 0 0 24px var(--accent-glow);
}

/* Meta row */
.intro-meta {
  display: flex;
  justify-content: center;
  align-items: stretch;
  gap: 0;
  margin: 24px auto 32px;
  padding: 14px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  max-width: 400px;
}
.intro-meta-cell {
  flex: 1;
  display: flex; flex-direction: column;
  gap: 4px;
  padding: 0 16px;
  position: relative;
}
.intro-meta-cell + .intro-meta-cell::before {
  content: "";
  position: absolute;
  left: 0; top: 20%; bottom: 20%;
  width: 1px;
  background: var(--border);
}
.intro-meta-val {
  font-family: 'JetBrains Mono', monospace;
  font-size: 18px;
  color: var(--text);
  font-weight: 500;
  letter-spacing: -0.01em;
}
.intro-meta-unit {
  font-size: 11px;
  color: var(--text-muted);
  margin-left: 2px;
}
.intro-meta-lbl {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: var(--text-dim);
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

/* CTA */
.intro-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  max-width: 320px;
  padding: 16px 28px;
  background: var(--accent-soft);
  border: 1px solid var(--accent);
  color: var(--text);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 0 24px rgba(129,140,248,0.15);
}
.intro-cta:hover {
  background: var(--accent);
  color: var(--bg);
  box-shadow: 0 0 32px rgba(129,140,248,0.4);
}
.intro-arrow {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 400;
  transition: transform 0.15s ease;
}
.intro-cta:hover .intro-arrow { transform: translateX(3px); }

.intro-powered {
  margin-top: auto;
  padding-top: 48px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--text-dim);
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

@media (max-width: 640px) {
  .intro-content { padding: 24px 16px; }
  .intro-card { padding: 40px 24px 32px; margin-top: 40px; }
  .intro-title { font-size: 26px; }
  .intro-hero { width: 104px; height: 104px; }
  .intro-hero img { width: 76px; height: 76px; }
}
`;

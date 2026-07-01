export const STYLES = `
  .cp-page {
    min-height: 100vh;
    background: var(--sf-bg, #fff);
    font-family: var(--sf-font-body, sans-serif);
    color: var(--sf-text-main, #111);
    overflow-x: hidden;
  }

  /* ── Hero ─────────────────────────────────────────── */
  .cp-hero { position: relative; padding: 120px 5% 128px; overflow: hidden; }
  .cp-hero-inner { max-width: 640px; margin: 0 auto; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .cp-hero-title { font-size: clamp(2rem,5vw,3.6rem); font-weight: 700; margin: 0; letter-spacing: -0.02em; line-height: 1.05; }
  .cp-hero-sub { font-size: 1rem; margin: 0; line-height: 1.7; max-width: 48ch; }

  /* ── Layout ───────────────────────────────────────── */
  .cp-sec { padding: 80px 0; }
  .cp-sec-alt { background: var(--sf-card-bg, #f8f8f8); }
  .cp-sec-strip { padding: 0; }
  .cp-con { max-width: 1280px; margin: 0 auto; padding: 0 40px; box-sizing: border-box; }

  /* ── Typography ───────────────────────────────────── */
  .cp-sec-title {
    font-family: var(--sf-font-heading, serif);
    font-size: clamp(1.4rem,2.5vw,2rem);
    font-weight: 700;
    color: var(--sf-text-main, #111);
    margin: 0 0 24px;
    letter-spacing: -0.02em;
    line-height: 1.15;
  }
  .cp-p { color: var(--sf-text-muted, #555); line-height: 1.8; font-size: 0.95rem; margin: 0; }
  .cp-rte { color: var(--sf-text-muted, #555); line-height: 1.8; font-size: 0.95rem; }
  .cp-rte h1,.cp-rte h2,.cp-rte h3,.cp-rte h4 {
    font-family: var(--sf-font-heading, serif);
    color: var(--sf-text-main, #111);
    margin: 28px 0 10px;
    letter-spacing: -0.01em;
  }
  .cp-rte p { margin: 0 0 14px; }
  .cp-rte a { color: var(--sf-accent, #15803d); }
  .cp-rte strong { color: var(--sf-text-main, #111); }

  /* ── Image + Text ─────────────────────────────────── */
  .cp-imgtxt { display: flex; gap: 56px; align-items: center; flex-wrap: wrap; }
  .cp-imgtxt-img { flex: 1 1 300px; }
  .cp-imgtxt-img img { width: 100%; object-fit: cover; aspect-ratio: 4/3; display: block; }
  .cp-imgtxt-body { flex: 1 1 280px; }

  /* ── Cards grid ───────────────────────────────────── */
  .cp-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1px;
    background: var(--sf-border, rgba(0,0,0,0.1));
    border: 1px solid var(--sf-border, rgba(0,0,0,0.1));
  }
  .cp-card { background: var(--sf-bg, #fff); padding: 32px 28px; }
  .cp-card-icon { font-size: 1.6rem; margin-bottom: 16px; }
  .cp-card-title { font-size: 0.95rem; font-weight: 700; color: var(--sf-text-main, #111); margin: 0 0 10px; }
  .cp-card-text { color: var(--sf-text-muted, #555); font-size: 0.83rem; line-height: 1.65; margin: 0; white-space: pre-line; }

  /* ── About ────────────────────────────────────────── */
  .cp-about { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; }

  /* ── Buttons ──────────────────────────────────────── */
  /*
   * bg = text-main so it's dark on light themes, light on dark themes.
   * text = bg so it always contrasts — the inverse of text-main.
   */
  .cp-btn {
    display: inline-block;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    text-decoration: none;
    padding: 13px 32px;
    cursor: pointer;
    border: none;
    border-radius: 0;
    background: var(--sf-text-main, #111);
    color: var(--sf-bg, #fff);
    transition: opacity 0.15s;
  }
  .cp-btn:hover { opacity: 0.78; }

  .cp-btn-accent {
    display: inline-block;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    text-decoration: none;
    padding: 13px 32px;
    cursor: pointer;
    border: none;
    border-radius: 0;
    background: var(--sf-accent, #15803d);
    color: #fff;
    transition: opacity 0.15s;
  }
  .cp-btn-accent:hover { opacity: 0.82; }

  .cp-btn-ghost {
    display: inline-block;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    text-decoration: none;
    padding: 12px 30px;
    border: 1.5px solid currentColor;
    border-radius: 0;
    color: var(--sf-text-main, #111);
    background: transparent;
    transition: opacity 0.15s;
  }
  .cp-btn-ghost:hover { opacity: 0.72; }

  /* ── Input ────────────────────────────────────────── */
  .cp-input {
    width: 100%;
    padding: 11px 14px;
    border: 1px solid var(--sf-border, rgba(0,0,0,0.15));
    border-radius: 0;
    font-size: 0.85rem;
    background: var(--sf-card-bg, #fff);
    color: var(--sf-text-main, #111);
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s;
    font-family: inherit;
  }
  .cp-input:focus { border-color: var(--sf-text-main, #111); }
  .cp-input::placeholder { color: var(--sf-text-muted, #999); }

  /* ── Categories carousel ──────────────────────────── */
  .cat-carousel-arrow { display: flex; }
  @media (max-width: 640px) {
    .cat-carousel-arrow { display: none; }
  }

  /* ── Features strip ───────────────────────────────── */
  .cp-features-item { border-right: 1px solid var(--sf-border,rgba(0,0,0,0.08)); }
  .cp-features-item:last-child { border-right: none; }

  /* ── Products grid ────────────────────────────────── */
  .cp-products-grid { display: grid; gap: 28px 20px; }
  .cp-products-grid-2 { grid-template-columns: repeat(2, 1fr); }
  .cp-products-grid-3 { grid-template-columns: repeat(3, 1fr); }
  .cp-products-grid-4 { grid-template-columns: repeat(4, 1fr); }
  .cp-products-grid-5 { grid-template-columns: repeat(5, 1fr); }

  /* ── Responsive ───────────────────────────────────── */
  @media (max-width: 1024px) {
    .cp-about { grid-template-columns: 1fr; gap: 48px; }
    .cp-products-grid-4, .cp-products-grid-5 { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 768px) {
    .cp-sec { padding: 56px 0; }
    .cp-con { padding: 0 20px; }
    .cp-hero { padding: 80px 5% 88px; }
    .cp-imgtxt { flex-direction: column !important; }
    .cp-products-grid-3, .cp-products-grid-4, .cp-products-grid-5 { grid-template-columns: repeat(2, 1fr); }
    .cp-products-grid { gap: 16px 12px; }
    .cp-features-grid { grid-template-columns: repeat(2,1fr) !important; }
    .cp-features-item { border-right: none !important; border-bottom: 1px solid var(--sf-border,rgba(0,0,0,0.08)); padding: 20px 14px !important; }
    .cp-features-item:nth-child(odd) { border-right: 1px solid var(--sf-border,rgba(0,0,0,0.08)) !important; }
    .cp-features-item:nth-last-child(-n+2) { border-bottom: none; }
  }
  @media (max-width: 480px) {
    .cp-cards { grid-template-columns: 1fr !important; }
    .cp-products-grid-2, .cp-products-grid-3, .cp-products-grid-4, .cp-products-grid-5 { grid-template-columns: repeat(2, 1fr); }
    .cp-products-grid { gap: 12px 8px; }
  }
`;

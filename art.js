// ===== איורי צמחים (מוצגים כשאין תמונה אמיתית) =====
const TROPIC = ['#FFB21C', '#FF2E7E', '#0FB5B2', '#FF6A3D', '#B8E62E', '#B44CFF'];
const GREENS = ['#07623F', '#0E8A4F', '#19A55B', '#3CC46B'];

function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
function colorFor(id) { return TROPIC[hashStr(String(id)) % TROPIC.length]; }

function plantArt(kind, seed) {
  const r = hashStr(String(seed || kind));
  const g = i => GREENS[(i + r) % GREENS.length];
  const pot = `<path d="M68 150h64l-9 42H77z" fill="#073B2A" opacity=".9"/><rect x="62" y="140" width="76" height="16" rx="6" fill="#073B2A"/>`;
  let body = '';
  if (kind === 'monstera') {
    const leaf = (a, s, i) => `<g transform="translate(100 142) rotate(${a}) scale(${s})"><path d="M0 0C-4-30-46-40-44-78C-42-104-12-116 0-100C12-116 42-104 44-78C46-40 4-30 0 0Z" fill="${g(i)}"/><path d="M0-4V-96M0-40L-30-62M0-58L-26-86M0-40L30-62M0-58L26-86" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/></g>`;
    body = leaf(-38, .82, 0) + leaf(36, .78, 1) + leaf(-6, 1, 2);
  } else if (kind === 'trailing' || kind === 'pearls') {
    const vine = (d, pts, i) => `<path d="${d}" stroke="${g(1)}" stroke-width="3" fill="none"/>` + pts.map(([x, y], k) => kind === 'pearls'
      ? `<circle cx="${x}" cy="${y}" r="6" fill="${g(k + i + 2)}"/>`
      : `<path d="M${x} ${y}c-10-2-14-12-6-18c4 6 10 10 6 18z" fill="${g(k + i)}" transform="rotate(${k * 40} ${x} ${y})"/>`).join('');
    body = `<ellipse cx="100" cy="132" rx="40" ry="20" fill="${g(2)}"/>` +
      vine('M70 145C52 160 46 180 42 198', [[62, 152], [52, 166], [46, 182], [43, 196]], 0) +
      vine('M130 145C150 162 156 180 160 198', [[138, 152], [148, 166], [154, 182], [158, 196]], 1) +
      vine('M88 146C80 170 78 184 76 200', [[84, 160], [80, 176], [77, 192]], 2) +
      `<path d="M100 132c-16-4-26-22-14-36c10 10 18 20 14 36zM100 132c14-8 32-6 34 12c-14 2-26-2-34-12z" fill="${g(3)}"/>`;
  } else if (kind === 'succulent') {
    for (let i = 0; i < 12; i++) body += `<path transform="translate(100 134) rotate(${i * 30}) scale(${i % 2 ? .75 : 1})" d="M0 0C-12-18-9-44 0-54C9-44 12-18 0 0Z" fill="${g(i)}"/>`;
    body += `<circle cx="100" cy="134" r="8" fill="#B8E62E"/>`;
  } else if (kind === 'cactus') {
    body = `<rect x="84" y="58" width="32" height="92" rx="16" fill="${g(1)}"/><path d="M84 110H66a10 10 0 0 1-10-10V82a8 8 0 0 1 16 0v14h12z" fill="${g(2)}"/><path d="M116 96h16V74a8 8 0 0 1 16 0v22a14 14 0 0 1-14 14h-18z" fill="${g(0)}"/>` +
      [[94, 72], [106, 86], [96, 104], [108, 122], [64, 90], [140, 84]].map(([x, y]) => `<path d="M${x - 3} ${y}h6M${x} ${y - 3}v6" stroke="#FFFBEA" stroke-width="2"/>`).join('') +
      `<circle cx="100" cy="56" r="9" fill="#FF2E7E"/>`;
  } else if (kind === 'snake') {
    const blade = (x, h, a, i) => `<path transform="translate(${x} 146) rotate(${a})" d="M0 0C-12-40-10-${h - 20}-2-${h}C8-${h - 20} 12-40 0 0Z" fill="${g(i)}" stroke="#B8E62E" stroke-width="2.5"/>`;
    body = blade(84, 96, -14, 0) + blade(116, 104, 12, 1) + blade(100, 124, 0, 2) + blade(92, 76, -30, 3) + blade(110, 80, 30, 0);
  } else if (kind === 'herb') {
    for (let i = 0; i < 7; i++) {
      const x = 74 + i * 9, h = 40 + ((r >> i) % 30);
      body += `<path d="M${x} 144V${144 - h}" stroke="${g(1)}" stroke-width="2.5"/>` +
        [0, 1, 2].map(k => `<ellipse cx="${x + (k % 2 ? 7 : -7)}" cy="${144 - h + k * 14}" rx="8" ry="5" fill="${g(i + k)}" transform="rotate(${k % 2 ? 30 : -30} ${x} ${144 - h + k * 14})"/>`).join('');
    }
  } else if (kind === 'tree') {
    body = `<path d="M96 146V96h8v50z" fill="#7A4A21"/><circle cx="100" cy="78" r="38" fill="${g(1)}"/><circle cx="72" cy="94" r="24" fill="${g(2)}"/><circle cx="128" cy="94" r="24" fill="${g(0)}"/>` +
      [[84, 70], [116, 66], [100, 96], [132, 92], [70, 96]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#FFB21C"/>`).join('');
  } else if (kind === 'seeds') {
    return `<svg viewBox="0 0 200 200" aria-hidden="true"><rect x="56" y="40" width="88" height="124" rx="10" fill="#FFFBEA"/><rect x="56" y="40" width="88" height="22" rx="10" fill="#073B2A"/><circle cx="100" cy="104" r="26" fill="#FF6A3D"/><path d="M100 78c6-10 16-12 20-8c-6 4-12 8-20 8z" fill="${g(2)}"/>` +
      [[76, 148], [88, 142], [112, 146], [124, 140], [100, 150]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.5" fill="#C8A165"/>`).join('') + `</svg>`;
  } else { // leafy
    const leaf = (a, s, i) => `<g transform="translate(100 142) rotate(${a}) scale(${s})"><path d="M0 0C-30-20-34-70 0-96C34-70 30-20 0 0Z" fill="${g(i)}"/><path d="M0-6V-88" stroke="#fff" stroke-opacity=".4" stroke-width="3"/></g>`;
    body = leaf(-48, .7, 0) + leaf(48, .7, 1) + leaf(-22, .9, 2) + leaf(22, .9, 3) + leaf(0, 1, 1);
  }
  return `<svg viewBox="0 0 200 200" aria-hidden="true">${body}${pot}</svg>`;
}

// עלים טרופיים למסך ההתאמה
function burstLeaves(n) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const a = (360 / n) * i + (i % 3) * 7;
    const d = 140 + (i % 4) * 40;
    const c = [...TROPIC, '#19A55B', '#B8E62E'][i % 8];
    out += `<svg class="bl" style="--a:${a}deg;--d:${d}px;--delay:${(i % 5) * 40}ms" viewBox="0 0 40 60" aria-hidden="true"><path d="M20 58C4 40 2 16 20 2C38 16 36 40 20 58Z" fill="${c}"/><path d="M20 54V8" stroke="#fff" stroke-opacity=".5" stroke-width="2"/></svg>`;
  }
  return out;
}

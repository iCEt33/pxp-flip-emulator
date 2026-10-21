// ============================================================================
// PxP Flip OS (pixlOS) - browser build
// ============================================================================
// A PORT of the firmware in pxp_stage1_esp32.ino, not a separate design.
// Re-ported 21 Oct 2026 from the 9,269-line .ino. Everything the phone gained
// since the first port is here now: themes and the custom colour editor, the
// status bar icons, the settings tree, contacts with three numbers, labels and
// colours, the symbol picker, relative times, "Not sent" + Resend, backup to
// the card, factory reset, Pong in the games list, and every ringtone.
//
// The split is the same as on the real device:
//   emulator.html = HARDWARE. Screens, buttons, modem, audio, storage, camera.
//   this file     = THE OS. Decides what to do with that hardware.
//
// The firmware runs off one loop() that checks millis() deadlines. This file
// does the same - osLoop() near the bottom, every 10 ms - instead of a pile of
// setTimeouts, so a timer here reads the same as its twin in the .ino.
//
// Anything the browser cannot really do (radio, camera sensor, SD card) is
// faked on the EMULATOR side or, where the phone talks to a chip directly,
// in a clearly marked "emulated" block here.
// ============================================================================

// ==================== FONTS (byte for byte from the firmware) =============
// 5x7: full ASCII 32-126, one byte per column, bit0 = top row.
const FONT5x7 = [
  [0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x5F,0x00,0x00],[0x00,0x07,0x00,0x07,0x00],[0x14,0x7F,0x14,0x7F,0x14],[0x24,0x2A,0x7F,0x2A,0x12],
  [0x23,0x13,0x08,0x64,0x62],[0x36,0x49,0x55,0x22,0x50],[0x00,0x05,0x03,0x00,0x00],[0x00,0x1C,0x22,0x41,0x00],[0x00,0x41,0x22,0x1C,0x00],
  [0x08,0x2A,0x1C,0x2A,0x08],[0x08,0x08,0x3E,0x08,0x08],[0x00,0x50,0x30,0x00,0x00],[0x08,0x08,0x08,0x08,0x08],[0x00,0x60,0x60,0x00,0x00],
  [0x20,0x10,0x08,0x04,0x02],[0x3E,0x51,0x49,0x45,0x3E],[0x00,0x42,0x7F,0x40,0x00],[0x42,0x61,0x51,0x49,0x46],[0x21,0x41,0x45,0x4B,0x31],
  [0x18,0x14,0x12,0x7F,0x10],[0x27,0x45,0x45,0x45,0x39],[0x3C,0x4A,0x49,0x49,0x30],[0x01,0x71,0x09,0x05,0x03],[0x36,0x49,0x49,0x49,0x36],
  [0x06,0x49,0x49,0x29,0x1E],[0x00,0x36,0x36,0x00,0x00],[0x00,0x56,0x36,0x00,0x00],[0x00,0x08,0x14,0x22,0x41],[0x14,0x14,0x14,0x14,0x14],
  [0x41,0x22,0x14,0x08,0x00],[0x02,0x01,0x51,0x09,0x06],[0x32,0x49,0x79,0x41,0x3E],[0x7E,0x11,0x11,0x11,0x7E],[0x7F,0x49,0x49,0x49,0x36],
  [0x3E,0x41,0x41,0x41,0x22],[0x7F,0x41,0x41,0x22,0x1C],[0x7F,0x49,0x49,0x49,0x41],[0x7F,0x09,0x09,0x01,0x01],[0x3E,0x41,0x41,0x51,0x32],
  [0x7F,0x08,0x08,0x08,0x7F],[0x00,0x41,0x7F,0x41,0x00],[0x20,0x40,0x41,0x3F,0x01],[0x7F,0x08,0x14,0x22,0x41],[0x7F,0x40,0x40,0x40,0x40],
  [0x7F,0x02,0x04,0x02,0x7F],[0x7F,0x04,0x08,0x10,0x7F],[0x3E,0x41,0x41,0x41,0x3E],[0x7F,0x09,0x09,0x09,0x06],[0x3E,0x41,0x51,0x21,0x5E],
  [0x7F,0x09,0x19,0x29,0x46],[0x46,0x49,0x49,0x49,0x31],[0x01,0x01,0x7F,0x01,0x01],[0x3F,0x40,0x40,0x40,0x3F],[0x1F,0x20,0x40,0x20,0x1F],
  [0x7F,0x20,0x18,0x20,0x7F],[0x63,0x14,0x08,0x14,0x63],[0x03,0x04,0x78,0x04,0x03],[0x61,0x51,0x49,0x45,0x43],[0x00,0x00,0x7F,0x41,0x41],
  [0x02,0x04,0x08,0x10,0x20],[0x41,0x41,0x7F,0x00,0x00],[0x04,0x02,0x01,0x02,0x04],[0x40,0x40,0x40,0x40,0x40],[0x00,0x01,0x02,0x04,0x00],
  [0x20,0x54,0x54,0x54,0x78],[0x7F,0x48,0x44,0x44,0x38],[0x38,0x44,0x44,0x44,0x20],[0x38,0x44,0x44,0x48,0x7F],[0x38,0x54,0x54,0x54,0x18],
  [0x08,0x7E,0x09,0x01,0x02],[0x08,0x14,0x54,0x54,0x3C],[0x7F,0x08,0x04,0x04,0x78],[0x00,0x44,0x7D,0x40,0x00],[0x20,0x40,0x44,0x3D,0x00],
  [0x00,0x7F,0x10,0x28,0x44],[0x00,0x41,0x7F,0x40,0x00],[0x7C,0x04,0x18,0x04,0x78],[0x7C,0x08,0x04,0x04,0x78],[0x38,0x44,0x44,0x44,0x38],
  [0x7C,0x14,0x14,0x14,0x08],[0x08,0x14,0x14,0x18,0x7C],[0x7C,0x08,0x04,0x04,0x08],[0x48,0x54,0x54,0x54,0x20],[0x04,0x3F,0x44,0x40,0x20],
  [0x3C,0x40,0x40,0x20,0x7C],[0x1C,0x20,0x40,0x20,0x1C],[0x3C,0x40,0x30,0x40,0x3C],[0x44,0x28,0x10,0x28,0x44],[0x0C,0x50,0x50,0x50,0x3C],
  [0x44,0x64,0x54,0x4C,0x44],[0x00,0x08,0x36,0x41,0x00],[0x00,0x00,0x7F,0x00,0x00],[0x00,0x41,0x36,0x08,0x00],[0x08,0x08,0x2A,0x1C,0x08],
];

const DIGIT_GLYPHS = {
  '0': { w: 3, rows: [7,5,5,5,7] },
  '1': { w: 3, rows: [2,3,2,2,7] },
  '2': { w: 3, rows: [7,4,7,1,7] },
  '3': { w: 3, rows: [7,4,7,4,7] },
  '4': { w: 3, rows: [5,5,7,4,4] },
  '5': { w: 3, rows: [7,1,7,4,7] },
  '6': { w: 3, rows: [7,1,7,5,7] },
  '7': { w: 3, rows: [7,4,2,1,1] },
  '8': { w: 3, rows: [7,5,7,5,7] },
  '9': { w: 3, rows: [7,5,7,4,7] },
  ':': { w: 1, rows: [0,1,0,1,0] },
  '.': { w: 1, rows: [0,0,0,0,1] },
  '%': { w: 3, rows: [5,4,2,1,5] },
  '+': { w: 3, rows: [0,2,7,2,0] },
  '*': { w: 3, rows: [5,2,7,2,5] },
  '#': { w: 3, rows: [2,7,2,7,2] },
};

const LETTERS3x5 = {
  'A': [2,5,7,5,5], 'D': [3,5,5,5,3], 'F': [7,1,3,1,1], 'J': [4,4,4,5,2],
  'M': [5,7,7,5,5], 'N': [5,7,7,7,5], 'O': [7,5,5,5,7], 'S': [7,1,7,4,7],
  'T': [7,2,2,2,2], 'W': [5,5,7,7,5],
  'a': [0,2,5,7,5], 'b': [1,1,3,5,3], 'c': [0,6,1,1,6], 'd': [4,4,6,5,6],
  'e': [0,6,7,1,6], 'g': [0,7,5,7,4], 'h': [1,1,3,5,5], 'i': [2,0,2,2,2],
  'l': [2,2,2,2,2], 'n': [0,3,5,5,5], 'o': [0,2,5,5,2], 'p': [0,3,5,3,1],
  'r': [0,3,5,1,1], 't': [2,7,2,2,6], 'u': [0,5,5,5,6], 'v': [0,5,5,5,2],
  'y': [0,5,5,6,4],
};

// ==================== SCREEN + COLOURS ====================
const IN_W = 240, IN_H = 320;
const OUT_W = 128, OUT_H = 128;

// The panel is RGB565: 5 bits of red, 6 of green, 5 of blue. c565() rounds a
// colour exactly the way the firmware's C565() macro does, then expands it back
// for the canvas, so the browser shows what the glass can show - including the
// 32 real steps the Custom colour sliders move through.
function c565(r, g, b) {
  const r5 = (r >> 3) & 31, g6 = (g >> 2) & 63, b5 = (b >> 3) & 31;
  const R = (r5 << 3) | (r5 >> 2), G = (g6 << 2) | (g6 >> 4), B = (b5 << 3) | (b5 >> 2);
  return '#' + ((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1);
}

const COL_BLACK = c565(0x00, 0x00, 0x00);

// ---- THEME ----
// COL_THEME is what used to be COL_GREEN. It is whatever the user picked in
// Settings, and every draw site reads it fresh on every frame. COL_THEME_INK is
// the colour drawn ON TOP of a themed fill - every list inverts its selected
// row - and the two are only ever set together, by themeApply().
let COL_THEME     = c565(0x00, 0xFF, 0x00);
let COL_THEME_INK = c565(0x00, 0x00, 0x00);

// Debug outlines must NOT follow the theme: green means fits, red overflows.
const COL_FIT_OK = c565(0x00, 0xFF, 0x00);
const COL_WHITE  = c565(0xFF, 0xFF, 0xFF);
const COL_GRAY3  = c565(0x33, 0x33, 0x33);   // unavailable (greyed rows)
const COL_GRAY6  = c565(0x66, 0x66, 0x66);
const COL_GRAY8  = c565(0x88, 0x88, 0x88);
const COL_BAR    = c565(0x11, 0x11, 0x11);
const COL_BAR2   = c565(0x0a, 0x0a, 0x0a);
const COL_RED    = c565(0xFF, 0x00, 0x00);
const COL_YEL    = c565(0xFF, 0xFF, 0x00);
const COL_BLUE   = c565(0x00, 0x00, 0xFF);   // debug outlines only
const COL_AZURE  = c565(0x00, 0xB0, 0xFF);   // answered incoming calls in the log

// ==================== STATES + TAGS (same numbers as the .ino) ==============
// 7 and 9 are retired, as on the phone: ST_SETTINGS became ST_SETPAGE and
// ST_ABOUT became a page inside the settings tree.
const ST_OFF=0, ST_BOOT=1, ST_HOME=2, ST_MENU=3, ST_APP=4, ST_DIALER=5, ST_CONTACTS=6,
      ST_STORAGE=8, ST_TEXTEDIT=10,
      ST_GALLERY=11, ST_PHOTO=12, ST_CAMERA=13,
      ST_MESSAGES=14, ST_CHAT=15,
      ST_VOICE=16, ST_VOICE_REC=17, ST_VOICE_PLAY=18,
      ST_INCOMING_CALL=19, ST_INCALL=20, ST_CALLLOG=21,
      ST_RINGTONES=22, ST_APPS=23, ST_GAMES=24, ST_THEME=25, ST_THEME_RGB=26,
      ST_CONTACT_DETAIL=27, ST_CONTACT_COLOUR=28, ST_SETPAGE=29,
      ST_RESET=30;   // factory reset / restore: "Resetting", then "Done - press any key"

// Popup owner tags. Runtime only, so gaps are harmless - collisions are not.
const OPT_NONE=0, OPT_HOME=1, OPT_DIALER=2, OPT_MENU=3, OPT_APP=4,
      OPT_CONTACTS=5, OPT_FORMAT=6, OPT_GALLERY=7, OPT_CAMERA=8,
      OPT_MESSAGES=10, OPT_CHAT=11, OPT_VOICE=12, OPT_VOICE_PLAY=13,
      OPT_CALLLOG=14, OPT_CALLLOG_CLEAR=15,
      OPT_FACTORY=16, OPT_BACKUP=17, OPT_BACKUP_SAVE=18, OPT_RESTORE=19,
      OPT_NUM_CHOOSE=20, OPT_NUM_LABEL=21;

const SCREEN_NORMAL=0, SCREEN_DIMMED=1, SCREEN_SLEEP=2;
const CALL_IDLE=0, CALL_RINGING=1, CALL_ACTIVE=2, CALL_DIALING=3;
const CALL_OUT=0, CALL_IN=1, CALL_MISSED=2, CALL_REJECTED=3;   // call log types
const MSG_DIR_IN=0, MSG_DIR_OUT=1;
const MSG_ST_SENT=0, MSG_ST_FAILED=1;
const SIM_UNKNOWN=0, SIM_NOT_PRESENT=1, SIM_NEEDS_PIN=2, SIM_NEEDS_PUK=3, SIM_READY_ST=4;

let state = ST_OFF;
let menuIdx = 0;
let screenState = SCREEN_NORMAL;
let debugMode = false;
let powered = false;          // the phone is switched on (hwPowerOn / hwPowerOff)

// millis() starts at 0 when the OS boots, exactly like the chip. Every deadline
// below is millis()-based and 0 means "not running", same as the firmware.
let chipBootMs = Date.now();
function millis() { return Date.now() - chipBootMs; }
function pxlog(msg) { printf(msg); }
function flipIsOpen() { return hardwareAPI.isFlipOpen(); }

// ==================== DRAWING PRIMITIVES ====================
// ctx is a 2D canvas the size of the panel. The canvas clips at its own edges,
// which is what fbRect()'s bounds checks do on the phone.
function fbRect(ctx, x, y, w, h, color) {
  if (w <= 0 || h <= 0) return;
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
}
function fbOutline(ctx, x, y, w, h, color) {
  fbRect(ctx, x, y, w, 1, color);
  fbRect(ctx, x, y + h - 1, w, 1, color);
  fbRect(ctx, x, y, 1, h, color);
  fbRect(ctx, x + w - 1, y, 1, h, color);
}
// Pixel-for-pixel the firmware's circle (no anti-aliasing - the panel has none).
function fbCircle(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  for (let yy = -r; yy <= r; yy++)
    for (let xx = -r; xx <= r; xx++)
      if (xx * xx + yy * yy <= r * r) ctx.fillRect(cx + xx, cy + yy, 1, 1);
}
// C integer division truncates toward zero; Math.trunc does the same.
function centerX(screenW, elemW) { return Math.trunc((screenW - elemW) / 2); }
function alignRight(screenW, elemW, margin) { return screenW - elemW - margin; }

// ==================== UTF-8 -> ASCII FOLDING ====================
// The 5x7 font is ASCII 32-126 only. Accents are STRIPPED, not drawn: at
// 0.152 mm a pixel an accent is a single dot. Same table as nextFoldedChar() in
// the .ino - anything it does not know becomes '?', one per character.
const FOLD_MAP = {};
(function () {
  const add = (chars, to) => { for (const c of chars) FOLD_MAP[c] = to; };
  add('àáâãäå', 'a'); add('ÀÁÂÃÄÅ', 'A');
  add('èéêë', 'e');             add('ÈÉÊË', 'E');
  add('ìíîï', 'i');             add('ÌÍÎÏ', 'I');
  add('òóôõöø', 'o'); add('ÒÓÔÕÖØ', 'O');
  add('ùúûü', 'u');             add('ÙÚÛÜ', 'U');
  add('ýÿ', 'y'); add('Ý', 'Y');
  add('ñ', 'n'); add('Ñ', 'N'); add('ç', 'c'); add('Ç', 'C'); add('ß', 's');
  // Latin Extended-A: Hungarian double acute, and the ones the .ino lists
  add('Ő', 'O'); add('ő', 'o'); add('Ű', 'U'); add('ű', 'u');
  add('ŚŜŞ', 'S'); add('śŝş', 's');
  add('ŹŻŽ', 'Z'); add('źżž', 'z');
  add('ČĆ', 'C'); add('čć', 'c');
  add('Ę', 'E'); add('ę', 'e'); add('Ğ', 'G'); add('ğ', 'g');
  add('İ', 'I'); add('ı', 'i');
  add('ĹĻ', 'L'); add('ĺļ', 'l');
  add('Ą', 'A'); add('ą', 'a');
})();
function fold(text) {
  let out = '';
  for (const ch of String(text)) {
    const f = FOLD_MAP[ch];
    if (f !== undefined) out += f;
    else if (ch.charCodeAt(0) < 128) out += ch;
    else out += '?';
  }
  return out;
}

// ==================== 5x7 TEXT FONT ====================
// scale = (sizePx + 4) / 8, integer: 4-11 -> scale 1 (6px a character),
// 12-19 -> scale 2 (12px), 20-27 -> 3, 28+ -> 4. Nothing in between.
// y is the BASELINE: a scale-2 line occupies y-14 .. y-1.
function textScale(sizePx) {
  const s = Math.trunc((sizePx + 4) / 8);
  return s < 1 ? 1 : s;
}
function measureTextStrW(text, sizePx) {
  const scale = textScale(sizePx);
  const n = fold(text).length;
  if (n === 0) return 0;
  return n * 6 * scale - scale;      // last inter-letter gap doesn't count
}

// [FIT] - the overflow check lives inside drawTextStr(), as on the phone, so it
// sees every string including the ones built at runtime. Each distinct string
// logs once. In debug mode every string also gets a box: green fits, red runs
// off the edge.
const PXP_TEXT_WARN = true;
const fitSeen = new Set();
let fitQuiet = false;   // set while a marquee scrolls - see drawTextFitCentered()

function drawTextStr(ctx, x, y, text, sizePx, color) {
  const scale = textScale(sizePx);
  const s = fold(text);
  if (PXP_TEXT_WARN) {
    const fbW = ctx.canvas.width;
    const wNeeded = s.length ? s.length * 6 * scale - scale : 0;
    const overflows = (x < 0 || x + wNeeded > fbW);
    if (overflows && !fitQuiet) {
      const key = fbW + '|' + x + '|' + text;
      if (!fitSeen.has(key)) {
        if (fitSeen.size < 48) fitSeen.add(key);
        pxlog('[FIT] ' + wNeeded + 'px at x=' + x + ' on ' + fbW + 'px (size ' + sizePx + "): '" + text + "'");
      }
    }
    if (debugMode) fbOutline(ctx, x, y - 7 * scale, wNeeded, 7 * scale, overflows ? COL_RED : COL_FIT_OK);
  }
  const top = y - 7 * scale;
  let cx = x;
  ctx.fillStyle = color;
  for (const raw of s) {
    let c = raw.charCodeAt(0);
    if (c < 32 || c > 126) c = 63;
    const glyph = FONT5x7[c - 32];
    for (let col = 0; col < 5; col++) {
      const bits = glyph[col];
      for (let row = 0; row < 7; row++)
        if (bits & (1 << row)) ctx.fillRect(cx + col * scale, top + row * scale, scale, scale);
    }
    cx += 6 * scale;
  }
}

// ---- 5x7 icons that are not characters (same format as the font) ----
const ICON_CALL_OUT    = [0x10,0x08,0x04,0x08,0x10];  // arrow up
const ICON_CALL_IN     = [0x04,0x08,0x10,0x08,0x04];  // arrow down
const ICON_CALL_MISSED = [0x1C,0x0C,0x14,0x10,0x0C];  // bounce: came in, deflected away
const ICON_CALL_REJECT = [0x22,0x14,0x08,0x14,0x22];  // X
const ICON_CHECK       = [0x10,0x20,0x10,0x08,0x04];  // factory reset's "Done"
const ICON_WIFI        = [0x02,0x0A,0x2A,0x0A,0x02];  // dot, then widening arcs
const ICON_VIBRATE     = [0x14,0x2A,0x00,0x14,0x2A];  // two buzz patterns
const ICON_SILENT      = [0x04,0x14,0x10,0x34,0x04];  // eyes, mouth, a drip off the right corner

function drawGlyph5x7(ctx, x, y, cols, sizePx, color) {
  const scale = textScale(sizePx);
  const top = y - 7 * scale;
  ctx.fillStyle = color;
  for (let col = 0; col < 5; col++) {
    const bits = cols[col];
    for (let row = 0; row < 7; row++)
      if (bits & (1 << row)) ctx.fillRect(x + col * scale, top + row * scale, scale, scale);
  }
}

// Shorten src so it fits maxPx at sizePx, ending on a WORD boundary with "...".
// bufLen is the C buffer it lands in (nm[40], prev[48]) - it caps the length
// the same way strncpy() does on the phone.
function truncateToFit(src, maxPx, sizePx, bufLen) {
  const cap = (bufLen || 40);
  let dst = String(src);
  if (dst.length > cap - 1) dst = dst.slice(0, cap - 1);
  if (measureTextStrW(dst, sizePx) <= maxPx) return dst;
  const ell = '...';
  // + one letter-gap: the "..." sits a gap after the kept text, and neither
  // measurement counts it - without it the result could be 2px too wide.
  let budget = maxPx - measureTextStrW(ell, sizePx) - textScale(sizePx);
  if (budget < 0) budget = 0;
  let cut = 0, lastSpace = -1;
  for (let i = 0; i < dst.length; i++) {
    if (measureTextStrW(dst.slice(0, i + 1), sizePx) > budget) {
      // The letter that did not fit is a SPACE: the whole word before it did
      // fit, so the cut lands right here ("yeah, soldering..." not "yeah,...").
      if (dst[i] === ' ') lastSpace = i;
      break;
    }
    cut = i + 1;
    if (dst[i] === ' ') lastSpace = i;
  }
  if (lastSpace > 0) cut = lastSpace;      // prefer the word boundary
  if (cut > cap - 4) cut = cap - 4;
  return dst.slice(0, cut) + ell;
}

const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function pad2(n) { return String(n).padStart(2, '0'); }

// How long ago, in words: today HH:MM, Yesterday, a day name within the week,
// "Sep 12" this year, "9/12/26" before that. Compares CALENDAR days, so a
// message at 23:50 is "Yesterday" at 00:10.
function relativeTimeStr(epoch) {
  if (!epoch) return '';
  const t = new Date(epoch * 1000), n = new Date();
  const td = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  const nd = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  const dayDiff = Math.round((nd - td) / 86400000);
  if (dayDiff <= 0)  return pad2(t.getHours()) + ':' + pad2(t.getMinutes());
  if (dayDiff === 1) return 'Yesterday';
  if (dayDiff < 7)   return DAYS[t.getDay()];
  if (t.getFullYear() === n.getFullYear()) return MONTHS[t.getMonth()] + ' ' + t.getDate();
  return (t.getMonth() + 1) + '/' + t.getDate() + '/' + pad2(t.getFullYear() % 100);
}

// ==================== TEXT WRAPPING ====================
// Three tiers of break, the order browsers use: spaces, then AFTER punctuation
// (/ . - ? & = _ : ,), then anywhere as a last resort. Returns the lines.
const CHAT_LINE_LEN = 48;
const CHAT_MAX_LINES = 24;
function isBreakAfter(c) { return '/.-?&=_:,'.indexOf(c) >= 0; }

function wrapText(body, availPx, sizePx, maxLines) {
  const out = [];
  let cur = '';
  const flush  = () => { if (cur.length > 0) { out.push(cur); cur = ''; } };
  const append = (s) => {
    let n = s.length;
    if (cur.length + n > CHAT_LINE_LEN - 1) n = CHAT_LINE_LEN - 1 - cur.length;
    if (n > 0) cur += s.slice(0, n);
  };
  const src = String(body);
  let p = 0;
  while (p < src.length && out.length < maxLines) {
    while (src[p] === ' ') p++;
    if (p >= src.length) break;
    let wl = 0;
    while (p + wl < src.length && src[p + wl] !== ' ') wl++;
    // The phone's word buffer is CHAT_LINE_LEN bytes, so a word longer than 47
    // characters loses its tail there too. Kept identical on purpose.
    const word = src.slice(p, p + Math.min(wl, CHAT_LINE_LEN - 1));
    p += wl;

    // tier 1: does it fit on the line being built?
    const test = cur.length ? cur + ' ' + word : word;
    if (measureTextStrW(test, sizePx) <= availPx) {
      if (cur.length) append(' ');
      append(word);
      continue;
    }
    // on a line of its own?
    if (measureTextStrW(word, sizePx) <= availPx) { flush(); append(word); continue; }

    // tier 2: chop at separators, greedily
    flush();
    let seg = 0;
    for (let i = 0; i < word.length && out.length < maxLines; i++) {
      const lastChar = (i === word.length - 1);
      if (!isBreakAfter(word[i]) && !lastChar) continue;
      const piece = word.slice(seg, i + 1);
      seg = i + 1;
      if (measureTextStrW(cur + piece, sizePx) <= availPx) { append(piece); continue; }
      flush();
      if (measureTextStrW(piece, sizePx) <= availPx) { append(piece); continue; }
      // tier 3: wider than a whole line - split character by character
      for (let c = 0; c < piece.length && out.length < maxLines; c++) {
        const probe = cur.slice(0, CHAT_LINE_LEN - 2) + piece[c];
        if (measureTextStrW(probe, sizePx) > availPx && cur.length > 0) flush();
        append(piece[c]);
      }
    }
  }
  flush();
  return out.slice(0, maxLines);
}

// Word-wraps a hint or status line, one line per lineH.
function drawTextWrapped(ctx, x, y, maxW, text, sizePx, color, lineH) {
  let cur = '', line = 0;
  const words = String(text).split(' ').filter(w => w.length > 0);
  for (const w0 of words) {
    const word = w0.slice(0, 47);
    let test = cur.length ? cur + ' ' + word : word;
    if (measureTextStrW(test, sizePx) > maxW && cur.length > 0) {
      drawTextStr(ctx, x, y + line * lineH, cur, sizePx, color);
      line++;
      test = word;
    }
    cur = test.slice(0, 63);
  }
  if (cur.length > 0) drawTextStr(ctx, x, y + line * lineH, cur, sizePx, color);
}

// One centred line that is GUARANTEED to fit maxW: step the size down, and if
// it still does not fit, scroll it right-to-left. Two copies one span apart so
// it wraps seamlessly; the panel edge clips the rest.
let marqueeShown = false;
function drawTextFitCentered(ctx, fbW, y, text, maxW, preferredPx, minPx, color) {
  let px = preferredPx;
  while (px > minPx && measureTextStrW(text, px) > maxW) px -= 2;
  const w = measureTextStrW(text, px);
  if (w <= maxW) {
    drawTextStr(ctx, centerX(fbW, w), y, text, px, color);
    return;
  }
  marqueeShown = true;
  const span = w + Math.trunc(maxW / 2);
  const off  = Math.trunc(millis() / 30) % span;     // ~33 px/second
  const x0   = Math.trunc((fbW - maxW) / 2) - off;
  // A scrolling line is off the edge by design. On the phone it still trips
  // [FIT] at every new x and floods the log; here it is kept quiet.
  fitQuiet = true;
  drawTextStr(ctx, x0, y, text, px, color);
  drawTextStr(ctx, x0 + span, y, text, px, color);
  fitQuiet = false;
}

// ==================== PIXEL DIGITS + 3x5 LETTERS ====================
const DIGIT_LARGE = 8, DIGIT_MEDIUM = 4, DIGIT_SMALL = 2;
const DAYNAME_UNIT_IN = 2, MONTH_UNIT_IN = 2, MONTH_UNIT_OUT = 2, DATE_UNIT_OUT = 2;
const DATE_NUDGE = 8;

function measureDigitStringW(str, ps) {
  let w = 0;
  for (let i = 0; i < str.length; i++) {
    const g = DIGIT_GLYPHS[str[i]];
    if (!g) continue;
    w += g.w * ps;
    if (i < str.length - 1) w += ps;
  }
  return w;
}
function drawPixelDigit(ctx, x, y, ch, ps, color) {
  const g = DIGIT_GLYPHS[ch];
  const b = { x: x, y: y, width: 0, height: 0 };
  if (!g) return b;
  ctx.fillStyle = color;
  for (let row = 0; row < 5; row++)
    for (let col = 0; col < g.w; col++)
      if (g.rows[row] & (1 << col)) ctx.fillRect(x + col * ps, y + row * ps, ps, ps);
  b.width = g.w * ps; b.height = 5 * ps;
  if (debugMode) fbOutline(ctx, b.x, b.y, b.width, b.height, COL_FIT_OK);
  return b;
}
function drawDigitString(ctx, x, y, str, ps, color) {
  let curX = x, maxH = 0;
  for (let i = 0; i < str.length; i++) {
    const g = drawPixelDigit(ctx, curX, y, str[i], ps, color);
    curX += g.width + ps;
    if (g.height > maxH) maxH = g.height;
  }
  const total = { x: x, y: y, width: curX - x - ps, height: maxH };
  if (debugMode) fbOutline(ctx, total.x, total.y, total.width, total.height, COL_YEL);
  return total;
}
function measureLetterStringW(str, ps) {
  const n = str.length;
  if (n === 0) return 0;
  return n * (3 * ps + ps) - ps;
}
function drawLetterString(ctx, x, y, str, ps, color) {
  let cx = x;
  ctx.fillStyle = color;
  for (const ch of str) {
    const g = LETTERS3x5[ch];
    if (g) {
      for (let r = 0; r < 5; r++)
        for (let c = 0; c < 3; c++)
          if (g[r] & (1 << c)) ctx.fillRect(cx + c * ps, y + r * ps, ps, ps);
    }
    cx += 3 * ps + ps;          // glyph + one-unit gap, same pitch as digits
  }
  return cx - x - ps;
}

// ==================== STATUS BAR ====================
// activeBars (0-4) lit; the rest grey. noSim greys them all and adds a red X.
function drawSignalBars(ctx, x, y, ps, color, activeBars, noSim) {
  for (let bar = 0; bar < 4; bar++) {
    const barX = x + bar * (ps + ps);
    const barColor = (!noSim && bar < activeBars) ? color : COL_GRAY6;
    for (let row = 0; row < 5; row++)
      if (row >= 3 - bar) fbRect(ctx, barX, y + row * ps, ps, ps, barColor);
  }
  const barsW = 4 * ps + 3 * ps;
  if (noSim) {
    const xx = x + barsW + ps;
    const xs = ps > 1 ? ps - 1 : 1;
    for (let i = 0; i < 5; i++) {
      fbRect(ctx, xx + i * xs,       y + i * xs, xs, xs, COL_RED);
      fbRect(ctx, xx + (4 - i) * xs, y + i * xs, xs, xs, COL_RED);
    }
  }
  const b = { x: x, y: y, width: barsW + (noSim ? ps * 6 : 0), height: 5 * ps };
  if (debugMode) fbOutline(ctx, b.x, b.y, b.width, b.height, COL_BLUE);
  return b;
}
function csqToBars(csq) {
  if (csq <= 0 || csq >= 99) return 0;
  if (csq < 10) return 1;
  if (csq < 15) return 2;
  if (csq < 20) return 3;
  return 4;
}

// Owned by pptransfer, which does not exist yet - so nothing sets this and the
// WiFi icon never draws. Deliberately NOT "is WiFi on": it means OTHER DEVICES
// CAN JOIN ME RIGHT NOW.
let ppTransferJoinable = false;

// Decides WHICH icons show and packs them left to right in a fixed order. Only
// exceptional states draw: audible shows nothing, vibrate and silent can never
// both appear. An icon that would reach the battery figure is dropped.
function drawStatusIcons(ctx, x, baseY, sizePx, iconW, gap, limitX) {
  const icons = [];
  if (ppTransferJoinable)            icons.push(ICON_WIFI);
  if      (settings.ringVolume === 0) icons.push(ICON_VIBRATE);
  else if (settings.ringVolume <  0)  icons.push(ICON_SILENT);
  for (let i = 0; i < icons.length; i++) {
    if (x + iconW > limitX) break;
    drawGlyph5x7(ctx, x, baseY, icons[i], sizePx, COL_THEME);
    x += iconW + gap;
  }
  return x;
}

function getBatteryPercent() { return hardwareAPI.getBatteryPercent(); }

function drawStatus(ctx, screenW) {
  fbRect(ctx, 0, 0, screenW, 36, COL_BAR);
  const bars = (simReady && networkRegistered()) ? csqToBars(modemSignalCSQ) : 0;
  const sb = drawSignalBars(ctx, 10, 8, 4, COL_THEME, bars, !simReady);
  const bstr = getBatteryPercent() + '%';
  const bw = measureDigitStringW(bstr, 4);
  const batX = alignRight(screenW, bw, 10);
  drawDigitString(ctx, batX, 8, bstr, 4, COL_THEME);
  // Scale 4 icons: 20px of ink to match the battery figure's 20px.
  drawStatusIcons(ctx, sb.x + sb.width + 8, 32, 28, 20, 8, batX - 6);
}

// The softkey strip every list screen ends with. Left at x=10, right at x=185
// unless a screen right-aligns its own (the dialer and the text editor do).
function softkeys(ctx, left, right, leftCol, rightCol) {
  fbRect(ctx, 0, 285, 240, 35, COL_BAR2);
  if (left)  drawTextStr(ctx, 10, 308, left, 14, leftCol || COL_GRAY8);
  if (right) drawTextStr(ctx, 185, 308, right, 14, rightCol || COL_GRAY8);
}
function drawScrollbar(ctx, count, top, visible, listTop, rowH) {
  if (count <= visible) return;
  const trackH = visible * rowH;
  let barH = Math.trunc(trackH * visible / count); if (barH < 8) barH = 8;
  const barY = listTop + Math.trunc((trackH - barH) * top / (count - visible));
  fbRect(ctx, 236, listTop, 2, trackH, COL_BAR);
  fbRect(ctx, 236, barY, 2, barH, COL_GRAY8);
}

// ==================== STORAGE LAYER ====================
// On the phone these are fixed-size structs on LittleFS. Here they are JSON in
// the emulator's storage shim (localStorage). Same shapes, same rules: text
// lives in internal storage and survives the card being pulled out.

// ---- settings ----
// Version 5, same as the firmware. A different version means "fresh start",
// exactly as settingsLoad() does on the phone: one ringtone/volume choice is
// lost, nothing is corrupted.
const SETTINGS_VERSION = 5;
const VOL_MIN = -1, VOL_MAX = 9;
let settings = {};

function settingsDefaults() {
  settings = {
    version: SETTINGS_VERSION,
    bootCount: 0,
    debugMode: 0,
    activeRingtoneIx: 0,
    ringVolume: 6,          // -1 silent, 0 vibrate, 1..9 audible
    themeIx: 3,             // 3 = TERMINAL, matching SmartClock's default accent
    customR: 0x00, customG: 0xFF, customB: 0x00,   // Custom starts on pure green
    keyTones: 0,            // no hook yet - row is greyed
    vibrateOnRing: 0,       // no motor yet - row is greyed
    brightness: 80,         // 10..100
    dimAfterS: 15,
    sleepAfterS: 30,
    autoTime: 1
  };
}
function settingsSave() { return hardwareAPI.storage.write('settings', settings); }
function settingsLoad() {
  const s = hardwareAPI.storage.read('settings');
  if (!s || s.version !== SETTINGS_VERSION) {
    pxlog('Settings: fresh start');
    settingsDefaults();
    return;
  }
  settingsDefaults();                 // any field a hand-edited copy lacks
  settings = Object.assign(settings, s);
}

// ==================== THEME ====================
// SmartClock's names and hexes, verbatim, so a theme means the same colour on
// both devices. darkInk is black on every entry BY DECISION (see the register).
const THEMES = [
  { name: 'CRIMSON',  r: 0xCC, g: 0x00, b: 0x00, darkInk: true },
  { name: 'EMBER',    r: 0xFF, g: 0x66, b: 0x00, darkInk: true },
  { name: 'GOLD',     r: 0xFF, g: 0xCC, b: 0x00, darkInk: true },
  { name: 'TERMINAL', r: 0x00, g: 0x80, b: 0x00, darkInk: true },   // <- default
  { name: 'OCEAN',    r: 0x00, g: 0x55, b: 0xFF, darkInk: true },
  { name: 'ARCANE',   r: 0xB0, g: 0x41, b: 0xB7, darkInk: true },
];
const THEME_COUNT  = 6;
const THEME_CUSTOM = THEME_COUNT;       // 6: the row after the presets
const THEME_ROWS   = THEME_COUNT + 1;   // 7 rows in the picker
const RGB_STEP     = 8;                 // RGB565 red/blue have 32 real levels

// WCAG: black ink beats white exactly when linear luminance is >= 0.179.
function srgbLin(c) {
  const f = c / 255;
  return (f <= 0.03928) ? (f / 12.92) : Math.pow((f + 0.055) / 1.055, 2.4);
}
function darkInkFor(r, g, b) {
  return (0.2126 * srgbLin(r) + 0.7152 * srgbLin(g) + 0.0722 * srgbLin(b)) >= 0.179;
}

// Sets BOTH colours together and records the choice. Does not save: the caller
// decides whether this is a live preview or a commitment.
function themeApply(ix) {
  if (ix < 0 || ix > THEME_CUSTOM) ix = 0;
  let r, g, b, dark;
  if (ix === THEME_CUSTOM) {
    r = settings.customR; g = settings.customG; b = settings.customB;
    dark = darkInkFor(r, g, b);
  } else {
    const t = THEMES[ix];
    r = t.r; g = t.g; b = t.b; dark = t.darkInk;
  }
  COL_THEME     = c565(r, g, b);
  COL_THEME_INK = dark ? c565(0x00, 0x00, 0x00) : c565(0xFF, 0xFF, 0xFF);
  settings.themeIx = ix;
}

// ==================== THE SETTINGS TREE ====================
// Table-driven, one state (ST_SETPAGE). Adding a page is one table entry.
// UNIFORM rows only - Ringtones, Theme and the RGB editor stay bespoke states,
// reached with SK_SCREEN. Eight rows is the ceiling: there is no window.
const SK_PAGE=0, SK_TOGGLE=1, SK_RANGE=2, SK_SCREEN=3, SK_ACTION=4, SK_INFO=5,
      SK_SOON=6,   // nothing behind it yet: greyed, and pressing it does nothing
      SK_TEXT=7;   // a plain line, the label IS the content (About's identity)
const PG_ROOT=0, PG_NETWORK=1, PG_TIME=2, PG_SOUNDS=3, PG_DISPLAY=4,
      PG_SECURITY=5, PG_STORAGE=6, PG_ABOUT=7, PG_COUNT=8;
const SF_RINGVOL=0, SF_DEBUG=1, SF_BRIGHT=2, SF_DIM=3, SF_SLEEP=4, SF_AUTOTIME=5;
const AC_STORAGE_INFO=0, AC_FORMAT_SD=1, AC_FACTORY_RESET=2, AC_SIM_PIN=3, AC_BACKUP=4;
const IN_OPERATOR=0, IN_BAND=1, IN_SIGNAL=2, IN_REG=3, IN_VERSION=4, IN_BOOTS=5, IN_UPTIME=6;

// On the phone this is the compiler's __DATE__. Here it is the day the browser
// build was last brought level with the .ino.
const FW_BUILD = 'Oct 21 2026';
const DIM_STEP = 5, SLEEP_STEP = 10;

function SR(label, kind, arg, lo, hi, step) {
  return { label: label, kind: kind, arg: arg || 0, lo: lo || 0, hi: hi || 0, step: step || 0 };
}
const ROWS_ROOT = [
  SR('Network',     SK_PAGE, PG_NETWORK),
  SR('Time & date', SK_PAGE, PG_TIME),
  SR('Sounds',      SK_PAGE, PG_SOUNDS),
  SR('Display',     SK_PAGE, PG_DISPLAY),
  SR('Security',    SK_PAGE, PG_SECURITY),
  SR('Storage',     SK_PAGE, PG_STORAGE),
  SR('About',       SK_PAGE, PG_ABOUT),
];
const ROWS_NETWORK = [
  SR('Operator', SK_INFO, IN_OPERATOR),
  SR('Band',     SK_INFO, IN_BAND),
  SR('Signal',   SK_INFO, IN_SIGNAL),
  SR('Status',   SK_INFO, IN_REG),
];
const ROWS_TIME = [
  SR('From network', SK_TOGGLE, SF_AUTOTIME),
  SR('Time zone',    SK_SOON),
  SR('Set manually', SK_SOON),
];
const ROWS_SOUNDS = [
  SR('Ring volume',  SK_RANGE,  SF_RINGVOL, -1, 9, 1),
  SR('Ringtone',     SK_SCREEN, ST_RINGTONES),
  SR('Keypad tones', SK_SOON),
  SR('Vibrate',      SK_SOON),
];
const ROWS_DISPLAY = [
  SR('Theme',       SK_SCREEN, ST_THEME),
  SR('Brightness',  SK_RANGE,  SF_BRIGHT, 10, 100, 10),
  SR('Dim after',   SK_RANGE,  SF_DIM,    5, 120, DIM_STEP),
  SR('Sleep after', SK_RANGE,  SF_SLEEP, 10, 300, SLEEP_STEP),
];
const ROWS_SECURITY = [
  SR('SIM PIN',     SK_ACTION, AC_SIM_PIN),
  SR('Change PIN',  SK_SOON),
  SR('Device lock', SK_SOON),
];
const ROWS_STORAGE = [
  SR('Storage info',     SK_ACTION, AC_STORAGE_INFO),
  SR('Backup & restore', SK_ACTION, AC_BACKUP),
  SR('Format SD card',   SK_ACTION, AC_FORMAT_SD),
  SR('Factory reset',    SK_ACTION, AC_FACTORY_RESET),
];
const ROWS_ABOUT = [
  SR('PxP Flip',       SK_TEXT),
  SR('ESP32-S3 N16R8', SK_TEXT),
  SR('Build',       SK_INFO,   IN_VERSION),
  SR('Boot count',  SK_INFO,   IN_BOOTS),
  SR('Uptime',      SK_INFO,   IN_UPTIME),
  SR('Debug boxes', SK_TOGGLE, SF_DEBUG),
];
const SET_PAGES = [
  { title: 'Settings',    rows: ROWS_ROOT },
  { title: 'Network',     rows: ROWS_NETWORK },
  { title: 'Time & date', rows: ROWS_TIME },
  { title: 'Sounds',      rows: ROWS_SOUNDS },
  { title: 'Display',     rows: ROWS_DISPLAY },
  { title: 'Security',    rows: ROWS_SECURITY },
  { title: 'Storage',     rows: ROWS_STORAGE },
  { title: 'About',       rows: ROWS_ABOUT },
];

// Where we are. A stack, so depth can grow without rewriting Back.
let setPage = PG_ROOT, setRow = 0;
let setStackPage = [0, 0, 0, 0], setStackRow = [0, 0, 0, 0], setDepth = 0;

// Filled when the network registers (the CPSI sweep on the phone).
let netOperator = '', netBand = '';

function setValueGet(f) {
  switch (f) {
    case SF_RINGVOL:  return settings.ringVolume;
    case SF_DEBUG:    return settings.debugMode ? 1 : 0;
    case SF_AUTOTIME: return settings.autoTime ? 1 : 0;
    case SF_DIM:      return settings.dimAfterS;
    case SF_SLEEP:    return settings.sleepAfterS;
    case SF_BRIGHT:   return settings.brightness;
  }
  return 0;
}
function setValueSet(f, v) {
  switch (f) {
    case SF_RINGVOL:  settings.ringVolume = v; break;
    case SF_DEBUG:    settings.debugMode = v ? 1 : 0; debugMode = (v !== 0); break;
    case SF_AUTOTIME: settings.autoTime = v ? 1 : 0; break;
    // Dim always happens before sleep, so the two push each other.
    case SF_DIM:
      settings.dimAfterS = v;
      if (settings.dimAfterS >= settings.sleepAfterS)
        settings.sleepAfterS = settings.dimAfterS + SLEEP_STEP;
      break;
    case SF_SLEEP:
      settings.sleepAfterS = v;
      if (settings.dimAfterS >= settings.sleepAfterS)
        settings.dimAfterS = (settings.sleepAfterS > DIM_STEP) ? settings.sleepAfterS - DIM_STEP : DIM_STEP;
      break;
    case SF_BRIGHT:   settings.brightness = v; break;
  }
  settingsSave();
}
function setInfoStr(id) {
  switch (id) {
    case IN_OPERATOR: return netOperator || '--';
    case IN_BAND:     return netBand || '--';
    case IN_SIGNAL:   return simReady ? (modemSignalCSQ + '/31') : '--';
    case IN_REG:      return simReady ? (networkRegistered() ? 'Registered' : 'Searching') : '--';
    case IN_VERSION:  return FW_BUILD;
    case IN_BOOTS:    return String(settings.bootCount);
    case IN_UPTIME:   return Math.trunc(millis() / 60000) + ' min';
  }
  return '';
}
// The right-hand column. Empty means draw nothing there.
function setValueStr(kind, arg) {
  switch (kind) {
    case SK_TOGGLE: return setValueGet(arg) ? 'ON' : 'OFF';
    case SK_RANGE: {
      const v = setValueGet(arg);
      if (arg === SF_RINGVOL) return v < 0 ? 'Silent' : v === 0 ? 'Vibrate' : String(v);
      if (arg === SF_DIM || arg === SF_SLEEP) return v + 's';
      return String(v);
    }
    case SK_INFO: return setInfoStr(arg);
    case SK_SOON: return 'soon';
  }
  return '';
}
// Left/right repeat on a NUMBER row only - an on/off row would flap.
function setRowRepeats() {
  return state === ST_SETPAGE && SET_PAGES[setPage].rows[setRow].kind === SK_RANGE;
}

// ==================== CONTACTS ====================
// Up to three numbers, filled from slot 0 upward with no gaps, each with a
// label. Colour 0 = "Default" = follow the theme.
const CONTACT_NAME_LEN = 24, CONTACT_NUM_LEN = 24, CONTACT_NUMS = 3, CONTACTS_MAX = 250;
const CONTACTS_VERSION = 2;
const NL_MOBILE = 0, NL_HOME = 1, NL_WORK = 2, NL_OTHER = 3;
const NUM_LABELS = ['Mobile', 'Home', 'Work', 'Other'];
const CONTACT_COLOUR_NAMES = ['Default', 'Red', 'Orange', 'Yellow', 'Green', 'Azure', 'Violet', 'White'];
const CONTACT_COLOUR_COUNT = 8;

let contacts = [];
let contactIdx = 0, contactTop = 0;

function contactColour(ix) {
  switch (ix) {
    case 1: return c565(0xFF, 0x00, 0x00);
    case 2: return c565(0xFF, 0x7F, 0x00);
    case 3: return c565(0xFF, 0xFF, 0x00);
    case 4: return c565(0x00, 0xFF, 0x00);
    case 5: return c565(0x00, 0xB0, 0xFF);
    case 6: return c565(0x94, 0x00, 0xD3);
    case 7: return c565(0xFF, 0xFF, 0xFF);
    default: return COL_THEME;
  }
}
function contactBlank() {
  return { name: '', number: ['', '', ''], label: [NL_MOBILE, NL_MOBILE, NL_MOBILE], colour: 0 };
}
function contactClean(c) {
  const k = contactBlank();
  k.name = String(c.name || '').slice(0, CONTACT_NAME_LEN - 1);
  for (let i = 0; i < CONTACT_NUMS; i++) {
    k.number[i] = String((c.number && c.number[i]) || '').slice(0, CONTACT_NUM_LEN - 1);
    const l = (c.label && c.label[i]) | 0;
    k.label[i] = (l >= NL_MOBILE && l <= NL_OTHER) ? l : NL_MOBILE;
  }
  // close any gap, so the count is "slots until the first empty one"
  const nums = [], labs = [];
  for (let i = 0; i < CONTACT_NUMS; i++) if (k.number[i]) { nums.push(k.number[i]); labs.push(k.label[i]); }
  while (nums.length < CONTACT_NUMS) { nums.push(''); labs.push(NL_MOBILE); }
  k.number = nums; k.label = labs;
  const col = c.colour | 0;
  k.colour = (col >= 0 && col < CONTACT_COLOUR_COUNT) ? col : 0;
  return k;
}
function contactsSave() {
  return hardwareAPI.storage.write('contacts', { version: CONTACTS_VERSION, list: contacts });
}
function contactsLoad() {
  contacts = [];
  const raw = hardwareAPI.storage.read('contacts');
  if (!raw) return;
  // v1 - the old browser build kept a bare array of { name, number }. WIDENED
  // rather than thrown away, the same way the phone widens its v1 file.
  if (Array.isArray(raw)) {
    contacts = raw.slice(0, CONTACTS_MAX).map(function (c) {
      return contactClean({ name: c.name, number: [c.number || ''], label: [NL_MOBILE], colour: c.colour || 0 });
    });
    pxlog('Contacts: widened ' + contacts.length + ' from v1');
    contactsSave();
    return;
  }
  if (raw.version !== CONTACTS_VERSION || !Array.isArray(raw.list)) {
    pxlog('Contacts: fresh start');
    contacts = [];
    contactsSave();
    return;
  }
  contacts = raw.list.slice(0, CONTACTS_MAX).map(contactClean);
}
function contactsAdd(name, number) {
  if (contacts.length >= CONTACTS_MAX) return false;
  const c = contactBlank();
  c.name = String(name).slice(0, CONTACT_NAME_LEN - 1);
  c.number[0] = String(number).slice(0, CONTACT_NUM_LEN - 1);
  c.label[0] = NL_MOBILE;     // the label popup that follows can change it
  c.colour = 0;
  contacts.push(c);
  return contactsSave();
}
function contactNumCount(idx) {
  if (idx < 0 || idx >= contacts.length) return 0;
  let n = 0;
  while (n < CONTACT_NUMS && contacts[idx].number[n]) n++;
  return n;
}
// The first of Mobile, Home, Work this contact does not have yet, else Other.
function contactFreeLabel(idx) {
  const n = contactNumCount(idx);
  for (let l = NL_MOBILE; l <= NL_WORK; l++) {
    let used = false;
    for (let k = 0; k < n; k++) if (contacts[idx].label[k] === l) used = true;
    if (!used) return l;
  }
  return NL_OTHER;
}
function contactsDelete(idx) {
  if (idx < 0 || idx >= contacts.length) return false;
  contacts.splice(idx, 1);
  return contactsSave();
}
// Which contact owns this number - ANY of its numbers - or -1.
function contactIndexForNumber(number) {
  if (!number) return -1;
  for (let i = 0; i < contacts.length; i++)
    for (let k = 0; k < CONTACT_NUMS && contacts[i].number[k]; k++)
      if (contacts[i].number[k] === number) return i;
  return -1;
}
function contactNameForNumber(number) {
  const i = contactIndexForNumber(number);
  return (i >= 0) ? contacts[i].name : number;
}
function contactExistsForNumber(number) { return contactIndexForNumber(number) >= 0; }

// ==================== MESSAGES ====================
// A flat log. A thread is "all messages whose number matches", grouped when
// the list is drawn.
const MSG_NUMBER_LEN = 24, MSG_BODY_LEN = 161, MESSAGES_MAX = 300;
let messages = [];          // { number, body, direction, status, epoch }

// A storage-full warning has to be seen wherever the person is.
let msgStorageFlash = '', msgStorageFlashUntil = 0;
function msgSetStorageFlash(text) {
  msgStorageFlash = text;
  msgStorageFlashUntil = millis() + 4000;
}
function nowEpoch() { return Math.floor(Date.now() / 1000); }

function messagesSave() { return hardwareAPI.storage.write('messages', messages); }
function messagesLoad() {
  const m = hardwareAPI.storage.read('messages');
  messages = Array.isArray(m) ? m.slice(-MESSAGES_MAX).map(function (x) {
    return { number: String(x.number || ''), body: String(x.body || ''),
             direction: x.direction | 0, status: x.status | 0, epoch: x.epoch | 0 };
  }) : [];
}
function messagesAdd(number, body, direction, status) {
  if (messages.length >= MESSAGES_MAX) messages.shift();   // oldest drops
  messages.push({ number: String(number).slice(0, MSG_NUMBER_LEN - 1),
                  body: String(body).slice(0, MSG_BODY_LEN - 1),
                  direction: direction, status: status, epoch: nowEpoch() });
  if (!messagesSave()) {
    pxlog('[SMS] Storage full - message NOT saved. Free up space (delete old messages/photos).');
    msgSetStorageFlash('Storage full! Delete old messages');
    return false;
  }
  return true;
}
function messagesDeleteThread(number) {
  const before = messages.length;
  messages = messages.filter(function (m) { return m.number !== number; });
  const removed = before - messages.length;
  if (removed > 0) messagesSave();
  return removed;
}

// ---- threads (a view over messages, rebuilt on entry) ----
let threadNumbers = [], threadLastMsg = [];
let threadIdx = 0, threadTop = 0;
// How many conversations the list shows at once - ONE number for the drawing
// and the scrolling. They used to say 5 and 6 (fixed on the phone too).
const THREAD_ROWS = 5;
let chatNumber = '';
let chatScrollTop = 0;        // first visible LINE of the open thread; 9999 = newest
let pendingMsgNumber = '';
function threadsScan() {
  threadNumbers = []; threadLastMsg = [];
  threadIdx = 0; threadTop = 0;
  for (let i = 0; i < messages.length && threadNumbers.length < 64; i++) {
    const t = threadNumbers.indexOf(messages[i].number);
    if (t >= 0) threadLastMsg[t] = i;
    else { threadNumbers.push(messages[i].number); threadLastMsg.push(i); }
  }
  const order = threadNumbers.map(function (n, i) { return i; })
                             .sort(function (a, b) { return threadLastMsg[b] - threadLastMsg[a]; });
  threadNumbers = order.map(function (i) { return threadNumbers[i]; });
  threadLastMsg = order.map(function (i) { return threadLastMsg[i]; });
}

// ==================== CALL LOG ====================
const CALLLOG_NUMBER_LEN = 24, CALLLOG_MAX = 300, CALLLOG_VERSION = 2;
let callLog = [];           // { number, type, epoch, durationSec }
let callLogIdx = 0, callLogTop = 0;

function callLogSave() {
  return hardwareAPI.storage.write('calllog', { version: CALLLOG_VERSION, list: callLog });
}
function callLogLoad() {
  const raw = hardwareAPI.storage.read('calllog');
  callLog = [];
  if (!raw) return;
  let list = null;
  if (Array.isArray(raw)) {
    // The first browser build numbered the types the other way round
    // (IN = 0, OUT = 1). The phone has always had OUT = 0, IN = 1.
    list = raw.map(function (c) {
      const t = c.type | 0;
      return { number: c.number, type: (t === 0) ? CALL_IN : (t === 1) ? CALL_OUT : t,
               epoch: c.epoch | 0, durationSec: c.durationSec | 0 };
    });
  } else if (raw.version === CALLLOG_VERSION && Array.isArray(raw.list)) {
    list = raw.list;
  }
  if (!list) return;
  callLog = list.slice(-CALLLOG_MAX).map(function (c) {
    return { number: String(c.number || ''), type: c.type | 0, epoch: c.epoch | 0, durationSec: c.durationSec | 0 };
  });
  if (Array.isArray(raw)) callLogSave();
}
function callLogAdd(number, type, durationSec) {
  if (callLog.length >= CALLLOG_MAX) callLog.shift();
  callLog.push({ number: String(number).slice(0, CALLLOG_NUMBER_LEN - 1), type: type,
                 epoch: nowEpoch(), durationSec: durationSec });
  if (!callLogSave()) {
    pxlog('[Call] Storage full - call log entry NOT saved.');
    msgSetStorageFlash('Storage full! Delete old messages');
    return false;
  }
  return true;
}
function callLogDelete(idx) {
  if (idx < 0 || idx >= callLog.length) return false;
  callLog.splice(idx, 1);
  return callLogSave();
}

// ==================== FIRST RUN / SAMPLE DATA (browser build only) ==========
// A fresh browser gets two contacts and one thread, so the emulator has
// something to show. (The phone seeds three starter contacts instead.) Delete
// them and they stay deleted.
//
// SEED_VERSION is bumped whenever the sample changes. A browser holding an
// older sample gets the new one once - but only if what it holds still has the
// SHAPE of untouched sample data. Anything the user actually did changes that
// shape, so their data is left alone.
const SEED_VERSION = 3;
const SEED_NUMBER  = '+36701234567';

function sampleDataUntouched() {
  return contacts.length === 2
      && contacts[1].number[0] === SEED_NUMBER
      && messages.length === 2
      && messages[0].number === SEED_NUMBER && messages[1].number === SEED_NUMBER
      && messages[0].direction === MSG_DIR_IN
      && messages[1].direction === MSG_DIR_OUT;
}
function seedSampleData() {
  const stored = hardwareAPI.storage.read('seedVersion') || 0;
  if (stored === SEED_VERSION) return;
  hardwareAPI.storage.write('seedVersion', SEED_VERSION);

  const empty = contacts.length === 0 && messages.length === 0;
  if (!empty && !sampleDataUntouched()) return;      // theirs, do not touch it

  // Mum has two numbers, so Call shows the number chooser; P_P has a colour.
  const mum = contactBlank();
  mum.name = 'Mum';
  mum.number[0] = '+36301112222'; mum.label[0] = NL_MOBILE;
  mum.number[1] = '+3612345678';  mum.label[1] = NL_HOME;
  const pp = contactBlank();
  pp.name = 'P_P'; pp.number[0] = SEED_NUMBER; pp.label[0] = NL_MOBILE; pp.colour = 5;
  contacts = [mum, pp];
  contactsSave();
  const t = nowEpoch();
  messages = [
    { number: SEED_NUMBER, body: 'did the board turn up yet?', direction: MSG_DIR_IN,  status: MSG_ST_SENT, epoch: t - 3600 },
    { number: SEED_NUMBER, body: 'yeah, soldering it now',     direction: MSG_DIR_OUT, status: MSG_ST_SENT, epoch: t - 3500 }
  ];
  messagesSave();
  pxlog(empty ? 'First run - sample contacts and one thread' : 'Sample data refreshed');
}

// ==================== RINGTONES ====================
// Note tables copied straight out of the firmware - same order, same names.
// New ones go at the END: settings.activeRingtoneIx is a position.
// [hz, ms] pairs; hz 0 is a rest, not a tone.
const RINGTONES = [
  { name: 'Cadet', notes: [
    [494,107],[0,107],[494,107],[494,107],[587,107],[0,107],[587,107],[587,107],
    [494,107],[0,107],[494,107],[494,107],[587,107],[0,107],[494,107],[587,107],
    [494,107],[0,107],[494,107],[494,107],[587,107],[0,107],[587,107],[587,107],
    [494,107],[0,107],[494,107],[0,107],[587,107],[0,321] ] },
  { name: 'Echo', notes: [
    [622,107],[622,107],[622,107],[0,214],[740,107],[0,214],
    [622,107],[622,107],[622,107],[0,214],[523,107],[0,214],
    [622,107],[622,107],[622,107],[0,214],[740,107],[0,1071] ] },
  { name: 'Semaphore', notes: [
    [349,107],[0,107],[494,107],[0,107],[349,107],[0,107],[494,107],[0,107],
    [349,107],[0,107],[494,107],[0,107],[494,107],[0,107],[494,107],[0,107],
    [349,107],[0,107],[262,107],[0,107],[349,107],[0,107],[262,107],[0,107],
    [349,107],[0,750] ] },
  { name: 'Beacon', notes: [
    [554,107],[554,107],[659,107],[659,107],
    [554,107],[554,107],[784,107],[784,107],[0,2571] ] },
  { name: 'Cascade', notes: [
    [784,136],[659,136],[698,273],[622,273],
    [740,136],[622,136],[659,273],[587,273],
    [698,136],[587,136],[622,273],[554,273],
    [587,409],[0,1500] ] },
  { name: 'Landline', notes: [
    [523,60],[349,60],[523,60],[349,60],[523,60],[349,60],[523,60],[349,60],
    [523,60],[349,60],[523,60],[349,60],[523,60],[349,60],[523,60],[349,60],
    [523,60],[349,60],[523,60],[349,60],[0,720] ] },
  { name: 'Neo', notes: [
    [415,65],[415,65],[415,65],[415,65],[415,65],[415,65],[415,65],[415,65],
    [415,65],[415,65],[415,65],[415,65],[415,65],[415,65],[415,65],[415,65],
    [0,1043] ] },
  { name: 'Outpost', notes: [
    [659,273],[466,273],[554,136],[659,136],[466,273],
    [440,273],[554,273],[784,273],[440,273] ] },
  { name: 'Warble', notes: [
    [880,58],[740,58],[880,58],[740,58],[880,58],[740,58],[880,58],[740,58],
    [880,58],[740,58],[880,58],[740,58],[880,58],[740,58],[880,58],[740,58],
    [0,923] ] },
  { name: 'Pager', notes: [
    [740,50],[554,50],[740,50],[554,50],[0,100],
    [740,50],[554,50],[740,50],[554,50],[0,100],
    [740,50],[554,50],[740,50],[554,50],[0,800] ] },
  { name: 'Cricket', notes: [
    [698,65],[740,65],[698,65],[0,65],
    [698,65],[740,65],[698,65],[0,65],
    [698,65],[740,65],[698,65],[0,1370] ] },
  // ---- Ticker: seven fast single beeps (280 bpm) ----
  { name: 'Ticker', notes: [
    [831,54],[0,54],[831,54],[0,54],[831,54],[0,54],[831,54],[0,54],
    [831,54],[0,54],[831,54],[0,54],[831,54],[0,1018] ] },
];
const RINGTONE_COUNT = RINGTONES.length;
let ringtonePickerIdx = 0, ringtonePickerTop = 0;

// Amplitude per volume level, NOT linear - loudness is perceived roughly
// logarithmically. Index 0 is silence. Scaled into the browser's 0..1 gain.
const RING_AMPLITUDE = [0, 260, 480, 850, 1400, 2200, 3300, 4700, 6300, 8000];
function ringGain() {
  let v = settings.ringVolume;
  if (v < 0) v = 0; else if (v > VOL_MAX) v = VOL_MAX;
  return RING_AMPLITUDE[v] / 8000 * 0.7;
}
// The pause between repeats is the SAME for every ringtone. Any rest a table
// ENDS with is skipped and this gap is played instead - same as audioTask() on
// the phone. Rests INSIDE a tune stay.
const RINGTONE_GAP_MS = 1000;
function ringtonePlayCount(ix) {
  const notes = RINGTONES[ix].notes;
  let n = notes.length;
  while (n > 0 && notes[n - 1][0] === 0) n--;
  return n;
}
// The tune alone, without its trailing rest - what a preview plays once.
function notesFor(ix) {
  return RINGTONES[ix].notes.slice(0, ringtonePlayCount(ix))
    .map(function (n) { return { hz: n[0], ms: n[1] }; });
}
// What a real ring loops: the tune, then the gap.
function ringLoopNotes(ix) { return notesFor(ix).concat([{ hz: 0, ms: RINGTONE_GAP_MS }]); }

let ringtonePlaying = false;
let previewRingtoneIx = -1;    // -1 = no preview in progress
let previewEndsAt = 0;         // when a preview's single pass is over

function ringtoneStart() {
  previewRingtoneIx = -1;      // a picker preview must not carry into a real ring
  ringtonePlaying = false;
  // Silent and vibrate never touch the speaker - the call screen still appears.
  if (settings.ringVolume <= 0) {
    pxlog(settings.ringVolume === 0 ? '[Call] Vibrate (no motor wired yet)' : '[Call] Silent');
    return;
  }
  if (settings.activeRingtoneIx < 0 || settings.activeRingtoneIx >= RINGTONE_COUNT)
    settings.activeRingtoneIx = 0;
  hardwareAPI.audio.setVolume(ringGain());
  hardwareAPI.audio.playMelody(ringLoopNotes(settings.activeRingtoneIx), true);
  ringtonePlaying = true;
}
function ringtoneStop() {
  if (!ringtonePlaying) return;
  ringtonePlaying = false;
  previewRingtoneIx = -1;
  hardwareAPI.audio.stop();
}
// A PREVIEW plays the tune ONCE, all the way through, and stops. On silent or
// vibrate it runs at amplitude 0 - the phone's generator clamps the level to
// silence rather than to the quietest audible tone.
function ringtonePreview(ix) {
  if (ix < 0 || ix >= RINGTONE_COUNT) return;
  ringtoneStop();
  previewRingtoneIx = ix;
  const notes = notesFor(ix);
  const gain = ringGain();
  if (gain > 0) {
    hardwareAPI.audio.setVolume(gain);
    hardwareAPI.audio.playMelody(notes, false);
  }
  ringtonePlaying = true;
  previewEndsAt = millis() + notes.reduce(function (s, n) { return s + n.ms; }, 0) + 60;
}
// B5 (was B6, an octave higher - shrill), once when you answer and once when a
// CONNECTED call ends. Silent mode stays silent.
const BLIP_HZ = 988, BLIP_MS = 70;
function audioBlip() {
  if (settings.ringVolume <= 0) return;
  hardwareAPI.audio.setVolume(ringGain());
  hardwareAPI.audio.tone(BLIP_HZ, BLIP_MS);
}

// ==================== VOLUME ====================
let volOverlayUntil = 0;
// Refuses to run during ANY call state: while a call is up the volume keys
// mean "shut the ringer up" and nothing else.
function volumeAdjust(delta) {
  if (callState !== CALL_IDLE) return;
  let v = settings.ringVolume + delta;
  if (v < VOL_MIN) v = VOL_MIN;
  if (v > VOL_MAX) v = VOL_MAX;
  const changed = (v !== settings.ringVolume);
  settings.ringVolume = v;
  if (changed) settingsSave();
  volOverlayUntil = millis() + 2000;
  pxlog(v < 0 ? 'Volume silent' : v === 0 ? 'Volume vibrate' : 'Volume ' + v + '/9');
  if (!flipIsOpen()) {
    clearOuterFade();
    hardwareAPI.setOuterBrightness(100);
    renderOuter();
    startOuterTimer();
  } else {
    startScreenTimers();
    renderInner();
  }
}
// Either volume button silences a ringing call. Returns true for the WHOLE
// call, sound or no sound, so the press never falls through to the volume.
function callSilenceRing() {
  if (callState === CALL_IDLE) return false;
  if (ringtonePlaying) { ringtoneStop(); pxlog('[Call] Ringer silenced'); }
  return true;
}
// The flip-shut peek: light the outer screen without touching the volume.
function osVolumePress() {
  if (callState !== CALL_IDLE) return;
  if (!flipIsOpen() && state !== ST_OFF) {
    if (fadeActive || hardwareAPI.getOuterBrightness() > 0) {
      pxlog('Outer screen active - reset timer');
      startOuterTimer();
      return;
    }
    renderOuter();
    startFade(0, 100);
    startOuterTimer();
  }
}

// ==================== CALLS ====================
let callState = CALL_IDLE;
let preCallState = ST_HOME;
let callNumber = '';
let callStartMs = 0;            // millis() when answered - drives MM:SS
let callMuted = false, callSpeaker = false, callOutgoing = false;
let callFlash = '', callFlashUntil = 0;
// Outer-screen badges: "what happened since you last looked". RAM only.
let missedCallCount = 0, unreadTextCount = 0;

function callFinalize(loggedType, durationSec) {
  callLogAdd(callNumber, loggedType, durationSec);
  ringtoneStop();
  callState = CALL_IDLE;
  state = preCallState;
  callNumber = '';
  callMuted = false; callSpeaker = false; callOutgoing = false;
  if (powered) {
    if (flipIsOpen()) renderInner();
    else { renderOuter(); startOuterTimer(); }
  }
}
// Every path that ends a call locally goes through here.
function callHangup() {
  if (callState === CALL_IDLE) return;
  hardwareAPI.modem.hangup();
  if (callState === CALL_RINGING) {
    callFinalize(CALL_REJECTED, 0);           // declined - NOT a missed call
    pxlog('[Call] Declined');
  } else if (callState === CALL_DIALING) {
    callFinalize(CALL_OUT, 0);
    pxlog('[Call] Cancelled');
  } else if (callState === CALL_ACTIVE) {
    const dur = callStartMs ? Math.trunc((millis() - callStartMs) / 1000) : 0;
    callFinalize(callOutgoing ? CALL_OUT : CALL_IN, dur);
    audioBlip();
    pxlog('[Call] Ended (hung up)');
  }
}
function callAnswer() {
  if (callState !== CALL_RINGING) return;
  hardwareAPI.modem.answer();
  ringtoneStop();
  callState = CALL_ACTIVE;
  state = ST_INCALL;
  callStartMs = millis();
  audioBlip();
  pxlog('[Call] Answered');
  renderInner();
}
// The trailing ';' on ATD is what makes it a VOICE call - the emulator's
// modem.dial() sends it.
function callDial(number) {
  if (callState !== CALL_IDLE) return false;
  if (!number) return false;
  if (!simReady || !networkRegistered()) {
    callFlash = 'No network';
    callFlashUntil = millis() + 2500;
    pxlog('[Call] Cannot dial - not registered');
    renderInner();
    return false;
  }
  preCallState = state;
  callOutgoing = true; callMuted = false; callSpeaker = false;
  callStartMs = 0;                 // stays 0 until the far end answers
  callNumber = String(number).slice(0, CALLLOG_NUMBER_LEN - 1);
  callState = CALL_DIALING;
  state = ST_INCALL;
  optOpen = false;
  startScreenTimers();
  renderInner();
  if (!hardwareAPI.modem.dial(callNumber)) {
    pxlog('[Call] Dial rejected by modem');
    callFinalize(CALL_OUT, 0);
    callFlash = 'Call failed';
    callFlashUntil = millis() + 2500;
    renderInner();
    return false;
  }
  pxlog('[Call] Dialing ' + callNumber);
  return true;
}
function callConnected() {
  if (callState !== CALL_DIALING) return;
  callState = CALL_ACTIVE;
  callStartMs = millis();
  pxlog('[Call] Answered by them');
  renderInner();
}
function callToggleMute() {
  if (callState !== CALL_ACTIVE) return;
  callMuted = !callMuted;
  pxlog(callMuted ? 'AT+CMUT=1' : 'AT+CMUT=0');
  renderInner();
}
function callToggleSpeaker() {
  if (callState !== CALL_ACTIVE) return;
  callSpeaker = !callSpeaker;
  pxlog(callSpeaker ? 'AT+CSDVC=3' : 'AT+CSDVC=1');
  renderInner();
}

// ==================== SIM + MODEM POLL ====================
// The phone asks the modem every 3 s: AT+CPIN?, then AT+CREG? and AT+CSQ once
// the card is ready. Same cadence here, against the emulator's modem.
let simState = SIM_UNKNOWN;
let simReady = false;
let modemRegState = -1;        // 1 home, 5 roaming, anything else = not on a network
let modemSignalCSQ = 99;       // 0-31, 99 = unknown
let simPinAttempts = 0;        // this session only - never shown as "tries left"
let simPendingPuk = '';
let simFlash = '', simFlashUntil = 0;
let simTookScreen = false;     // simTextCommit() put a screen up of its own
const MODEM_POLL_EVERY = 3000;
let modemNextPoll = 0;

function networkRegistered() { return modemRegState === 1 || modemRegState === 5; }

// GSM 02.17 5.6: a PIN is 4 to 8 digits, a PUK is always 8. Enforced in the
// editor, so a wrong length never reaches the modem.
function simCodeMin(owner) {
  if (owner === TXT_SIM_PUK) return 8;
  if (owner === TXT_SIM_PIN || owner === TXT_SIM_NEWPIN) return 4;
  return 0;
}
function simCodeMax(owner) {
  if (owner === TXT_SIM_PUK) return 8;
  if (owner === TXT_SIM_PIN || owner === TXT_SIM_NEWPIN) return 8;
  return TEXT_MAX;
}
function simSetFlash(msg) {
  simFlash = msg;
  simFlashUntil = millis() + 2500;
  pxlog('[SIM] ' + msg);
}
function simPromptPin() { textEditOpen('Enter PIN', '', TXT_SIM_PIN, true, true); }
function simPromptPuk() { textEditOpen('Enter PUK', '', TXT_SIM_PUK, true, true); }

// Called from textEditCommit(). Returns true if it handled the field.
function simTextCommit(owner, value) {
  if (owner === TXT_SIM_PIN) {
    simPinAttempts++;
    const r = hardwareAPI.modem.enterPin(value);
    if (r.ok) {
      simState = SIM_READY_ST; simReady = true; simPinAttempts = 0;
      simFlashUntil = 0;
      pxlog('[SIM] PIN accepted');            // log only - success needs no flash
    } else if (r.state === 'puk') {
      simState = SIM_NEEDS_PUK;
      simSetFlash('SIM blocked');
      simPromptPuk();                         // straight to the PUK field
      simTookScreen = true;
    } else {
      simSetFlash('Wrong PIN');
      simPromptPin();                         // straight back to an empty field
      simTookScreen = true;
    }
    return true;
  }
  if (owner === TXT_SIM_PUK) {
    simPendingPuk = value;
    textEditOpen('New PIN', '', TXT_SIM_NEWPIN, true, true);
    simTookScreen = true;                     // step 1 of 2
    return true;
  }
  if (owner === TXT_SIM_NEWPIN) {
    const r = hardwareAPI.modem.enterPuk(simPendingPuk, value);
    simPendingPuk = '';
    if (r.ok) {
      simState = SIM_READY_ST; simReady = true; simPinAttempts = 0;
      simFlashUntil = 0;
      pxlog('[SIM] SIM unlocked, new PIN set');
    } else if (r.state === 'puk') {
      simSetFlash('Wrong PUK');
      simPromptPuk();
      simTookScreen = true;
    } else {
      simSetFlash('Unlock failed');
      simPromptPuk();
      simTookScreen = true;
    }
    return true;
  }
  return false;
}

function modemPoll(now) {
  if (now < modemNextPoll) return;
  // Never during audio or a call - on the phone each AT round trip blocks.
  const audioBusy = (state === ST_VOICE_REC && voiceRecState === VREC_RECORDING) ||
                    (state === ST_VOICE_PLAY && voicePlaying) ||
                    state === ST_INCOMING_CALL || state === ST_INCALL;
  if (audioBusy) { modemNextPoll = now + 250; return; }
  modemNextPoll = now + MODEM_POLL_EVERY;

  const m = hardwareAPI.modem;
  const ss = m.getSimState();
  const newState = (ss === 'ready') ? SIM_READY_ST : (ss === 'pin') ? SIM_NEEDS_PIN
                 : (ss === 'puk') ? SIM_NEEDS_PUK : SIM_NOT_PRESENT;
  if (newState !== simState) {
    simState = newState;
    const names = ['unknown', 'no SIM detected', 'needs PIN', 'needs PUK (blocked!)', 'ready'];
    pxlog('[Modem] SIM: ' + names[simState]);
    if (state === ST_HOME) renderInner();
  }
  simReady = (simState === SIM_READY_ST);

  // Re-ask on EVERY poll while the card is locked - a prompt skipped because a
  // popup was open is not lost. Never while the phone is switched off.
  if (powered && state !== ST_OFF && (simState === SIM_NEEDS_PIN || simState === SIM_NEEDS_PUK)) {
    const alreadyAsking = (state === ST_TEXTEDIT &&
      (textOwner === TXT_SIM_PIN || textOwner === TXT_SIM_PUK || textOwner === TXT_SIM_NEWPIN));
    if (!alreadyAsking) {
      optOpen = false;
      if (simState === SIM_NEEDS_PIN) simPromptPin(); else simPromptPuk();
    }
  }

  if (!simReady) { modemRegState = -1; modemSignalCSQ = 99; return; }

  const stat = m.isRegistered() ? 1 : 2;
  if (stat !== modemRegState) {
    modemRegState = stat;
    pxlog('[Modem] Registration: ' + (stat === 1 ? 'home network' : 'searching'));
    if (stat === 1) {               // the CPSI sweep: operator and band
      netOperator = (typeof m.getOperator === 'function') ? (m.getOperator() || '') : '';
      netBand     = (typeof m.getBand === 'function') ? (m.getBand() || '') : '';
    }
  }
  const v = m.getSignal();
  if (v !== modemSignalCSQ) {
    modemSignalCSQ = v;
    pxlog('[Modem] Signal CSQ: ' + v + '/31');
  }
}

// ==================== TEXT EDITOR (multi-tap) ====================
const TEXT_MAX = 160;
const TAP_WINDOW = 500;        // ms to keep cycling the same key
const TXT_NONE=0, TXT_CONTACT_NAME=1, TXT_CONTACT_NUM=2,
      TXT_SIM_PIN=3, TXT_SIM_PUK=4, TXT_SIM_NEWPIN=5,
      TXT_MSG_BODY=6, TXT_MSG_NEWNUM=7,
      TXT_CONTACT_EDIT_NAME=8, TXT_CONTACT_EDIT_NUM=9,
      TXT_CONTACT_ADD_NUM=10;
// Lowercase throughout; case is applied when the character is placed.
const KEYMAP = [
  ' 0', " .,?!'\"1-()", 'abc2', 'def3', 'ghi4',
  'jkl5', 'mno6', 'pqrs7', 'tuv8', 'wxyz9', '+/=<>[]{}*'
];

let textBuf = '', textCursor = 0, textTitle = '';
let textCaseMode = 0;          // 0 Abc  1 abc  2 ABC  3 123
let textDigitsOnly = false, textOwner = TXT_NONE;
let textMask = false, textMaskPos = -1, textMaskAt = 0;
let tapKey = 0, tapIndex = 0, tapExpire = 0;
let textCursorVisible = true, textBlinkNext = 0;
let pendingName = '';
let savingContactFromMessage = false, savingContactReturn = 0;

// ---- symbol picker, opened with * while typing ----
// Exactly 32 symbols: an 8 x 4 grid with no ragged last row. Space is left out
// because 0 already types it.
const SYMBOLS = ".,?!'\"-_:;()/@#$%&*+=<>[]{}\\^`|~";
const SYMBOL_COUNT = 32, SYMBOL_COLS = 8;
let symbolPickerOpen = false, symbolIdx = 0;

// Where Edit name / Edit number / Colour return to, and where Back from a
// message body goes - wherever each was started.
let contactEditReturn = ST_CONTACT_DETAIL;
let msgBodyReturn = ST_CHAT;
let contactColourIdx = 0;

function textBlinkReset() {
  textCursorVisible = true;
  textBlinkNext = millis() + 600;
}
function textEditOpen(title, initial, owner, digitsOnly, mask) {
  symbolPickerOpen = false;    // never inherit an open picker from a previous field
  textTitle = title; textOwner = owner;
  textDigitsOnly = !!digitsOnly; textMask = !!mask;
  textMaskPos = -1; textMaskAt = 0; textCaseMode = 0;
  textBuf = String(initial || '').slice(0, TEXT_MAX);
  textCursor = textBuf.length;
  tapKey = 0; tapIndex = 0; tapExpire = 0;
  state = ST_TEXTEDIT;
  textBlinkReset();
  renderInner();
}
function textInsert(c) {
  if (textBuf.length >= TEXT_MAX) return;
  if (textBuf.length >= simCodeMax(textOwner)) return;   // PIN and PUK stop at 8
  textBuf = textBuf.slice(0, textCursor) + c + textBuf.slice(textCursor);
  textCursor++;
}
function textDelete() {
  if (textCursor <= 0) return;
  textBuf = textBuf.slice(0, textCursor - 1) + textBuf.slice(textCursor);
  textCursor--;
  tapKey = 0;
}
// Abc: capital at the start of the field, or straight after a space.
function textApplyCase(c, pos) {
  if (c < 'a' || c > 'z') return c;
  if (textCaseMode === 2) return c.toUpperCase();
  if (textCaseMode === 1) return c;
  if (pos === 0) return c.toUpperCase();
  if (textBuf[pos - 1] === ' ') return c.toUpperCase();
  return c;
}
function textKeyPress(k) {
  let idx;
  if (k >= '0' && k <= '9') idx = k.charCodeAt(0) - 48;
  else if (k === '*') idx = 10;
  else return;

  // Number fields and 123 mode: the key IS the character, no cycling.
  if (textDigitsOnly || textCaseMode === 3) {
    if (k === '*') {
      const now = millis();
      // same trick as the dialer: * twice within a second becomes +
      if (tapKey === '*' && now < tapExpire && textCursor > 0 && textBuf[textCursor - 1] === '*') {
        textBuf = textBuf.slice(0, textCursor - 1) + '+' + textBuf.slice(textCursor);
      } else textInsert('*');
      tapKey = '*'; tapExpire = now + 1000;
      if (textMask) textMaskPos = -1;   // '*' itself is never worth revealing
    } else {
      textInsert(k);
      tapKey = 0;
      if (textMask) { textMaskPos = textCursor - 1; textMaskAt = millis() + 1000; }
    }
    textBlinkReset();
    return;
  }
  const map = KEYMAP[idx];
  const n = map.length;
  const now = millis();
  if (tapKey === k && now < tapExpire && textCursor > 0) {
    tapIndex = (tapIndex + 1) % n;                       // cycle in place
    const ch = textApplyCase(map[tapIndex], textCursor - 1);
    textBuf = textBuf.slice(0, textCursor - 1) + ch + textBuf.slice(textCursor);
  } else {
    tapIndex = 0;
    textInsert(textApplyCase(map[0], textCursor));       // commit, start new
    tapKey = k;
  }
  tapExpire = now + TAP_WINDOW;
  textBlinkReset();
}
function textCycleCase() {
  if (textDigitsOnly) return;
  textCaseMode = (textCaseMode + 1) % 4;
  tapKey = 0;
  textBlinkReset();
}
function textEditCancel() {
  symbolPickerOpen = false;
  const owner = textOwner;
  // A SIM code screen has no exit - one keypress past the only gate the phone has.
  if (owner === TXT_SIM_PIN || owner === TXT_SIM_PUK || owner === TXT_SIM_NEWPIN) return;
  textOwner = TXT_NONE;
  if (owner === TXT_MSG_NEWNUM) {
    threadsScan();
    state = ST_MESSAGES;
  } else if (owner === TXT_MSG_BODY) {
    pendingMsgNumber = '';
    state = msgBodyReturn;               // back to wherever the message was started
    if (state === ST_MESSAGES) threadsScan();
  } else if (owner === TXT_CONTACT_NAME && savingContactFromMessage) {
    savingContactFromMessage = false;
    if      (savingContactReturn === ST_CALLLOG) state = ST_CALLLOG;
    else if (savingContactReturn === ST_CHAT)    state = ST_CHAT;
    else if (savingContactReturn === ST_DIALER)  state = ST_DIALER;   // number still typed
    else { threadsScan(); state = ST_MESSAGES; }
    savingContactReturn = 0;
  } else if (owner === TXT_CONTACT_EDIT_NAME || owner === TXT_CONTACT_EDIT_NUM
             || owner === TXT_CONTACT_ADD_NUM) {
    state = contactEditReturn;
  } else {
    state = ST_CONTACTS;
  }
  renderInner();
}
// OK pressed: hand the finished string to whoever opened the editor.
function textEditCommit() {
  const owner = textOwner;
  if (textBuf.length === 0) { pxlog('Empty - cancelled'); textEditCancel(); return; }

  simTookScreen = false;
  if (simTextCommit(owner, textBuf)) {
    if (simTookScreen) { simTookScreen = false; return; }
    textOwner = TXT_NONE;
    state = ST_HOME;
    renderInner();
    return;
  }

  if (owner === TXT_CONTACT_NAME) {
    if (savingContactFromMessage) {
      // the number is already known (from a thread or the call log) - one step
      savingContactFromMessage = false;
      const added = contactsAdd(textBuf, pendingMsgNumber);
      pxlog(added ? 'Saved ' + textBuf + ' ' + pendingMsgNumber : 'Could not save contact');
      textOwner = TXT_NONE;
      if      (savingContactReturn === ST_CALLLOG) state = ST_CALLLOG;
      else if (savingContactReturn === ST_CHAT)    state = ST_CHAT;
      else if (savingContactReturn === ST_DIALER)  state = ST_DIALER;   // back to the number
      else { threadsScan(); state = ST_MESSAGES; }
      savingContactReturn = 0;
      if (added) contactAskLabel(contacts.length - 1, 0);   // what kind of number? (renders)
      else renderInner();
      return;
    }
    pendingName = textBuf.slice(0, CONTACT_NAME_LEN - 1);
    textEditOpen('Number', '', TXT_CONTACT_NUM, true, false);   // straight on to step 2
    return;
  }
  if (owner === TXT_CONTACT_EDIT_NAME || owner === TXT_CONTACT_EDIT_NUM) {
    if (contactIdx >= 0 && contactIdx < contacts.length) {
      if (owner === TXT_CONTACT_EDIT_NAME) {
        contacts[contactIdx].name = textBuf.slice(0, CONTACT_NAME_LEN - 1);
      } else {
        const s = (contactNumSlot >= 0 && contactNumSlot < CONTACT_NUMS) ? contactNumSlot : 0;
        contacts[contactIdx].number[s] = textBuf.slice(0, CONTACT_NUM_LEN - 1);
      }
      contactsSave();
      pxlog('Edited ' + contacts[contactIdx].name);
    }
    textOwner = TXT_NONE;
    state = contactEditReturn;
    if (owner === TXT_CONTACT_EDIT_NUM && contactIdx >= 0 && contactIdx < contacts.length)
      contactAskLabel(contactIdx, contactNumSlot);   // also how a label gets changed
    else
      renderInner();
    return;
  }
  if (owner === TXT_CONTACT_ADD_NUM) {
    let slot = -1;
    if (contactIdx >= 0 && contactIdx < contacts.length) {
      const n = contactNumCount(contactIdx);
      if (n < CONTACT_NUMS) {
        const c = contacts[contactIdx];
        const def = contactFreeLabel(contactIdx);
        c.number[n] = textBuf.slice(0, CONTACT_NUM_LEN - 1);
        c.label[n] = def;
        contactsSave();
        pxlog('Added a number to ' + c.name);
        slot = n;
      }
    }
    textOwner = TXT_NONE;
    state = contactEditReturn;
    if (slot >= 0) contactAskLabel(contactIdx, slot);
    else renderInner();
    return;
  }
  if (owner === TXT_CONTACT_NUM) {
    const added = contactsAdd(pendingName, textBuf);
    if (added) {
      pxlog('Saved ' + pendingName + ' ' + textBuf);
      contactIdx = contacts.length - 1;
      if (contactIdx >= contactTop + 8) contactTop = contactIdx - 7;
    } else pxlog('Could not save contact');
    textOwner = TXT_NONE;
    state = ST_CONTACTS;
    if (added) contactAskLabel(contactIdx, 0);
    else renderInner();
    return;
  }
  if (owner === TXT_MSG_NEWNUM) {
    pendingMsgNumber = textBuf.slice(0, MSG_NUMBER_LEN - 1);
    msgBodyReturn = ST_MESSAGES;
    textEditOpen('Message', '', TXT_MSG_BODY, false, false);
    return;
  }
  if (owner === TXT_MSG_BODY) {
    const dest = pendingMsgNumber || chatNumber;
    if (!dest) { textEditCancel(); return; }     // no number: never store one
    busyText = 'Sending...';
    renderInner(true);
    const sent = hardwareAPI.modem.sendSMS(dest, textBuf);
    busyText = null;
    // Stored either way, so nothing typed is lost - but MARKED. A failed one
    // says "Not sent" in the thread, and the thread's Options offer Resend.
    messagesAdd(dest, textBuf, MSG_DIR_OUT, sent ? MSG_ST_SENT : MSG_ST_FAILED);
    if (!sent) pxlog('[SMS] Not sent - marked in the thread');
    chatNumber = dest;
    pendingMsgNumber = '';
    textOwner = TXT_NONE;
    state = ST_CHAT;
    chatScrollTop = 9999;    // show what you just sent; drawInner clamps
    renderInner();
    return;
  }
  textEditCancel();
}

// ==================== DIALER ====================
const DIALER_MAX = 40;
let dialerDigits = '', dialerCursor = 0;
let dialerCursorVisible = true;
let dialerBlinkNext = 0;     // next blink toggle (0 = not blinking)
let dialerUnhideAt = 0;      // resume blinking after the 250 ms hide
let dialerExitAt = 0;        // auto-exit 500 ms after the last digit is deleted
let dialerStarTime = 0;      // for the *-then-* => + trick

function startDialerBlink() {
  dialerCursorVisible = true;
  dialerBlinkNext = millis() + 1000;
  dialerUnhideAt = 0;
  renderInner();
}
// After any input: hide the cursor for 250 ms, then resume the 1 s blink.
function resetDialerBlink() {
  dialerCursorVisible = false;
  dialerBlinkNext = 0;
  dialerUnhideAt = millis() + 250;
  renderInner();
}
function enterDialer() {
  state = ST_DIALER;
  dialerDigits = ''; dialerCursor = 0;
  dialerExitAt = 0; dialerStarTime = 0;
  startDialerBlink();
  pxlog('Dialer opened');
}
function exitDialer() {
  dialerBlinkNext = 0; dialerUnhideAt = 0; dialerExitAt = 0;
  state = ST_HOME;
  renderInner();
  pxlog('Dialer closed');
}
function insertDialerDigit(c) {
  if (dialerDigits.length >= DIALER_MAX) return;
  dialerDigits = dialerDigits.slice(0, dialerCursor) + c + dialerDigits.slice(dialerCursor);
  dialerCursor++;
  dialerExitAt = 0;
  resetDialerBlink();
}
function deleteDialerDigit() {
  if (dialerCursor > 0) {
    dialerDigits = dialerDigits.slice(0, dialerCursor - 1) + dialerDigits.slice(dialerCursor);
    dialerCursor--;
    resetDialerBlink();
  }
  if (dialerDigits.length === 0) dialerExitAt = millis() + 500;   // empty -> leave shortly
}
function dialerUnit()    { return dialerDigits.length >= 14 ? DIGIT_MEDIUM : DIGIT_LARGE; }
function dialerPerLine() { return dialerUnit() === DIGIT_LARGE ? 7 : 13; }
function moveDialerCursor(dir) {
  const per = dialerPerLine(), len = dialerDigits.length;
  if      (dir === 'LEFT'  && dialerCursor > 0)            { dialerCursor--;      resetDialerBlink(); }
  else if (dir === 'RIGHT' && dialerCursor < len)          { dialerCursor++;      resetDialerBlink(); }
  else if (dir === 'UP'    && dialerCursor >= per)         { dialerCursor -= per; resetDialerBlink(); }
  else if (dir === 'DOWN'  && dialerCursor + per <= len)   { dialerCursor += per; resetDialerBlink(); }
}

// ==================== CAMERA + GALLERY (emulated) ====================
// The emulator's camera paints a grain field rather than asking for webcam
// permission. The SIZES are the phone's: the live preview is the sensor's
// 160x120, a saved 800x600 photo is shown shrunk to 200x150. Photos live in
// memory, as the card's /DCIM.
let galleryPhotos = [];          // { name, canvas, bytes }
let galleryCount = 0, galleryIdx = 0, galleryTop = 0;
let gallerySwap = false;         // "Fix colours" - flips the byte order on the phone
let camFlash = '', camFlashUntil = 0;
let camLastNum = 0;
let camNextFrame = 0;
const CAM_PREV_W = 160, CAM_PREV_H = 120;
const PHOTO_W = 200, PHOTO_H = 150;

function sdPresent() { return hardwareAPI.sd.isPresent(); }
function camSetFlash(msg) {
  camFlash = msg;
  camFlashUntil = millis() + 1800;
  pxlog(msg);
}
function cameraShutter() {
  if (!hardwareAPI.camera.isReady()) { camSetFlash('Camera not ready'); return false; }
  if (!sdPresent()) { camSetFlash('Insert memory card'); return false; }
  const c = document.createElement('canvas');
  c.width = PHOTO_W; c.height = PHOTO_H;
  hardwareAPI.camera.drawPreview(c.getContext('2d'), PHOTO_W, PHOTO_H);
  camLastNum++;
  const name = 'PXP_' + String(camLastNum).padStart(4, '0') + '.JPG';
  galleryPhotos.push({ name: name, canvas: c, bytes: 38000 + ((Math.random() * 9000) | 0) });
  camSetFlash('Saved ' + name);
  return true;
}
function galleryScan() {
  galleryCount = 0; galleryIdx = 0; galleryTop = 0;
  if (!sdPresent()) return;
  galleryPhotos.sort(function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; });
  galleryCount = galleryPhotos.length;
  pxlog('Gallery: ' + galleryCount + ' photo(s)');
}

// ==================== VOICE MEMOS (emulated) ====================
// The UI is the real one. The audio is not: getUserMedia would put a microphone
// permission prompt in front of anyone who opens the emulator, so a recording
// here is a timed placeholder. The list is kept as the card's /VOICE.
const VREC_READY = 0, VREC_RECORDING = 1, VREC_PAUSED = 2;
let voiceMemos = [];             // { name, durationSec }
let voiceCount = 0, voiceIdx = 0, voiceTop = 0, voiceLastNum = 0;
let voiceRecState = VREC_READY;
let voiceRecStartMs = 0, voiceRecElapsedMs = 0, voiceRecBlinkNext = 0;
let voiceRecFlash = '', voiceRecFlashUntil = 0;
let voicePlaying = false;
let voicePlayPosMs = 0, voicePlayTotalMs = 0, voicePlayStartMs = 0, voicePlayStartPos = 0;

function voiceStoreLoad() {
  const s = hardwareAPI.storage.read('voice');
  voiceMemos = (s && Array.isArray(s.list)) ? s.list : [];
  voiceLastNum = (s && s.last) | 0;
}
function voiceStoreSave() { hardwareAPI.storage.write('voice', { list: voiceMemos, last: voiceLastNum }); }

// mm:ss for both the recording timer and the playback counter: "0:05".
function formatMMSS(totalSec) {
  totalSec = Math.max(0, Math.trunc(totalSec));
  return Math.trunc(totalSec / 60) + ':' + pad2(totalSec % 60);
}
function voiceScan() {
  voiceCount = 0; voiceIdx = 0; voiceTop = 0;
  if (!sdPresent()) return;
  voiceStoreLoad();
  voiceMemos.sort(function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; });
  voiceCount = voiceMemos.length;
  pxlog('Voice: ' + voiceCount + ' recording(s)');
}
function voiceRecSetFlash(msg) {
  voiceRecFlash = msg;
  voiceRecFlashUntil = millis() + 1800;
  pxlog(msg);
}
function voiceRecEnter() {
  voiceRecState = VREC_READY;
  voiceRecElapsedMs = 0;
  voiceRecFlashUntil = 0;
  state = ST_VOICE_REC;
}
function voiceRecStartCapture() {
  if (voiceRecState !== VREC_READY || !sdPresent()) return;
  pxlog('[Voice] No microphone in the browser build - timing a placeholder');
  voiceRecStartMs = millis();
  voiceRecState = VREC_RECORDING;
}
function voiceRecResume() {
  if (voiceRecState !== VREC_PAUSED) return;
  voiceRecStartMs = millis();
  voiceRecState = VREC_RECORDING;
}
function voiceRecPause() {
  if (voiceRecState !== VREC_RECORDING) return;
  voiceRecElapsedMs += millis() - voiceRecStartMs;
  voiceRecState = VREC_PAUSED;
}
function voiceRecSave() {
  if (voiceRecState === VREC_RECORDING) voiceRecPause();
  if (voiceRecState !== VREC_PAUSED) return;
  voiceStoreLoad();
  voiceLastNum++;
  const name = 'REC_' + String(voiceLastNum).padStart(4, '0') + '.WAV';
  voiceMemos.push({ name: name, durationSec: Math.trunc(voiceRecElapsedMs / 1000) });
  voiceStoreSave();
  pxlog('Saved /VOICE/' + name);
  voiceScan();
  voiceIdx = voiceCount > 0 ? voiceCount - 1 : 0;   // the newest sorts last
  if (voiceIdx >= voiceTop + 8) voiceTop = voiceIdx - 7;
  state = ST_VOICE;
}
function voiceRecDiscard() {
  if (voiceRecState === VREC_RECORDING) voiceRecPause();
  pxlog('Recording discarded');
  state = ST_VOICE;
}
function voicePlayEnter(idx) {
  if (idx < 0 || idx >= voiceCount) return;
  voiceIdx = idx;
  voicePlayTotalMs = (voiceMemos[idx].durationSec | 0) * 1000;
  voicePlayPosMs = 0;
  voicePlaying = false;        // opens paused - OK starts it
  state = ST_VOICE_PLAY;
}
function voicePlayExit() {
  voicePlaying = false;
  state = ST_VOICE;
}
function voicePlayToggle() {
  if (!voicePlaying) {
    if (voicePlayPosMs >= voicePlayTotalMs) voicePlayPosMs = 0;   // replay from the start
    voicePlaying = true;
    voicePlayStartMs = millis(); voicePlayStartPos = voicePlayPosMs;
  } else {
    voicePlaying = false;
  }
}
function voicePlaySeek(deltaSec) {
  let np = voicePlayPosMs + deltaSec * 1000;
  if (np < 0) np = 0;
  if (np > voicePlayTotalMs) np = voicePlayTotalMs;
  voicePlayPosMs = np;
  voicePlayStartMs = millis(); voicePlayStartPos = voicePlayPosMs;
}
function voiceDelete(idx) {
  // Take the name from the list as SHOWN (sorted) before reloading the stored
  // one, whose order can differ.
  const name = (idx >= 0 && idx < voiceCount) ? voiceMemos[idx].name : '';
  voiceStoreLoad();
  voiceMemos = voiceMemos.filter(function (v) { return v.name !== name; });
  voiceStoreSave();
  return name;
}

// ==================== MENUS ====================
// Top level, in the order you actually reach for them.
const menuNames = ['Contacts', 'Messages', 'Call log', 'Camera',
                   'Gallery', 'Apps', 'Games', 'Settings'];
const menuCount = 8;
const appsItems = ['Voice memos', 'Calendar', 'Notes', 'Calculator',
                   'Alarms', 'File explorer', 'Music', 'Wallet'];
const appsCount = 8;
let appsIdx = 0, appsTop = 0;
// Pong first on purpose: the minimal dirty-rectangle case.
const gamesItems = ['Pong', 'Snake', 'Tetris', 'Blackjack', 'Starfall', 'Doom'];
const gamesCount = 6;
let gamesIdx = 0, gamesTop = 0;
let comingSoonName = '', comingSoonReturn = ST_MENU, appReturnTo = ST_MENU;

// One opener, called from both the OK key and the popup's "Open".
function menuOpen(idx) {
  if      (idx === 0) { state = ST_CONTACTS; contactIdx = 0; contactTop = 0; }
  else if (idx === 1) { threadsScan(); state = ST_MESSAGES; }
  else if (idx === 2) { state = ST_CALLLOG; callLogIdx = 0; callLogTop = 0; }
  else if (idx === 3) { camNextFrame = 0; camFlashUntil = 0; state = ST_CAMERA; }
  else if (idx === 4) { galleryScan(); state = ST_GALLERY; }
  else if (idx === 5) { state = ST_APPS;  appsIdx = 0;  appsTop = 0; }
  else if (idx === 6) { state = ST_GAMES; gamesIdx = 0; gamesTop = 0; }
  else if (idx === 7) { state = ST_SETPAGE; setPage = PG_ROOT; setRow = 0; setDepth = 0; }
}

// ==================== NOTICES ====================
// One line in a box above every screen for a few seconds, in its own colour.
let uiFlash = '', uiFlashUntil = 0, uiFlashColour = COL_RED;
function uiFlashShow(text, colour) {
  uiFlash = String(text).slice(0, 39);
  uiFlashColour = colour;
  uiFlashUntil = millis() + 2500;
}
// "Sending..." / "Backing up..." while a blocking call runs. null = no box.
let busyText = null;

// ==================== FACTORY RESET ====================
// Everything INTERNAL goes - contacts, messages, call log, every setting,
// bootCount included. The card is deliberately not touched.
const RESET_SHOW_MS = 1200;
let resetDoneAt = 0, resetDone = false, resetIsRestore = false, resetOk = true;

function factoryResetWipe() {
  contacts = []; contactIdx = 0; contactTop = 0;
  messages = [];
  threadsScan();
  callLog = []; callLogIdx = 0; callLogTop = 0;
  missedCallCount = 0; unreadTextCount = 0;
  hardwareAPI.storage.write('messages', []);
  callLogSave();
  settingsDefaults();            // bootCount goes back to 0 as well
  settingsSave();
  contactsSave();                // a valid empty file
}
// The second half, once "Resetting" has been up long enough to read: the new
// defaults become visible together, as "Done" appears.
function factoryResetApply() {
  themeApply(settings.themeIx);
  debugMode = settings.debugMode === 1;
  resetDone = true;
  pxlog(resetIsRestore ? 'Restore - done' : 'Factory reset - done');
  if (state === ST_RESET) {
    startScreenTimers();
    if (flipIsOpen()) renderInner(true);
  }
}

// ==================== CONTACT NUMBERS ====================
const NUMACT_CALL = 1, NUMACT_MESSAGE = 2, NUMACT_EDIT = 3, NUMACT_REMOVE = 4;
let numChooseFor = 0, contactNumSlot = 0, labelContact = -1, labelSlot = 0;

// After a number is entered, ask what kind it is. The number is already saved
// with a default label, so Back simply keeps it.
function contactAskLabel(idx, slot) {
  labelContact = idx;
  labelSlot = slot;
  openOptions(OPT_NUM_LABEL, NUM_LABELS);
}
// "Mobile 06301234567" - at most 18 characters, the widest a popup row holds.
// A long number keeps its END behind "..", which is what tells numbers apart.
function numChooseLabel(label, num) {
  const room = 18 - label.length - 1;
  if (num.length <= room) return label + ' ' + num;
  return label + ' ..' + num.slice(num.length - (room - 2));
}
// One number: straight to it. More than one: ask which, every time.
function contactNumAction(what) {
  if (contactIdx < 0 || contactIdx >= contacts.length) return;
  const n = contactNumCount(contactIdx);
  if (n === 0) { uiFlashShow('No number saved', COL_RED); renderInner(); return; }
  if (what === NUMACT_REMOVE && n < 2) { uiFlashShow('Last number stays', COL_RED); renderInner(); return; }
  if (n === 1) { contactNumDo(what, 0); return; }
  const c = contacts[contactIdx];
  const items = [];
  for (let k = 0; k < n; k++)
    items.push(numChooseLabel(NUM_LABELS[c.label[k] <= NL_OTHER ? c.label[k] : NL_OTHER], c.number[k]));
  numChooseFor = what;
  openOptions(OPT_NUM_CHOOSE, items);
}
function contactNumDo(what, slot) {
  if (contactIdx < 0 || contactIdx >= contacts.length) return;
  if (slot < 0 || slot >= contactNumCount(contactIdx)) return;
  const c = contacts[contactIdx];
  if (what === NUMACT_CALL) {
    callDial(c.number[slot]);
  } else if (what === NUMACT_MESSAGE) {
    pendingMsgNumber = c.number[slot];
    msgBodyReturn = state;
    textEditOpen('Message', '', TXT_MSG_BODY, false, false);
  } else if (what === NUMACT_EDIT) {
    contactNumSlot = slot;
    contactEditReturn = state;
    textEditOpen('Number', c.number[slot], TXT_CONTACT_EDIT_NUM, true, false);
  } else if (what === NUMACT_REMOVE) {
    for (let k = slot; k < CONTACT_NUMS - 1; k++) {
      c.number[k] = c.number[k + 1];
      c.label[k] = c.label[k + 1];
    }
    c.number[CONTACT_NUMS - 1] = '';
    c.label[CONTACT_NUMS - 1] = NL_MOBILE;
    contactsSave();
    pxlog('Removed a number from ' + c.name);
    uiFlashShow('Number removed', COL_THEME);
    renderInner();
  }
}
// The newest message in the open thread that did not go out, or -1.
function chatFailedIndex() {
  for (let i = messages.length - 1; i >= 0; i--)
    if (messages[i].direction === MSG_DIR_OUT && messages[i].status === MSG_ST_FAILED
        && messages[i].number === chatNumber) return i;
  return -1;
}

// ==================== BACKUP & RESTORE (emulated card) ====================
// On the phone: /PXBACKUP on the SD card, done.txt written LAST so a half-made
// backup never looks complete. Here the "card" is one storage key, which is
// only readable while the emulator's SD card is in.
function backupExists() {
  if (!sdPresent()) return false;
  const b = hardwareAPI.storage.read('card_backup');
  return !!(b && b.done);
}
function backupWrite() {
  if (!sdPresent()) return false;
  const st = hardwareAPI.storage;
  const b = {
    done: true,
    settingsVersion: SETTINGS_VERSION,
    settings: st.read('settings'),
    contacts: st.read('contacts'),
    messages: st.read('messages'),
    calllog:  st.read('calllog')
  };
  if (!st.write('card_backup', b)) { pxlog('[BK] could not write the card'); return false; }
  pxlog('[BK] backup complete');
  return true;
}
function backupRun() {
  busyText = 'Backing up...';
  renderInner(true);
  const ok = backupWrite();
  busyText = null;
  uiFlashShow(ok ? 'Backup saved' : 'Backup failed', ok ? COL_THEME : COL_RED);
}
// Card -> phone. The loaders reject a wrong layout on their own, so a backup
// from older firmware comes back as defaults, never as garbage.
function restoreRun() {
  if (!backupExists()) return false;
  const st = hardwareAPI.storage;
  const b = st.read('card_backup');
  const put = function (key, v) { if (v === undefined || v === null) localForget(key); else st.write(key, v); };
  put('settings', b.settings);
  put('contacts', b.contacts);
  put('messages', b.messages);
  put('calllog',  b.calllog);
  contacts = []; messages = []; callLog = [];
  settingsLoad();
  contactsLoad();
  messagesLoad();
  callLogLoad();
  threadsScan();
  contactIdx = 0; contactTop = 0;
  threadIdx = 0;  threadTop = 0;
  callLogIdx = 0; callLogTop = 0;
  missedCallCount = 0; unreadTextCount = 0;
  pxlog('[BK] restore complete');
  return true;
}
// A file the backup did not have is removed, so the phone ends up matching
// the backup exactly. The storage shim has no delete, so "removed" is an
// empty value the loaders treat as a missing file.
function localForget(key) { hardwareAPI.storage.write(key, null); }

// Format: everything on the card goes - photos, recordings and the backup.
function sdTrueFormat() {
  galleryPhotos = []; galleryCount = 0; galleryIdx = 0; galleryTop = 0;
  voiceMemos = []; voiceLastNum = 0; voiceStoreSave(); voiceCount = 0;
  hardwareAPI.storage.write('card_backup', null);
  pxlog('SD card formatted');
}

// ==================== OPTIONS POPUP ====================
// One component, many callers: a list of labels plus an owner tag saying who
// opened it. Up to 10 rows - the contacts list menu reaches 9.
const OPT_MAX = 10;
let optOpen = false, optOwner = OPT_NONE, optItems = [], optIdx = 0;

function openOptions(owner, items) {
  let list = items.slice();
  if (list.length > OPT_MAX) {
    pxlog('[OPT] menu has ' + list.length + ' items, only ' + OPT_MAX + ' fit - the rest are cut');
    list = list.slice(0, OPT_MAX);
  }
  optOwner = owner; optItems = list; optIdx = 0; optOpen = true;
  renderInner();
  pxlog('Options opened');
}
function closeOptions() {
  optOpen = false; optOwner = OPT_NONE;
  renderInner();
  pxlog('Options closed');
}
function optionsMove(delta) {
  if (optItems.length <= 0) return;
  optIdx = (optIdx + delta + optItems.length) % optItems.length;
  renderInner();
}

function optionsSelect() {
  if (optItems.length <= 0) { closeOptions(); return; }
  const label = optItems[optIdx];
  const owner = optOwner;
  optOpen = false; optOwner = OPT_NONE;     // close before acting
  pxlog('Option: ' + label);

  if (owner === OPT_HOME) {
    if (label === 'Main menu') { state = ST_MENU; menuIdx = 0; }
    else if (label === 'Debug boxes') debugMode = !debugMode;
    else pxlog('  (not implemented yet)');
  }
  else if (owner === OPT_DIALER) {
    if (label === 'Clear all') {
      dialerDigits = ''; dialerCursor = 0;
      dialerExitAt = millis() + 500;
    }
    // Wired at last - the same as the call log's Call / Send message / Save as contact.
    else if (label === 'Call' && dialerDigits.length > 0) {
      callDial(dialerDigits);            // same as the green key
      return;
    }
    else if (label === 'Send message' && dialerDigits.length > 0) {
      pendingMsgNumber = dialerDigits.slice(0, MSG_NUMBER_LEN - 1);
      msgBodyReturn = ST_DIALER;         // Back from the message: the number is still there
      textEditOpen('Message', '', TXT_MSG_BODY, false, false);
      return;
    }
    else if (label === 'Save number' && dialerDigits.length > 0) {
      pendingMsgNumber = dialerDigits.slice(0, MSG_NUMBER_LEN - 1);
      savingContactFromMessage = true;   // number known, only the name is asked for
      savingContactReturn = ST_DIALER;
      textEditOpen('Name', '', TXT_CONTACT_NAME, false, false);
      return;
    }
  }
  else if (owner === OPT_MENU) {
    if (label === 'Open') menuOpen(menuIdx);
    else if (label === 'Back to home') state = ST_HOME;
  }
  else if (owner === OPT_CONTACTS) {
    const have = contacts.length > 0;
    if (label === 'Delete' && have) {
      pxlog('Deleted ' + contacts[contactIdx].name);
      contactsDelete(contactIdx);
      if (contactIdx >= contacts.length) contactIdx = contacts.length - 1;
      if (contactIdx < 0) contactIdx = 0;
      if (contactTop > contactIdx) contactTop = contactIdx;
      if (state === ST_CONTACT_DETAIL) state = ST_CONTACTS;   // that contact is gone
    }
    else if (label === 'New contact') { textEditOpen('Name', '', TXT_CONTACT_NAME, false, false); return; }
    else if (label === 'Edit name' && have) {
      contactEditReturn = state;
      textEditOpen('Name', contacts[contactIdx].name, TXT_CONTACT_EDIT_NAME, false, false);
      return;
    }
    else if (label === 'Edit number' && have) { contactNumAction(NUMACT_EDIT); return; }
    else if (label === 'Add number' && have) {
      if (contactNumCount(contactIdx) >= CONTACT_NUMS) uiFlashShow('Already 3 numbers', COL_RED);
      else {
        contactEditReturn = state;
        textEditOpen('Add number', '', TXT_CONTACT_ADD_NUM, true, false);
        return;
      }
    }
    else if (label === 'Remove number' && have) { contactNumAction(NUMACT_REMOVE); return; }
    else if (label === 'Colour' && have) {
      contactColourIdx = contacts[contactIdx].colour;
      contactEditReturn = state;
      state = ST_CONTACT_COLOUR;
      renderInner();
      return;
    }
    else if (label === 'Call' && have) { contactNumAction(NUMACT_CALL); return; }
    else if (label === 'Write message' && have) { contactNumAction(NUMACT_MESSAGE); return; }
    else pxlog('  (not implemented yet)');
  }
  else if (owner === OPT_NUM_CHOOSE) {
    contactNumDo(numChooseFor, optIdx);       // the row picked IS the slot
    return;
  }
  else if (owner === OPT_NUM_LABEL) {
    if (labelContact >= 0 && labelContact < contacts.length
        && labelSlot >= 0 && labelSlot < contactNumCount(labelContact)) {
      contacts[labelContact].label[labelSlot] = optIdx;   // rows are NL_* in order
      contactsSave();
    }
  }
  else if (owner === OPT_MESSAGES) {
    if (label === 'New message') { textEditOpen('To', '', TXT_MSG_NEWNUM, true, false); return; }
    else if (label === 'Save as contact' && threadNumbers.length > 0) {
      pendingMsgNumber = threadNumbers[threadIdx];
      savingContactFromMessage = true;
      savingContactReturn = ST_MESSAGES;
      textEditOpen('Name', '', TXT_CONTACT_NAME, false, false);
      return;
    }
    else if (label === 'Delete' && threadNumbers.length > 0) {
      const removed = messagesDeleteThread(threadNumbers[threadIdx]);
      pxlog('Deleted ' + removed + ' message(s)');
      threadsScan();                  // resets the cursor to the top, as on the phone
      if (threadIdx >= threadNumbers.length) threadIdx = threadNumbers.length - 1;
      if (threadIdx < 0) threadIdx = 0;
      if (threadTop > threadIdx) threadTop = threadIdx;
    }
    else if (label === 'Call' && threadNumbers.length > 0) { callDial(threadNumbers[threadIdx]); return; }
  }
  else if (owner === OPT_CHAT) {
    if (label === 'Resend') {
      const i = chatFailedIndex();
      if (i >= 0) {
        busyText = 'Sending...';
        renderInner(true);
        const sent = hardwareAPI.modem.sendSMS(messages[i].number, messages[i].body);
        busyText = null;
        if (sent) {
          messages[i].status = MSG_ST_SENT;    // keeps its place and its time
          messagesSave();
          pxlog('[SMS] Resent');
        } else {
          uiFlashShow('Still not sent', COL_RED);
          pxlog('[SMS] Resend failed');
        }
      }
      renderInner();
      return;
    }
    if (label === 'New message') {
      pendingMsgNumber = '';
      msgBodyReturn = ST_CHAT;
      textEditOpen('Message', '', TXT_MSG_BODY, false, false);
      return;
    }
    else if (label === 'Save as contact') {
      pendingMsgNumber = chatNumber;
      savingContactFromMessage = true;
      savingContactReturn = ST_CHAT;
      textEditOpen('Name', '', TXT_CONTACT_NAME, false, false);
      return;
    }
    else if (label === 'Call') { callDial(chatNumber); return; }
  }
  else if (owner === OPT_CAMERA) {
    if (label === 'View gallery') { galleryScan(); state = ST_GALLERY; }
    else if (label === 'Fix colours') {
      gallerySwap = !gallerySwap;
      pxlog(gallerySwap ? 'Colour bytes swapped' : 'Colour bytes normal');
    }
  }
  else if (owner === OPT_GALLERY) {
    if (label === 'Refresh') galleryScan();
    else if (label === 'Fix colours') {
      gallerySwap = !gallerySwap;
      pxlog(gallerySwap ? 'Colour bytes swapped' : 'Colour bytes normal');
    }
    else if (label === 'Delete' && galleryCount > 0) {
      const name = galleryPhotos[galleryIdx].name;
      galleryPhotos = galleryPhotos.filter(function (p) { return p.name !== name; });
      pxlog('Deleted ' + name);
      galleryScan();
      state = ST_GALLERY;
    }
  }
  else if (owner === OPT_VOICE) {
    if (label === 'New recording') { voiceRecEnter(); renderInner(); return; }
    else if (label === 'Delete' && voiceCount > 0) {
      pxlog('Deleted ' + voiceDelete(voiceIdx));
      voiceScan();                    // back to the top of the list, as on the phone
      if (voiceIdx >= voiceCount) voiceIdx = voiceCount - 1;
      if (voiceIdx < 0) voiceIdx = 0;
      if (voiceTop > voiceIdx) voiceTop = voiceIdx;
      state = ST_VOICE;
    }
  }
  else if (owner === OPT_VOICE_PLAY) {
    if (label === 'Delete' && voiceIdx >= 0 && voiceIdx < voiceCount) {
      voicePlaying = false;
      pxlog('Deleted ' + voiceDelete(voiceIdx));
      voiceScan();
      if (voiceIdx >= voiceCount) voiceIdx = voiceCount - 1;
      if (voiceIdx < 0) voiceIdx = 0;
      state = ST_VOICE;
    }
  }
  else if (owner === OPT_CALLLOG) {
    // Stored oldest-first, shown newest-first - the highlighted row maps back.
    const sel = callLog.length - 1 - callLogIdx;
    const haveSel = (callLog.length > 0 && sel >= 0 && sel < callLog.length);
    if (label === 'Call' && haveSel) { callDial(callLog[sel].number); return; }
    else if (label === 'Send message' && haveSel) {
      pendingMsgNumber = callLog[sel].number;
      msgBodyReturn = ST_CALLLOG;
      textEditOpen('Message', '', TXT_MSG_BODY, false, false);
      return;
    }
    else if (label === 'Save as contact' && haveSel) {
      if (contactExistsForNumber(callLog[sel].number)) pxlog('Already in contacts');
      else {
        pendingMsgNumber = callLog[sel].number;
        savingContactFromMessage = true;
        savingContactReturn = ST_CALLLOG;
        textEditOpen('Name', '', TXT_CONTACT_NAME, false, false);
        return;
      }
    }
    else if (label === 'Delete all' && callLog.length > 0) {
      openOptions(OPT_CALLLOG_CLEAR, ['Yes, clear log', 'Cancel']);
      return;                         // a whole history is worth one confirmation
    }
    else if (label === 'Delete entry' && haveSel) {
      pxlog('Deleted call log entry: ' + contactNameForNumber(callLog[sel].number));
      callLogDelete(sel);
      if (callLogIdx >= callLog.length) callLogIdx = callLog.length - 1;
      if (callLogIdx < 0) callLogIdx = 0;
      if (callLogTop > callLogIdx) callLogTop = callLogIdx;
    }
  }
  else if (owner === OPT_CALLLOG_CLEAR) {
    if (label === 'Yes, clear log') {
      callLog = []; callLogIdx = 0; callLogTop = 0;
      callLogSave();
      missedCallCount = 0;
      pxlog('Call log cleared');
    }
  }
  else if (owner === OPT_FACTORY) {
    if (label === 'Yes, reset') {
      // Its own screen, drawn BEFORE the wipe starts so the words are up while
      // it happens. What goes: factoryResetWipe(). When it shows: Apply().
      pxlog('Factory reset - wiping');
      state = ST_RESET;
      resetIsRestore = false; resetOk = true; resetDone = false;
      clearScreenTimers();
      renderInner(true);
      factoryResetWipe();
      resetDoneAt = millis() + RESET_SHOW_MS;
      return;
    }
  }
  else if (owner === OPT_BACKUP) {
    if (label === 'Back up to SD') {
      if (backupExists()) {
        // Replacing is how a good backup gets lost.
        openOptions(OPT_BACKUP_SAVE, ['Yes, replace it', 'Cancel']);
        return;
      }
      backupRun();
    }
    else if (label === 'Restore from SD') {
      if (!backupExists()) uiFlashShow('No backup on card', COL_RED);
      else { openOptions(OPT_RESTORE, ['Yes, restore', 'Cancel']); return; }
    }
  }
  else if (owner === OPT_BACKUP_SAVE) {
    if (label === 'Yes, replace it') backupRun();
  }
  else if (owner === OPT_RESTORE) {
    if (label === 'Yes, restore') {
      pxlog('Restore - reading the card');
      state = ST_RESET;
      resetIsRestore = true; resetDone = false;
      clearScreenTimers();
      renderInner(true);
      resetOk = restoreRun();
      resetDoneAt = millis() + RESET_SHOW_MS;
      return;
    }
  }
  else if (owner === OPT_FORMAT) {
    if (label === 'Yes, erase all') sdTrueFormat();
    else pxlog('Format cancelled');
  }
  else if (owner === OPT_APP) {
    if (label === 'Close') state = ST_MENU;
    else if (label === 'Back to home') state = ST_HOME;
  }
  renderInner();
}

// Drawn last, so it sits on top of whatever screen is underneath.
function drawOptions(ctx) {
  if (!optOpen) return;
  const TEXT = 14, rowH = 22, padX = 8, padY = 5;
  let w = 0;
  for (const it of optItems) w = Math.max(w, measureTextStrW(it, TEXT));
  w += padX * 2;
  if (w < 110) w = 110;
  if (w > 232) w = 232;
  const h = optItems.length * rowH + padY * 2;
  const x = 4;
  let y = 283 - h;                  // just above the softkey strip
  if (y < 40) y = 40;               // never cover the status bar
  fbRect(ctx, x, y, w, h, COL_BLACK);
  fbOutline(ctx, x, y, w, h, COL_THEME);
  for (let i = 0; i < optItems.length; i++) {
    const ry = y + padY + i * rowH;
    if (i === optIdx) {
      fbRect(ctx, x + 2, ry, w - 4, rowH, COL_THEME);
      drawTextStr(ctx, x + padX, ry + 18, optItems[i], TEXT, COL_THEME_INK);
    } else {
      drawTextStr(ctx, x + padX, ry + 18, optItems[i], TEXT, COL_THEME);
    }
  }
}

// "2 missed calls, 1 unread text". Shared by both screens so the wording can
// never drift. null when there is nothing unreviewed.
function notifBadgeText() {
  if (missedCallCount <= 0 && unreadTextCount <= 0) return null;
  if (missedCallCount > 0 && unreadTextCount > 0)
    return missedCallCount + ' missed, ' + unreadTextCount + ' unread';
  if (missedCallCount > 0)
    return missedCallCount + ' missed call' + (missedCallCount === 1 ? '' : 's');
  return unreadTextCount + ' unread text' + (unreadTextCount === 1 ? '' : 's');
}

// Nine bars up the left edge. Below bar 1 are two MODES, not quieter levels:
// 0 = vibrate, -1 = silent. Drawn on whichever screen faces the user.
function drawVolumeOverlay(ctx, fbW, fbH) {
  if (millis() >= volOverlayUntil) return;
  const big = fbW >= 200;
  const barW = big ? 8 : 4, barH = big ? 16 : 8, gap = big ? 4 : 2;
  const x = big ? 3 : 0, yBot = big ? 250 : 114;
  const lvl = settings.ringVolume;
  for (let i = 0; i < 9; i++) {
    const by = yBot - barH - i * (barH + gap);
    if (i < lvl) fbRect(ctx, x, by, barW, barH, COL_THEME);
    else         fbOutline(ctx, x, by, barW, barH, COL_GRAY6);
  }
  const label = (lvl < 0) ? 'SILENT' : (lvl === 0) ? 'VIBRATE' : '';
  if (label) {
    const px = big ? 14 : 10;
    const lw = measureTextStrW(label, px);
    const ly = big ? 276 : 126;
    fbRect(ctx, centerX(fbW, lw) - 3, ly - px - 1, lw + 6, px + 5, COL_BLACK);
    drawTextStr(ctx, centerX(fbW, lw), ly, label, px, (lvl < 0) ? COL_RED : COL_YEL);
  }
}

// ==================== SCREEN DRAW (port of drawInner / drawOuter) ==========
function drawInner(ctx) {
  fbRect(ctx, 0, 0, IN_W, IN_H, COL_BLACK);

  if (state === ST_BOOT) {
    // Size 32 = scale 4 = 24px a character: "PIXL OS" is 164px, 38px each side.
    const lw = measureTextStrW('PIXL OS', 32);
    drawTextStr(ctx, centerX(IN_W, lw), 181, 'PIXL OS', 32, COL_THEME);
    if (debugMode) {
      const dw = measureTextStrW('[DEBUG]', 14);
      drawTextStr(ctx, centerX(IN_W, dw), 215, '[DEBUG]', 14, COL_RED);
    }
  }
  else if (state === ST_RESET) {
    // No status bar and no softkeys: nothing on this screen is a choice.
    if (!resetDone) {
      const l1 = resetIsRestore ? 'Restoring from' : 'Resetting to';
      const l2 = resetIsRestore ? 'SD card' : 'defaults';
      drawTextStr(ctx, centerX(IN_W, measureTextStrW(l1, 16)), 156, l1, 16, COL_WHITE);
      drawTextStr(ctx, centerX(IN_W, measureTextStrW(l2, 16)), 180, l2, 16, COL_WHITE);
    } else if (!resetOk) {
      drawGlyph5x7(ctx, centerX(IN_W, 5 * 8), 150, ICON_CALL_REJECT, 64, COL_RED);
      drawTextStr(ctx, centerX(IN_W, measureTextStrW('Restore failed', 16)), 176, 'Restore failed', 16, COL_WHITE);
      drawTextStr(ctx, centerX(IN_W, measureTextStrW('Nothing changed', 14)), 200, 'Nothing changed', 14, COL_GRAY6);
      drawTextStr(ctx, centerX(IN_W, measureTextStrW('Press any key', 14)), 224, 'Press any key', 14, COL_GRAY6);
    } else {
      drawGlyph5x7(ctx, centerX(IN_W, 5 * 8), 150, ICON_CHECK, 64, COL_THEME);
      drawTextStr(ctx, centerX(IN_W, measureTextStrW('Done', 16)), 176, 'Done', 16, COL_WHITE);
      drawTextStr(ctx, centerX(IN_W, measureTextStrW('Press any key', 14)), 204, 'Press any key', 14, COL_GRAY6);
    }
  }
  else if (state === ST_HOME) {
    drawStatus(ctx, IN_W);
    const d = new Date();
    const h = pad2(d.getHours()), m = pad2(d.getMinutes()), s = pad2(d.getSeconds());
    const clockStr = h + ':' + m;
    const clockW = measureDigitStringW(clockStr, DIGIT_LARGE);
    const clockX = centerX(IN_W, clockW) - 16, clockY = 120;
    const cb = drawDigitString(ctx, clockX, clockY, clockStr, DIGIT_LARGE, COL_THEME);

    // Right column: day name top-aligned to the clock, seconds bottom-aligned.
    const rightX = cb.x + cb.width + DIGIT_LARGE;
    drawLetterString(ctx, rightX, clockY + 2, DAYS[d.getDay()], DAYNAME_UNIT_IN, COL_THEME);
    drawDigitString(ctx, rightX, clockY + 20, s, DIGIT_MEDIUM, COL_THEME);

    const dateY = cb.y + cb.height + DIGIT_LARGE;
    drawLetterString(ctx, cb.x, dateY, MONTHS[d.getMonth()], MONTH_UNIT_IN, COL_THEME);

    // GRID RULE: the day starts where the first clock digit stops, and every
    // slot on this row is one DIGIT_LARGE apart: day 0-1, dot 2, year 3.
    // Positioned from the grid, never from the previous glyph's edge.
    const dayStr = pad2(d.getDate());
    const yearStr = String(d.getFullYear());
    const firstHour = DIGIT_GLYPHS[h[0]];
    const dayStartX = cb.x + (firstHour ? firstHour.w * DIGIT_LARGE : 0) + DATE_NUDGE;
    drawDigitString(ctx, dayStartX, dateY, dayStr, DIGIT_SMALL, COL_THEME);
    drawPixelDigit(ctx, dayStartX + 2 * DIGIT_LARGE, dateY, '.', DIGIT_SMALL, COL_THEME);
    drawDigitString(ctx, dayStartX + 3 * DIGIT_LARGE, dateY, yearStr, DIGIT_SMALL, COL_THEME);

    // The lines under the date share one running Y so they stack.
    let noticeY = dateY + 34;
    const badge = notifBadgeText();
    if (badge) {
      const bdw = measureTextStrW(badge, 14);
      drawTextStr(ctx, centerX(IN_W, bdw), noticeY, badge, 14, missedCallCount > 0 ? COL_RED : COL_GRAY8);
      noticeY += 22;
    }
    // SIM_UNKNOWN = the modem has not answered yet; say nothing rather than
    // claim the tray is empty.
    if (!simReady && simState !== SIM_UNKNOWN) {
      const simMsg = (simState === SIM_NEEDS_PIN) ? 'SIM locked'
                   : (simState === SIM_NEEDS_PUK) ? 'SIM blocked' : 'Insert SIM card';
      const simW = measureTextStrW(simMsg, 14);
      drawTextStr(ctx, centerX(IN_W, simW), noticeY, simMsg, 14, COL_GRAY8);
      noticeY += 20;
    }
    if (millis() < simFlashUntil)
      drawTextFitCentered(ctx, IN_W, noticeY, simFlash, 224, 14, 10, COL_YEL);
    if (debugMode) drawTextStr(ctx, 5, 315, '[DEBUG MODE]', 10, COL_RED);
  }
  else if (state === ST_DIALER) {
    // Digits flow RIGHT to LEFT; the bottom line holds the newest. The font
    // drops to MEDIUM past 14 digits.
    const ps = dialerUnit(), digitW = 3 * ps, digitH = 5 * ps, gap = ps;
    const perLine = dialerPerLine(), softKeyY = 285;
    fbRect(ctx, 0, softKeyY, 240, 35, COL_BAR2);
    drawTextStr(ctx, 10, softKeyY + 23, 'Options', 14, COL_GRAY8);
    const rk = (dialerDigits.length === 0) ? 'Back' : 'Clear';
    drawTextStr(ctx, 231 - measureTextStrW(rk, 14), softKeyY + 23, rk, 14, COL_GRAY8);

    const maxY = softKeyY - 10, lineH = digitH + gap, bottomY = maxY - digitH;
    let cursorW = Math.trunc(ps / 5); if (cursorW < 1) cursorW = 1;
    const len = dialerDigits.length;
    if (len === 0) {
      if (dialerCursorVisible)
        fbRect(ctx, 240 - 10 - Math.trunc(gap / 2), bottomY, cursorW, digitH, COL_THEME);
    } else {
      const totalLines = Math.trunc((len + perLine - 1) / perLine);
      for (let lineNum = 0; lineNum < totalLines; lineNum++) {
        const lineY = bottomY - lineNum * lineH;
        let lineStart = len - (lineNum + 1) * perLine; if (lineStart < 0) lineStart = 0;
        const lineEnd = len - lineNum * perLine;
        const count = lineEnd - lineStart;
        const lineWidth = count * digitW + (count > 0 ? (count - 1) * gap : 0);
        let x = 240 - lineWidth - 10;
        for (let i = 0; i <= count; i++) {
          if (dialerCursor === lineStart + i && dialerCursorVisible)
            fbRect(ctx, x - Math.trunc(gap / 2), lineY, cursorW, digitH, COL_THEME);
          if (i < count) {
            drawPixelDigit(ctx, x, lineY, dialerDigits[lineStart + i], ps, COL_THEME);
            x += digitW + gap;
          }
        }
      }
    }
  }
  else if (state === ST_TEXTEDIT) {
    drawStatus(ctx, IN_W);
    const pinStyle = (textOwner === TXT_SIM_PIN || textOwner === TXT_SIM_PUK || textOwner === TXT_SIM_NEWPIN);
    if (pinStyle) {
      const tw = measureTextStrW(textTitle, 18);
      drawTextStr(ctx, centerX(IN_W, tw), 130, textTitle, 18, COL_WHITE);
      let shown = '';
      for (let i = 0; i < textBuf.length; i++) shown += (textMask && i !== textMaskPos) ? '*' : textBuf[i];
      const CODE_PX = 26;
      const sw = shown.length ? measureTextStrW(shown, CODE_PX) : 0;
      const sx = centerX(IN_W, sw), sy = 195;
      if (shown.length) drawTextStr(ctx, sx, sy, shown, CODE_PX, COL_THEME);
      if (textCursorVisible) fbRect(ctx, sx + sw + 3, sy - CODE_PX + 4, 2, CODE_PX - 2, COL_THEME);
      // Faint underline the width of the expected code - not fixed slots.
      const expect = (textOwner === TXT_SIM_PUK) ? 8 : 4;
      const rw = measureTextStrW('0'.repeat(expect), CODE_PX);
      fbRect(ctx, centerX(IN_W, rw), sy + 8, rw, 1, COL_BAR);
      if (millis() < simFlashUntil)
        drawTextFitCentered(ctx, IN_W, 236, simFlash, 224, 14, 10, COL_YEL);
      fbRect(ctx, 0, 285, 240, 35, COL_BAR2);
      const codeLongEnough = (textBuf.length >= simCodeMin(textOwner));
      drawTextStr(ctx, 10, 308, 'OK', 14, codeLongEnough ? COL_GRAY8 : COL_GRAY6);
      // NOT "Back": a SIM code screen has no exit, so on an empty field the
      // label greys out rather than advertising one.
      drawTextStr(ctx, 231 - measureTextStrW('Clear', 14), 308, 'Clear', 14,
                  textBuf.length > 0 ? COL_GRAY8 : COL_GRAY6);
    } else {
      drawTextStr(ctx, 10, 58, textTitle, 16, COL_WHITE);
      const modes = ['Abc', 'abc', 'ABC', '123'];
      const md = textDigitsOnly ? '123' : modes[textCaseMode];
      drawTextStr(ctx, 230 - measureTextStrW(md, 14), 58, md, 14, COL_GRAY8);
      fbRect(ctx, 10, 66, 220, 1, COL_BAR);

      const longField = (textOwner === TXT_MSG_BODY);
      if (!longField) {
        const charW = 12, perLine = 18, lineH = 24, y0 = 100;
        for (let i = 0; i <= textBuf.length; i++) {
          const line = Math.trunc(i / perLine), col = i % perLine;
          if (line > 5) break;
          const x = 10 + col * charW, y = y0 + line * lineH;
          if (i === textCursor && textCursorVisible) fbRect(ctx, x - 1, y - 15, 2, 18, COL_THEME);
          if (i < textBuf.length) {
            const ch = (textMask && i !== textMaskPos) ? '*' : textBuf[i];
            drawTextStr(ctx, x, y, ch, 16, COL_THEME);
          }
        }
      } else {
        // Same size and pitch as the chat bubbles this text becomes.
        const charW = 12, perLine = 18, lineH = 16, y0 = 90, maxLines = 11;
        const totalLines = Math.trunc(textBuf.length / perLine) + 1;
        const cursorLine = Math.trunc(textCursor / perLine);
        let scrollLine = 0;
        if (totalLines > maxLines) {
          scrollLine = cursorLine - maxLines + 1;
          if (scrollLine < 0) scrollLine = 0;
          const maxScroll = totalLines - maxLines;
          if (scrollLine > maxScroll) scrollLine = maxScroll;
        }
        for (let i = 0; i <= textBuf.length; i++) {
          const line = Math.trunc(i / perLine), col = i % perLine;
          const visLine = line - scrollLine;
          if (visLine < 0 || visLine >= maxLines) continue;
          const x = 10 + col * charW, y = y0 + visLine * lineH;
          if (i === textCursor && textCursorVisible) fbRect(ctx, x - 1, y - 11, 2, 13, COL_THEME);
          if (i < textBuf.length) drawTextStr(ctx, x, y, textBuf[i], 13, COL_THEME);
        }
        const cnt = textBuf.length + '/' + TEXT_MAX;
        drawTextStr(ctx, 230 - measureTextStrW(cnt, 12), 278, cnt, 12, COL_GRAY6);
      }

      fbRect(ctx, 0, 285, 240, 35, COL_BAR2);
      drawTextStr(ctx, 10, 308, symbolPickerOpen ? 'Insert' : 'OK', 14, COL_GRAY8);
      // Empty field genuinely goes back, so it says so; with the picker up the
      // key only closes the picker, so it says Back there too.
      const rk2 = (symbolPickerOpen || textBuf.length === 0) ? 'Back' : 'Clear';
      drawTextStr(ctx, 231 - measureTextStrW(rk2, 14), 308, rk2, 14, COL_GRAY8);

      // The field stays visible above the grid on purpose - you are choosing a
      // character to put somewhere.
      if (symbolPickerOpen) {
        const cell = 26;
        const gw = SYMBOL_COLS * cell;                       // 208
        const rows = Math.trunc(SYMBOL_COUNT / SYMBOL_COLS); // 4, exactly
        const gx = centerX(IN_W, gw), gy = 150;
        fbRect(ctx, gx - 6, gy - 28, gw + 12, rows * cell + 36, COL_BLACK);
        fbOutline(ctx, gx - 6, gy - 28, gw + 12, rows * cell + 36, COL_THEME);
        drawTextStr(ctx, gx, gy - 10, 'Symbols', 12, COL_GRAY8);
        for (let i = 0; i < SYMBOL_COUNT; i++) {
          const cxi = i % SYMBOL_COLS, cyi = Math.trunc(i / SYMBOL_COLS);
          const px = gx + cxi * cell, py = gy + cyi * cell;
          const sel = (i === symbolIdx);
          if (sel) fbRect(ctx, px, py, cell, cell, COL_THEME);
          const sym = SYMBOLS[i];
          const symW = measureTextStrW(sym, 16);
          drawTextStr(ctx, px + Math.trunc((cell - symW) / 2), py + 20, sym, 16, sel ? COL_THEME_INK : COL_THEME);
        }
      }
    }
  }
  else if (state === ST_GALLERY) {
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, 'Gallery', 16, COL_WHITE);
    const rowH = 26, listTop = 68, visible = 8;
    if (!sdPresent()) {
      drawTextStr(ctx, 10, 130, 'Insert memory card', 16, COL_GRAY8);
    } else if (galleryCount === 0) {
      drawTextStr(ctx, 10, 130, 'No photos', 16, COL_GRAY8);
      drawTextWrapped(ctx, 10, 156, 220, 'Put .JPG files in /DCIM', 14, COL_GRAY6, 18);
    } else {
      for (let row = 0; row < visible; row++) {
        const i = galleryTop + row;
        if (i >= galleryCount) break;
        const ry = listTop + row * rowH, sel = (i === galleryIdx);
        if (sel) fbRect(ctx, 4, ry, 232, rowH, COL_THEME);
        drawTextStr(ctx, 10, ry + 19, galleryPhotos[i].name, 14, sel ? COL_THEME_INK : COL_THEME);
        const kb = Math.trunc(galleryPhotos[i].bytes / 1024) + 'k';
        drawTextStr(ctx, 230 - measureTextStrW(kb, 12), ry + 19, kb, 12, sel ? COL_THEME_INK : COL_GRAY6);
      }
      drawScrollbar(ctx, galleryCount, galleryTop, visible, listTop, rowH);
    }
    softkeys(ctx, 'Options', 'Back');
  }
  else if (state === ST_CAMERA) {
    if (hardwareAPI.camera.isReady()) {
      const x0 = Math.trunc((IN_W - CAM_PREV_W) / 2), y0 = Math.trunc((285 - CAM_PREV_H) / 2);
      ctx.save();
      ctx.beginPath(); ctx.rect(x0, y0, CAM_PREV_W, CAM_PREV_H); ctx.clip();
      ctx.translate(x0, y0);
      hardwareAPI.camera.drawPreview(ctx, CAM_PREV_W, CAM_PREV_H);
      ctx.restore();
      // thin frame round the live area so you can see where the picture ends
      fbOutline(ctx, x0 - 1, y0 - 1, CAM_PREV_W + 2, CAM_PREV_H + 2, COL_BAR);
    } else {
      drawTextStr(ctx, 10, 140, 'Camera unavailable', 16, COL_RED);
      drawTextWrapped(ctx, 10, 166, 220, 'Check the wiring, then restart', 14, COL_GRAY8, 18);
    }
    if (millis() < camFlashUntil) {
      const fw = measureTextStrW(camFlash, 14);
      fbRect(ctx, centerX(IN_W, fw) - 6, 246, fw + 12, 22, COL_BLACK);
      fbOutline(ctx, centerX(IN_W, fw) - 6, 246, fw + 12, 22, COL_THEME);
      drawTextStr(ctx, centerX(IN_W, fw), 262, camFlash, 14, COL_THEME);
    }
    fbRect(ctx, 0, 285, 240, 35, COL_BAR2);
    drawTextStr(ctx, 10, 308, 'Opt.', 14, COL_GRAY8);
    drawTextStr(ctx, centerX(IN_W, measureTextStrW('Capture', 14)), 308, 'Capture', 14, COL_THEME);
    drawTextStr(ctx, 185, 308, 'Back', 14, COL_GRAY8);
  }
  else if (state === ST_PHOTO) {
    const p = galleryPhotos[galleryIdx];
    if (p) {
      const x0 = Math.trunc((IN_W - p.canvas.width) / 2), y0 = Math.trunc((285 - p.canvas.height) / 2);
      ctx.drawImage(p.canvas, x0, y0);
    } else {
      drawTextStr(ctx, 10, 150, 'Cannot show photo', 16, COL_RED);
    }
    fbRect(ctx, 0, 285, 240, 35, COL_BAR2);
    drawTextStr(ctx, 10, 308, (galleryIdx + 1) + '/' + galleryCount, 14, COL_GRAY8);
    drawTextStr(ctx, 80, 308, '< >', 12, COL_GRAY6);
    drawTextStr(ctx, 185, 308, 'Back', 14, COL_GRAY8);
  }
  else if (state === ST_VOICE) {
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, 'Voice Memos', 16, COL_WHITE);
    const rowH = 26, listTop = 68, visible = 8;
    if (!sdPresent()) {
      drawTextStr(ctx, 10, 130, 'Insert memory card', 16, COL_GRAY8);
    } else if (voiceCount === 0) {
      drawTextStr(ctx, 10, 130, 'No recordings', 16, COL_GRAY8);
      drawTextStr(ctx, 10, 156, 'Press OK to record', 14, COL_GRAY6);
    } else {
      for (let row = 0; row < visible; row++) {
        const i = voiceTop + row;
        if (i >= voiceCount) break;
        const ry = listTop + row * rowH, sel = (i === voiceIdx);
        if (sel) fbRect(ctx, 4, ry, 232, rowH, COL_THEME);
        drawTextStr(ctx, 10, ry + 19, voiceMemos[i].name, 14, sel ? COL_THEME_INK : COL_THEME);
        const dur = formatMMSS(voiceMemos[i].durationSec | 0);
        drawTextStr(ctx, 230 - measureTextStrW(dur, 12), ry + 19, dur, 12, sel ? COL_THEME_INK : COL_GRAY6);
      }
      drawScrollbar(ctx, voiceCount, voiceTop, visible, listTop, rowH);
    }
    softkeys(ctx, 'Options', 'Back');
  }
  else if (state === ST_VOICE_REC) {
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, 'New Recording', 16, COL_WHITE);
    const elapsedMs = voiceRecElapsedMs + (voiceRecState === VREC_RECORDING ? millis() - voiceRecStartMs : 0);
    const t = formatMMSS(elapsedMs / 1000);
    drawTextStr(ctx, centerX(IN_W, measureTextStrW(t, 32)), 170, t, 32, COL_WHITE);
    // dim = armed, blinking red = recording, amber = paused
    let dotColor = COL_BAR;
    if (voiceRecState === VREC_RECORDING) dotColor = (Math.trunc(millis() / 500) % 2 === 0) ? COL_RED : COL_BAR;
    else if (voiceRecState === VREC_PAUSED) dotColor = COL_YEL;
    fbCircle(ctx, 120, 210, 6, dotColor);
    const hint = (voiceRecState === VREC_READY) ? 'OK to record'
               : (voiceRecState === VREC_RECORDING) ? 'OK to pause' : 'OK to keep recording';
    drawTextStr(ctx, centerX(IN_W, measureTextStrW(hint, 14)), 232, hint, 14, COL_GRAY8);
    if (millis() < voiceRecFlashUntil) {
      const fw = measureTextStrW(voiceRecFlash, 14);
      fbRect(ctx, centerX(IN_W, fw) - 6, 246, fw + 12, 22, COL_BLACK);
      fbOutline(ctx, centerX(IN_W, fw) - 6, 246, fw + 12, 22, COL_YEL);
      drawTextStr(ctx, centerX(IN_W, fw), 262, voiceRecFlash, 14, COL_YEL);
    }
    fbRect(ctx, 0, 285, 240, 35, COL_BAR2);
    if (voiceRecState === VREC_PAUSED) {
      drawTextStr(ctx, 10, 308, 'Save', 14, COL_THEME);
      drawTextStr(ctx, 230 - measureTextStrW('Discard', 14), 308, 'Discard', 14, COL_RED);
    }
  }
  else if (state === ST_VOICE_PLAY) {
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, (voiceIdx >= 0 && voiceIdx < voiceCount) ? voiceMemos[voiceIdx].name : 'Recording', 16, COL_WHITE);
    const lbl = formatMMSS(voicePlayPosMs / 1000) + ' / ' + formatMMSS(voicePlayTotalMs / 1000);
    drawTextStr(ctx, centerX(IN_W, measureTextStrW(lbl, 14)), 150, lbl, 14, COL_GRAY8);
    const barX = 20, barY = 172, barW = 200, barH = 8;
    fbRect(ctx, barX, barY, barW, barH, COL_BAR);
    const fillW = voicePlayTotalMs > 0 ? Math.trunc(barW * voicePlayPosMs / voicePlayTotalMs) : 0;
    if (fillW > 0) fbRect(ctx, barX, barY, fillW, barH, COL_THEME);
    const hint = voicePlaying ? 'OK to pause' : 'OK to play';
    drawTextStr(ctx, centerX(IN_W, measureTextStrW(hint, 14)), 210, hint, 14, COL_GRAY8);
    drawTextStr(ctx, 30, 235, '<< 5s', 12, COL_GRAY6);
    drawTextStr(ctx, 210 - measureTextStrW('5s >>', 12), 235, '5s >>', 12, COL_GRAY6);
    softkeys(ctx, 'Options', 'Back');
  }
  else if (state === ST_INCOMING_CALL) {
    drawStatus(ctx, IN_W);
    const label = callNumber ? contactNameForNumber(callNumber) : 'Unknown caller';
    drawTextStr(ctx, centerX(IN_W, measureTextStrW(label, 20)), 110, label, 20, COL_WHITE);
    if (callNumber && label !== callNumber)
      drawTextStr(ctx, centerX(IN_W, measureTextStrW(callNumber, 14)), 136, callNumber, 14, COL_GRAY8);
    drawTextStr(ctx, centerX(IN_W, measureTextStrW('Incoming call', 14)), 168, 'Incoming call', 14, COL_THEME);
    fbRect(ctx, 0, 285, 240, 35, COL_BAR2);
    drawTextStr(ctx, 10, 308, 'Answer', 14, COL_THEME);
    drawTextStr(ctx, 230 - measureTextStrW('Decline', 14), 308, 'Decline', 14, COL_RED);
  }
  else if (state === ST_INCALL) {
    drawStatus(ctx, IN_W);
    const label = callNumber ? contactNameForNumber(callNumber) : 'Unknown caller';
    drawTextStr(ctx, centerX(IN_W, measureTextStrW(label, 20)), 100, label, 20, COL_WHITE);
    if (callNumber && label !== callNumber)
      drawTextStr(ctx, centerX(IN_W, measureTextStrW(callNumber, 14)), 126, callNumber, 14, COL_GRAY8);
    if (callState === CALL_DIALING) {
      drawTextStr(ctx, centerX(IN_W, measureTextStrW('Calling...', 20)), 165, 'Calling...', 20, COL_THEME);
    } else {
      const t = formatMMSS(callStartMs ? (millis() - callStartMs) / 1000 : 0);
      drawTextStr(ctx, centerX(IN_W, measureTextStrW(t, 24)), 165, t, 24, COL_GRAY8);
    }
    fbRect(ctx, 0, 285, 240, 35, COL_BAR2);
    if (callState !== CALL_DIALING)
      drawTextStr(ctx, 10, 308, callMuted ? 'Unmute' : 'Mute', 14, callMuted ? COL_YEL : COL_GRAY8);
    const rightLabel = (callState === CALL_DIALING) ? 'Cancel' : (callSpeaker ? 'Earpiece' : 'Speaker');
    drawTextStr(ctx, 230 - measureTextStrW(rightLabel, 14), 308, rightLabel, 14,
                (callState === CALL_DIALING) ? COL_RED : (callSpeaker ? COL_YEL : COL_GRAY8));
    if (callState !== CALL_DIALING) {
      const hint = 'Red key or close flip to hang up';
      drawTextStr(ctx, centerX(IN_W, measureTextStrW(hint, 11)), 264, hint, 11, COL_GRAY6);
    }
  }
  else if (state === ST_CONTACTS) {
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, 'Contacts', 16, COL_WHITE);
    const rowH = 26, listTop = 68, visible = 8;
    if (contacts.length === 0) {
      drawTextStr(ctx, 10, 130, 'No contacts', 16, COL_GRAY8);
      drawTextStr(ctx, 10, 156, 'Press OK to add one', 14, COL_GRAY6);
    } else {
      for (let row = 0; row < visible; row++) {
        const i = contactTop + row;
        if (i >= contacts.length) break;
        const ry = listTop + row * rowH, sel = (i === contactIdx);
        if (sel) fbRect(ctx, 4, ry, 232, rowH, COL_THEME);
        // Colour 0 returns COL_THEME, so untouched contacts look as they always
        // did. The selected row inverts and the colour vanishes - accepted.
        drawTextStr(ctx, 10, ry + 19, contacts[i].name, 16, sel ? COL_THEME_INK : contactColour(contacts[i].colour));
      }
      drawScrollbar(ctx, contacts.length, contactTop, visible, listTop, rowH);
    }
    softkeys(ctx, 'Options', 'Back');
  }
  else if (state === ST_CONTACT_DETAIL) {
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, 'Contact', 16, COL_WHITE);
    fbRect(ctx, 10, 66, 220, 1, COL_BAR);
    if (contacts.length === 0 || contactIdx < 0 || contactIdx >= contacts.length) {
      drawTextStr(ctx, 10, 130, 'Contact gone', 16, COL_GRAY8);
    } else {
      const c = contacts[contactIdx];
      // The one place the colour is never inverted away.
      drawTextStr(ctx, 10, 104, truncateToFit(c.name, 220, 19), 19, contactColour(c.colour));
      // Each number is its label over the number, 46px a pair.
      let y = 128;
      const nn = contactNumCount(contactIdx);
      for (let k = 0; k < nn; k++) {
        drawTextStr(ctx, 10, y, NUM_LABELS[c.label[k] <= NL_OTHER ? c.label[k] : NL_OTHER], 12, COL_GRAY6);
        drawTextStr(ctx, 10, y + 20, truncateToFit(c.number[k], 220, 16), 16, COL_GRAY8);
        y += 46;
      }
      drawTextStr(ctx, 10, y, 'Colour', 12, COL_GRAY6);
      drawTextStr(ctx, 94, y, CONTACT_COLOUR_NAMES[c.colour], 16, COL_GRAY8);
      fbRect(ctx, 190, y - 12, 36, 12, contactColour(c.colour));
      fbOutline(ctx, 190, y - 12, 36, 12, COL_GRAY6);
    }
    softkeys(ctx, 'Options', 'Back');
  }
  else if (state === ST_CONTACT_COLOUR) {
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, 'Colour', 16, COL_WHITE);
    const hint = '* = current      OK = keep';
    drawTextStr(ctx, centerX(IN_W, measureTextStrW(hint, 11)), 78, hint, 11, COL_GRAY6);
    // 8 rows at 24px from y=92 end at 284, just clear of the softkey strip.
    const rowH = 24, listTop = 92;
    const cur = (contactIdx >= 0 && contactIdx < contacts.length) ? contacts[contactIdx].colour : 0;
    for (let i = 0; i < CONTACT_COLOUR_COUNT; i++) {
      const ry = listTop + i * rowH, sel = (i === contactColourIdx);
      if (sel) fbRect(ctx, 4, ry, 232, rowH, COL_THEME);
      drawTextStr(ctx, 10, ry + 18, (i === cur) ? '*' : ' ', 16, sel ? COL_THEME_INK : COL_THEME);
      // each name drawn IN its own colour, so the list previews itself
      drawTextStr(ctx, 30, ry + 18, CONTACT_COLOUR_NAMES[i], 16, sel ? COL_THEME_INK : contactColour(i));
      if (!sel) fbRect(ctx, 200, ry + 6, 26, 12, contactColour(i));
    }
    softkeys(ctx, 'Select', 'Back');
  }
  else if (state === ST_CALLLOG) {
    missedCallCount = 0;   // the badge clears on visiting this screen
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, 'Call log', 16, COL_WHITE);
    const rowH = 26, listTop = 68, visible = 8;
    if (callLog.length === 0) {
      drawTextStr(ctx, 10, 130, 'No calls yet', 16, COL_GRAY8);
    } else {
      // newest-last in storage, so walk backwards for display
      for (let row = 0; row < visible; row++) {
        const i = callLog.length - 1 - (callLogTop + row);
        if (i < 0) break;
        const ry = listTop + row * rowH;
        const sel = ((callLogTop + row) === callLogIdx);
        if (sel) fbRect(ctx, 4, ry, 232, rowH, COL_THEME);
        const c = callLog[i];
        // All four icons differ by SHAPE - colour vanishes on the selected row.
        let iconColor = sel ? COL_THEME_INK : COL_GRAY8;
        let icon = ICON_CALL_REJECT;
        if      (c.type === CALL_OUT)      { icon = ICON_CALL_OUT;    iconColor = sel ? COL_THEME_INK : COL_THEME; }
        else if (c.type === CALL_IN)       { icon = ICON_CALL_IN;     iconColor = sel ? COL_THEME_INK : COL_AZURE; }
        else if (c.type === CALL_MISSED)   { icon = ICON_CALL_MISSED; iconColor = sel ? COL_THEME_INK : COL_RED; }
        else if (c.type === CALL_REJECTED) { icon = ICON_CALL_REJECT; iconColor = sel ? COL_THEME_INK : COL_GRAY6; }
        drawGlyph5x7(ctx, 10, ry + 19, icon, 16, iconColor);
        const ts = relativeTimeStr(c.epoch);
        const tw = ts ? measureTextStrW(ts, 12) : 0;
        if (ts) drawTextStr(ctx, 230 - tw, ry + 19, ts, 12, sel ? COL_THEME_INK : COL_GRAY6);
        // The name gets only what the time leaves, so it never runs under it.
        const nm = truncateToFit(contactNameForNumber(c.number), 200 - (tw ? tw + 12 : 0), 16);
        drawTextStr(ctx, 30, ry + 19, nm, 16, sel ? COL_THEME_INK : COL_THEME);
      }
      drawScrollbar(ctx, callLog.length, callLogTop, visible, listTop, rowH);
    }
    softkeys(ctx, 'Options', 'Back');
  }
  else if (state === ST_RINGTONES) {
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, 'Ringtones', 16, COL_WHITE);
    // Legend pinned ABOVE the list - a permanent key, not a footnote.
    const hint = '* = active        OK = preview';
    drawTextStr(ctx, centerX(IN_W, measureTextStrW(hint, 11)), 78, hint, 11, COL_GRAY6);
    const rowH = 30, listTop = 92, visible = 6;
    for (let row = 0; row < visible; row++) {
      const i = ringtonePickerTop + row;
      if (i >= RINGTONE_COUNT) break;
      const ry = listTop + row * rowH, sel = (i === ringtonePickerIdx);
      if (sel) fbRect(ctx, 4, ry, 232, rowH, COL_THEME);
      drawTextStr(ctx, 10, ry + 22, (i === settings.activeRingtoneIx) ? '*' : ' ', 16, sel ? COL_THEME_INK : COL_THEME);
      drawTextStr(ctx, 30, ry + 22, RINGTONES[i].name, 16, sel ? COL_THEME_INK : COL_WHITE);
    }
    softkeys(ctx, 'Select', 'Back');
  }
  else if (state === ST_THEME) {
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, 'Theme', 16, COL_WHITE);
    const hint = '* = active   OK = keep   Back = undo';
    drawTextStr(ctx, centerX(IN_W, measureTextStrW(hint, 11)), 78, hint, 11, COL_GRAY6);
    // 7 rows at 26px from y=92 end at 274: nothing to scroll.
    const rowH = 26, listTop = 92;
    for (let i = 0; i < THEME_ROWS; i++) {
      const ry = listTop + i * rowH, sel = (i === themeIdx), cus = (i === THEME_CUSTOM);
      if (sel) fbRect(ctx, 4, ry, 232, rowH, COL_THEME);
      drawTextStr(ctx, 10, ry + 19, (i === settings.themeIx) ? '*' : ' ', 16, sel ? COL_THEME_INK : COL_THEME);
      drawTextStr(ctx, 30, ry + 19, cus ? 'CUSTOM' : THEMES[i].name, 16, sel ? COL_THEME_INK : COL_WHITE);
      if (cus) drawTextStr(ctx, 150, ry + 19, '>', 16, sel ? COL_THEME_INK : COL_GRAY8);
      // A swatch only on rows NOT selected - the selected row already IS one.
      if (!sel)
        fbRect(ctx, 200, ry + 7, 26, 12, cus ? c565(settings.customR, settings.customG, settings.customB)
                                             : c565(THEMES[i].r, THEMES[i].g, THEMES[i].b));
    }
    // Never dead: Select on a preset, Edit on CUSTOM.
    softkeys(ctx, (themeIdx === THEME_CUSTOM) ? 'Edit' : 'Select', 'Back');
  }
  else if (state === ST_THEME_RGB) {
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, 'Custom colour', 16, COL_WHITE);
    const hint = 'up/down = channel   left/right = slide';
    drawTextStr(ctx, centerX(IN_W, measureTextStrW(hint, 11)), 78, hint, 11, COL_GRAY6);
    fbRect(ctx, 20, 92, 200, 40, c565(settings.customR, settings.customG, settings.customB));
    fbOutline(ctx, 20, 92, 200, 40, COL_GRAY6);
    const names = ['R', 'G', 'B'];
    const vals = [settings.customR, settings.customG, settings.customB];
    const rowH = 34, listTop = 150, barX = 60, barW = 130;
    for (let c = 0; c < 3; c++) {
      const ry = listTop + c * rowH, sel = (c === rgbChan);
      if (sel) fbRect(ctx, 4, ry, 232, rowH, COL_THEME);
      drawTextStr(ctx, 12, ry + 22, names[c], 16, sel ? COL_THEME_INK : COL_WHITE);
      fbOutline(ctx, barX, ry + 10, barW, 14, sel ? COL_THEME_INK : COL_GRAY6);
      const fillW = Math.trunc((barW - 4) * vals[c] / 255);
      if (fillW > 0) fbRect(ctx, barX + 2, ry + 12, fillW, 10, sel ? COL_THEME_INK : COL_GRAY8);
      const num = String(vals[c]);
      drawTextStr(ctx, 230 - measureTextStrW(num, 14), ry + 22, num, 14, sel ? COL_THEME_INK : COL_GRAY8);
    }
    softkeys(ctx, 'Save', 'Back');
  }
  else if (state === ST_MESSAGES) {
    unreadTextCount = 0;   // the badge clears on visiting this screen
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, 'Messages', 16, COL_WHITE);
    // 40px rows: name and preview are both scale 2 (14px tall each).
    const rowH = 40, listTop = 68, visible = THREAD_ROWS;
    if (threadNumbers.length === 0) {
      drawTextStr(ctx, 10, 130, 'No messages', 16, COL_GRAY8);
      drawTextWrapped(ctx, 10, 156, 220, 'Press OK to write one', 14, COL_GRAY6, 18);
    } else {
      for (let row = 0; row < visible; row++) {
        const i = threadTop + row;
        if (i >= threadNumbers.length) break;
        const ry = listTop + row * rowH, sel = (i === threadIdx);
        if (sel) fbRect(ctx, 4, ry, 232, rowH, COL_THEME);
        const name = contactNameForNumber(threadNumbers[i]);
        const last = messages[threadLastMsg[i]];
        const ts = relativeTimeStr(last.epoch);
        const reserve = ts ? measureTextStrW(ts, 12) + 12 : 0;
        // Baselines 18 and 36: 4 / 14 / 4 / 14 / 4 = exactly 40.
        drawTextStr(ctx, 10, ry + 18, truncateToFit(name, 220 - reserve, 15), 15, sel ? COL_THEME_INK : COL_THEME);
        // Same size as the name - colour carries the hierarchy, not size.
        drawTextStr(ctx, 10, ry + 36, truncateToFit(last.body, 220, 15, 48), 15, sel ? COL_THEME_INK : COL_GRAY8);
        if (ts) drawTextStr(ctx, 230 - measureTextStrW(ts, 12), ry + 18, ts, 12, sel ? COL_THEME_INK : COL_GRAY6);
      }
      drawScrollbar(ctx, threadNumbers.length, threadTop, visible, listTop, rowH);
    }
    if (millis() < msgStorageFlashUntil) {
      const fw = measureTextStrW(msgStorageFlash, 13);
      fbRect(ctx, centerX(IN_W, fw) - 6, 262, fw + 12, 20, COL_BLACK);
      fbOutline(ctx, centerX(IN_W, fw) - 6, 262, fw + 12, 20, COL_RED);
      drawTextStr(ctx, centerX(IN_W, fw), 276, msgStorageFlash, 13, COL_RED);
    }
    softkeys(ctx, 'Options', 'Back');
  }
  else if (state === ST_CHAT) {
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, contactNameForNumber(chatNumber), 16, COL_WHITE);
    fbRect(ctx, 10, 66, 220, 1, COL_BAR);

    // LAYOUT IS BY LINE, NOT BY MESSAGE: a message is 1 to 20 lines tall, so
    // scrolling by message would lurch. Same idx/top/visible shape as a list.
    const idxBuf = [];
    for (let i = 0; i < messages.length; i++) if (messages[i].number === chatNumber) idxBuf.push(i);
    const n = idxBuf.length;
    const bubblePad = 8, maxBubbleW = 170, lineH = 16;
    const availPx = maxBubbleW - bubblePad * 2;
    const viewTop = 76, viewBot = 275;
    const visible = Math.trunc((viewBot - viewTop) / lineH);

    // Pass 1: how many lines does each message take?
    const lineOf = [];
    let totalLines = 0;
    for (let k = 0; k < n; k++) {
      let lc = wrapText(messages[idxBuf[k]].body, availPx, 13, CHAT_MAX_LINES).length;
      if (lc < 1) lc = 1;
      lineOf.push(lc);
      totalLines += lc + 1;                  // +1 spacer line between bubbles
      const mk = messages[idxBuf[k]];
      if (mk.direction === MSG_DIR_OUT && mk.status === MSG_ST_FAILED) totalLines += 1;   // "Not sent"
    }
    // Opening a thread parks at the newest.
    let maxTop = totalLines - visible; if (maxTop < 0) maxTop = 0;
    if (chatScrollTop > maxTop) chatScrollTop = maxTop;
    if (chatScrollTop < 0) chatScrollTop = 0;

    // Pass 2: draw only the lines inside the window.
    let lineNo = 0;
    for (let k = 0; k < n; k++) {
      const lc = lineOf[k];
      const bubbleFirst = lineNo, bubbleLast = lineNo + lc - 1;
      const m = messages[idxBuf[k]];
      const failed = (m.direction === MSG_DIR_OUT && m.status === MSG_ST_FAILED);
      const statusLine = bubbleLast + 1;
      lineNo += lc + 1 + (failed ? 1 : 0);
      if ((failed ? statusLine : bubbleLast) < chatScrollTop) continue;   // entirely above
      if (bubbleFirst >= chatScrollTop + visible) break;                 // entirely below

      const mine = (m.direction === MSG_DIR_OUT);
      const lines = wrapText(m.body, availPx, 13, CHAT_MAX_LINES);
      const from = Math.max(0, chatScrollTop - bubbleFirst);
      const to = Math.min(lc, chatScrollTop + visible - bubbleFirst);
      let bw = 0;
      for (let l = from; l < to; l++) bw = Math.max(bw, measureTextStrW(lines[l] || '', 13));
      bw += bubblePad * 2;
      const yTop = viewTop + (bubbleFirst + from - chatScrollTop) * lineH;
      const bh = (to - from) * lineH + 2;
      const bx = mine ? (IN_W - bw - 10) : 10;
      // A part-scrolled bubble gets a flat cut edge - that is what scrolling looks like.
      if (to > from) fbRect(ctx, bx, yTop, bw, bh, mine ? COL_THEME : COL_BAR);
      for (let l = from; l < to; l++)
        drawTextStr(ctx, bx + bubblePad, yTop + (l - from) * lineH + 15, lines[l] || '', 13,
                    mine ? COL_THEME_INK : COL_WHITE);
      if (failed && statusLine >= chatScrollTop && statusLine < chatScrollTop + visible) {
        const sw = measureTextStrW('Not sent', 13);
        drawTextStr(ctx, IN_W - 10 - sw, viewTop + (statusLine - chatScrollTop) * lineH + 15, 'Not sent', 13, COL_RED);
      }
    }
    // scroll hints, only when there is something above or below
    if (chatScrollTop > 0)      drawGlyph5x7(ctx, 228, viewTop + 8, ICON_CALL_OUT, 10, COL_GRAY6);
    if (chatScrollTop < maxTop) drawGlyph5x7(ctx, 228, viewBot - 4, ICON_CALL_IN, 10, COL_GRAY6);

    if (millis() < msgStorageFlashUntil) {
      const fw = measureTextStrW(msgStorageFlash, 13);
      fbRect(ctx, centerX(IN_W, fw) - 6, 262, fw + 12, 20, COL_BLACK);
      fbOutline(ctx, centerX(IN_W, fw) - 6, 262, fw + 12, 20, COL_RED);
      drawTextStr(ctx, centerX(IN_W, fw), 276, msgStorageFlash, 13, COL_RED);
    }
    softkeys(ctx, 'Options', 'Back');
  }
  else if (state === ST_SETPAGE) {
    const pg = SET_PAGES[setPage];
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, pg.title, 16, COL_WHITE);
    const rowH = 26, listTop = 68;
    for (let i = 0; i < pg.rows.length; i++) {
      const r = pg.rows[i];
      const ry = listTop + i * rowH;
      const sel = (i === setRow), soon = (r.kind === SK_SOON);
      // An inert row shows the cursor as an OUTLINE and never lights up - the
      // difference has to survive inversion, so it is structural, not a shade.
      if (sel) {
        if (soon) fbOutline(ctx, 4, ry, 232, rowH, COL_GRAY6);
        else      fbRect(ctx, 4, ry, 232, rowH, COL_THEME);
      }
      const fg = soon ? (sel ? COL_GRAY6 : COL_GRAY3)
                      : (sel ? COL_THEME_INK : (r.kind === SK_TEXT ? COL_WHITE : COL_THEME));
      drawTextStr(ctx, 10, ry + 19, r.label, 16, fg);
      const v = setValueStr(r.kind, r.arg);
      if (v) drawTextStr(ctx, 230 - measureTextStrW(v, 14), ry + 19, v, 14,
                         soon ? fg : (sel ? COL_THEME_INK : COL_GRAY8));
    }
    // Left softkey greys on a row that cannot be selected, rather than being
    // relabelled.
    const cur = pg.rows[setRow];
    const inert = (cur.kind === SK_SOON || cur.kind === SK_INFO || cur.kind === SK_TEXT);
    softkeys(ctx, 'Select', 'Back', inert ? COL_GRAY3 : COL_GRAY8);
  }
  else if (state === ST_STORAGE) {
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, 'Storage', 16, COL_WHITE);
    let y = 96;
    drawTextStr(ctx, 10, y, 'Internal', 16, COL_THEME); y += 24;
    {
      const fs = fsUsage();
      const u = fs.used, t = fs.total;
      drawTextStr(ctx, 10, y, Math.trunc(u / 1024) + ' of ' + Math.trunc(t / 1024) + ' kB', 14, COL_GRAY8); y += 20;
      // A bar says "nearly full" faster than two numbers do.
      const barW = 220, fill = t ? Math.trunc(barW * u / t) : 0;
      fbOutline(ctx, 10, y - 8, barW, 10, COL_GRAY6);
      if (fill > 0) fbRect(ctx, 11, y - 7, (fill > barW - 2) ? barW - 2 : fill, 8, COL_THEME);
      y += 22;
    }
    y += 10;
    drawTextStr(ctx, 10, y, 'SD card', 16, COL_THEME); y += 24;
    if (sdPresent()) {
      const su = sdUsedMB(), stt = hardwareAPI.sd.sizeMB();
      drawTextStr(ctx, 10, y, su + ' of ' + stt + ' MB', 14, COL_GRAY8); y += 20;
      const barW = 220, fill = stt ? Math.trunc(barW * su / stt) : 0;
      fbOutline(ctx, 10, y - 8, barW, 10, COL_GRAY6);
      if (fill > 0) fbRect(ctx, 11, y - 7, (fill > barW - 2) ? barW - 2 : fill, 8, COL_THEME);
      y += 22;
    } else {
      drawTextStr(ctx, 10, y, 'no card', 14, COL_GRAY8);
      y += 22;
    }
    softkeys(ctx, null, 'Back');
  }
  else if (state === ST_APPS || state === ST_GAMES) {
    const games = (state === ST_GAMES);
    const items = games ? gamesItems : appsItems;
    const count = games ? gamesCount : appsCount;
    const idx = games ? gamesIdx : appsIdx;
    const top = games ? gamesTop : appsTop;
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, games ? 'Games' : 'Apps', 16, COL_WHITE);
    const rowH = 26, listTop = 72, visible = 8;
    for (let row = 0; row < visible; row++) {
      const i = top + row;
      if (i >= count) break;
      const ry = listTop + row * rowH, sel = (i === idx);
      if (sel) fbRect(ctx, 4, ry, 232, rowH, COL_THEME);
      drawTextStr(ctx, 10, ry + 19, items[i], 16, sel ? COL_THEME_INK : COL_THEME);
    }
    softkeys(ctx, 'Select', 'Back');
  }
  else if (state === ST_MENU) {
    drawStatus(ctx, IN_W);
    // the largest size that still fits, then centred
    const name = menuNames[menuIdx];
    const nameSizes = [24, 20, 18, 16];
    let nameSize = nameSizes[0], nw = 0;
    for (let s = 0; s < 4; s++) {
      nameSize = nameSizes[s];
      nw = measureTextStrW(name, nameSize);
      if (nw <= IN_W - 20) break;
    }
    drawTextStr(ctx, centerX(IN_W, nw), 130, name, nameSize, COL_WHITE);
    drawTextStr(ctx, 15, 175, '<', 20, COL_GRAY6);
    drawTextStr(ctx, IN_W - 15 - measureTextStrW('>', 20), 175, '>', 20, COL_GRAY6);
    const dotsX = centerX(IN_W, (menuCount - 1) * 25);
    for (let i = 0; i < menuCount; i++)
      fbCircle(ctx, dotsX + i * 25, 215, i === menuIdx ? 5 : 3, i === menuIdx ? COL_WHITE : COL_GRAY6);
    softkeys(ctx, 'Select', 'Back');
  }
  else if (state === ST_APP) {
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, centerX(IN_W, measureTextStrW(comingSoonName, 24)), 130, comingSoonName, 24, COL_WHITE);
    drawTextStr(ctx, centerX(IN_W, measureTextStrW('Coming soon', 16)), 170, 'Coming soon', 16, COL_GRAY8);
    drawTextStr(ctx, centerX(IN_W, measureTextStrW('RIGHT to exit', 14)), 200, 'RIGHT to exit', 14, COL_GRAY6);
  }

  // A dial that cannot happen, e.g. no network. Above every screen, below the popup.
  if (millis() < callFlashUntil) {
    const fw = measureTextStrW(callFlash, 16);
    fbRect(ctx, centerX(IN_W, fw) - 8, 232, fw + 16, 28, COL_BLACK);
    fbOutline(ctx, centerX(IN_W, fw) - 8, 232, fw + 16, 28, COL_RED);
    drawTextStr(ctx, centerX(IN_W, fw), 252, callFlash, 16, COL_RED);
  }
  // General notice - same box and spot, its own colour.
  if (millis() < uiFlashUntil) {
    const fw = measureTextStrW(uiFlash, 16);
    fbRect(ctx, centerX(IN_W, fw) - 8, 232, fw + 16, 28, COL_BLACK);
    fbOutline(ctx, centerX(IN_W, fw) - 8, 232, fw + 16, 28, uiFlashColour);
    drawTextStr(ctx, centerX(IN_W, fw), 252, uiFlash, 16, uiFlashColour);
  }
  // The busy box, mid-screen.
  if (busyText) {
    const bw = measureTextStrW(busyText, 16);
    fbRect(ctx, centerX(IN_W, bw) - 12, 140, bw + 24, 36, COL_BLACK);
    fbOutline(ctx, centerX(IN_W, bw) - 12, 140, bw + 24, 36, COL_THEME);
    drawTextStr(ctx, centerX(IN_W, bw), 164, busyText, 16, COL_WHITE);
  }
  drawOptions(ctx);                    // the popup floats above whatever is behind it
  drawVolumeOverlay(ctx, IN_W, IN_H);  // and the meter floats above even that
}

// Internal storage, estimated the way LittleFS spends it: whole 4 kB blocks per
// file, plus the filesystem's own two. Same record sizes as the phone's structs.
function fsUsage() {
  const blk = function (bytes) { return bytes > 0 ? Math.ceil(bytes / 4096) * 4096 : 0; };
  let used = 2 * 4096;
  used += blk(36);                                  // settings.dat
  used += blk(8 + contacts.length * 100);           // contacts.dat
  used += blk(messages.length * 192);               // messages.dat
  used += blk(callLog.length * 36);                 // calllog.dat
  return { used: used, total: 11264 * 1024 };       // the 11 MB partition
}
function sdUsedMB() {
  let bytes = 0;
  for (const p of galleryPhotos) bytes += p.bytes;
  for (const v of voiceMemos) bytes += 44 + (v.durationSec | 0) * 32000;
  return hardwareAPI.sd.usedMB() + Math.trunc(bytes / (1024 * 1024));
}

function drawOuter(ctx) {
  marqueeShown = false;   // recomputed by drawTextFitCentered below
  fbRect(ctx, 0, 0, OUT_W, OUT_H, COL_BLACK);
  if (state === ST_OFF) return;

  const outBars = (simReady && networkRegistered()) ? csqToBars(modemSignalCSQ) : 0;
  const osb = drawSignalBars(ctx, 4, 4, 2, COL_THEME, outBars, !simReady);
  const bstr = getBatteryPercent() + '%';
  const bw = measureDigitStringW(bstr, 2);
  const obatX = alignRight(OUT_W, bw, 4);
  drawDigitString(ctx, obatX, 4, bstr, 2, COL_THEME);
  // Same icons, scale 2 to match this battery figure's 10px of ink. These matter
  // MORE on the closed phone: it is the only surface that can say whether a
  // silent phone was set to silent or simply missed a call.
  drawStatusIcons(ctx, osb.x + osb.width + 6, 16, 16, 10, 4, obatX - 4);

  // Ringing or in a call: the caller replaces the clock.
  if (state === ST_INCOMING_CALL || state === ST_INCALL) {
    const MARGIN = 4, MAXW = OUT_W - MARGIN * 2;
    if (state === ST_INCOMING_CALL)
      drawTextFitCentered(ctx, OUT_W, 44, 'Incoming', MAXW, 14, 10, COL_WHITE);
    const label = callNumber ? contactNameForNumber(callNumber) : 'Unknown';
    drawTextFitCentered(ctx, OUT_W, 68, label, MAXW, 14, 12, COL_THEME);
    if (callNumber && label !== callNumber)
      drawTextFitCentered(ctx, OUT_W, 84, callNumber, MAXW, 10, 10, COL_THEME);
    if (state === ST_INCALL) {
      if (callState === CALL_DIALING)
        drawTextFitCentered(ctx, OUT_W, 108, 'Calling...', MAXW, 14, 10, COL_THEME);
      else
        drawTextFitCentered(ctx, OUT_W, 108, formatMMSS(callStartMs ? (millis() - callStartMs) / 1000 : 0),
                            MAXW, 14, 10, COL_WHITE);
    }
    drawVolumeOverlay(ctx, OUT_W, OUT_H);
    return;
  }

  const d = new Date();
  const clockStr = pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  const clockW = measureDigitStringW(clockStr, 6);
  const cb = drawDigitString(ctx, centerX(OUT_W, clockW), 35, clockStr, 6, COL_THEME);
  const dateY = cb.y + cb.height + 6;

  // Centred rather than grid-aligned: legibility wins over an alignment nobody
  // can see at 27 mm across.
  const DU = DATE_UNIT_OUT, GAP = 3 * DU;
  const dayStr = pad2(d.getDate()), yearStr = String(d.getFullYear());
  const mW = measureLetterStringW(MONTHS[d.getMonth()], MONTH_UNIT_OUT);
  const dW = measureDigitStringW(dayStr, DU);
  const yW = measureDigitStringW(yearStr, DU);
  let x = centerX(OUT_W, mW + GAP + dW + DU + DU + GAP + yW);
  drawLetterString(ctx, x, dateY, MONTHS[d.getMonth()], MONTH_UNIT_OUT, COL_THEME);
  x += mW + GAP;
  const db  = drawDigitString(ctx, x, dateY, dayStr, DU, COL_THEME);
  const dot = drawPixelDigit(ctx, db.x + db.width + DU, dateY, '.', DU, COL_THEME);
  drawDigitString(ctx, dot.x + dot.width + GAP, dateY, yearStr, DU, COL_THEME);

  // Missed calls / unread texts under the date - the screen you see shut.
  const badge = notifBadgeText();
  if (badge) {
    const bdw = measureTextStrW(badge, 10);
    drawTextStr(ctx, centerX(OUT_W, bdw), dateY + 5 * DU + 12, badge, 10,
                missedCallCount > 0 ? COL_RED : COL_GRAY8);
  }
  drawVolumeOverlay(ctx, OUT_W, OUT_H);
}

// The emulator calls these names. Keep them as the only entry points.
function drawInnerScreen(ctx) { drawInner(ctx); }
function drawOuterScreen(ctx) { drawOuter(ctx); }

// ==================== RENDER + TIMERS ====================
// On the phone renderInner() is drawInner() + presentScreen(). Here the
// emulator owns the present step: it calls drawInnerScreen() into its canvas.
function renderInner(force) { hardwareAPI.requestInnerFrame(); }
function renderOuter(force) { hardwareAPI.requestOuterFrame(); }

// millis()-based deadlines, 0 = not running - the same set loop() checks.
let bootDeadline = 0, dimDeadline = 0, sleepDeadline = 0, outerDeadline = 0;
let tickDeadline = 0;
let fadeActive = false, fadeFrom = 0, fadeTo = 0, fadeStartMs = 0, fadeNextMs = 0;
const FADE_DUR = 1000;

function clearScreenTimers() { dimDeadline = 0; sleepDeadline = 0; }
function clearOuterTimer()   { outerDeadline = 0; }
function clearOuterFade()    { fadeActive = false; }

// With the lid shut the inner screen does not exist as far as the OS is
// concerned: no countdown, no backlight. Opening the lid calls this again.
function startScreenTimers() {
  clearScreenTimers();
  if (!flipIsOpen()) return;
  screenState = SCREEN_NORMAL;
  hardwareAPI.setInnerBrightness(settings.brightness);
  dimDeadline   = millis() + settings.dimAfterS * 1000;
  sleepDeadline = millis() + settings.sleepAfterS * 1000;
}
function startOuterTimer() { outerDeadline = millis() + 5000; }
function startFade(from, to) {
  fadeActive = true; fadeFrom = from; fadeTo = to;
  fadeStartMs = millis(); fadeNextMs = fadeStartMs;
}

// ---- theme picker / RGB editor cursors ----
let themeIdx = 0, themeEntryIx = 0;
let rgbChan = 0;                       // 0=R 1=G 2=B
let rgbEntryR = 0, rgbEntryG = 0, rgbEntryB = 0;   // so Back can undo the editor

// ==================== HOLD-TO-REPEAT ====================
// The keypad reports a key going down and coming back up; the OS alone decides
// whether a hold means one input or one every N ms.
let repeatBtn = '', repeatNext = 0, repeatEvery = 100;
const REPEAT_FIRST = 400, REPEAT_DELETE = 100, REPEAT_SCROLL = 250;
function repeatArm(b, every) { repeatBtn = b; repeatEvery = every; repeatNext = millis() + REPEAT_FIRST; }
// OPT-IN: in a call the arrows toggle the speaker, so they must never repeat there.
function stateScrollsWithArrows(s) {
  return s === ST_MENU    || s === ST_CONTACTS  || s === ST_MESSAGES || s === ST_CHAT
      || s === ST_CALLLOG || s === ST_GALLERY   || s === ST_APPS     || s === ST_GAMES
      || s === ST_SETPAGE || s === ST_RINGTONES || s === ST_THEME
      || s === ST_THEME_RGB;
}

// ==================== POWER ====================
function osPowerOn() {
  pxlog('Power ON');
  state = ST_BOOT;
  screenState = SCREEN_NORMAL;
  hardwareAPI.setInnerBrightness(settings.brightness);
  renderInner();
  bootDeadline = millis() + 2000;
}
function osPowerOff() {
  pxlog('Power OFF');
  state = ST_OFF;
  screenState = SCREEN_NORMAL;
  debugMode = false;
  settings.debugMode = 0;   // the About row reads this - it said ON after a restart
  optOpen = false; optOwner = OPT_NONE;   // a popup must not survive a power cycle
  // Nor an open text field - a half-typed PIN has no business in RAM.
  textOwner = TXT_NONE;
  textBuf = ''; textCursor = 0;
  symbolPickerOpen = false;
  clearScreenTimers(); clearOuterTimer(); clearOuterFade();
  bootDeadline = 0;
}

// ==================== BUTTONS ====================
function osButtonPress(btn) {
  // Arm hold-to-scroll on a FRESH arrow press only, so a re-delivered repeat
  // does not push the lead-in out again on every tick.
  if ((btn === 'ARROW_UP' || btn === 'ARROW_DOWN') && repeatBtn !== btn && stateScrollsWithArrows(state))
    repeatArm(btn, REPEAT_SCROLL);
  if ((btn === 'ARROW_LEFT' || btn === 'ARROW_RIGHT') && repeatBtn !== btn
      && (state === ST_THEME_RGB || setRowRepeats()))
    repeatArm(btn, REPEAT_SCROLL);
  if (state === ST_OFF) return;
  // Mid-reset every key is swallowed - before the wake logic below.
  if (state === ST_RESET && !resetDone) return;

  if (screenState === SCREEN_SLEEP) {          // wake, and eat the press
    pxlog('Wake from sleep');
    startScreenTimers();
    renderInner();
    return;
  }
  if (screenState === SCREEN_DIMMED) {         // wake, and let the press through
    pxlog('Wake from dim');
    startScreenTimers();
    renderInner();
  }
  if (screenState === SCREEN_NORMAL) startScreenTimers();

  // ---- OPTIONS POPUP: swallows every button while open ----
  if (optOpen) {
    if (btn === 'ARROW_UP')   { optionsMove(-1); return; }
    if (btn === 'ARROW_DOWN') { optionsMove(+1); return; }
    if (btn === 'BTN_OK' || btn === 'BTN_LEFT') { optionsSelect(); return; }
    if (btn === 'BTN_RIGHT')  { closeOptions(); return; }
    return;
  }

  // ---- FACTORY RESET: DONE - "press any key", and the key is eaten ----
  if (state === ST_RESET) { state = ST_HOME; renderInner(true); return; }

  // ---- CALLS: a live call outranks whatever else was on screen ----
  if (state === ST_INCOMING_CALL) {
    // Answer on the left softkey and the green key ONLY - OK is "confirm"
    // everywhere else, and a pocket press must not pick up.
    if (btn === 'BTN_LEFT' || btn === 'BTN_CALL') { callAnswer(); return; }
    if (btn === 'BTN_RIGHT' || btn === 'BTN_HANGUP') { callHangup(); return; }
    return;
  }
  if (state === ST_INCALL) {
    if (callState === CALL_DIALING) {
      if (btn === 'BTN_RIGHT' || btn === 'BTN_HANGUP') { callHangup(); return; }
      return;
    }
    // Mute and Speaker on the softkeys; hang up is the RED key or the flip.
    if (btn === 'BTN_LEFT')  { callToggleMute(); return; }
    if (btn === 'BTN_RIGHT') { callToggleSpeaker(); return; }
    if (btn === 'ARROW_UP' || btn === 'ARROW_DOWN') { callToggleSpeaker(); return; }
    if (btn === 'BTN_HANGUP') { callHangup(); return; }
    return;
  }

  // ---- APPS / GAMES ----
  if (state === ST_APPS || state === ST_GAMES) {
    const games = (state === ST_GAMES);
    const count = games ? gamesCount : appsCount;
    const items = games ? gamesItems : appsItems;
    let idx = games ? gamesIdx : appsIdx;
    let top = games ? gamesTop : appsTop;
    if (btn === 'ARROW_UP' || btn === 'ARROW_DOWN') {
      idx += (btn === 'ARROW_DOWN') ? 1 : -1;
      if (idx < 0) idx = count - 1;
      if (idx >= count) idx = 0;
      const visible = 8;
      if (idx < top) top = idx;
      if (idx >= top + visible) top = idx - visible + 1;
      if (games) { gamesIdx = idx; gamesTop = top; } else { appsIdx = idx; appsTop = top; }
      renderInner();
      return;
    }
    if (btn === 'BTN_OK' || btn === 'BTN_LEFT') {
      // Voice memos is the only one built; everything else is "Coming soon".
      if (!games && idx === 0) { voiceScan(); state = ST_VOICE; appReturnTo = ST_APPS; }
      else { comingSoonName = items[idx]; comingSoonReturn = state; state = ST_APP; }
      renderInner();
      return;
    }
    if (btn === 'BTN_RIGHT') { state = ST_MENU; renderInner(); return; }
    return;
  }

  // ---- CALL LOG ----
  if (state === ST_CALLLOG) {
    if (btn === 'ARROW_UP' || btn === 'ARROW_DOWN') {
      if (callLog.length > 0) {
        callLogIdx += (btn === 'ARROW_DOWN') ? 1 : -1;
        if (callLogIdx < 0) callLogIdx = callLog.length - 1;
        if (callLogIdx >= callLog.length) callLogIdx = 0;
        const visible = 8;
        if (callLogIdx < callLogTop) callLogTop = callLogIdx;
        if (callLogIdx >= callLogTop + visible) callLogTop = callLogIdx - visible + 1;
        renderInner();
      }
      return;
    }
    if (btn === 'BTN_LEFT' && callLog.length > 0) {
      openOptions(OPT_CALLLOG, ['Call', 'Send message', 'Save as contact', 'Delete entry', 'Delete all']);
      return;
    }
    if (btn === 'BTN_CALL' && callLog.length > 0) {
      const sel = callLog.length - 1 - callLogIdx;
      if (sel >= 0 && sel < callLog.length) callDial(callLog[sel].number);
      return;
    }
    if (btn === 'BTN_RIGHT' || btn === 'BTN_OK') { state = ST_MENU; renderInner(); return; }
    return;
  }

  // ---- RINGTONES ----
  if (state === ST_RINGTONES) {
    if (btn === 'ARROW_UP' || btn === 'ARROW_DOWN') {
      ringtoneStop();   // do not leave the previous row's tune playing
      ringtonePickerIdx += (btn === 'ARROW_DOWN') ? 1 : -1;
      if (ringtonePickerIdx < 0) ringtonePickerIdx = RINGTONE_COUNT - 1;
      if (ringtonePickerIdx >= RINGTONE_COUNT) ringtonePickerIdx = 0;
      const visible = 6;
      if (ringtonePickerIdx < ringtonePickerTop) ringtonePickerTop = ringtonePickerIdx;
      if (ringtonePickerIdx >= ringtonePickerTop + visible) ringtonePickerTop = ringtonePickerIdx - visible + 1;
      renderInner();
      return;
    }
    // Hearing one and choosing one are different intentions: OK auditions,
    // the left softkey ("Select") is the one that saves.
    if (btn === 'BTN_OK') { ringtonePreview(ringtonePickerIdx); return; }
    if (btn === 'BTN_LEFT') {
      settings.activeRingtoneIx = ringtonePickerIdx;
      settingsSave();
      ringtonePreview(ringtonePickerIdx);   // confirm what you just picked
      renderInner();                        // the * moves
      return;
    }
    if (btn === 'BTN_RIGHT') { ringtoneStop(); state = ST_SETPAGE; renderInner(); return; }
    return;
  }

  // ---- CUSTOM COLOUR ----
  if (state === ST_THEME_RGB) {
    if (btn === 'ARROW_UP' || btn === 'ARROW_DOWN') {
      rgbChan += (btn === 'ARROW_DOWN') ? 1 : -1;
      if (rgbChan < 0) rgbChan = 2;
      if (rgbChan > 2) rgbChan = 0;
      renderInner();
      return;
    }
    if (btn === 'ARROW_LEFT' || btn === 'ARROW_RIGHT') {
      const d = (btn === 'ARROW_RIGHT') ? RGB_STEP : -RGB_STEP;
      const key = (rgbChan === 0) ? 'customR' : (rgbChan === 1) ? 'customG' : 'customB';
      let v = settings[key] + d;
      if (v < 0) v = 0;            // clamp, never wrap
      if (v > 255) v = 255;
      settings[key] = v;
      themeApply(THEME_CUSTOM);    // live: the ink can flip mid-slide
      renderInner(true);
      return;
    }
    if (btn === 'BTN_OK' || btn === 'BTN_LEFT') {
      themeApply(THEME_CUSTOM);
      settingsSave();
      state = ST_THEME;
      renderInner(true);
      return;
    }
    if (btn === 'BTN_RIGHT') {
      settings.customR = rgbEntryR; settings.customG = rgbEntryG; settings.customB = rgbEntryB;
      themeApply(themeEntryIx);    // all the way back to the theme we walked in on
      state = ST_THEME;
      renderInner(true);
      return;
    }
    return;
  }

  // ---- THEME ----
  if (state === ST_THEME) {
    if (btn === 'ARROW_UP' || btn === 'ARROW_DOWN') {
      themeIdx += (btn === 'ARROW_DOWN') ? 1 : -1;
      if (themeIdx < 0) themeIdx = THEME_ROWS - 1;
      if (themeIdx >= THEME_ROWS) themeIdx = 0;
      // Live preview for free: the screen is drawn in COL_THEME, so changing it
      // and redrawing IS the preview.
      themeApply(themeIdx);
      renderInner(true);
      return;
    }
    if (btn === 'BTN_LEFT' && themeIdx === THEME_CUSTOM) {
      rgbEntryR = settings.customR; rgbEntryG = settings.customG; rgbEntryB = settings.customB;
      rgbChan = 0;
      themeApply(THEME_CUSTOM);
      state = ST_THEME_RGB;
      renderInner(true);
      return;
    }
    if (btn === 'BTN_OK' || btn === 'BTN_LEFT') {
      themeApply(themeIdx);
      settingsSave();              // only keeping writes
      state = ST_SETPAGE;
      renderInner(true);
      return;
    }
    if (btn === 'BTN_RIGHT') {
      themeApply(themeEntryIx);    // undo whatever the preview left behind
      state = ST_SETPAGE;
      renderInner(true);
      return;
    }
    return;
  }

  // ---- SETTINGS ----
  if (state === ST_STORAGE) {
    if (btn === 'BTN_RIGHT' || btn === 'BTN_OK') { state = ST_SETPAGE; renderInner(); }
    return;
  }
  if (state === ST_SETPAGE) {
    const pg = SET_PAGES[setPage];
    if (btn === 'ARROW_UP' || btn === 'ARROW_DOWN') {
      const n = pg.rows.length;
      let i = setRow + ((btn === 'ARROW_DOWN') ? 1 : -1);
      if (i < 0) i = n - 1;
      if (i >= n) i = 0;
      setRow = i;
      renderInner();
      return;
    }
    // Left/right adjust a value IN PLACE - a number does not deserve a screen.
    if (btn === 'ARROW_LEFT' || btn === 'ARROW_RIGHT') {
      const r = pg.rows[setRow];
      const d = (btn === 'ARROW_RIGHT') ? 1 : -1;
      if (r.kind === SK_RANGE) {
        let v = setValueGet(r.arg) + d * r.step;
        if (v < r.lo) v = r.lo;          // clamp, never wrap
        if (v > r.hi) v = r.hi;
        setValueSet(r.arg, v);
        // the one value you judge by looking at it - applied on the way past
        if (r.arg === SF_BRIGHT) hardwareAPI.setInnerBrightness(settings.brightness);
        renderInner();
      } else if (r.kind === SK_TOGGLE) {
        setValueSet(r.arg, setValueGet(r.arg) ? 0 : 1);
        renderInner();
      }
      return;
    }
    if (btn === 'BTN_OK' || btn === 'BTN_LEFT') {
      const r = pg.rows[setRow];
      switch (r.kind) {
        case SK_PAGE:
          if (setDepth < 4) { setStackPage[setDepth] = setPage; setStackRow[setDepth] = setRow; setDepth++; }
          setPage = r.arg; setRow = 0;
          break;
        case SK_TOGGLE:
          setValueSet(r.arg, setValueGet(r.arg) ? 0 : 1);
          break;
        case SK_SCREEN:
          // Each bespoke screen needs its cursor primed - why these are not
          // simply state = r.arg.
          if (r.arg === ST_RINGTONES) {
            state = ST_RINGTONES;
            // A saved choice past the end of the list (a removed tune) -> the first one.
            if (settings.activeRingtoneIx >= RINGTONE_COUNT) settings.activeRingtoneIx = 0;
            ringtonePickerIdx = settings.activeRingtoneIx;
            ringtonePickerTop = 0;
            const vis = 6;
            if (ringtonePickerIdx >= vis) ringtonePickerTop = ringtonePickerIdx - vis + 1;
          } else if (r.arg === ST_THEME) {
            state = ST_THEME;
            themeIdx = settings.themeIx; themeEntryIx = settings.themeIx;
          } else {
            state = r.arg;
          }
          break;
        case SK_ACTION:
          switch (r.arg) {
            case AC_STORAGE_INFO: state = ST_STORAGE; break;
            case AC_FORMAT_SD:
              if (!sdPresent()) { pxlog('No memory card inserted'); uiFlashShow('No memory card', COL_RED); }
              else { openOptions(OPT_FORMAT, ['Yes, erase all', 'Cancel']); return; }
              break;
            case AC_BACKUP:
              if (!sdPresent()) { uiFlashShow('No memory card', COL_RED); break; }
              openOptions(OPT_BACKUP, ['Back up to SD', 'Restore from SD']);
              return;
            case AC_FACTORY_RESET:
              openOptions(OPT_FACTORY, ['Yes, reset', 'Cancel']);
              return;
            case AC_SIM_PIN:
              if (simReady)                        pxlog('SIM already unlocked');
              else if (simState === SIM_NEEDS_PIN) simPromptPin();
              else if (simState === SIM_NEEDS_PUK) simPromptPuk();
              else                                 pxlog('No SIM detected');
              break;
          }
          break;
        case SK_RANGE: return;   // the arrows do this one; OK deliberately inert
        case SK_INFO:
        case SK_TEXT:
        case SK_SOON:  return;   // nothing behind them, and the label says so
      }
      renderInner();
      return;
    }
    if (btn === 'BTN_RIGHT') {
      if (setDepth > 0) {
        setDepth--;
        setPage = setStackPage[setDepth];
        setRow  = setStackRow[setDepth];   // land back on the row you came from
      } else {
        state = ST_MENU;
      }
      renderInner();
      return;
    }
    return;
  }

  // ---- CAMERA ----
  if (state === ST_CAMERA) {
    if (btn === 'BTN_OK' || btn === 'BTN_CALL') { cameraShutter(); renderInner(); return; }
    if (btn === 'BTN_RIGHT') { state = ST_MENU; renderInner(); return; }
    if (btn === 'BTN_LEFT') { openOptions(OPT_CAMERA, ['View gallery', 'Fix colours']); return; }
    return;
  }

  // ---- GALLERY ----
  if (state === ST_PHOTO) {
    if (btn === 'ARROW_LEFT' || btn === 'ARROW_RIGHT') {
      if (galleryCount > 0) {
        galleryIdx += (btn === 'ARROW_RIGHT') ? 1 : -1;
        if (galleryIdx < 0) galleryIdx = galleryCount - 1;
        if (galleryIdx >= galleryCount) galleryIdx = 0;
        renderInner();
      }
      return;
    }
    if (btn === 'BTN_RIGHT' || btn === 'BTN_OK') { state = ST_GALLERY; renderInner(); return; }
    if (btn === 'BTN_LEFT') { openOptions(OPT_GALLERY, ['Delete', 'Fix colours']); return; }
    return;
  }
  if (state === ST_GALLERY) {
    const visible = 8;
    if (btn === 'ARROW_UP' || btn === 'ARROW_DOWN') {
      if (galleryCount > 0) {
        galleryIdx += (btn === 'ARROW_DOWN') ? 1 : -1;
        if (galleryIdx < 0) galleryIdx = galleryCount - 1;
        if (galleryIdx >= galleryCount) galleryIdx = 0;
        if (galleryIdx < galleryTop) galleryTop = galleryIdx;
        if (galleryIdx >= galleryTop + visible) galleryTop = galleryIdx - visible + 1;
        renderInner();
      }
      return;
    }
    if (btn === 'BTN_OK') {
      if (galleryCount > 0) { pxlog('Opening photo...'); state = ST_PHOTO; renderInner(); }
      return;
    }
    if (btn === 'BTN_LEFT') { openOptions(OPT_GALLERY, ['Refresh', 'Delete', 'Fix colours']); return; }
    if (btn === 'BTN_RIGHT') { state = ST_MENU; renderInner(); return; }
    return;
  }

  // ---- VOICE MEMOS ----
  if (state === ST_VOICE) {
    const visible = 8;
    if (btn === 'ARROW_UP' || btn === 'ARROW_DOWN') {
      if (voiceCount > 0) {
        voiceIdx += (btn === 'ARROW_DOWN') ? 1 : -1;
        if (voiceIdx < 0) voiceIdx = voiceCount - 1;
        if (voiceIdx >= voiceCount) voiceIdx = 0;
        if (voiceIdx < voiceTop) voiceTop = voiceIdx;
        if (voiceIdx >= voiceTop + visible) voiceTop = voiceIdx - visible + 1;
        renderInner();
      }
      return;
    }
    if (btn === 'BTN_OK') {
      // Empty list: straight into recording, not a second OK press.
      if (voiceCount === 0) { voiceRecEnter(); voiceRecStartCapture(); renderInner(); }
      else { voicePlayEnter(voiceIdx); renderInner(); }
      return;
    }
    if (btn === 'BTN_LEFT') {
      openOptions(OPT_VOICE, voiceCount === 0 ? ['New recording'] : ['New recording', 'Delete']);
      return;
    }
    if (btn === 'BTN_RIGHT') { state = appReturnTo; renderInner(); return; }
    return;
  }
  if (state === ST_VOICE_REC) {
    if (btn === 'BTN_OK') {
      if      (voiceRecState === VREC_READY)     voiceRecStartCapture();
      else if (voiceRecState === VREC_PAUSED)    voiceRecResume();
      else if (voiceRecState === VREC_RECORDING) voiceRecPause();
      renderInner();
      return;
    }
    if (btn === 'BTN_LEFT' && voiceRecState === VREC_PAUSED) { voiceRecSave(); renderInner(); return; }
    if (btn === 'BTN_RIGHT') {
      if (voiceRecState === VREC_READY) state = ST_VOICE;   // nothing captured, just leave
      else voiceRecDiscard();
      renderInner();
      return;
    }
    return;
  }
  if (state === ST_VOICE_PLAY) {
    if (btn === 'BTN_OK') { voicePlayToggle(); renderInner(); return; }
    if (btn === 'ARROW_LEFT')  { voicePlaySeek(-5); renderInner(); return; }
    if (btn === 'ARROW_RIGHT') { voicePlaySeek(+5); renderInner(); return; }
    if (btn === 'BTN_LEFT') { openOptions(OPT_VOICE_PLAY, ['Delete']); return; }
    if (btn === 'BTN_RIGHT') { voicePlayExit(); renderInner(); return; }
    return;
  }

  // ---- TEXT EDITOR: the symbol picker owns every key while it is up ----
  if (state === ST_TEXTEDIT && symbolPickerOpen) {
    if (btn === 'ARROW_LEFT' || btn === 'ARROW_RIGHT') {
      symbolIdx += (btn === 'ARROW_RIGHT') ? 1 : -1;
      if (symbolIdx < 0) symbolIdx = SYMBOL_COUNT - 1;
      if (symbolIdx >= SYMBOL_COUNT) symbolIdx = 0;
      renderInner(); return;
    }
    if (btn === 'ARROW_UP' || btn === 'ARROW_DOWN') {
      symbolIdx += (btn === 'ARROW_DOWN') ? SYMBOL_COLS : -SYMBOL_COLS;
      if (symbolIdx < 0) symbolIdx += SYMBOL_COUNT;
      if (symbolIdx >= SYMBOL_COUNT) symbolIdx -= SYMBOL_COUNT;
      renderInner(); return;
    }
    if (btn === 'BTN_OK' || btn === 'BTN_LEFT') {
      // textInsert(), NOT textKeyPress() - that one maps a KEYPAD key and every
      // symbol except * would fall straight out of it.
      textInsert(SYMBOLS[symbolIdx]);
      tapKey = 0;                   // ends any multitap run, or the next letter cycles the symbol
      textBlinkReset();
      symbolPickerOpen = false;     // one symbol per visit
      renderInner(); return;
    }
    if (btn === 'BTN_RIGHT') { symbolPickerOpen = false; renderInner(); return; }
    return;
  }
  if (state === ST_TEXTEDIT) {
    if (btn.indexOf('NUM_') === 0) {
      const d = btn.slice(4);
      if (d === 'HASH') textCycleCase();
      else if (d === 'STAR') {
        // In a number field * stays a literal * - valid in a phone number.
        if (textDigitsOnly) textKeyPress('*');
        else { symbolPickerOpen = true; symbolIdx = 0; renderInner(); }
      }
      else if (d.length === 1) textKeyPress(d);
      renderInner();
      return;
    }
    if (btn === 'ARROW_LEFT')  { if (textCursor > 0) { textCursor--; tapKey = 0; textBlinkReset(); renderInner(); } return; }
    if (btn === 'ARROW_RIGHT') { if (textCursor < textBuf.length) { textCursor++; tapKey = 0; textBlinkReset(); renderInner(); } return; }
    if (btn === 'BTN_RIGHT') {
      if (textBuf.length === 0) { textEditCancel(); return; }
      textDelete();
      repeatArm('BTN_RIGHT', REPEAT_DELETE);
      textBlinkReset();
      renderInner();
      return;
    }
    if (btn === 'BTN_OK' || btn === 'BTN_LEFT') {
      // Not enough digits yet - swallowed; the dimmed label says "not ready".
      if (textBuf.length < simCodeMin(textOwner)) return;
      textEditCommit();
      return;
    }
    return;
  }

  // ---- MESSAGES (thread list) ----
  if (state === ST_MESSAGES) {
    const visible = THREAD_ROWS;   // was 6 - the list only draws 5
    if (btn === 'ARROW_UP' || btn === 'ARROW_DOWN') {
      if (threadNumbers.length > 0) {
        threadIdx += (btn === 'ARROW_DOWN') ? 1 : -1;
        if (threadIdx < 0) threadIdx = threadNumbers.length - 1;
        if (threadIdx >= threadNumbers.length) threadIdx = 0;
        if (threadIdx < threadTop) threadTop = threadIdx;
        if (threadIdx >= threadTop + visible) threadTop = threadIdx - visible + 1;
        renderInner();
      }
      return;
    }
    if (btn === 'BTN_OK') {
      if (threadNumbers.length === 0) {
        textEditOpen('To', '', TXT_MSG_NEWNUM, true, false);
      } else {
        chatNumber = threadNumbers[threadIdx];
        state = ST_CHAT;
        chatScrollTop = 9999;     // open at the newest; drawInner clamps
        renderInner();
      }
      return;
    }
    if (btn === 'BTN_LEFT') {
      if (threadNumbers.length === 0) openOptions(OPT_MESSAGES, ['New message']);
      else if (contactExistsForNumber(threadNumbers[threadIdx]))
        openOptions(OPT_MESSAGES, ['New message', 'Call', 'Delete']);
      else
        openOptions(OPT_MESSAGES, ['New message', 'Save as contact', 'Call', 'Delete']);
      return;
    }
    if (btn === 'BTN_RIGHT') { state = ST_MENU; renderInner(); return; }
    return;
  }

  // ---- CHAT (open conversation) ----
  if (state === ST_CHAT) {
    const CHAT_SCROLL_STEP = 2;
    if (btn === 'ARROW_UP') {
      chatScrollTop -= CHAT_SCROLL_STEP;
      if (chatScrollTop < 0) chatScrollTop = 0;
      renderInner(); return;
    }
    if (btn === 'ARROW_DOWN') { chatScrollTop += CHAT_SCROLL_STEP; renderInner(); return; }
    if (btn === 'BTN_OK') {
      pendingMsgNumber = '';     // replying to this thread: use chatNumber
      msgBodyReturn = ST_CHAT;
      textEditOpen('Message', '', TXT_MSG_BODY, false, false);
      return;
    }
    if (btn === 'BTN_LEFT') {
      // The verb this screen exists for first. Resend leads while the thread
      // holds a message that did not go out.
      const items = [];
      if (chatFailedIndex() >= 0) items.push('Resend');
      items.push('New message');
      if (!contactExistsForNumber(chatNumber)) items.push('Save as contact');
      items.push('Call');
      openOptions(OPT_CHAT, items);
      return;
    }
    if (btn === 'BTN_RIGHT') { state = ST_MESSAGES; threadsScan(); renderInner(); return; }
    return;
  }

  // ---- CONTACT DETAIL ----
  if (state === ST_CONTACT_DETAIL) {
    if (btn === 'BTN_CALL' && contacts.length > 0) { contactNumAction(NUMACT_CALL); return; }
    if (btn === 'BTN_LEFT' && contacts.length > 0) {
      const nn = contactNumCount(contactIdx);
      const items = ['Call', 'Write message', 'Edit name', 'Edit number'];
      if (nn < CONTACT_NUMS) items.push('Add number');
      if (nn > 1) items.push('Remove number');
      items.push('Colour');
      items.push('Delete');
      openOptions(OPT_CONTACTS, items);
      return;
    }
    if (btn === 'BTN_RIGHT' || btn === 'BTN_OK') { state = ST_CONTACTS; renderInner(); return; }
    return;
  }

  // ---- CONTACT COLOUR ----
  if (state === ST_CONTACT_COLOUR) {
    if (btn === 'ARROW_UP' || btn === 'ARROW_DOWN') {
      contactColourIdx += (btn === 'ARROW_DOWN') ? 1 : -1;
      if (contactColourIdx < 0) contactColourIdx = CONTACT_COLOUR_COUNT - 1;
      if (contactColourIdx >= CONTACT_COLOUR_COUNT) contactColourIdx = 0;
      renderInner();
      return;
    }
    if (btn === 'BTN_OK' || btn === 'BTN_LEFT') {
      if (contactIdx >= 0 && contactIdx < contacts.length) {
        contacts[contactIdx].colour = contactColourIdx;
        contactsSave();
      }
      state = contactEditReturn;
      renderInner();
      return;
    }
    if (btn === 'BTN_RIGHT') { state = contactEditReturn; renderInner(); return; }
    return;
  }

  // ---- CONTACTS ----
  if (state === ST_CONTACTS) {
    const visible = 8;
    if (btn === 'ARROW_UP' || btn === 'ARROW_DOWN') {
      if (contacts.length > 0) {
        contactIdx += (btn === 'ARROW_DOWN') ? 1 : -1;
        if (contactIdx < 0) contactIdx = contacts.length - 1;
        if (contactIdx >= contacts.length) contactIdx = 0;
        if (contactIdx < contactTop) contactTop = contactIdx;
        if (contactIdx >= contactTop + visible) contactTop = contactIdx - visible + 1;
        renderInner();
      }
      return;
    }
    if (btn === 'BTN_CALL' && contacts.length > 0) { contactNumAction(NUMACT_CALL); return; }
    if (btn === 'BTN_LEFT') {
      if (contacts.length === 0) openOptions(OPT_CONTACTS, ['New contact']);
      else {
        const nn = contactNumCount(contactIdx);
        const items = ['New contact', 'Call', 'Write message', 'Edit name', 'Edit number'];
        if (nn < CONTACT_NUMS) items.push('Add number');
        if (nn > 1) items.push('Remove number');
        items.push('Colour');
        items.push('Delete');
        openOptions(OPT_CONTACTS, items);   // 9 at most - OPT_MAX is 10
      }
      return;
    }
    if (btn === 'BTN_OK') {
      if (contacts.length === 0) { textEditOpen('Name', '', TXT_CONTACT_NAME, false, false); return; }
      state = ST_CONTACT_DETAIL;
      renderInner();
      return;
    }
    if (btn === 'BTN_RIGHT') { state = ST_MENU; renderInner(); return; }
    return;
  }

  // ---- DIALER ----
  if (state === ST_DIALER) {
    if (btn.indexOf('NUM_') === 0) {
      const d = btn.slice(4);
      if (d === 'STAR') {
        // * twice within a second becomes + (international prefix)
        const now = millis();
        if (now - dialerStarTime < 1000 && dialerCursor > 0 && dialerDigits[dialerCursor - 1] === '*') {
          dialerDigits = dialerDigits.slice(0, dialerCursor - 1) + '+' + dialerDigits.slice(dialerCursor);
          resetDialerBlink();
        } else {
          insertDialerDigit('*');
          dialerStarTime = now;
        }
      }
      else if (d === 'HASH') insertDialerDigit('#');
      else if (d.length === 1) insertDialerDigit(d);
      return;
    }
    if (btn === 'ARROW_LEFT')  { moveDialerCursor('LEFT');  return; }
    if (btn === 'ARROW_RIGHT') { moveDialerCursor('RIGHT'); return; }
    if (btn === 'ARROW_UP')    { moveDialerCursor('UP');    return; }
    if (btn === 'ARROW_DOWN')  { moveDialerCursor('DOWN');  return; }
    if (btn === 'BTN_RIGHT') {
      // Empty field: this key is Back, not Clear.
      if (dialerDigits.length === 0) { state = ST_HOME; renderInner(); return; }
      deleteDialerDigit();
      repeatArm('BTN_RIGHT', REPEAT_DELETE);
      return;
    }
    if (btn === 'BTN_LEFT') {
      // "Save number" only when the number is not a contact already - the same
      // rule the message list uses for "Save as contact". No duplicates.
      const items = ['Call'];
      if (!contactExistsForNumber(dialerDigits)) items.push('Save number');
      items.push('Send message', 'Clear all');
      openOptions(OPT_DIALER, items);
      return;
    }
    if (btn === 'BTN_OK' || btn === 'BTN_CALL') {
      if (dialerDigits.length > 0) callDial(dialerDigits);
      return;
    }
    return;
  }

  // From HOME, any number key opens the dialer AND types that digit.
  if (state === ST_HOME && btn.indexOf('NUM_') === 0) {
    enterDialer();
    const d = btn.slice(4);
    if (d === 'STAR')      { insertDialerDigit('*'); dialerStarTime = millis(); }
    else if (d === 'HASH') insertDialerDigit('#');
    else if (d.length === 1) insertDialerDigit(d);
    return;
  }

  // ---- HOME / MENU / COMING SOON ----
  if (btn === 'BTN_OK') {
    if (state === ST_HOME) { pxlog('Menu'); state = ST_MENU; menuIdx = 0; renderInner(); }
    else if (state === ST_MENU) { pxlog(menuNames[menuIdx]); menuOpen(menuIdx); renderInner(); }
  }
  else if (btn === 'BTN_LEFT') {
    if (state === ST_HOME) { pxlog('Menu'); state = ST_MENU; menuIdx = 0; renderInner(); }
    else if (state === ST_MENU) openOptions(OPT_MENU, ['Open', 'Back to home']);
    else if (state === ST_APP)  openOptions(OPT_APP,  ['Close', 'Back to home']);
  }
  else if (btn === 'BTN_RIGHT') {
    if (state === ST_HOME) { pxlog('Contacts'); state = ST_CONTACTS; contactIdx = 0; contactTop = 0; renderInner(); }
    else if (state === ST_APP) {
      // back to wherever it was opened from - Apps and Games are a level down
      pxlog('Back');
      state = comingSoonReturn || ST_MENU;
      renderInner();
    }
    else if (state === ST_MENU) { pxlog('Back to home'); state = ST_HOME; renderInner(); }
  }
  else if (btn === 'ARROW_LEFT') {
    if (state === ST_MENU) { menuIdx = (menuIdx - 1 + menuCount) % menuCount; pxlog(menuNames[menuIdx]); renderInner(); }
  }
  else if (btn === 'ARROW_RIGHT') {
    if (state === ST_MENU) { menuIdx = (menuIdx + 1) % menuCount; pxlog(menuNames[menuIdx]); renderInner(); }
  }
}

// ==================== FLIP ====================
function osFlipChange(open) {
  pxlog(open ? 'Flip open' : 'Flip closed');
  if (open) {
    clearOuterTimer(); clearOuterFade();
    hardwareAPI.setOuterBrightness(0);
    if (state !== ST_OFF) {
      startScreenTimers();
      renderInner(true);     // a full repaint - nothing was drawn while shut
    }
  } else {
    // Closing during an ANSWERED call ends it, like a real flip phone's switch.
    // Closing while still RINGING does not: the outer screen shows the call.
    if (callState === CALL_ACTIVE) callHangup();
    clearScreenTimers();
    hardwareAPI.setInnerBrightness(0);
    if (state !== ST_OFF) {
      renderOuter();
      startFade(0, 100);
      if (callState === CALL_IDLE) startOuterTimer();   // a call keeps it lit
    }
  }
}

// ==================== HARDWARE CALLBACKS (emulator.html calls these) ======
// The emulator only delivers a non-volume key with the flip OPEN, which is the
// firmware's handleButtonMsg() rule.
function onButtonPress(btn) { osButtonPress(btn); }
// Real buttons report release too - that is what stops a hold-repeat.
function onButtonRelease(btn) { if (repeatBtn === btn) { repeatBtn = ''; repeatNext = 0; } }

function onVolumeButton(btn) {
  // During a call these keys ONLY silence the ringer.
  if (callSilenceRing()) return;
  if (state === ST_OFF) return;
  // A press on a DARK screen wakes it and does nothing else.
  if (!flipIsOpen()) {
    if (!fadeActive && hardwareAPI.getOuterBrightness() === 0) { osVolumePress(); return; }
  } else if (screenState === SCREEN_SLEEP) {
    pxlog('Wake from sleep');
    startScreenTimers();
    renderInner();
    return;
  }
  volumeAdjust(btn === 'VOL_UP' ? +1 : -1);
}

function onFlipChange(open) { osFlipChange(open); }

function onPowerOn() {
  powered = true;
  osPowerOn();
  // The phone's 3 s SIM poll lands at a random moment after power-on. One
  // second in, here, so the PIXL OS splash is always seen before a PIN prompt.
  modemNextPoll = millis() + 1000;
}
function onPowerOff() {
  powered = false;
  ringtoneStop();
  callState = CALL_IDLE; callNumber = '';   // the emulator's modem drops the call too
  voicePlaying = false;
  if (voiceRecState === VREC_RECORDING) voiceRecPause();
  osPowerOff();
  stopRepeatNow();
}
function stopRepeatNow() { repeatBtn = ''; repeatNext = 0; }

function onBatteryChange(percent) {
  if (state === ST_OFF) return;
  if (flipIsOpen()) { if (screenState !== SCREEN_SLEEP) renderInner(); }
  else renderOuter();
}

// RING + CLIP arrive together here.
function onIncomingCall(number) {
  // A powered-off phone must not ring - the modem stays on and still sees RING.
  if (callState !== CALL_IDLE || !powered || state === ST_OFF) return;
  preCallState = state;
  callState = CALL_RINGING;
  state = ST_INCOMING_CALL;
  callNumber = String(number || '').slice(0, CALLLOG_NUMBER_LEN - 1);
  optOpen = false;              // a popup would hide the call and eat Answer
  ringtoneStart();
  pxlog('[Call] Incoming');
  if (flipIsOpen()) {
    startScreenTimers();        // the panel may be asleep - never answer into black
    renderInner();
  } else {
    clearOuterTimer(); clearOuterFade();
    hardwareAPI.setOuterBrightness(100);
    renderOuter();
  }
}
function onCallConnected() { callConnected(); }
// +CEND / NO CARRIER
function onCallEnded(reason) {
  if (callState === CALL_DIALING) {
    callFinalize(CALL_OUT, 0);
    pxlog('[Call] Not answered');
  } else if (callState === CALL_RINGING) {
    missedCallCount++;
    callFinalize(CALL_MISSED, 0);
    pxlog('[Call] Missed');
  } else if (callState === CALL_ACTIVE) {
    const dur = callStartMs ? Math.trunc((millis() - callStartMs) / 1000) : 0;
    callFinalize(callOutgoing ? CALL_OUT : CALL_IN, dur);
    audioBlip();
    pxlog('[Call] Ended');
  }
}
// +CMT
function onSMSReceived(number, text) {
  messagesAdd(number, text, MSG_DIR_IN, MSG_ST_SENT);
  pxlog('[SMS] From ' + number + ': ' + text);
  // Only texts not already in view count as unread.
  if (state !== ST_MESSAGES) unreadTextCount++;
  if (powered) {
    if (state === ST_MESSAGES) { threadsScan(); renderInner(); }
    else if (state === ST_CHAT && chatNumber === number) { chatScrollTop = 9999; renderInner(); }
  }
}
// Not a phone event: the emulator's hardware panel changed the SIM. The phone
// would notice on its next 3 s poll; ask on the next loop pass instead.
function onSimChange(present) { modemNextPoll = 0; }

// ==================== THE LOOP ====================
// The firmware's loop(), minus the radio and the stream: every deadline the
// phone checks, checked here every 10 ms.
function osLoop() {
  const now = millis();

  if (bootDeadline && now >= bootDeadline) {
    bootDeadline = 0;
    // Do not slam the home screen over a SIM code field the poll already opened.
    if (state !== ST_TEXTEDIT) { state = ST_HOME; renderInner(); }
    startScreenTimers();
  }
  if (dimDeadline && now >= dimDeadline) {
    dimDeadline = 0;
    pxlog('Dim');
    screenState = SCREEN_DIMMED;
    // Half of what the user chose, not a flat 50.
    hardwareAPI.setInnerBrightness(Math.trunc(settings.brightness / 2));
  }
  if (sleepDeadline && now >= sleepDeadline) {
    sleepDeadline = 0;
    pxlog('Sleep');
    screenState = SCREEN_SLEEP;
    hardwareAPI.setInnerBrightness(0);
  }
  if (outerDeadline && now >= outerDeadline) {
    outerDeadline = 0;
    pxlog('Outer timeout');
    startFade(100, 0);
  }
  if (resetDoneAt && now >= resetDoneAt) {
    resetDoneAt = 0;
    factoryResetApply();
  }

  modemPoll(now);

  // ---- hold-to-repeat ----
  if (repeatBtn && now >= repeatNext) {
    // Deletes stay EXPLICIT: re-delivering a held delete would empty the field
    // and then walk straight out of the screen.
    if (state === ST_DIALER && repeatBtn === 'BTN_RIGHT' && dialerDigits.length > 0) {
      deleteDialerDigit();
      repeatNext = now + repeatEvery;
    } else if (state === ST_TEXTEDIT && repeatBtn === 'BTN_RIGHT' && textBuf.length > 0 && !symbolPickerOpen) {
      textDelete();
      textBlinkReset();
      renderInner();
      repeatNext = now + repeatEvery;
    } else if ((repeatBtn === 'ARROW_LEFT' || repeatBtn === 'ARROW_RIGHT')
               && (state === ST_THEME_RGB || setRowRepeats())) {
      osButtonPress(repeatBtn);
      repeatNext = now + repeatEvery;
    } else if ((repeatBtn === 'ARROW_UP' || repeatBtn === 'ARROW_DOWN') && stateScrollsWithArrows(state)) {
      // Scrolling IS re-delivered: each screen's own handler moves and clamps.
      osButtonPress(repeatBtn);
      repeatNext = now + repeatEvery;
    } else {
      repeatBtn = '';
    }
  }

  // ---- camera preview: one frame every 300 ms, and no dimming meanwhile ----
  if (state === ST_CAMERA && now >= camNextFrame) {
    camNextFrame = now + 300;
    if (flipIsOpen() && screenState !== SCREEN_SLEEP) renderInner();
    dimDeadline   = now + settings.dimAfterS * 1000;      // no dimming while framing a shot
    sleepDeadline = now + settings.sleepAfterS * 1000;
  }
  // ---- voice memos ----
  if (state === ST_VOICE_REC && voiceRecState === VREC_RECORDING) {
    dimDeadline   = now + settings.dimAfterS * 1000;
    sleepDeadline = now + settings.sleepAfterS * 1000;
    if (now >= voiceRecBlinkNext) { voiceRecBlinkNext = now + 250; renderInner(); }
  }
  if (state === ST_VOICE_PLAY && voicePlaying) {
    dimDeadline   = now + settings.dimAfterS * 1000;
    sleepDeadline = now + settings.sleepAfterS * 1000;
    voicePlayPosMs = voicePlayStartPos + (now - voicePlayStartMs);
    if (voicePlayPosMs >= voicePlayTotalMs) {
      voicePlayPosMs = voicePlayTotalMs;
      voicePlaying = false;
      renderInner();
    }
  }
  // ---- calls hold the screen awake - but only with the lid open ----
  if (flipIsOpen() && (state === ST_INCOMING_CALL || state === ST_INCALL)) {
    dimDeadline   = now + settings.dimAfterS * 1000;
    sleepDeadline = now + settings.sleepAfterS * 1000;
  }
  // ---- a preview plays once; mark it over when the tune has run out ----
  if (ringtonePlaying && previewRingtoneIx >= 0 && now >= previewEndsAt) {
    ringtonePlaying = false;
    previewRingtoneIx = -1;
  }

  // ---- text editor: tap window, PIN reveal, cursor blink ----
  if (state === ST_TEXTEDIT) {
    if (tapKey && now >= tapExpire) { tapKey = 0; tapIndex = 0; }
    if (textMask && textMaskPos >= 0 && now >= textMaskAt) { textMaskPos = -1; renderInner(); }
    if (now >= textBlinkNext) {
      textBlinkNext = now + 600;
      textCursorVisible = !textCursorVisible;
      renderInner();
    }
  }
  // ---- dialer: cursor blink and auto-exit ----
  if (state === ST_DIALER) {
    if (dialerUnhideAt && now >= dialerUnhideAt) { dialerUnhideAt = 0; startDialerBlink(); }
    if (dialerBlinkNext && now >= dialerBlinkNext) {
      dialerBlinkNext = now + 1000;
      dialerCursorVisible = !dialerCursorVisible;
      renderInner();
    }
    if (dialerExitAt && now >= dialerExitAt) { dialerExitAt = 0; exitDialer(); }
  }
  // ---- outer screen fade ----
  if (fadeActive && now >= fadeNextMs) {
    fadeNextMs = now + 30;
    const elapsed = now - fadeStartMs;
    if (elapsed >= FADE_DUR) {
      hardwareAPI.setOuterBrightness(fadeTo);
      fadeActive = false;
    } else {
      hardwareAPI.setOuterBrightness(fadeFrom + Math.trunc((fadeTo - fadeFrom) * elapsed / FADE_DUR));
    }
  }
  // ---- a scrolling line needs frequent redraws - only shut, in a call ----
  if (marqueeShown && !flipIsOpen() && callState !== CALL_IDLE && state !== ST_OFF && now >= marqueeNext) {
    marqueeNext = now + 100;
    renderOuter();
  }
  // ---- the volume meter is on a timer: redraw once it expires ----
  const volShown = now < volOverlayUntil;
  if (volWasShown && !volShown && state !== ST_OFF) {
    if (flipIsOpen()) renderInner(); else renderOuter();
  }
  volWasShown = volShown;
  // ---- once a second: the clock, the call timer, the flash notices ----
  if (now >= tickDeadline) {
    tickDeadline = now + 1000;
    if (flipIsOpen() && state !== ST_OFF && screenState !== SCREEN_SLEEP) renderInner();
    if (!flipIsOpen() && state !== ST_OFF) renderOuter();
  }
}
let marqueeNext = 0, volWasShown = false;

// ==================== INIT (the chip booting) ====================
// emulator.html calls this after loading the file: Restart is the phone's
// reset button. The red key, held, is power.
function osInit() {
  chipBootMs = Date.now();
  state = ST_OFF; powered = false;
  menuIdx = 0; appsIdx = 0; appsTop = 0; gamesIdx = 0; gamesTop = 0;
  contactIdx = 0; contactTop = 0; callLogIdx = 0; callLogTop = 0;
  threadIdx = 0; threadTop = 0; galleryIdx = 0; galleryTop = 0; voiceIdx = 0; voiceTop = 0;
  setPage = PG_ROOT; setRow = 0; setDepth = 0;
  screenState = SCREEN_NORMAL;
  optOpen = false; optOwner = OPT_NONE;
  callState = CALL_IDLE; callNumber = '';
  missedCallCount = 0; unreadTextCount = 0;
  simState = SIM_UNKNOWN; simReady = false; modemRegState = -1; modemSignalCSQ = 99;
  modemNextPoll = 0;
  bootDeadline = 0; tickDeadline = 0; resetDoneAt = 0;
  clearScreenTimers(); clearOuterTimer(); clearOuterFade();
  stopRepeatNow();

  // storageBegin(): settings first, so the theme is right before the first pixel
  settingsLoad();
  settings.bootCount++;
  // Debug boxes always start OFF - the screen and Settings > About agree.
  settings.debugMode = 0;
  settingsSave();
  debugMode = false;
  themeApply(settings.themeIx);
  contactsLoad();
  messagesLoad();
  callLogLoad();
  seedSampleData();
  threadsScan();
  voiceStoreLoad();
  pxlog('Boot #' + settings.bootCount + ', ' + contacts.length + ' contacts, '
        + messages.length + ' messages, ' + callLog.length + ' calls');

  // One loop, like the chip. A Restart re-loads this file, so the previous
  // file's loop has to be stopped first or there would be two.
  if (window.__pxpLoop) clearInterval(window.__pxpLoop);
  window.__pxpLoop = setInterval(osLoop, 10);
  pxlog('OS Ready - hold the red key 3s to power on');
}

// ============================================================================
// PxP Flip OS - browser build
// ============================================================================
// A PORT of the firmware in pxp_stage1_esp32.ino, not a separate design.
// Screen layouts, fonts, button dispatch and state machine are lifted from the
// .ino so what you see here is what the panel draws.
//
// The split is the same as on the real device:
//   emulator.html = HARDWARE. Screens, buttons, modem, audio, storage, camera.
//   this file     = THE OS. Decides what to do with that hardware.
//
// Anything the browser cannot really do is faked on the EMULATOR side, never
// here, so this file stays a straight port.
// ============================================================================

// ==================== FONTS (ported byte for byte from the firmware) =======
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
const COL_BLACK = '#000000', COL_GREEN = '#00ff00', COL_WHITE = '#ffffff';
const COL_GRAY6 = '#666666', COL_GRAY8 = '#888888';
const COL_BAR   = '#111111', COL_BAR2  = '#0a0a0a';
const COL_RED   = '#ff0000', COL_YEL   = '#ffff00';

// ==================== STATES ====================
const ST_OFF=0, ST_BOOT=1, ST_HOME=2, ST_MENU=3, ST_APP=4, ST_DIALER=5,
      ST_CONTACTS=6, ST_SETTINGS=7, ST_STORAGE=8, ST_ABOUT=9, ST_TEXTEDIT=10,
      ST_GALLERY=11, ST_PHOTO=12, ST_CAMERA=13, ST_MESSAGES=14, ST_CHAT=15,
      ST_VOICE=16, ST_VOICE_REC=17, ST_VOICE_PLAY=18, ST_INCOMING_CALL=19,
      ST_INCALL=20, ST_CALLLOG=21, ST_RINGTONES=22, ST_APPS=23, ST_GAMES=24;

const SCREEN_NORMAL=0, SCREEN_DIMMED=1, SCREEN_SLEEP=2;

const CALL_IDLE=0, CALL_RINGING=1, CALL_DIALING=2, CALL_ACTIVE=3;
const CALL_IN=0, CALL_OUT=1, CALL_MISSED=2, CALL_REJECTED=3;
const MSG_DIR_IN=0, MSG_DIR_OUT=1;

let state = ST_OFF;
let screenState = SCREEN_NORMAL;
let menuIdx = 0;
let debugMode = false;

// ==================== DRAWING PRIMITIVES ====================
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
function fbCircle(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}
function centerX(screenW, elemW) { return Math.floor((screenW - elemW) / 2); }
function alignRight(screenW, elemW, margin) { return screenW - elemW - margin; }

// ==================== UTF-8 -> ASCII FOLDING ====================
// The firmware strips accents: a 5x7 cell has no room for marks that stay
// legible at 0.152 mm per pixel. Same rule here, so the browser shows exactly
// what the phone shows rather than something prettier.
const FOLD_MAP = {
  'a':'a','á':'a','à':'a','â':'a','ä':'a','ã':'a','å':'a',
  'Á':'A','À':'A','Â':'A','Ä':'A','Ã':'A','Å':'A',
  'é':'e','è':'e','ê':'e','ë':'e',
  'É':'E','È':'E','Ê':'E','Ë':'E',
  'í':'i','ì':'i','î':'i','ï':'i',
  'Í':'I','Ì':'I','Î':'I','Ï':'I',
  'ó':'o','ò':'o','ô':'o','ö':'o','õ':'o','ő':'o','ø':'o',
  'Ó':'O','Ò':'O','Ô':'O','Ö':'O','Õ':'O','Ő':'O','Ø':'O',
  'ú':'u','ù':'u','û':'u','ü':'u','ű':'u',
  'Ú':'U','Ù':'U','Û':'U','Ü':'U','Ű':'U',
  'ñ':'n','Ñ':'N','ç':'c','Ç':'C','ß':'s',
  'ý':'y','ÿ':'y','Ý':'Y'
};
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
// The firmware quantises size: scale = (sizePx + 4) / 8, so 4-11 gives scale 1
// (6px per character) and 12-19 gives scale 2 (12px). Nothing in between, which
// is exactly why text overruns the 128px outer screen so easily. Reproduced
// faithfully rather than "fixed".
function textScale(sizePx) {
  const s = Math.floor((sizePx + 4) / 8);
  return s < 1 ? 1 : s;
}
function measureTextStrW(text, sizePx) {
  const scale = textScale(sizePx);
  const n = fold(text).length;
  if (n === 0) return 0;
  return n * 6 * scale - scale;
}
function drawTextStr(ctx, x, y, text, sizePx, color) {
  const scale = textScale(sizePx);
  const top = y - 7 * scale;
  let cx = x;
  ctx.fillStyle = color;
  for (const raw of fold(text)) {
    let c = raw.charCodeAt(0);
    if (c < 32 || c > 126) c = 63;
    const glyph = FONT5x7[c - 32];
    for (let col = 0; col < 5; col++) {
      const bits = glyph[col];
      for (let row = 0; row < 7; row++) {
        if (bits & (1 << row)) ctx.fillRect(cx + col * scale, top + row * scale, scale, scale);
      }
    }
    cx += 6 * scale;
  }
}
function drawTextWrapped(ctx, x, y, maxW, text, sizePx, color, lineH) {
  const words = fold(text).split(' ');
  let line = '', cy = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (measureTextStrW(test, sizePx) > maxW && line) {
      drawTextStr(ctx, x, cy, line, sizePx, color);
      cy += lineH; line = w;
    } else line = test;
  }
  if (line) drawTextStr(ctx, x, cy, line, sizePx, color);
  return cy + lineH;
}

// Shrink to fit, then scroll. marqueeShown tells the render loop to redraw
// fast enough that the scroll actually looks like motion.
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
  const span = w + Math.floor(maxW / 2);
  const off = Math.floor(Date.now() / 30) % span;
  const x0 = Math.floor((fbW - maxW) / 2) - off;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y - 7 * textScale(px) - 2, fbW, 7 * textScale(px) + 6);
  ctx.clip();
  drawTextStr(ctx, x0, y, text, px, color);
  drawTextStr(ctx, x0 + span, y, text, px, color);
  ctx.restore();
}

// ==================== PIXEL DIGITS + 3x5 LETTERS ====================
const DIGIT_LARGE = 8, DIGIT_MEDIUM = 4, DIGIT_SMALL = 2;
const DATE_UNIT_OUT = 2, MONTH_UNIT_OUT = 2, MONTH_UNIT_IN = 2, DAYNAME_UNIT_IN = 2;
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
  if (!g) return { x, y, width: 0, height: 0 };
  ctx.fillStyle = color;
  for (let row = 0; row < 5; row++) {
    const bits = g.rows[row];
    for (let col = 0; col < g.w; col++) {
      if (bits & (1 << col)) ctx.fillRect(x + col * ps, y + row * ps, ps, ps);
    }
  }
  return { x, y, width: g.w * ps, height: 5 * ps };
}
function drawDigitString(ctx, x, y, str, ps, color) {
  let cx = x;
  for (let i = 0; i < str.length; i++) {
    const b = drawPixelDigit(ctx, cx, y, str[i], ps, color);
    cx += b.width + ps;
  }
  return { x, y, width: cx - x - ps, height: 5 * ps };
}
function measureLetterStringW(str, ps) {
  let w = 0;
  for (let i = 0; i < str.length; i++) {
    if (!LETTERS3x5[str[i]]) continue;
    w += 3 * ps;
    if (i < str.length - 1) w += ps;
  }
  return w;
}
function drawLetterString(ctx, x, y, str, ps, color) {
  let cx = x;
  ctx.fillStyle = color;
  for (const ch of str) {
    const g = LETTERS3x5[ch];
    if (!g) continue;
    for (let row = 0; row < 5; row++)
      for (let col = 0; col < 3; col++)
        if (g[row] & (1 << col)) ctx.fillRect(cx + col * ps, y + row * ps, ps, ps);
    cx += 4 * ps;
  }
  return { x, y, width: cx - x - ps, height: 5 * ps };
}

// ==================== STATUS BAR ====================
function csqToBars(csq) {
  if (csq <= 0 || csq >= 99) return 0;
  if (csq < 10) return 1;
  if (csq < 15) return 2;
  if (csq < 20) return 3;
  return 4;
}
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
}
function simReady()  { return hardwareAPI.modem.getSimState() === 'ready'; }
function networkRegistered() { return hardwareAPI.modem.isRegistered(); }

function drawStatus(ctx, screenW) {
  fbRect(ctx, 0, 0, screenW, 36, COL_BAR);
  const ok = simReady() && networkRegistered();
  const bars = ok ? csqToBars(hardwareAPI.modem.getSignal()) : 0;
  drawSignalBars(ctx, 10, 8, 4, COL_GREEN, bars, !simReady());
  const bstr = hardwareAPI.getBatteryPercent() + '%';
  const bw = measureDigitStringW(bstr, 4);
  drawDigitString(ctx, alignRight(screenW, bw, 10), 8, bstr, 4, COL_GREEN);
}

// ==================== SMALL HELPERS ====================
function formatMMSS(totalSec) {
  const m = Math.floor(totalSec / 60), s = Math.floor(totalSec % 60);
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}
function nowEpoch() { return Math.floor(Date.now() / 1000); }
function hhmm(epoch) {
  const d = new Date(epoch * 1000);
  return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
}

// ==================== STORAGE LAYER ====================
// On the phone these are fixed-size structs on LittleFS. Here they are JSON in
// the emulator's storage shim, which is localStorage. Same shape, same rules:
// text lives in internal storage and survives the card being pulled out.
const SETTINGS_VERSION = 2;
let settings = {
  version: SETTINGS_VERSION,
  bootCount: 0,
  debugMode: 0,
  activeRingtoneIx: 0,
  ringVolume: 6        // -1 silent, 0 vibrate, 1..9
};
const VOL_MIN = -1, VOL_MAX = 9;

function settingsSave() { hardwareAPI.storage.write('settings', settings); }
function settingsLoad() {
  const s = hardwareAPI.storage.read('settings');
  if (s && s.version === SETTINGS_VERSION) settings = Object.assign(settings, s);
  else settingsSave();
  if (settings.ringVolume < VOL_MIN) settings.ringVolume = VOL_MIN;
  if (settings.ringVolume > VOL_MAX) settings.ringVolume = VOL_MAX;
}

// ---- contacts ----
let contacts = [];                      // { name, number }
let contactIdx = 0, contactTop = 0;
function contactsSave() { hardwareAPI.storage.write('contacts', contacts); }
function contactsLoad() { contacts = hardwareAPI.storage.read('contacts') || []; }
function contactsAdd(name, number) {
  if (contacts.length >= 100) return false;
  contacts.push({ name: name, number: number });
  contactsSave();
  return true;
}
function contactsDelete(i) {
  if (i < 0 || i >= contacts.length) return false;
  contacts.splice(i, 1);
  contactsSave();
  return true;
}
function contactNameForNumber(number) {
  for (const c of contacts) if (c.number === number) return c.name;
  return number;
}
function contactExistsForNumber(number) {
  for (const c of contacts) if (c.number === number) return true;
  return false;
}

// ---- messages ----
let messages = [];                      // { number, body, direction, epoch }
function messagesSave() { hardwareAPI.storage.write('messages', messages); }
function messagesLoad() { messages = hardwareAPI.storage.read('messages') || []; }
function messagesAdd(number, body, direction) {
  messages.push({ number: number, body: body, direction: direction, epoch: nowEpoch() });
  if (messages.length > 200) messages.shift();
  messagesSave();
  return true;
}
function messagesDeleteThread(number) {
  const before = messages.length;
  messages = messages.filter(m => m.number !== number);
  messagesSave();
  return before - messages.length;
}

// ---- threads (a view over messages, rebuilt on entry) ----
let threadNumbers = [], threadLastMsg = [];
let threadIdx = 0, threadTop = 0;
let chatNumber = '';
function threadsScan() {
  threadNumbers = []; threadLastMsg = [];
  threadIdx = 0; threadTop = 0;
  for (let i = 0; i < messages.length; i++) {
    const num = messages[i].number;
    const t = threadNumbers.indexOf(num);
    if (t >= 0) threadLastMsg[t] = i;
    else { threadNumbers.push(num); threadLastMsg.push(i); }
  }
  // newest thread first
  const order = threadNumbers.map((n, i) => i).sort((a, b) => threadLastMsg[b] - threadLastMsg[a]);
  threadNumbers = order.map(i => threadNumbers[i]);
  threadLastMsg = order.map(i => threadLastMsg[i]);
}

// ---- call log ----
let callLog = [];                       // { number, type, durationSec, epoch }
let callLogIdx = 0, callLogTop = 0;
function callLogSave() { hardwareAPI.storage.write('calllog', callLog); }
function callLogLoad() { callLog = hardwareAPI.storage.read('calllog') || []; }
function callLogAdd(number, type, durationSec) {
  callLog.push({ number: number, type: type, durationSec: durationSec, epoch: nowEpoch() });
  if (callLog.length > 100) callLog.shift();
  callLogSave();
}
function callLogDelete(i) {
  if (i < 0 || i >= callLog.length) return;
  callLog.splice(i, 1);
  callLogSave();
}

// ==================== NOTIFICATION BADGE ====================
let missedCallCount = 0;
let unreadTextCount = 0;
function notifBadgeText() {
  if (missedCallCount <= 0 && unreadTextCount <= 0) return null;
  if (missedCallCount > 0 && unreadTextCount > 0)
    return missedCallCount + ' missed, ' + unreadTextCount + ' unread';
  if (missedCallCount > 0)
    return missedCallCount + ' missed call' + (missedCallCount === 1 ? '' : 's');
  return unreadTextCount + ' unread text' + (unreadTextCount === 1 ? '' : 's');
}

// ==================== RINGTONES ====================
// Note tables copied straight out of the firmware. hz 0 is a rest, not a tone.
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
];
const RINGTONE_COUNT = RINGTONES.length;
let ringtonePickerIdx = 0, ringtonePickerTop = 0;
let ringtonePlaying = false;
let previewTimer = null;

// RING_AMPLITUDE from the firmware, scaled into the browser's 0..1 gain.
const RING_AMPLITUDE = [0, 260, 480, 850, 1400, 2200, 3300, 4700, 6300, 8000];
function ringGain() {
  const v = settings.ringVolume;
  if (v <= 0) return 0;
  return RING_AMPLITUDE[v] / 8000 * 0.7;
}
function notesFor(ix) {
  return RINGTONES[ix].notes.map(n => ({ hz: n[0], ms: n[1] }));
}

function ringtoneStart() {
  ringtoneClearPreview();
  ringtonePlaying = false;
  // Silent and vibrate never touch the speaker. The call screen appears as
  // normal, there is simply no sound.
  if (settings.ringVolume <= 0) {
    printf(settings.ringVolume === 0 ? '[Call] Vibrate (no motor wired yet)' : '[Call] Silent');
    return;
  }
  hardwareAPI.audio.setVolume(ringGain());
  hardwareAPI.audio.playMelody(notesFor(settings.activeRingtoneIx), true);
  ringtonePlaying = true;
}
function ringtoneStop() {
  ringtoneClearPreview();
  if (!ringtonePlaying) return;
  ringtonePlaying = false;
  hardwareAPI.audio.stop();
}
function ringtoneClearPreview() {
  if (previewTimer) { clearTimeout(previewTimer); previewTimer = null; }
}
function ringtonePreview(ix) {
  if (ix < 0 || ix >= RINGTONE_COUNT) return;
  ringtoneStop();
  if (settings.ringVolume <= 0) {
    printf(settings.ringVolume === 0 ? 'Vibrate - no preview' : 'Silent - no preview');
    return;
  }
  hardwareAPI.audio.setVolume(ringGain());
  hardwareAPI.audio.playMelody(notesFor(ix), false);
  ringtonePlaying = true;
  previewTimer = setTimeout(function () {
    previewTimer = null;
    if (callState === CALL_IDLE) { ringtonePlaying = false; hardwareAPI.audio.stop(); }
  }, 4000);
}
// B6. Fires when you answer, and when a CONNECTED call ends. Nothing else.
const BLIP_HZ = 1976, BLIP_MS = 70;
function audioBlip() { hardwareAPI.audio.tone(BLIP_HZ, BLIP_MS); }

// ==================== VOLUME ====================
let volOverlayUntil = 0;
function drawVolumeOverlay(ctx, fbW, fbH) {
  if (Date.now() >= volOverlayUntil) return;
  const big = fbW >= 200;
  const barW = big ? 8 : 4, barH = big ? 16 : 8, gap = big ? 4 : 2;
  const x = big ? 3 : 0, yBot = big ? 250 : 114;
  const lvl = settings.ringVolume;
  for (let i = 0; i < 9; i++) {
    const by = yBot - barH - i * (barH + gap);
    if (i < lvl) fbRect(ctx, x, by, barW, barH, COL_GREEN);
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
// Refuses to run during ANY call state: while a call is up the volume keys mean
// "shut the ringer up" and nothing else, so the level you set is the level you
// get on the next call.
function volumeAdjust(delta) {
  if (callState !== CALL_IDLE) return;
  let v = settings.ringVolume + delta;
  if (v < VOL_MIN) v = VOL_MIN;
  if (v > VOL_MAX) v = VOL_MAX;
  const changed = (v !== settings.ringVolume);
  settings.ringVolume = v;
  if (changed) settingsSave();
  volOverlayUntil = Date.now() + 2000;
  printf(v < 0 ? 'Volume silent' : v === 0 ? 'Volume vibrate' : 'Volume ' + v + '/9');
  if (!hardwareAPI.isFlipOpen()) {
    clearOuterFade(); hardwareAPI.setOuterBrightness(100); renderOuter(); startOuterTimer();
  } else {
    startScreenTimers(); renderInner();
  }
}
// Either volume button silences a ringing call. It only kills the SOUND: the
// call keeps ringing at the network level and Answer/Decline still work.
function callSilenceRing() {
  if (callState === CALL_IDLE) return false;
  if (ringtonePlaying) { ringtoneStop(); printf('[Call] Ringer silenced'); }
  return true;
}

// ==================== CALLS ====================
let callState = CALL_IDLE;
let preCallState = ST_HOME;
let callNumber = '';
let callStartMs = 0;
let callMuted = false, callSpeaker = false, callOutgoing = false;
let callFlash = '', callFlashUntil = 0;

function callFinalize(loggedType, durationSec) {
  callLogAdd(callNumber, loggedType, durationSec);
  ringtoneStop();
  callState = CALL_IDLE;
  state = preCallState;
  callNumber = '';
  callMuted = false; callSpeaker = false; callOutgoing = false;
  if (state === ST_OFF) return;
  if (hardwareAPI.isFlipOpen()) {
    // startScreenTimers() refuses to arm dim/sleep while a call is up, so they
    // have to be re-armed here. Without this the panel stayed lit forever after
    // the first call of the session.
    startScreenTimers();
    renderInner();
  } else {
    renderOuter();
    startOuterTimer();
  }
}

// Every path that ends a call locally goes through here, so the log always gets
// a correctly-typed entry and the modem is only told once.
function callHangup() {
  if (callState === CALL_IDLE) return;
  hardwareAPI.modem.hangup();
  if (callState === CALL_RINGING) {
    // Declined on purpose. NOT a missed call - missedCallCount is for calls the
    // person never got a chance to act on.
    callFinalize(CALL_REJECTED, 0);
    printf('[Call] Declined');
  } else if (callState === CALL_DIALING) {
    callFinalize(CALL_OUT, 0);
    printf('[Call] Cancelled');
  } else if (callState === CALL_ACTIVE) {
    const dur = callStartMs ? Math.floor((Date.now() - callStartMs) / 1000) : 0;
    callFinalize(callOutgoing ? CALL_OUT : CALL_IN, dur);
    audioBlip();   // a CONNECTED call ended - declines and cancels get nothing
    printf('[Call] Ended (hung up)');
  }
}

function callAnswer() {
  if (callState !== CALL_RINGING) return;
  hardwareAPI.modem.answer();
  ringtoneStop();
  callState = CALL_ACTIVE;
  state = ST_INCALL;
  callStartMs = Date.now();
  audioBlip();
  printf('[Call] Answered');
  renderInner();
}

// The trailing ';' on ATD is what makes it a VOICE call. That lives on the
// emulator's modem.dial(), same as the firmware sends it.
function callDial(number) {
  if (callState !== CALL_IDLE) return false;
  if (!number) return false;
  if (!simReady() || !networkRegistered()) {
    callFlash = 'No network';
    callFlashUntil = Date.now() + 2500;
    printf('[Call] Cannot dial - not registered');
    renderInner();
    return false;
  }
  preCallState = (state === ST_INCALL || state === ST_INCOMING_CALL) ? ST_HOME : state;
  callOutgoing = true; callMuted = false; callSpeaker = false;
  callStartMs = 0;                 // stays 0 until the far end actually answers
  callNumber = number;
  callState = CALL_DIALING;
  state = ST_INCALL;
  optOpen = false;
  startScreenTimers();
  renderInner();
  if (!hardwareAPI.modem.dial(number)) {
    printf('[Call] Dial rejected by modem');
    callFinalize(CALL_OUT, 0);
    callFlash = 'Call failed'; callFlashUntil = Date.now() + 2500;
    renderInner();
    return false;
  }
  printf('[Call] Dialing ' + number);
  return true;
}

// The far end picked up.
function callConnected() {
  if (callState !== CALL_DIALING) return;
  callState = CALL_ACTIVE;
  callStartMs = Date.now();
  printf('[Call] Answered by them');
  renderInner();
}
function callToggleMute() {
  if (callState !== CALL_ACTIVE) return;
  callMuted = !callMuted;
  printf(callMuted ? '[Call] Muted' : '[Call] Unmuted');
  renderInner();
}
function callToggleSpeaker() {
  if (callState !== CALL_ACTIVE) return;
  callSpeaker = !callSpeaker;
  printf(callSpeaker ? '[Call] Speaker on' : '[Call] Earpiece');
  renderInner();
}

// ==================== TEXT EDITOR (multi-tap) ====================
const TEXT_MAX = 160;
const TXT_NONE=0, TXT_CONTACT_NAME=1, TXT_CONTACT_NUM=2, TXT_MSG_NEWNUM=3,
      TXT_MSG_BODY=4, TXT_SIM_PIN=5, TXT_SIM_PUK=6, TXT_SIM_NEWPIN=7;
const KEYMAP = [
  ' 0', " .,?!'\"1-()", 'abc2', 'def3', 'ghi4',
  'jkl5', 'mno6', 'pqrs7', 'tuv8', 'wxyz9', '+/=<>[]{}*'
];
const TAP_WINDOW = 900;

let textBuf = '', textCursor = 0, textTitle = '';
let textCaseMode = 0, textDigitsOnly = false, textOwner = TXT_NONE;
let textMask = false, textMaskPos = -1, textMaskAt = 0;
let tapKey = 0, tapIndex = 0, tapExpire = 0;
let textCursorVisible = true, textBlinkTimer = null, textMaskTimer = null;
let pendingName = '', pendingMsgNumber = '';
let savingContactFromMessage = false, savingContactReturn = 0;

// Show the character just typed in the clear, then turn it into a '*' a second
// later. The firmware does the clearing in loop():
//   if (textMask && textMaskPos >= 0 && now >= textMaskAt) { textMaskPos = -1; ... }
// There is no loop() here, so it needs its own one-shot. Without it the last
// digit you typed never becomes a star, which is what made the PIN field look
// like it was not masking at all.
function textRevealChar(pos) {
  textMaskPos = pos;
  textMaskClearTimer();
  textMaskTimer = setTimeout(function () {
    textMaskTimer = null;
    textMaskPos = -1;
    if (state === ST_TEXTEDIT) renderInner();
  }, 1000);
}
function textMaskClearTimer() {
  if (textMaskTimer) { clearTimeout(textMaskTimer); textMaskTimer = null; }
}

function textBlinkReset() {
  textCursorVisible = true;
  if (textBlinkTimer) clearInterval(textBlinkTimer);
  textBlinkTimer = setInterval(function () {
    if (state !== ST_TEXTEDIT) { clearInterval(textBlinkTimer); textBlinkTimer = null; return; }
    textCursorVisible = !textCursorVisible;
    renderInner();
  }, 600);
}
function textEditOpen(title, initial, owner, digitsOnly, mask) {
  textTitle = title; textOwner = owner;
  textDigitsOnly = !!digitsOnly; textMask = !!mask;
  textMaskClearTimer(); textMaskPos = -1; textMaskAt = 0; textCaseMode = 0;
  textBuf = initial || '';
  textCursor = textBuf.length;
  tapKey = 0; tapIndex = 0; tapExpire = 0;
  state = ST_TEXTEDIT;
  textBlinkReset();
  renderInner();
}
function textInsert(c) {
  if (textBuf.length >= TEXT_MAX) return;
  textBuf = textBuf.slice(0, textCursor) + c + textBuf.slice(textCursor);
  textCursor++;
}
function textDelete() {
  if (textCursor <= 0) return;
  textMaskClearTimer(); textMaskPos = -1;   // nothing stays revealed across a delete
  textBuf = textBuf.slice(0, textCursor - 1) + textBuf.slice(textCursor);
  textCursor--;
  tapKey = 0;
}
// Abc mode: capital at the very start, or straight after a space. That rule is
// what makes names come out right without touching the case key.
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

  if (textDigitsOnly || textCaseMode === 3) {
    const now = Date.now();
    if (k === '*') {
      // same trick as the dialer: * twice within a second becomes +
      if (tapKey === '*' && now < tapExpire && textCursor > 0 && textBuf[textCursor - 1] === '*') {
        textBuf = textBuf.slice(0, textCursor - 1) + '+' + textBuf.slice(textCursor);
      } else textInsert('*');
      tapKey = '*'; tapExpire = now + 1000;
      if (textMask) { textMaskClearTimer(); textMaskPos = -1; }   // '*' is never worth revealing
    } else {
      textInsert(k);
      tapKey = 0;
      if (textMask) textRevealChar(textCursor - 1);
    }
    textBlinkReset();
    return;
  }
  const map = KEYMAP[idx];
  const n = map.length;
  const now = Date.now();
  if (tapKey === k && now < tapExpire && textCursor > 0) {
    tapIndex = (tapIndex + 1) % n;
    const ch = textApplyCase(map[tapIndex], textCursor - 1);
    textBuf = textBuf.slice(0, textCursor - 1) + ch + textBuf.slice(textCursor);
  } else {
    tapIndex = 0;
    textInsert(textApplyCase(map[0], textCursor));
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
  const owner = textOwner;
  textOwner = TXT_NONE;
  textMaskClearTimer(); textMaskPos = -1;
  if (owner === TXT_SIM_PIN || owner === TXT_SIM_PUK || owner === TXT_SIM_NEWPIN) {
    state = ST_HOME; simSetFlash('Cancelled');
  } else if (owner === TXT_MSG_NEWNUM) {
    threadsScan(); state = ST_MESSAGES;
  } else if (owner === TXT_MSG_BODY) {
    state = chatNumber ? ST_CHAT : ST_MESSAGES;
    if (!chatNumber) threadsScan();
  } else if (owner === TXT_CONTACT_NAME && savingContactFromMessage) {
    savingContactFromMessage = false;
    if (savingContactReturn === ST_CALLLOG) state = ST_CALLLOG;
    else { threadsScan(); state = ST_MESSAGES; }
    savingContactReturn = 0;
  } else state = ST_CONTACTS;
  renderInner();
}
function textEditCommit() {
  const owner = textOwner;
  if (textBuf.length === 0) { printf('Empty - cancelled'); textEditCancel(); return; }

  simTookScreen = false;
  if (simTextCommit(owner, textBuf)) {
    // simTextCommit() may have opened a screen of its own - the "New PIN" step
    // after a PUK, or the PIN field again after a wrong one. Resetting to
    // ST_HOME here would close it the instant it appeared, which is what the
    // .ino currently does. See firmware-bugs.md.
    if (simTookScreen) { simTookScreen = false; return; }
    textOwner = TXT_NONE; state = ST_HOME; renderInner(); return;
  }
  if (owner === TXT_CONTACT_NAME) {
    if (savingContactFromMessage) {
      savingContactFromMessage = false;
      if (contactsAdd(textBuf, pendingMsgNumber)) printf('Saved ' + textBuf + ' ' + pendingMsgNumber);
      else printf('Could not save contact');
      textOwner = TXT_NONE;
      if (savingContactReturn === ST_CALLLOG) state = ST_CALLLOG;
      else { threadsScan(); state = ST_MESSAGES; }
      savingContactReturn = 0;
      renderInner();
      return;
    }
    pendingName = textBuf;
    textEditOpen('Number', '', TXT_CONTACT_NUM, true, false);   // straight on to step 2
    return;
  }
  if (owner === TXT_CONTACT_NUM) {
    if (contactsAdd(pendingName, textBuf)) {
      printf('Saved ' + pendingName + ' ' + textBuf);
      contactIdx = contacts.length - 1;
      if (contactIdx >= contactTop + 8) contactTop = contactIdx - 7;
    } else printf('Could not save contact');
    textOwner = TXT_NONE; state = ST_CONTACTS; renderInner();
    return;
  }
  if (owner === TXT_MSG_NEWNUM) {
    pendingMsgNumber = textBuf;
    textEditOpen('Message', '', TXT_MSG_BODY, false, false);
    return;
  }
  if (owner === TXT_MSG_BODY) {
    const dest = pendingMsgNumber || chatNumber;
    const sent = hardwareAPI.modem.sendSMS(dest, textBuf);
    // Stored locally regardless of on-air success, same as any phone's
    // "sending..." bubble that can still fail later.
    messagesAdd(dest, textBuf, MSG_DIR_OUT);
    if (!sent) printf('[SMS] May not have sent - check signal');
    chatNumber = dest;
    pendingMsgNumber = '';
    textOwner = TXT_NONE;
    state = ST_CHAT;
    renderInner();
    return;
  }
  textEditCancel();
}

// ==================== SIM PIN / PUK ====================
let simFlash = '', simFlashUntil = 0;
let simPinAttempts = 0;
let simPinAutoPrompt = true;    // stops re-nagging after 3 wrong tries this session
let simPendingPuk = '';
let simLastState = '';

function simSetFlash(msg) {
  simFlash = msg; simFlashUntil = Date.now() + 2500;
  printf('[SIM] ' + msg);
}
function simPromptPin() { textEditOpen('Enter PIN', '', TXT_SIM_PIN, true, true); }
function simPromptPuk() { textEditOpen('Enter PUK', '', TXT_SIM_PUK, true, true); }
function simPromptPukConfirm() { openOptions(OPT_PUK_CONFIRM, ['Enter PUK now', 'Not now']); }

// The firmware's modemPoll() watches +CPIN and pops the prompt the instant the
// state CHANGES to "needs PIN", from wherever the user is - which is why a
// PIN-locked SIM asks at every boot without anyone going into Settings. Same
// here, driven by the emulator's onSimChange instead of a 3s AT poll.
function simPollState() {
  const now = hardwareAPI.modem.getSimState();
  const prev = simLastState;
  if (now === prev) return;
  simLastState = now;
  printf('[Modem] SIM: ' + (now === 'ready' ? 'ready'
                          : now === 'pin'   ? 'needs PIN'
                          : now === 'puk'   ? 'needs PUK (blocked!)' : 'no SIM detected'));
  // Skip only if a popup or another text field is already up, so we never yank
  // the field out from under whatever is being typed.
  if (now === 'pin' && prev !== 'pin' && simPinAutoPrompt && !optOpen && state !== ST_TEXTEDIT) {
    simPromptPin();
    return;
  }
  if (now === 'puk' && prev !== 'puk' && !optOpen && state !== ST_TEXTEDIT) {
    simPromptPukConfirm();
    return;
  }
  if (state === ST_HOME) renderInner();
}

// Set by simTextCommit() when it has already put a screen up of its own, so
// textEditCommit() knows not to reset to ST_HOME underneath it.
let simTookScreen = false;

function simTextCommit(owner, value) {
  if (owner === TXT_SIM_PIN) {
    // A wrong or short PIN must NOT drop you onto the home screen. That reads
    // as being let in, and leaves no way to try again short of digging through
    // Settings. Stay on the field, say what happened, and let them retype it.
    // Clearing an empty field still backs out, which is the escape hatch.
    if (value.length < 4) { simSetFlash('PIN too short'); simPromptPin(); simTookScreen = true; return true; }
    simPinAttempts++;
    const r = hardwareAPI.modem.enterPin(value);
    if (r.ok) {
      simPinAttempts = 0;
      simLastState = 'ready';
      simFlashUntil = 0;      // clear any leftover "Wrong PIN" from a moment ago
      // Log only. Success does not need a flash - the phone simply starts
      // working, exactly as the firmware does it.
      printf('[SIM] PIN accepted');
    } else if (r.state === 'puk') {
      simLastState = 'puk';
      simSetFlash('PIN wrong 3x - SIM BLOCKED');
      simPromptPukConfirm();
      // No simPinAutoPrompt = false here, matching the firmware. That flag
      // exists to stop re-prompting for a PIN, and a blocked card has no PIN
      // to prompt for - the PUK path takes over.
    } else {
      // The count comes from the CARD (AT+SPIC), never from simPinAttempts.
      // That only counts this session, so it would be confidently wrong after
      // a reboot that followed an earlier wrong attempt.
      const left = hardwareAPI.modem.getPinAttempts().pin;
      simSetFlash('Wrong PIN - ' + left + ' left');
      simPromptPin();
      simTookScreen = true;
    }
    return true;
  }
  if (owner === TXT_SIM_PUK) {
    simPendingPuk = value;
    // Same two-step pattern as contact name -> number.
    textEditOpen('New PIN', '', TXT_SIM_NEWPIN, true, true);
    simTookScreen = true;
    return true;
  }
  if (owner === TXT_SIM_NEWPIN) {
    if (value.length < 4) { simSetFlash('New PIN too short'); simTookScreen = true; textEditOpen('New PIN', '', TXT_SIM_NEWPIN, true, true); return true; }
    const r = hardwareAPI.modem.enterPuk(simPendingPuk, value);
    simPendingPuk = '';
    if (r.ok) {
      simPinAttempts = 0; simPinAutoPrompt = true;
      simLastState = 'ready';
      simFlashUntil = 0;      // clear the "SIM BLOCKED" warning, it is over
      printf('[SIM] SIM unlocked, new PIN set');   // log only
    } else if (r.state === 'puk') {
      simSetFlash('PUK wrong - check the code');
      simPromptPuk();                 // back to step 1, same reasoning as the PIN
      simTookScreen = true;
    } else {
      simSetFlash('Unlock failed');
    }
    return true;
  }
  return false;
}

// ==================== DIALER ====================
const DIALER_MAX = 20;
let dialerDigits = '', dialerCursor = 0;
let dialerCursorVisible = true, dialerBlinkTimer = null;
let dialerStarTime = 0, dialerExitTimer = null;

function dialerUnit()    { return dialerDigits.length >= 14 ? DIGIT_MEDIUM : DIGIT_LARGE; }
function dialerPerLine() { return dialerUnit() === DIGIT_LARGE ? 7 : 13; }
function startDialerBlink() {
  dialerCursorVisible = true;
  if (dialerBlinkTimer) clearInterval(dialerBlinkTimer);
  dialerBlinkTimer = setInterval(function () {
    if (state !== ST_DIALER) { clearInterval(dialerBlinkTimer); dialerBlinkTimer = null; return; }
    dialerCursorVisible = !dialerCursorVisible;
    renderInner();
  }, 1000);
  renderInner();
}
function enterDialer() {
  state = ST_DIALER;
  dialerDigits = ''; dialerCursor = 0; dialerStarTime = 0;
  clearDialerExit();
  startDialerBlink();
  printf('Dialer opened');
}
function exitDialer() {
  clearDialerExit();
  if (dialerBlinkTimer) { clearInterval(dialerBlinkTimer); dialerBlinkTimer = null; }
  state = ST_HOME;
  renderInner();
  printf('Dialer closed');
}
function clearDialerExit() { if (dialerExitTimer) { clearTimeout(dialerExitTimer); dialerExitTimer = null; } }
function armDialerExit() {
  clearDialerExit();
  dialerExitTimer = setTimeout(function () {
    dialerExitTimer = null;
    if (state === ST_DIALER && dialerDigits.length === 0) exitDialer();
  }, 500);
}
function insertDialerDigit(c) {
  if (dialerDigits.length >= DIALER_MAX) return;
  dialerDigits = dialerDigits.slice(0, dialerCursor) + c + dialerDigits.slice(dialerCursor);
  dialerCursor++;
  clearDialerExit();
  dialerCursorVisible = true;
  renderInner();
}
function deleteDialerDigit() {
  if (dialerCursor > 0) {
    dialerDigits = dialerDigits.slice(0, dialerCursor - 1) + dialerDigits.slice(dialerCursor);
    dialerCursor--;
    dialerCursorVisible = true;
    renderInner();
  }
  if (dialerDigits.length === 0) armDialerExit();   // empty -> leave shortly
}
function moveDialerCursor(dir) {
  const per = dialerPerLine();
  if      (dir === 'LEFT'  && dialerCursor > 0)                      dialerCursor--;
  else if (dir === 'RIGHT' && dialerCursor < dialerDigits.length)    dialerCursor++;
  else if (dir === 'UP'    && dialerCursor >= per)                   dialerCursor -= per;
  else if (dir === 'DOWN'  && dialerCursor + per <= dialerDigits.length) dialerCursor += per;
  else return;
  dialerCursorVisible = true;
  renderInner();
}

// ==================== CAMERA + GALLERY ====================
// The emulator's camera paints a moving grain field rather than asking for
// webcam permission. Capture snapshots that field into a canvas, so the
// gallery holds real (if boring) images and the whole path is exercised.
let galleryPhotos = [];          // { name, canvas, bytes }
let galleryIdx = 0, galleryTop = 0;
let camFlash = '', camFlashUntil = 0;
let camLastNum = 0;
let camTimer = null;

function cameraEnter() {
  camFlashUntil = 0;
  if (camTimer) clearInterval(camTimer);
  camTimer = setInterval(function () {
    if (state !== ST_CAMERA) { clearInterval(camTimer); camTimer = null; return; }
    renderInner();
  }, 120);
}
function cameraLeave() { if (camTimer) { clearInterval(camTimer); camTimer = null; } }
function cameraShutter() {
  if (!hardwareAPI.sd.isPresent()) {
    camFlash = 'No memory card'; camFlashUntil = Date.now() + 1800;
    printf('[Cam] No card - nothing saved');
    return;
  }
  const c = document.createElement('canvas');
  c.width = 240; c.height = 180;
  hardwareAPI.camera.drawPreview(c.getContext('2d'), 240, 180);
  camLastNum++;
  const name = 'PXP_' + String(camLastNum).padStart(4, '0') + '.JPG';
  galleryPhotos.push({ name: name, canvas: c, bytes: 38000 + ((Math.random() * 9000) | 0) });
  camFlash = 'Saved ' + name; camFlashUntil = Date.now() + 1800;
  printf('[Cam] ' + name);
}
function galleryScan() {
  if (galleryIdx >= galleryPhotos.length) galleryIdx = Math.max(0, galleryPhotos.length - 1);
  if (galleryTop > galleryIdx) galleryTop = galleryIdx;
}

// ==================== VOICE MEMOS ====================
// The UI is the real one. The audio is not: getUserMedia would put a microphone
// permission prompt in front of anyone who opens the emulator, so recordings
// here are timed placeholders. Everything else - the list, the timer, save,
// discard, delete, the playback scrubber - behaves exactly as on the phone.
const VREC_READY=0, VREC_RECORDING=1, VREC_PAUSED=2;
let voiceMemos = [];             // { name, durationSec }
let voiceIdx = 0, voiceTop = 0, voiceLastNum = 0;
let voiceRecState = VREC_READY;
let voiceRecElapsedMs = 0, voiceRecStartMs = 0, voiceRecTimer = null;
let voiceRecFlash = '', voiceRecFlashUntil = 0;
let voicePlaying = false, voicePlayPosSec = 0, voicePlayTotalSec = 0, voicePlayTimer = null;

function voiceScan() {
  const s = hardwareAPI.storage.read('voice');
  if (s) { voiceMemos = s.list || []; voiceLastNum = s.last || 0; }
  if (voiceIdx >= voiceMemos.length) voiceIdx = Math.max(0, voiceMemos.length - 1);
  if (voiceTop > voiceIdx) voiceTop = voiceIdx;
}
function voiceSave() { hardwareAPI.storage.write('voice', { list: voiceMemos, last: voiceLastNum }); }
function voiceRecEnter() {
  state = ST_VOICE_REC;
  voiceRecState = VREC_READY;
  voiceRecElapsedMs = 0; voiceRecStartMs = 0;
  voiceRecFlashUntil = 0;
}
function voiceRecStartCapture() {
  if (!hardwareAPI.sd.isPresent()) {
    voiceRecFlash = 'No memory card'; voiceRecFlashUntil = Date.now() + 1800;
    return;
  }
  printf('[Voice] No microphone in the browser build - timing a placeholder');
  voiceRecState = VREC_RECORDING;
  voiceRecStartMs = Date.now();
  if (voiceRecTimer) clearInterval(voiceRecTimer);
  voiceRecTimer = setInterval(function () {
    if (state !== ST_VOICE_REC) { clearInterval(voiceRecTimer); voiceRecTimer = null; return; }
    renderInner();
  }, 250);
}
function voiceRecPause() {
  if (voiceRecState !== VREC_RECORDING) return;
  voiceRecElapsedMs += Date.now() - voiceRecStartMs;
  voiceRecState = VREC_PAUSED;
}
function voiceRecResume() {
  if (voiceRecState !== VREC_PAUSED) return;
  voiceRecState = VREC_RECORDING;
  voiceRecStartMs = Date.now();
}
function voiceRecSave() {
  const sec = Math.floor(voiceRecElapsedMs / 1000);
  voiceLastNum++;
  voiceMemos.push({ name: 'REC_' + String(voiceLastNum).padStart(4, '0') + '.WAV', durationSec: sec });
  voiceSave();
  if (voiceRecTimer) { clearInterval(voiceRecTimer); voiceRecTimer = null; }
  voiceScan();
  voiceIdx = voiceMemos.length - 1;
  state = ST_VOICE;
  printf('[Voice] Saved ' + voiceMemos[voiceIdx].name);
}
function voiceRecDiscard() {
  if (voiceRecTimer) { clearInterval(voiceRecTimer); voiceRecTimer = null; }
  voiceRecState = VREC_READY; voiceRecElapsedMs = 0;
  state = ST_VOICE;
  printf('[Voice] Discarded');
}
function voicePlayEnter(idx) {
  voiceIdx = idx;
  voicePlayPosSec = 0;
  voicePlayTotalSec = voiceMemos[idx] ? voiceMemos[idx].durationSec : 0;
  voicePlaying = false;
  state = ST_VOICE_PLAY;
}
function voicePlayExit() {
  voicePlaying = false;
  if (voicePlayTimer) { clearInterval(voicePlayTimer); voicePlayTimer = null; }
  state = ST_VOICE;
  renderInner();
}
function voicePlayToggle() {
  voicePlaying = !voicePlaying;
  if (voicePlayTimer) { clearInterval(voicePlayTimer); voicePlayTimer = null; }
  if (voicePlaying) {
    voicePlayTimer = setInterval(function () {
      if (state !== ST_VOICE_PLAY || !voicePlaying) return;
      voicePlayPosSec++;
      if (voicePlayPosSec >= voicePlayTotalSec) {
        voicePlayPosSec = voicePlayTotalSec; voicePlaying = false;
        clearInterval(voicePlayTimer); voicePlayTimer = null;
      }
      renderInner();
    }, 1000);
  }
}
function voicePlaySeek(d) {
  voicePlayPosSec = Math.max(0, Math.min(voicePlayTotalSec, voicePlayPosSec + d));
}

// ==================== MENUS ====================
const menuNames = ['Contacts', 'Messages', 'Call log', 'Camera',
                   'Gallery', 'Apps', 'Games', 'Settings'];
const menuCount = menuNames.length;
const appsItems = ['Voice memos', 'Calendar', 'Notes', 'Calculator',
                   'Alarms', 'File explorer', 'Music', 'Wallet'];
let appsIdx = 0, appsTop = 0;
const gamesItems = ['Snake', 'Tetris', 'Blackjack', 'Starfall', 'Doom'];
let gamesIdx = 0, gamesTop = 0;
const settingsItems = ['Storage info', 'Format SD card', 'Debug boxes',
                       'SIM PIN/PUK', 'Ringtones', 'About'];
let setIdx = 0;
let comingSoonName = '', comingSoonReturn = ST_MENU, appReturnTo = ST_MENU;

// One opener, called from both the OK key and the options popup. In the
// firmware these were two copies of the same if-chain and they drifted apart.
function menuOpen(idx) {
  if      (idx === 0) { state = ST_CONTACTS; contactIdx = 0; contactTop = 0; }
  else if (idx === 1) { threadsScan(); state = ST_MESSAGES; }
  else if (idx === 2) { state = ST_CALLLOG; callLogIdx = 0; callLogTop = 0; }
  else if (idx === 3) { state = ST_CAMERA; cameraEnter(); }
  else if (idx === 4) { galleryScan(); state = ST_GALLERY; }
  else if (idx === 5) { state = ST_APPS;  appsIdx = 0;  appsTop = 0; }
  else if (idx === 6) { state = ST_GAMES; gamesIdx = 0; gamesTop = 0; }
  else if (idx === 7) { state = ST_SETTINGS; setIdx = 0; }
}

// ==================== OPTIONS POPUP ====================
const OPT_NONE=0, OPT_HOME=1, OPT_DIALER=2, OPT_MENU=3, OPT_CONTACTS=4,
      OPT_MESSAGES=5, OPT_CAMERA=6, OPT_GALLERY=7, OPT_VOICE=8,
      OPT_VOICE_PLAY=9, OPT_CALLLOG=10, OPT_CALLLOG_CLEAR=11, OPT_FORMAT=12,
      OPT_APP=13, OPT_PUK_CONFIRM=14;
let optOpen = false, optOwner = OPT_NONE, optItems = [], optIdx = 0;

function openOptions(owner, items) {
  optOwner = owner; optItems = items; optIdx = 0; optOpen = true;
  renderInner();
  printf('Options opened');
}
function closeOptions() {
  optOpen = false; optOwner = OPT_NONE;
  renderInner();
  printf('Options closed');
}
function optionsMove(delta) {
  if (!optItems.length) return;
  optIdx = (optIdx + delta + optItems.length) % optItems.length;
  renderInner();
}
function optionsSelect() {
  if (!optItems.length) { closeOptions(); return; }
  const label = optItems[optIdx];
  const owner = optOwner;
  optOpen = false; optOwner = OPT_NONE;
  printf('Option: ' + label);

  if (owner === OPT_HOME) {
    if (label === 'Main menu') { state = ST_MENU; menuIdx = 0; }
    else if (label === 'Dialer') { enterDialer(); return; }
    else if (label === 'Debug boxes') { debugMode = !debugMode; settings.debugMode = debugMode ? 1 : 0; settingsSave(); }
  }
  else if (owner === OPT_DIALER) {
    if (label === 'Call' && dialerDigits.length) { callDial(dialerDigits); return; }
    else if (label === 'Save number' && dialerDigits.length) {
      pendingMsgNumber = dialerDigits;
      savingContactFromMessage = true; savingContactReturn = ST_CONTACTS;
      textEditOpen('Name', '', TXT_CONTACT_NAME, false, false);
      return;
    }
    else if (label === 'Send message' && dialerDigits.length) {
      pendingMsgNumber = dialerDigits;
      textEditOpen('Message', '', TXT_MSG_BODY, false, false);
      return;
    }
    else if (label === 'Clear all') { dialerDigits = ''; dialerCursor = 0; armDialerExit(); }
  }
  else if (owner === OPT_MENU) {
    if      (label === 'Open') { menuOpen(menuIdx); }
    else if (label === 'Back to home') { state = ST_HOME; }
  }
  else if (owner === OPT_CONTACTS) {
    if (label === 'New contact') { textEditOpen('Name', '', TXT_CONTACT_NAME, false, false); return; }
    else if (label === 'Delete' && contacts.length) {
      printf('Deleted ' + contacts[contactIdx].name);
      contactsDelete(contactIdx);
      if (contactIdx >= contacts.length) contactIdx = contacts.length - 1;
      if (contactIdx < 0) contactIdx = 0;
      if (contactTop > contactIdx) contactTop = contactIdx;
    }
    else if (label === 'Call' && contacts.length) { callDial(contacts[contactIdx].number); return; }
    else if (label === 'Write message' && contacts.length) {
      pendingMsgNumber = contacts[contactIdx].number;
      textEditOpen('Message', '', TXT_MSG_BODY, false, false);
      return;
    }
  }
  else if (owner === OPT_MESSAGES) {
    if (label === 'New message') { chatNumber = ''; pendingMsgNumber = ''; textEditOpen('To', '', TXT_MSG_NEWNUM, true, false); return; }
    else if (label === 'Save as contact' && threadNumbers.length) {
      pendingMsgNumber = threadNumbers[threadIdx];
      savingContactFromMessage = true; savingContactReturn = ST_MESSAGES;
      textEditOpen('Name', '', TXT_CONTACT_NAME, false, false);
      return;
    }
    else if (label === 'Call' && threadNumbers.length) { callDial(threadNumbers[threadIdx]); return; }
    else if (label === 'Delete' && threadNumbers.length) {
      const removed = messagesDeleteThread(threadNumbers[threadIdx]);
      printf('Deleted ' + removed + ' message(s)');
      threadsScan();
      if (threadIdx >= threadNumbers.length) threadIdx = threadNumbers.length - 1;
      if (threadIdx < 0) threadIdx = 0;
      if (threadTop > threadIdx) threadTop = threadIdx;
    }
  }
  else if (owner === OPT_CAMERA) {
    if (label === 'View gallery') { cameraLeave(); galleryScan(); state = ST_GALLERY; }
  }
  else if (owner === OPT_GALLERY) {
    if (label === 'Refresh') galleryScan();
    else if (label === 'Delete' && galleryPhotos.length) {
      printf('Deleted ' + galleryPhotos[galleryIdx].name);
      galleryPhotos.splice(galleryIdx, 1);
      if (galleryIdx >= galleryPhotos.length) galleryIdx = galleryPhotos.length - 1;
      if (galleryIdx < 0) galleryIdx = 0;
      if (galleryTop > galleryIdx) galleryTop = galleryIdx;
      state = ST_GALLERY;
    }
  }
  else if (owner === OPT_VOICE) {
    if (label === 'New recording') { voiceRecEnter(); renderInner(); return; }
    else if (label === 'Delete' && voiceMemos.length) {
      printf('Deleted ' + voiceMemos[voiceIdx].name);
      voiceMemos.splice(voiceIdx, 1); voiceSave(); voiceScan();
      state = ST_VOICE;
    }
  }
  else if (owner === OPT_VOICE_PLAY) {
    if (label === 'Delete' && voiceMemos.length) {
      voicePlaying = false;
      printf('Deleted ' + voiceMemos[voiceIdx].name);
      voiceMemos.splice(voiceIdx, 1); voiceSave(); voiceScan();
      state = ST_VOICE;
    }
  }
  else if (owner === OPT_CALLLOG) {
    // callLog[] is stored oldest-first but displayed newest-first, so the
    // highlighted row maps to a reversed index. Worked out once, here.
    const sel = callLog.length - 1 - callLogIdx;
    const haveSel = (callLog.length > 0 && sel >= 0 && sel < callLog.length);
    if (label === 'Call' && haveSel) { callDial(callLog[sel].number); return; }
    else if (label === 'Send message' && haveSel) {
      chatNumber = ''; pendingMsgNumber = callLog[sel].number;
      textEditOpen('Message', '', TXT_MSG_BODY, false, false);
      return;
    }
    else if (label === 'Save as contact' && haveSel) {
      if (contactExistsForNumber(callLog[sel].number)) printf('Already in contacts');
      else {
        pendingMsgNumber = callLog[sel].number;
        savingContactFromMessage = true; savingContactReturn = ST_CALLLOG;
        textEditOpen('Name', '', TXT_CONTACT_NAME, false, false);
        return;
      }
    }
    else if (label === 'Delete all' && callLog.length) {
      openOptions(OPT_CALLLOG_CLEAR, ['Yes, clear log', 'Cancel']);
      return;                       // a whole history is worth one confirmation
    }
    else if (label === 'Delete entry' && haveSel) {
      printf('Deleted call log entry: ' + contactNameForNumber(callLog[sel].number));
      callLogDelete(sel);
      if (callLogIdx >= callLog.length) callLogIdx = callLog.length - 1;
      if (callLogIdx < 0) callLogIdx = 0;
      if (callLogTop > callLogIdx) callLogTop = callLogIdx;
    }
  }
  else if (owner === OPT_CALLLOG_CLEAR) {
    if (label === 'Yes, clear log') {
      callLog = []; callLogIdx = 0; callLogTop = 0; callLogSave();
      missedCallCount = 0;
      printf('Call log cleared');
    }
  }
  else if (owner === OPT_FORMAT) {
    if (label === 'Yes, erase all') {
      galleryPhotos = []; voiceMemos = []; voiceLastNum = 0; voiceSave();
      printf('Memory card formatted');
    } else printf('Format cancelled');
  }
  else if (owner === OPT_PUK_CONFIRM) {
    if (label === 'Enter PUK now') { simPromptPuk(); return; }
    printf('PUK entry postponed');
  }
  else if (owner === OPT_APP) {
    if      (label === 'Close') state = ST_MENU;
    else if (label === 'Back to home') state = ST_HOME;
  }
  renderInner();
}

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
  let y = 283 - h;
  if (y < 40) y = 40;
  fbRect(ctx, x, y, w, h, COL_BLACK);
  fbOutline(ctx, x, y, w, h, COL_GREEN);
  for (let i = 0; i < optItems.length; i++) {
    const ry = y + padY + i * rowH;
    if (i === optIdx) {
      fbRect(ctx, x + 2, ry, w - 4, rowH, COL_GREEN);
      drawTextStr(ctx, x + padX, ry + 18, optItems[i], TEXT, COL_BLACK);
    } else {
      drawTextStr(ctx, x + padX, ry + 18, optItems[i], TEXT, COL_GREEN);
    }
  }
}

// ==================== SHARED LIST DRAW ====================
function drawScrollbar(ctx, count, top, visible, listTop, rowH) {
  if (count <= visible) return;
  const trackH = visible * rowH;
  let barH = Math.floor(trackH * visible / count);
  if (barH < 8) barH = 8;
  const barY = listTop + Math.floor((trackH - barH) * top / (count - visible));
  fbRect(ctx, 236, listTop, 2, trackH, COL_BAR);
  fbRect(ctx, 236, barY, 2, barH, COL_GRAY8);
}
function softkeys(ctx, left, right, leftCol, rightCol) {
  fbRect(ctx, 0, 285, 240, 35, COL_BAR2);
  if (left)  drawTextStr(ctx, 10, 308, left, 14, leftCol || COL_GRAY8);
  if (right) {
    const w = measureTextStrW(right, 14);
    drawTextStr(ctx, 230 - w, 308, right, 14, rightCol || COL_GRAY8);
  }
}
function listMove(idx, top, count, visible, delta) {
  if (count <= 0) return [0, 0];
  idx += delta;
  if (idx < 0) idx = count - 1;
  if (idx >= count) idx = 0;
  if (idx < top) top = idx;
  if (idx >= top + visible) top = idx - visible + 1;
  return [idx, top];
}

// ==================== SCREEN DRAW ====================
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function drawInner(ctx) {
  marqueeShown = false;
  fbRect(ctx, 0, 0, IN_W, IN_H, COL_BLACK);

  if (state === ST_BOOT) {
    const lw = measureTextStrW('PxP', 48);
    drawTextStr(ctx, centerX(IN_W, lw), 181, 'PxP', 48, COL_GREEN);
    if (debugMode) {
      const dw = measureTextStrW('[DEBUG]', 14);
      drawTextStr(ctx, centerX(IN_W, dw), 215, '[DEBUG]', 14, COL_RED);
    }
  }
  else if (state === ST_HOME) {
    drawStatus(ctx, IN_W);
    const d = new Date();
    const h = String(d.getHours()).padStart(2,'0');
    const m = String(d.getMinutes()).padStart(2,'0');
    const s = String(d.getSeconds()).padStart(2,'0');
    const clockStr = h + ':' + m;
    const clockW = measureDigitStringW(clockStr, DIGIT_LARGE);
    const clockX = centerX(IN_W, clockW) - 16, clockY = 120;
    const cb = drawDigitString(ctx, clockX, clockY, clockStr, DIGIT_LARGE, COL_GREEN);

    // Right column: day name top-aligned to the clock top, seconds bottom-aligned.
    const rightX = cb.x + cb.width + DIGIT_LARGE;
    drawLetterString(ctx, rightX, clockY + 2, DAYS[d.getDay()], DAYNAME_UNIT_IN, COL_GREEN);
    drawDigitString(ctx, rightX, clockY + 20, s, DIGIT_MEDIUM, COL_GREEN);

    const dateY = cb.y + cb.height + DIGIT_LARGE;
    drawLetterString(ctx, cb.x, dateY, MONTHS[d.getMonth()], MONTH_UNIT_IN, COL_GREEN);

    // GRID RULE: the day's first digit starts where the hour's first digit stops.
    const dayStr = String(d.getDate()).padStart(2,'0');
    const yearStr = String(d.getFullYear());
    const firstHour = DIGIT_GLYPHS[h[0]];
    const dayStartX = cb.x + (firstHour ? firstHour.w * DIGIT_LARGE : 0) + DATE_NUDGE;
    const db  = drawDigitString(ctx, dayStartX, dateY, dayStr, DIGIT_SMALL, COL_GREEN);
    const dot = drawPixelDigit(ctx, db.x + db.width + DIGIT_SMALL, dateY, '.', DIGIT_SMALL, COL_GREEN);
    drawDigitString(ctx, dot.x + dot.width + DIGIT_LARGE, dateY, yearStr, DIGIT_SMALL, COL_GREEN);

    // The lines under the date share one running Y so they stack instead of
    // overlapping when more than one is showing at once.
    let noticeY = dateY + 34;
    const badge = notifBadgeText();
    if (badge) {
      const bw = measureTextStrW(badge, 14);
      drawTextStr(ctx, centerX(IN_W, bw), noticeY, badge, 14, missedCallCount > 0 ? COL_RED : COL_GRAY8);
      noticeY += 22;
    }
    const ss = hardwareAPI.modem.getSimState();
    if (ss !== 'ready') {
      // drawTextFitCentered, NOT drawTextStr. At size 14 the font is scale 2 =
      // 12px per character, so 20 characters is the whole 240px screen.
      // "SIM locked - enter PIN" is 22 and "SIM blocked - needs PUK" is 23:
      // both ran off BOTH edges. Letting it drop to scale 1 fits them with room
      // to spare, and "Insert SIM card" is short enough to stay big.
      const simMsg = (ss === 'pin') ? 'SIM locked - enter PIN'
                   : (ss === 'puk') ? 'SIM blocked - needs PUK' : 'Insert SIM card';
      drawTextFitCentered(ctx, IN_W, noticeY, simMsg, 220, 14, 10, COL_GRAY8);
      noticeY += 20;
    }
    if (Date.now() < simFlashUntil) {
      drawTextFitCentered(ctx, IN_W, noticeY, simFlash, 220, 14, 10, COL_YEL);
    }
    if (debugMode) drawTextStr(ctx, 5, 315, '[DEBUG MODE]', 10, COL_RED);
  }
  else if (state === ST_DIALER) {
    // Digits flow RIGHT to LEFT. The bottom line holds the newest digits; older
    // ones push up onto the lines above. Font drops to MEDIUM past 14.
    const ps = dialerUnit(), digitW = 3 * ps, digitH = 5 * ps, gap = ps;
    const perLine = dialerPerLine(), softKeyY = 285;
    softkeys(ctx, 'Options', 'Clear');
    const maxY = softKeyY - 10, lineH = digitH + gap, bottomY = maxY - digitH;
    let cursorW = Math.floor(ps / 5); if (cursorW < 1) cursorW = 1;

    if (dialerDigits.length === 0) {
      if (dialerCursorVisible)
        fbRect(ctx, 240 - 10 - Math.floor(gap / 2), bottomY, cursorW, digitH, COL_GREEN);
    } else {
      const totalLines = Math.ceil(dialerDigits.length / perLine);
      for (let lineNum = 0; lineNum < totalLines; lineNum++) {
        const lineY = bottomY - lineNum * lineH;
        let lineStart = dialerDigits.length - (lineNum + 1) * perLine;
        if (lineStart < 0) lineStart = 0;
        const lineEnd = dialerDigits.length - lineNum * perLine;
        const count = lineEnd - lineStart;
        const lineWidth = count * digitW + (count > 0 ? (count - 1) * gap : 0);
        let x = 240 - lineWidth - 10;
        for (let i = 0; i <= count; i++) {
          if (dialerCursor === lineStart + i && dialerCursorVisible)
            fbRect(ctx, x - Math.floor(gap / 2), lineY, cursorW, digitH, COL_GREEN);
          if (i < count) {
            drawPixelDigit(ctx, x, lineY, dialerDigits[lineStart + i], ps, COL_GREEN);
            x += digitW + gap;
          }
        }
      }
    }
  }
  else if (state === ST_TEXTEDIT) {
    drawStatus(ctx, IN_W);
    // PIN/PUK entry is always a short digit code, so it gets its own centered
    // layout instead of reusing the multi-tap grid built for names and bodies.
    const pinStyle = (textOwner === TXT_SIM_PIN || textOwner === TXT_SIM_PUK || textOwner === TXT_SIM_NEWPIN);
    if (pinStyle) {
      const tw = measureTextStrW(textTitle, 18);
      drawTextStr(ctx, centerX(IN_W, tw), 130, textTitle, 18, COL_WHITE);
      let shown = '';
      for (let i = 0; i < textBuf.length; i++)
        shown += (textMask && i !== textMaskPos) ? '*' : textBuf[i];
      const CODE_PX = 26;
      const sw = shown.length ? measureTextStrW(shown, CODE_PX) : 0;
      const sx = centerX(IN_W, sw), sy = 195;
      if (shown.length) drawTextStr(ctx, sx, sy, shown, CODE_PX, COL_GREEN);
      if (textCursorVisible) fbRect(ctx, sx + sw + 3, sy - CODE_PX + 4, 2, CODE_PX - 2, COL_GREEN);
      // Faint underline the width of the expected code - a sense of how much is
      // left to type, without pretending to be fixed slots.
      const expect = (textOwner === TXT_SIM_PUK) ? 8 : 4;
      const rw = measureTextStrW('0'.repeat(expect), CODE_PX);
      fbRect(ctx, centerX(IN_W, rw), sy + 8, rw, 1, COL_BAR);
      // The error belongs HERE, not on the home screen. A wrong PIN now keeps
      // you on this field, so a flash drawn only in the ST_HOME branch would
      // never be seen by the person who caused it.
      if (Date.now() < simFlashUntil) {
        drawTextFitCentered(ctx, IN_W, 236, simFlash, 224, 14, 10, COL_YEL);
      }
      softkeys(ctx, 'OK', 'Clear');
    } else {
      drawTextStr(ctx, 10, 58, textTitle, 16, COL_WHITE);
      const modes = ['Abc', 'abc', 'ABC', '123'];
      const m = textDigitsOnly ? '123' : modes[textCaseMode];
      const mw = measureTextStrW(m, 14);
      drawTextStr(ctx, 230 - mw, 58, m, 14, COL_GRAY8);
      fbRect(ctx, 10, 66, 220, 1, COL_BAR);

      const longField = (textOwner === TXT_MSG_BODY);
      if (!longField) {
        const charW = 12, perLine = 18, lineH = 24, y0 = 100;
        for (let i = 0; i <= textBuf.length; i++) {
          const line = Math.floor(i / perLine), col = i % perLine;
          if (line > 5) break;
          const x = 10 + col * charW, y = y0 + line * lineH;
          if (i === textCursor && textCursorVisible) fbRect(ctx, x - 1, y - 15, 2, 18, COL_GREEN);
          if (i < textBuf.length) {
            const shown = (textMask && i !== textMaskPos) ? '*' : textBuf[i];
            drawTextStr(ctx, x, y, shown, 16, COL_GREEN);
          }
        }
      } else {
        // Same font size and pitch as the chat bubbles this text becomes once
        // sent, so what you type looks like what you get.
        const charW = 12, perLine = 18, lineH = 16, y0 = 90, maxLines = 11;
        const totalLines = Math.floor(textBuf.length / perLine) + 1;
        const cursorLine = Math.floor(textCursor / perLine);
        let scrollLine = 0;
        if (totalLines > maxLines) {
          scrollLine = cursorLine - maxLines + 1;
          if (scrollLine < 0) scrollLine = 0;
          const maxScroll = totalLines - maxLines;
          if (scrollLine > maxScroll) scrollLine = maxScroll;
        }
        for (let i = 0; i <= textBuf.length; i++) {
          const line = Math.floor(i / perLine), col = i % perLine;
          const visLine = line - scrollLine;
          if (visLine < 0 || visLine >= maxLines) continue;
          const x = 10 + col * charW, y = y0 + visLine * lineH;
          if (i === textCursor && textCursorVisible) fbRect(ctx, x - 1, y - 11, 2, 13, COL_GREEN);
          if (i < textBuf.length) drawTextStr(ctx, x, y, textBuf[i], 13, COL_GREEN);
        }
        const cnt = textBuf.length + '/' + TEXT_MAX;
        const cw = measureTextStrW(cnt, 12);
        drawTextStr(ctx, 230 - cw, 278, cnt, 12, COL_GRAY6);
      }
      softkeys(ctx, 'OK', 'Clear');
      if (!textDigitsOnly) drawTextStr(ctx, 88, 308, '# case', 12, COL_GRAY6);
    }
  }
  else if (state === ST_GALLERY) {
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, 'Gallery', 16, COL_WHITE);
    const rowH = 26, listTop = 68, visible = 8;
    if (!hardwareAPI.sd.isPresent()) {
      drawTextStr(ctx, 10, 130, 'Insert memory card', 16, COL_GRAY8);
    } else if (galleryPhotos.length === 0) {
      drawTextStr(ctx, 10, 130, 'No photos', 16, COL_GRAY8);
      drawTextWrapped(ctx, 10, 156, 220, 'Take one with the camera', 14, COL_GRAY6, 18);
    } else {
      for (let row = 0; row < visible; row++) {
        const i = galleryTop + row;
        if (i >= galleryPhotos.length) break;
        const ry = listTop + row * rowH, sel = (i === galleryIdx);
        if (sel) fbRect(ctx, 4, ry, 232, rowH, COL_GREEN);
        drawTextStr(ctx, 10, ry + 19, galleryPhotos[i].name, 14, sel ? COL_BLACK : COL_GREEN);
        const kb = Math.floor(galleryPhotos[i].bytes / 1024) + 'k';
        const kw = measureTextStrW(kb, 12);
        drawTextStr(ctx, 230 - kw, ry + 19, kb, 12, sel ? COL_BLACK : COL_GRAY6);
      }
      drawScrollbar(ctx, galleryPhotos.length, galleryTop, visible, listTop, rowH);
    }
    softkeys(ctx, 'Options', 'Back');
  }
  else if (state === ST_CAMERA) {
    if (hardwareAPI.camera.isReady()) {
      const pw = 240, ph = 180, y0 = Math.floor((285 - ph) / 2);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, y0, pw, ph); ctx.clip();
      ctx.translate(0, y0);
      hardwareAPI.camera.drawPreview(ctx, pw, ph);
      ctx.restore();
      fbOutline(ctx, -1, y0 - 1, pw + 2, ph + 2, COL_BAR);
    } else {
      drawTextStr(ctx, 10, 140, 'Camera not available', 16, COL_RED);
      drawTextWrapped(ctx, 10, 166, 220, 'Insert a memory card first', 14, COL_GRAY8, 18);
    }
    if (Date.now() < camFlashUntil) {
      const fw = measureTextStrW(camFlash, 14);
      fbRect(ctx, centerX(IN_W, fw) - 6, 246, fw + 12, 22, COL_BLACK);
      fbOutline(ctx, centerX(IN_W, fw) - 6, 246, fw + 12, 22, COL_GREEN);
      drawTextStr(ctx, centerX(IN_W, fw), 262, camFlash, 14, COL_GREEN);
    }
    softkeys(ctx, 'Opt.', 'Back');
    const cw = measureTextStrW('Capture', 14);
    drawTextStr(ctx, centerX(IN_W, cw), 308, 'Capture', 14, COL_GREEN);
  }
  else if (state === ST_PHOTO) {
    const p = galleryPhotos[galleryIdx];
    if (p) {
      const y0 = Math.floor((285 - p.canvas.height) / 2);
      ctx.drawImage(p.canvas, 0, y0);
    } else {
      drawTextStr(ctx, 10, 150, 'Could not show photo', 16, COL_RED);
    }
    fbRect(ctx, 0, 285, 240, 35, COL_BAR2);
    drawTextStr(ctx, 10, 308, (galleryIdx + 1) + '/' + galleryPhotos.length, 14, COL_GRAY8);
    drawTextStr(ctx, 80, 308, '< >', 12, COL_GRAY6);
    drawTextStr(ctx, 185, 308, 'Back', 14, COL_GRAY8);
  }
  else if (state === ST_VOICE) {
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, 'Voice Memos', 16, COL_WHITE);
    const rowH = 26, listTop = 68, visible = 8;
    if (!hardwareAPI.sd.isPresent()) {
      drawTextStr(ctx, 10, 130, 'Insert memory card', 16, COL_GRAY8);
    } else if (voiceMemos.length === 0) {
      drawTextStr(ctx, 10, 130, 'No recordings', 16, COL_GRAY8);
      drawTextStr(ctx, 10, 156, 'Press OK to record', 14, COL_GRAY6);
    } else {
      for (let row = 0; row < visible; row++) {
        const i = voiceTop + row;
        if (i >= voiceMemos.length) break;
        const ry = listTop + row * rowH, sel = (i === voiceIdx);
        if (sel) fbRect(ctx, 4, ry, 232, rowH, COL_GREEN);
        drawTextStr(ctx, 10, ry + 19, voiceMemos[i].name, 14, sel ? COL_BLACK : COL_GREEN);
        const dur = formatMMSS(voiceMemos[i].durationSec);
        const dw = measureTextStrW(dur, 12);
        drawTextStr(ctx, 230 - dw, ry + 19, dur, 12, sel ? COL_BLACK : COL_GRAY6);
      }
      drawScrollbar(ctx, voiceMemos.length, voiceTop, visible, listTop, rowH);
    }
    softkeys(ctx, 'Options', 'Back');
  }
  else if (state === ST_VOICE_REC) {
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, 'New Recording', 16, COL_WHITE);
    const elapsedMs = voiceRecElapsedMs + (voiceRecState === VREC_RECORDING ? Date.now() - voiceRecStartMs : 0);
    const t = formatMMSS(elapsedMs / 1000);
    const tw = measureTextStrW(t, 32);
    drawTextStr(ctx, centerX(IN_W, tw), 170, t, 32, COL_WHITE);
    let dotColor = COL_BAR;
    if (voiceRecState === VREC_RECORDING) dotColor = (Math.floor(Date.now() / 500) % 2 === 0) ? COL_RED : COL_BAR;
    else if (voiceRecState === VREC_PAUSED) dotColor = COL_YEL;
    fbCircle(ctx, 120, 210, 6, dotColor);
    const hint = (voiceRecState === VREC_READY) ? 'OK to record'
               : (voiceRecState === VREC_RECORDING) ? 'OK to pause' : 'OK to keep recording';
    const hw = measureTextStrW(hint, 14);
    drawTextStr(ctx, centerX(IN_W, hw), 232, hint, 14, COL_GRAY8);
    if (Date.now() < voiceRecFlashUntil) {
      const fw = measureTextStrW(voiceRecFlash, 14);
      fbRect(ctx, centerX(IN_W, fw) - 6, 246, fw + 12, 22, COL_BLACK);
      fbOutline(ctx, centerX(IN_W, fw) - 6, 246, fw + 12, 22, COL_YEL);
      drawTextStr(ctx, centerX(IN_W, fw), 262, voiceRecFlash, 14, COL_YEL);
    }
    fbRect(ctx, 0, 285, 240, 35, COL_BAR2);
    if (voiceRecState === VREC_PAUSED) {
      drawTextStr(ctx, 10, 308, 'Save', 14, COL_GREEN);
      const dw = measureTextStrW('Discard', 14);
      drawTextStr(ctx, 230 - dw, 308, 'Discard', 14, COL_RED);
    }
  }
  else if (state === ST_VOICE_PLAY) {
    drawStatus(ctx, IN_W);
    const nm = voiceMemos[voiceIdx] ? voiceMemos[voiceIdx].name : 'Recording';
    drawTextStr(ctx, 10, 58, nm, 16, COL_WHITE);
    const lbl = formatMMSS(voicePlayPosSec) + ' / ' + formatMMSS(voicePlayTotalSec);
    const lw = measureTextStrW(lbl, 14);
    drawTextStr(ctx, centerX(IN_W, lw), 150, lbl, 14, COL_GRAY8);
    const barX = 20, barY = 172, barW = 200, barH = 8;
    fbRect(ctx, barX, barY, barW, barH, COL_BAR);
    const fillW = voicePlayTotalSec > 0 ? Math.floor(barW * voicePlayPosSec / voicePlayTotalSec) : 0;
    if (fillW > 0) fbRect(ctx, barX, barY, fillW, barH, COL_GREEN);
    const hint = voicePlaying ? 'OK to pause' : 'OK to play';
    const hw = measureTextStrW(hint, 14);
    drawTextStr(ctx, centerX(IN_W, hw), 210, hint, 14, COL_GRAY8);
    drawTextStr(ctx, 30, 235, '<< 5s', 12, COL_GRAY6);
    const sw = measureTextStrW('5s >>', 12);
    drawTextStr(ctx, 210 - sw, 235, '5s >>', 12, COL_GRAY6);
    softkeys(ctx, 'Options', 'Back');
  }
  else if (state === ST_INCOMING_CALL) {
    drawStatus(ctx, IN_W);
    const label = callNumber ? contactNameForNumber(callNumber) : 'Unknown caller';
    const lw = measureTextStrW(label, 20);
    drawTextStr(ctx, centerX(IN_W, lw), 110, label, 20, COL_WHITE);
    if (callNumber && label !== callNumber) {
      const nw = measureTextStrW(callNumber, 14);
      drawTextStr(ctx, centerX(IN_W, nw), 136, callNumber, 14, COL_GRAY8);
    }
    const stw = measureTextStrW('Incoming call', 14);
    drawTextStr(ctx, centerX(IN_W, stw), 168, 'Incoming call', 14, COL_GREEN);
    softkeys(ctx, 'Answer', 'Decline', COL_GREEN, COL_RED);
  }
  else if (state === ST_INCALL) {
    drawStatus(ctx, IN_W);
    const label = callNumber ? contactNameForNumber(callNumber) : 'Unknown caller';
    const lw = measureTextStrW(label, 20);
    drawTextStr(ctx, centerX(IN_W, lw), 100, label, 20, COL_WHITE);
    if (callNumber && label !== callNumber) {
      const nw = measureTextStrW(callNumber, 14);
      drawTextStr(ctx, centerX(IN_W, nw), 126, callNumber, 14, COL_GRAY8);
    }
    if (callState === CALL_DIALING) {
      const dw = measureTextStrW('Calling...', 20);
      drawTextStr(ctx, centerX(IN_W, dw), 165, 'Calling...', 20, COL_GREEN);
    } else {
      const t = formatMMSS(callStartMs ? (Date.now() - callStartMs) / 1000 : 0);
      const tw = measureTextStrW(t, 24);
      drawTextStr(ctx, centerX(IN_W, tw), 165, t, 24, COL_GRAY8);
    }
    fbRect(ctx, 0, 285, 240, 35, COL_BAR2);
    if (callState !== CALL_DIALING)
      drawTextStr(ctx, 10, 308, callMuted ? 'Unmute' : 'Mute', 14, callMuted ? COL_YEL : COL_GRAY8);
    const rightLabel = (callState === CALL_DIALING) ? 'Cancel' : (callSpeaker ? 'Earpiece' : 'Speaker');
    const bw = measureTextStrW(rightLabel, 14);
    drawTextStr(ctx, 230 - bw, 308, rightLabel, 14,
      (callState === CALL_DIALING) ? COL_RED : (callSpeaker ? COL_YEL : COL_GRAY8));
    if (callState !== CALL_DIALING) {
      const hint = 'Red key or close flip to hang up';
      const shw = measureTextStrW(hint, 11);
      drawTextStr(ctx, centerX(IN_W, shw), 264, hint, 11, COL_GRAY6);
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
        if (sel) fbRect(ctx, 4, ry, 232, rowH, COL_GREEN);
        drawTextStr(ctx, 10, ry + 19, contacts[i].name, 16, sel ? COL_BLACK : COL_GREEN);
      }
      drawScrollbar(ctx, contacts.length, contactTop, visible, listTop, rowH);
    }
    softkeys(ctx, 'Options', 'Back');
  }
  else if (state === ST_CALLLOG) {
    missedCallCount = 0;   // the badge clears on visiting this screen, not on flip-open
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, 'Call log', 16, COL_WHITE);
    const rowH = 26, listTop = 68, visible = 8;
    if (callLog.length === 0) {
      drawTextStr(ctx, 10, 130, 'No calls yet', 16, COL_GRAY8);
    } else {
      // newest-last in storage (append-only), so walk backwards for display
      for (let row = 0; row < visible; row++) {
        const i = callLog.length - 1 - (callLogTop + row);
        if (i < 0) break;
        const ry = listTop + row * rowH;
        const sel = ((callLogTop + row) === callLogIdx);
        if (sel) fbRect(ctx, 4, ry, 232, rowH, COL_GREEN);
        const c = callLog[i];
        // Printable ASCII only - the 5x7 font covers 32..126 and draws '?' for
        // anything else, so no arrow glyphs here.
        let icon = '?', iconColor = sel ? COL_BLACK : COL_GRAY8;
        if      (c.type === CALL_OUT)      { icon = '<'; iconColor = sel ? COL_BLACK : COL_GREEN; }
        else if (c.type === CALL_IN)       { icon = '>'; iconColor = sel ? COL_BLACK : COL_GREEN; }
        else if (c.type === CALL_MISSED)   { icon = 'x'; iconColor = sel ? COL_BLACK : COL_RED; }
        else if (c.type === CALL_REJECTED) { icon = 'o'; iconColor = sel ? COL_BLACK : COL_GRAY6; }
        drawTextStr(ctx, 10, ry + 19, icon, 16, iconColor);
        drawTextStr(ctx, 30, ry + 19, contactNameForNumber(c.number), 16, sel ? COL_BLACK : COL_GREEN);
        const ts = hhmm(c.epoch);
        const tw = measureTextStrW(ts, 12);
        drawTextStr(ctx, 230 - tw, ry + 19, ts, 12, sel ? COL_BLACK : COL_GRAY6);
      }
      drawScrollbar(ctx, callLog.length, callLogTop, visible, listTop, rowH);
    }
    softkeys(ctx, 'Options', 'Back');
  }
  else if (state === ST_RINGTONES) {
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, 'Ringtones', 16, COL_WHITE);
    // Legend pinned ABOVE the list. It is a permanent key to the screen, not a
    // footnote, so it must not move every time the list grows.
    const hint = '* = active     OK = preview & select';
    const hw = measureTextStrW(hint, 11);
    drawTextStr(ctx, centerX(IN_W, hw), 78, hint, 11, COL_GRAY6);
    const rowH = 30, listTop = 92, visible = 6;
    for (let row = 0; row < visible; row++) {
      const i = ringtonePickerTop + row;
      if (i >= RINGTONE_COUNT) break;
      const ry = listTop + row * rowH, sel = (i === ringtonePickerIdx);
      if (sel) fbRect(ctx, 4, ry, 232, rowH, COL_GREEN);
      const marker = (i === settings.activeRingtoneIx) ? '*' : ' ';
      drawTextStr(ctx, 10, ry + 22, marker, 16, sel ? COL_BLACK : COL_GREEN);
      drawTextStr(ctx, 30, ry + 22, RINGTONES[i].name, 16, sel ? COL_BLACK : COL_WHITE);
    }
    drawScrollbar(ctx, RINGTONE_COUNT, ringtonePickerTop, visible, listTop, rowH);
    softkeys(ctx, 'Select', 'Back');
  }
  else if (state === ST_MESSAGES) {
    unreadTextCount = 0;   // badge clears on visiting, not on flip-open
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, 'Messages', 16, COL_WHITE);
    const rowH = 34, listTop = 68, visible = 6;
    if (threadNumbers.length === 0) {
      drawTextStr(ctx, 10, 130, 'No messages', 16, COL_GRAY8);
      drawTextWrapped(ctx, 10, 156, 220, 'Press OK to write one', 14, COL_GRAY6, 18);
    } else {
      for (let row = 0; row < visible; row++) {
        const i = threadTop + row;
        if (i >= threadNumbers.length) break;
        const ry = listTop + row * rowH, sel = (i === threadIdx);
        if (sel) fbRect(ctx, 4, ry, 232, rowH, COL_GREEN);
        const name = contactNameForNumber(threadNumbers[i]);
        const last = messages[threadLastMsg[i]];
        drawTextStr(ctx, 10, ry + 17, name, 15, sel ? COL_BLACK : COL_GREEN);
        const prev = last.body.slice(0, 25);
        drawTextStr(ctx, 10, ry + 31, prev, 12, sel ? COL_BLACK : COL_GRAY8);
        if (last.epoch > 0) {
          const ts = hhmm(last.epoch);
          const tw = measureTextStrW(ts, 12);
          drawTextStr(ctx, 230 - tw, ry + 17, ts, 12, sel ? COL_BLACK : COL_GRAY6);
        }
      }
      drawScrollbar(ctx, threadNumbers.length, threadTop, visible, listTop, rowH);
    }
    softkeys(ctx, 'Options', 'Back');
  }
  else if (state === ST_CHAT) {
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, contactNameForNumber(chatNumber), 16, COL_WHITE);
    fbRect(ctx, 10, 66, 220, 1, COL_BAR);
    const mine = messages.filter(m => m.number === chatNumber);
    const bubblePad = 8, bubbleGap = 8, maxBubbleW = 170, lineH = 16;
    let y = 285 - 10;
    // Walk backwards from the newest, stacking bubbles upward until we run out
    // of room. That naturally shows the last screenful.
    for (let k = mine.length - 1; k >= 0 && y > 76; k--) {
      const m = mine[k];
      const isMine = (m.direction === MSG_DIR_OUT);
      // word wrap into at most 6 lines within maxBubbleW at font 13
      const words = fold(m.body).split(' ');
      const lines = [];
      let cur = '';
      for (const w of words) {
        const test = cur ? cur + ' ' + w : w;
        if (measureTextStrW(test, 13) > maxBubbleW - bubblePad * 2 && cur) {
          lines.push(cur); cur = w;
          if (lines.length >= 6) break;
        } else cur = test;
      }
      if (cur && lines.length < 6) lines.push(cur);
      if (lines.length === 0) lines.push(m.body);
      let bw = 0;
      for (const l of lines) bw = Math.max(bw, measureTextStrW(l, 13));
      bw += bubblePad * 2;
      const bh = lines.length * lineH + bubblePad * 2 - 4;
      y -= bh;
      const bx = isMine ? (IN_W - bw - 10) : 10;
      fbRect(ctx, bx, y, bw, bh, isMine ? COL_GREEN : COL_BAR);
      for (let l = 0; l < lines.length; l++)
        drawTextStr(ctx, bx + bubblePad, y + bubblePad + 10 + l * lineH, lines[l], 13,
                    isMine ? COL_BLACK : COL_WHITE);
      y -= bubbleGap;
    }
    softkeys(ctx, 'Reply', 'Back');
  }
  else if (state === ST_SETTINGS) {
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, 'Settings', 16, COL_WHITE);
    const rowH = 26, listTop = 68;
    for (let i = 0; i < settingsItems.length; i++) {
      const ry = listTop + i * rowH, sel = (i === setIdx);
      if (sel) fbRect(ctx, 4, ry, 232, rowH, COL_GREEN);
      drawTextStr(ctx, 10, ry + 19, settingsItems[i], 16, sel ? COL_BLACK : COL_GREEN);
      if (i === 2) {
        const v = debugMode ? 'ON' : 'OFF';
        const vw = measureTextStrW(v, 14);
        drawTextStr(ctx, 230 - vw, ry + 19, v, 14, sel ? COL_BLACK : COL_GRAY8);
      }
      if (i === 4) {
        const v = RINGTONES[settings.activeRingtoneIx].name;
        const vw = measureTextStrW(v, 12);
        drawTextStr(ctx, 230 - vw, ry + 19, v, 12, sel ? COL_BLACK : COL_GRAY6);
      }
    }
    softkeys(ctx, 'Select', 'Back');
  }
  else if (state === ST_STORAGE) {
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, 'Storage', 16, COL_WHITE);
    let y = 92;
    drawTextStr(ctx, 10, y, 'PHONE (internal)', 14, COL_GRAY8); y += 22;
    drawTextStr(ctx, 10, y, '1408 KB free', 14, COL_GREEN); y += 20;
    drawTextStr(ctx, 10, y, 'of 1472 KB', 14, COL_GREEN); y += 20;
    drawTextStr(ctx, 10, y, contacts.length + ' contacts', 14, COL_GRAY8); y += 20;
    drawTextStr(ctx, 10, y, messages.length + ' messages', 14, COL_GRAY8);
    y = 210;
    drawTextStr(ctx, 10, y, 'MEMORY CARD', 14, COL_GRAY8); y += 22;
    if (hardwareAPI.sd.isPresent()) {
      const used = hardwareAPI.sd.usedMB() + galleryPhotos.length;
      drawTextStr(ctx, 10, y, (hardwareAPI.sd.sizeMB() - used) + ' MB free', 14, COL_GREEN); y += 20;
      drawTextStr(ctx, 10, y, 'of ' + hardwareAPI.sd.sizeMB() + ' MB', 14, COL_GREEN);
    } else {
      drawTextStr(ctx, 10, y, 'Insert memory card', 14, COL_GRAY8);
    }
    softkeys(ctx, null, 'Back');
  }
  else if (state === ST_ABOUT) {
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, 'About', 16, COL_WHITE);
    let y = 96;
    drawTextStr(ctx, 10, y, 'PxP Flip', 16, COL_GREEN);            y += 26;
    drawTextStr(ctx, 10, y, 'Browser build', 14, COL_GRAY8);       y += 22;
    drawTextStr(ctx, 10, y, 'ESP32-S3 N16R8', 14, COL_GRAY8);      y += 22;
    drawTextStr(ctx, 10, y, 'Boot count ' + settings.bootCount, 14, COL_GRAY8); y += 22;
    drawTextStr(ctx, 10, y, 'Up ' + Math.floor((Date.now() - bootMs) / 60000) + ' min', 14, COL_GRAY8); y += 22;
    // 14px is scale 2 = 12px per character, so 20 characters is the most that
    // fits across 240px with a 10px margin. "Hardware is simulated" was 21 and
    // ran off the edge.
    drawTextStr(ctx, 10, y, 'Hardware simulated', 14, COL_GRAY6);
    softkeys(ctx, null, 'Back');
  }
  else if (state === ST_APPS || state === ST_GAMES) {
    // One list routine for both, because they are the same thing with different
    // contents. Settings uses the same shape.
    const games = (state === ST_GAMES);
    const items = games ? gamesItems : appsItems;
    const idx = games ? gamesIdx : appsIdx;
    const top = games ? gamesTop : appsTop;
    drawStatus(ctx, IN_W);
    drawTextStr(ctx, 10, 58, games ? 'Games' : 'Apps', 16, COL_WHITE);
    const rowH = 26, listTop = 72, visible = 8;
    for (let row = 0; row < visible; row++) {
      const i = top + row;
      if (i >= items.length) break;
      const ry = listTop + row * rowH, sel = (i === idx);
      if (sel) fbRect(ctx, 4, ry, 232, rowH, COL_GREEN);
      drawTextStr(ctx, 10, ry + 19, items[i], 16, sel ? COL_BLACK : COL_GREEN);
    }
    softkeys(ctx, 'Select', 'Back');
  }
  else if (state === ST_MENU) {
    drawStatus(ctx, IN_W);
    const name = menuNames[menuIdx];
    const sizes = [24, 20, 18, 16];
    let nameSize = sizes[0], nw = 0;
    for (const s of sizes) { nameSize = s; nw = measureTextStrW(name, s); if (nw <= IN_W - 20) break; }
    drawTextStr(ctx, centerX(IN_W, nw), 130, name, nameSize, COL_WHITE);
    drawTextStr(ctx, 15, 175, '<', 20, COL_GRAY6);
    const rw = measureTextStrW('>', 20);
    drawTextStr(ctx, IN_W - 15 - rw, 175, '>', 20, COL_GRAY6);
    const dotsX = centerX(IN_W, (menuCount - 1) * 25);
    for (let i = 0; i < menuCount; i++)
      fbCircle(ctx, dotsX + i * 25, 215, i === menuIdx ? 5 : 3, i === menuIdx ? COL_WHITE : COL_GRAY6);
    softkeys(ctx, 'Select', 'Back');
  }
  else if (state === ST_APP) {
    drawStatus(ctx, IN_W);
    const nw = measureTextStrW(comingSoonName, 24);
    drawTextStr(ctx, centerX(IN_W, nw), 130, comingSoonName, 24, COL_WHITE);
    const cw = measureTextStrW('Coming soon', 16);
    drawTextStr(ctx, centerX(IN_W, cw), 170, 'Coming soon', 16, COL_GRAY8);
    const ew = measureTextStrW('RIGHT to exit', 14);
    drawTextStr(ctx, centerX(IN_W, ew), 200, 'RIGHT to exit', 14, COL_GRAY6);
  }

  // Brief toast for things that happen off-screen, e.g. a dial refused because
  // there is no network. Above every screen, below the popup.
  if (Date.now() < callFlashUntil) {
    const fw = measureTextStrW(callFlash, 16);
    fbRect(ctx, centerX(IN_W, fw) - 8, 232, fw + 16, 28, COL_BLACK);
    fbOutline(ctx, centerX(IN_W, fw) - 8, 232, fw + 16, 28, COL_RED);
    drawTextStr(ctx, centerX(IN_W, fw), 252, callFlash, 16, COL_RED);
  }
  drawOptions(ctx);                    // the popup floats above whatever is behind it
  drawVolumeOverlay(ctx, IN_W, IN_H);  // and the meter floats above even that
}

function drawOuter(ctx) {
  marqueeShown = false;
  fbRect(ctx, 0, 0, OUT_W, OUT_H, COL_BLACK);
  if (state === ST_OFF) return;

  const ok = simReady() && networkRegistered();
  const bars = ok ? csqToBars(hardwareAPI.modem.getSignal()) : 0;
  drawSignalBars(ctx, 4, 4, 2, COL_GREEN, bars, !simReady());
  const bstr = hardwareAPI.getBatteryPercent() + '%';
  const bw = measureDigitStringW(bstr, 2);
  drawDigitString(ctx, alignRight(OUT_W, bw, 4), 4, bstr, 2, COL_GREEN);

  // While ringing or in-call the clock block is replaced with caller info. This
  // is the only screen visible with the flip shut, so it has to carry the call.
  if (state === ST_INCOMING_CALL || state === ST_INCALL) {
    const MARGIN = 4, MAXW = OUT_W - MARGIN * 2;
    if (state === ST_INCOMING_CALL)
      drawTextFitCentered(ctx, OUT_W, 44, 'Incoming', MAXW, 14, 10, COL_WHITE);
    const label = callNumber ? contactNameForNumber(callNumber) : 'Unknown';
    drawTextFitCentered(ctx, OUT_W, 68, label, MAXW, 14, 12, COL_GREEN);
    if (callNumber && label !== callNumber)
      drawTextFitCentered(ctx, OUT_W, 84, callNumber, MAXW, 10, 10, COL_GREEN);
    if (state === ST_INCALL) {
      if (callState === CALL_DIALING)
        drawTextFitCentered(ctx, OUT_W, 108, 'Calling...', MAXW, 14, 10, COL_GREEN);
      else
        drawTextFitCentered(ctx, OUT_W, 108,
          formatMMSS(callStartMs ? (Date.now() - callStartMs) / 1000 : 0), MAXW, 14, 10, COL_WHITE);
    }
    drawVolumeOverlay(ctx, OUT_W, OUT_H);
    return;
  }

  const d = new Date();
  const h = String(d.getHours()).padStart(2,'0');
  const m = String(d.getMinutes()).padStart(2,'0');
  const clockStr = h + ':' + m;
  const clockW = measureDigitStringW(clockStr, 6);
  const cb = drawDigitString(ctx, centerX(OUT_W, clockW), 35, clockStr, 6, COL_GREEN);
  const dateY = cb.y + cb.height + 6;
  const DU = DATE_UNIT_OUT, GAP = 3 * DU;
  const dayStr = String(d.getDate()).padStart(2,'0');
  const yearStr = String(d.getFullYear());
  const mW = measureLetterStringW(MONTHS[d.getMonth()], MONTH_UNIT_OUT);
  const dW = measureDigitStringW(dayStr, DU);
  const yW = measureDigitStringW(yearStr, DU);
  let x = centerX(OUT_W, mW + GAP + dW + DU + DU + GAP + yW);
  drawLetterString(ctx, x, dateY, MONTHS[d.getMonth()], MONTH_UNIT_OUT, COL_GREEN);
  x += mW + GAP;
  const db  = drawDigitString(ctx, x, dateY, dayStr, DU, COL_GREEN);
  const dot = drawPixelDigit(ctx, db.x + db.width + DU, dateY, '.', DU, COL_GREEN);
  drawDigitString(ctx, dot.x + dot.width + GAP, dateY, yearStr, DU, COL_GREEN);

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
let bootMs = Date.now();
function renderInner() { hardwareAPI.requestInnerFrame(); }
function renderOuter() { hardwareAPI.requestOuterFrame(); }

let dimTimer = null, sleepTimer = null, outerTimer = null, outerFadeTimer = null;
let bootTimer = null;

function clearScreenTimers() {
  if (dimTimer) clearTimeout(dimTimer);
  if (sleepTimer) clearTimeout(sleepTimer);
  dimTimer = sleepTimer = null;
}
function clearOuterTimer() { if (outerTimer) clearTimeout(outerTimer); outerTimer = null; }
function clearOuterFade()  { if (outerFadeTimer) clearInterval(outerFadeTimer); outerFadeTimer = null; }

function startScreenTimers() {
  clearScreenTimers();
  screenState = SCREEN_NORMAL;
  hardwareAPI.setInnerBrightness(100);
  // A ringing or connected call holds the screen awake. Nothing should dim
  // mid-call, and an incoming call must never be answered into a black panel.
  if (callState !== CALL_IDLE) return;
  dimTimer = setTimeout(function () {
    if (callState !== CALL_IDLE) return;
    printf('Dim'); screenState = SCREEN_DIMMED; hardwareAPI.setInnerBrightness(50);
  }, 20000);
  sleepTimer = setTimeout(function () {
    if (callState !== CALL_IDLE) return;
    printf('Sleep'); screenState = SCREEN_SLEEP; hardwareAPI.setInnerBrightness(0);
  }, 30000);
}
function startOuterTimer() {
  clearOuterTimer();
  outerTimer = setTimeout(function () { printf('Outer timeout'); fadeOuter(100, 0); }, 5000);
}
function fadeOuter(from, to) {
  clearOuterFade();
  const steps = Math.round(1000 / 30);
  let step = 0;
  outerFadeTimer = setInterval(function () {
    step++;
    hardwareAPI.setOuterBrightness(from + (to - from) * (step / steps));
    if (step >= steps) { clearOuterFade(); hardwareAPI.setOuterBrightness(to); }
  }, 30);
}

// Once-a-second refresh, same rule as the firmware's tickDeadline: the clock,
// the call timer and the flash toasts all need it.
setInterval(function () {
  if (state === ST_OFF) return;
  if (hardwareAPI.isFlipOpen()) { if (screenState !== SCREEN_SLEEP) renderInner(); }
  else renderOuter();
}, 1000);

// A marquee redrawn once a second does not look like it is moving, it looks
// broken. When one is on screen, redraw it at 30fps instead.
setInterval(function () {
  if (state === ST_OFF || !marqueeShown) return;
  if (hardwareAPI.isFlipOpen()) { if (screenState !== SCREEN_SLEEP) renderInner(); }
  else renderOuter();
}, 33);

// ==================== BUTTONS ====================
let repeatBtn = null, repeatTimer = null;
function startRepeat(btn, fn) {
  stopRepeat();
  repeatBtn = btn;
  repeatTimer = setTimeout(function tick() {
    if (repeatBtn !== btn) return;
    fn();
    repeatTimer = setTimeout(tick, 90);
  }, 450);
}
function stopRepeat() {
  if (repeatTimer) clearTimeout(repeatTimer);
  repeatTimer = null; repeatBtn = null;
}

function onButtonPress(btn) {
  if (state === ST_OFF) return;

  if (screenState === SCREEN_SLEEP) {          // wake, and eat the press
    printf('Wake from sleep'); startScreenTimers(); renderInner(); return;
  }
  if (screenState === SCREEN_DIMMED) {         // wake, and let the press through
    printf('Wake from dim'); startScreenTimers(); renderInner();
  }
  if (screenState === SCREEN_NORMAL) startScreenTimers();

  // ---- OPTIONS POPUP ----
  // While open it swallows every button, so nothing underneath reacts.
  if (optOpen) {
    if (btn === 'ARROW_UP')   { optionsMove(-1); return; }
    if (btn === 'ARROW_DOWN') { optionsMove(+1); return; }
    if (btn === 'BTN_OK' || btn === 'BTN_LEFT') { optionsSelect(); return; }
    if (btn === 'BTN_RIGHT')  { closeOptions(); return; }
    return;
  }

  // ---- CALLS ----
  // Ahead of every other screen: a live call takes priority over whatever else
  // was on screen, so its buttons have to win here too.
  if (state === ST_INCOMING_CALL) {
    // Answer on the left softkey (which is what the screen labels "Answer") and
    // the green call key ONLY. OK deliberately does nothing: it is the confirm
    // key everywhere else, and a stray press in a pocket must not pick up.
    if (btn === 'BTN_LEFT' || btn === 'BTN_CALL') { callAnswer(); return; }
    if (btn === 'BTN_RIGHT' || btn === 'BTN_HANGUP') { callHangup(); return; }
    return;
  }
  if (state === ST_INCALL) {
    if (callState === CALL_DIALING) {
      if (btn === 'BTN_RIGHT' || btn === 'BTN_HANGUP') { callHangup(); return; }
      return;
    }
    // Softkeys are Mute and Speaker, the two things you reach for mid-call.
    // Hanging up is the RED key or shutting the flip, so a misplaced softkey
    // press can never drop a call by accident.
    if (btn === 'BTN_LEFT')  { callToggleMute(); return; }
    if (btn === 'BTN_RIGHT') { callToggleSpeaker(); return; }
    if (btn === 'ARROW_UP' || btn === 'ARROW_DOWN') { callToggleSpeaker(); return; }
    if (btn === 'BTN_HANGUP') { callHangup(); return; }
    return;
  }

  // ---- APPS / GAMES ----
  if (state === ST_APPS || state === ST_GAMES) {
    const games = (state === ST_GAMES);
    const items = games ? gamesItems : appsItems;
    let idx = games ? gamesIdx : appsIdx;
    let top = games ? gamesTop : appsTop;
    if (btn === 'ARROW_UP' || btn === 'ARROW_DOWN') {
      [idx, top] = listMove(idx, top, items.length, 8, btn === 'ARROW_DOWN' ? 1 : -1);
      if (games) { gamesIdx = idx; gamesTop = top; } else { appsIdx = idx; appsTop = top; }
      renderInner();
      return;
    }
    if (btn === 'BTN_OK' || btn === 'BTN_LEFT') {
      // Voice memos is the only one actually built, on the phone and here.
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
      if (callLog.length) {
        [callLogIdx, callLogTop] = listMove(callLogIdx, callLogTop, callLog.length, 8,
                                            btn === 'ARROW_DOWN' ? 1 : -1);
        renderInner();
      }
      return;
    }
    if (btn === 'BTN_LEFT' && callLog.length) {
      openOptions(OPT_CALLLOG, ['Call', 'Send message', 'Save as contact', 'Delete entry', 'Delete all']);
      return;
    }
    if (btn === 'BTN_CALL' && callLog.length) {
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
      [ringtonePickerIdx, ringtonePickerTop] =
        listMove(ringtonePickerIdx, ringtonePickerTop, RINGTONE_COUNT, 6,
                 btn === 'ARROW_DOWN' ? 1 : -1);
      renderInner();
      return;
    }
    if (btn === 'BTN_OK' || btn === 'BTN_LEFT') {
      // One press does both: makes this the active ringtone AND previews it, so
      // picking and hearing what you picked is one action rather than two.
      settings.activeRingtoneIx = ringtonePickerIdx;
      settingsSave();
      ringtonePreview(ringtonePickerIdx);
      renderInner();
      return;
    }
    if (btn === 'BTN_RIGHT') { ringtoneStop(); state = ST_SETTINGS; renderInner(); return; }
    return;
  }

  // ---- SETTINGS ----
  if (state === ST_STORAGE || state === ST_ABOUT) {
    if (btn === 'BTN_RIGHT' || btn === 'BTN_OK') { state = ST_SETTINGS; renderInner(); }
    return;
  }
  if (state === ST_SETTINGS) {
    if (btn === 'ARROW_UP' || btn === 'ARROW_DOWN') {
      [setIdx] = listMove(setIdx, 0, settingsItems.length, 8, btn === 'ARROW_DOWN' ? 1 : -1);
      renderInner();
      return;
    }
    if (btn === 'BTN_OK' || btn === 'BTN_LEFT') {
      if (setIdx === 0) state = ST_STORAGE;
      else if (setIdx === 1) {
        if (!hardwareAPI.sd.isPresent()) printf('No memory card inserted');
        else { openOptions(OPT_FORMAT, ['Yes, erase all', 'Cancel']); return; }
      }
      else if (setIdx === 2) {
        debugMode = !debugMode;
        settings.debugMode = debugMode ? 1 : 0; settingsSave();
        printf(debugMode ? 'Debug boxes ON' : 'Debug boxes OFF');
      }
      else if (setIdx === 3) {
        const ss = hardwareAPI.modem.getSimState();
        if      (ss === 'ready') printf('SIM already unlocked');
        else if (ss === 'pin')   simPromptPin();
        else if (ss === 'puk')   simPromptPukConfirm();
        else printf('No SIM detected');
      }
      else if (setIdx === 4) {
        state = ST_RINGTONES;
        ringtonePickerIdx = settings.activeRingtoneIx;
        ringtonePickerTop = 0;
        if (ringtonePickerIdx >= 6) ringtonePickerTop = ringtonePickerIdx - 5;
      }
      else if (setIdx === 5) state = ST_ABOUT;
      renderInner();
      return;
    }
    if (btn === 'BTN_RIGHT') { state = ST_MENU; renderInner(); return; }
    return;
  }

  // ---- CAMERA ----
  if (state === ST_CAMERA) {
    if (btn === 'BTN_OK' || btn === 'BTN_CALL') { cameraShutter(); renderInner(); return; }
    if (btn === 'BTN_RIGHT') { cameraLeave(); state = ST_MENU; renderInner(); return; }
    if (btn === 'BTN_LEFT') { openOptions(OPT_CAMERA, ['View gallery']); return; }
    return;
  }

  // ---- GALLERY ----
  if (state === ST_PHOTO) {
    if (btn === 'ARROW_LEFT' || btn === 'ARROW_RIGHT') {
      if (galleryPhotos.length) {
        galleryIdx += (btn === 'ARROW_RIGHT') ? 1 : -1;
        if (galleryIdx < 0) galleryIdx = galleryPhotos.length - 1;
        if (galleryIdx >= galleryPhotos.length) galleryIdx = 0;
        renderInner();
      }
      return;
    }
    if (btn === 'BTN_RIGHT' || btn === 'BTN_OK') { state = ST_GALLERY; renderInner(); return; }
    if (btn === 'BTN_LEFT') { openOptions(OPT_GALLERY, ['Delete']); return; }
    return;
  }
  if (state === ST_GALLERY) {
    if (btn === 'ARROW_UP' || btn === 'ARROW_DOWN') {
      if (galleryPhotos.length) {
        [galleryIdx, galleryTop] = listMove(galleryIdx, galleryTop, galleryPhotos.length, 8,
                                            btn === 'ARROW_DOWN' ? 1 : -1);
        renderInner();
      }
      return;
    }
    if (btn === 'BTN_OK') {
      if (galleryPhotos.length) { printf('Opening photo...'); state = ST_PHOTO; renderInner(); }
      return;
    }
    if (btn === 'BTN_LEFT') { openOptions(OPT_GALLERY, ['Refresh', 'Delete']); return; }
    if (btn === 'BTN_RIGHT') { state = ST_MENU; renderInner(); return; }
    return;
  }

  // ---- VOICE MEMOS ----
  if (state === ST_VOICE) {
    if (btn === 'ARROW_UP' || btn === 'ARROW_DOWN') {
      if (voiceMemos.length) {
        [voiceIdx, voiceTop] = listMove(voiceIdx, voiceTop, voiceMemos.length, 8,
                                        btn === 'ARROW_DOWN' ? 1 : -1);
        renderInner();
      }
      return;
    }
    if (btn === 'BTN_OK') {
      // Empty list: go straight into recording instead of arming the screen and
      // waiting for a second OK press.
      if (voiceMemos.length === 0) { voiceRecEnter(); voiceRecStartCapture(); }
      else voicePlayEnter(voiceIdx);
      renderInner();
      return;
    }
    if (btn === 'BTN_LEFT') {
      openOptions(OPT_VOICE, voiceMemos.length ? ['New recording', 'Delete'] : ['New recording']);
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
      if (voiceRecState === VREC_READY) state = ST_VOICE;
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
    if (btn === 'BTN_RIGHT') { voicePlayExit(); return; }
    return;
  }

  // ---- TEXT EDITOR ----
  if (state === ST_TEXTEDIT) {
    if (btn.indexOf('NUM_') === 0) {
      const d = btn.slice(4);
      if      (d === 'HASH') textCycleCase();
      else if (d === 'STAR') textKeyPress('*');
      else if (d.length === 1) textKeyPress(d);
      renderInner();
      return;
    }
    if (btn === 'ARROW_LEFT')  { if (textCursor > 0) { textCursor--; tapKey = 0; textBlinkReset(); renderInner(); } return; }
    if (btn === 'ARROW_RIGHT') { if (textCursor < textBuf.length) { textCursor++; tapKey = 0; textBlinkReset(); renderInner(); } return; }
    if (btn === 'BTN_RIGHT') {
      if (textBuf.length === 0) { textEditCancel(); return; }
      textDelete();
      startRepeat('BTN_RIGHT', function () {      // hold to burst-delete
        if (state !== ST_TEXTEDIT) { stopRepeat(); return; }
        if (textBuf.length === 0) { stopRepeat(); return; }
        textDelete(); renderInner();
      });
      textBlinkReset();
      renderInner();
      return;
    }
    if (btn === 'BTN_OK' || btn === 'BTN_LEFT') { textEditCommit(); return; }
    return;
  }

  // ---- MESSAGES (thread list) ----
  if (state === ST_MESSAGES) {
    if (btn === 'ARROW_UP' || btn === 'ARROW_DOWN') {
      if (threadNumbers.length) {
        [threadIdx, threadTop] = listMove(threadIdx, threadTop, threadNumbers.length, 6,
                                          btn === 'ARROW_DOWN' ? 1 : -1);
        renderInner();
      }
      return;
    }
    if (btn === 'BTN_OK') {
      if (threadNumbers.length === 0) {
        chatNumber = ''; pendingMsgNumber = '';
        textEditOpen('To', '', TXT_MSG_NEWNUM, true, false);
      } else {
        chatNumber = threadNumbers[threadIdx];
        state = ST_CHAT;
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
    if (btn === 'BTN_CALL' && threadNumbers.length) { callDial(threadNumbers[threadIdx]); return; }
    if (btn === 'BTN_RIGHT') { state = ST_MENU; renderInner(); return; }
    return;
  }

  // ---- CHAT (open conversation) ----
  if (state === ST_CHAT) {
    if (btn === 'BTN_OK' || btn === 'BTN_LEFT') {
      pendingMsgNumber = '';   // replying to this thread: use chatNumber
      textEditOpen('Message', '', TXT_MSG_BODY, false, false);
      return;
    }
    if (btn === 'BTN_CALL' && chatNumber) { callDial(chatNumber); return; }
    if (btn === 'BTN_RIGHT') { state = ST_MESSAGES; threadsScan(); renderInner(); return; }
    return;
  }

  // ---- CONTACTS ----
  if (state === ST_CONTACTS) {
    if (btn === 'ARROW_UP' || btn === 'ARROW_DOWN') {
      if (contacts.length) {
        [contactIdx, contactTop] = listMove(contactIdx, contactTop, contacts.length, 8,
                                            btn === 'ARROW_DOWN' ? 1 : -1);
        renderInner();
      }
      return;
    }
    if (btn === 'BTN_CALL' && contacts.length) { callDial(contacts[contactIdx].number); return; }
    if (btn === 'BTN_LEFT') {
      openOptions(OPT_CONTACTS, contacts.length
        ? ['New contact', 'Write message', 'Call', 'Delete']
        : ['New contact']);
      return;
    }
    if (btn === 'BTN_OK') {
      if (contacts.length === 0) textEditOpen('Name', '', TXT_CONTACT_NAME, false, false);
      else printf('Contact: ' + contacts[contactIdx].name + ' ' + contacts[contactIdx].number);
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
        // press * twice within a second and it becomes + (international prefix)
        const now = Date.now();
        if (now - dialerStarTime < 1000 && dialerCursor > 0 && dialerDigits[dialerCursor - 1] === '*') {
          dialerDigits = dialerDigits.slice(0, dialerCursor - 1) + '+' + dialerDigits.slice(dialerCursor);
          renderInner();
        } else { insertDialerDigit('*'); dialerStarTime = now; }
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
      deleteDialerDigit();
      startRepeat('BTN_RIGHT', function () {     // hold to burst-delete
        if (state !== ST_DIALER || dialerDigits.length === 0) { stopRepeat(); return; }
        deleteDialerDigit();
      });
      return;
    }
    if (btn === 'BTN_LEFT') {
      openOptions(OPT_DIALER, ['Call', 'Save number', 'Send message', 'Clear all']);
      return;
    }
    if (btn === 'BTN_OK' || btn === 'BTN_CALL') {
      if (dialerDigits.length) callDial(dialerDigits);
      return;
    }
    return;
  }

  // From HOME, any number key opens the dialer AND types that digit.
  if (state === ST_HOME && btn.indexOf('NUM_') === 0) {
    enterDialer();
    const d = btn.slice(4);
    if      (d === 'STAR') { insertDialerDigit('*'); dialerStarTime = Date.now(); }
    else if (d === 'HASH') insertDialerDigit('#');
    else if (d.length === 1) insertDialerDigit(d);
    return;
  }

  // ---- HOME / MENU / COMING SOON ----
  if (btn === 'BTN_OK') {
    if (state === ST_HOME) { printf('Menu'); state = ST_MENU; menuIdx = 0; renderInner(); }
    else if (state === ST_MENU) { printf(menuNames[menuIdx]); menuOpen(menuIdx); renderInner(); }
  }
  else if (btn === 'BTN_LEFT') {
    if (state === ST_HOME) { printf('Menu'); state = ST_MENU; menuIdx = 0; renderInner(); }
    else if (state === ST_MENU) openOptions(OPT_MENU, ['Open', 'Back to home']);
    else if (state === ST_APP)  openOptions(OPT_APP,  ['Close', 'Back to home']);
  }
  else if (btn === 'BTN_RIGHT') {
    if (state === ST_HOME) { printf('Contacts'); state = ST_CONTACTS; contactIdx = 0; contactTop = 0; renderInner(); }
    else if (state === ST_APP) {
      // Back to wherever it was opened from. Apps and Games are one level down,
      // so always returning to the main menu skipped a level.
      printf('Back'); state = comingSoonReturn || ST_MENU; renderInner();
    }
    else if (state === ST_MENU) { printf('Back to home'); state = ST_HOME; renderInner(); }
  }
  else if (btn === 'BTN_CALL') {
    // Green key from home or menu opens the dialer, like every other phone.
    if (state === ST_HOME || state === ST_MENU) { enterDialer(); }
  }
  else if (btn === 'ARROW_LEFT') {
    if (state === ST_MENU) { menuIdx = (menuIdx - 1 + menuCount) % menuCount; printf(menuNames[menuIdx]); renderInner(); }
  }
  else if (btn === 'ARROW_RIGHT') {
    if (state === ST_MENU) { menuIdx = (menuIdx + 1) % menuCount; printf(menuNames[menuIdx]); renderInner(); }
  }
}

function onButtonRelease(btn) { if (repeatBtn === btn) stopRepeat(); }

// ==================== VOLUME KEYS ====================
// Order matters. During a call these keys ONLY silence the ringer - they must
// never reach the volume control, or answering a call would leave the phone at
// a level nobody chose.
function onVolumeButton(btn) {
  if (state === ST_OFF) return;
  if (callSilenceRing()) return;

  // A press on a DARK screen wakes it and does nothing else. Volume is the only
  // key reachable with the flip shut, so without this you could not check the
  // time without also nudging the level.
  if (!hardwareAPI.isFlipOpen()) {
    if (!outerFadeTimer && hardwareAPI.getOuterBrightness() === 0) {
      renderOuter(); fadeOuter(0, 100); startOuterTimer();
      return;
    }
  } else if (screenState === SCREEN_SLEEP) {
    printf('Wake from sleep'); startScreenTimers(); renderInner(); return;
  }
  volumeAdjust(btn === 'VOL_UP' ? +1 : -1);
}

// ==================== FLIP / POWER / BATTERY ====================
function onFlipChange(open) {
  printf(open ? 'Flip open' : 'Flip closed');
  if (open) {
    clearOuterTimer(); clearOuterFade();
    hardwareAPI.setOuterBrightness(0);
    if (state !== ST_OFF) { startScreenTimers(); renderInner(); }
  } else {
    // Closing during an ANSWERED call ends it, matching a real flip phone's
    // hang-up switch. Closing while still RINGING does not: the outer screen
    // shows the call instead, because closing the flip is not a decline.
    if (callState === CALL_ACTIVE) callHangup();
    clearScreenTimers();
    hardwareAPI.setInnerBrightness(0);
    if (state !== ST_OFF) {
      renderOuter();
      fadeOuter(0, 100);
      if (callState === CALL_IDLE) startOuterTimer();
    }
  }
}

function onPowerOn() {
  printf('Power ON');
  settingsLoad(); contactsLoad(); messagesLoad(); callLogLoad(); voiceScan();
  settings.bootCount++; settingsSave();
  debugMode = settings.debugMode === 1;
  bootMs = Date.now();
  state = ST_BOOT;
  screenState = SCREEN_NORMAL;
  hardwareAPI.setInnerBrightness(100);
  renderInner();
  if (bootTimer) clearTimeout(bootTimer);
  simPinAttempts = 0; simPinAutoPrompt = true; simPendingPuk = '';
  simLastState = '';            // forces simPollState() to fire on the first look
  bootTimer = setTimeout(function () {
    bootTimer = null;
    if (state !== ST_BOOT) return;
    state = ST_HOME; renderInner(); startScreenTimers();
    // A PIN-locked SIM asks at every boot, like any phone. This is the same
    // path the firmware takes: the first +CPIN poll after boot sees the state
    // change and pops the prompt on its own.
    simPollState();
  }, 2000);
}

function onPowerOff() {
  printf('Power OFF');
  ringtoneStop();
  cameraLeave();
  if (bootTimer) { clearTimeout(bootTimer); bootTimer = null; }
  state = ST_OFF;
  callState = CALL_IDLE; callNumber = '';
  screenState = SCREEN_NORMAL;
  optOpen = false; optOwner = OPT_NONE;
  clearScreenTimers(); clearOuterTimer(); clearOuterFade();
  stopRepeat();
}

function onBatteryChange(percent) {
  if (state === ST_OFF) return;
  if (hardwareAPI.isFlipOpen()) { if (screenState !== SCREEN_SLEEP) renderInner(); }
  else renderOuter();
}

// ==================== MODEM CALLBACKS ====================
function onIncomingCall(number) {
  // A powered-off phone must not ring. The modem stays powered even when the OS
  // is off, so RING still arrives - just ignore it.
  if (state === ST_OFF || callState !== CALL_IDLE) return;
  preCallState = (state === ST_TEXTEDIT || state === ST_DIALER) ? ST_HOME : state;
  callState = CALL_RINGING;
  state = ST_INCOMING_CALL;
  callNumber = number || '';
  // The popup floats above every screen AND swallows every button. Left open it
  // would hide the call and eat Answer/Decline.
  optOpen = false;
  ringtoneStart();
  printf('[Call] Incoming ' + (callNumber || 'unknown'));
  if (hardwareAPI.isFlipOpen()) {
    // The panel may be dimmed or fully asleep. Without this the call is drawn
    // into a black screen and the first press is eaten as "wake from sleep"
    // instead of answering.
    startScreenTimers();
    renderInner();
  } else {
    clearOuterTimer(); clearOuterFade();
    hardwareAPI.setOuterBrightness(100);
    renderOuter();
  }
}

function onCallConnected() { callConnected(); }

function onCallEnded(reason) {
  if (callState === CALL_IDLE) return;
  if (callState === CALL_DIALING) {
    callFinalize(CALL_OUT, 0);
    printf('[Call] Not answered');
  } else if (callState === CALL_RINGING) {
    missedCallCount++;
    callFinalize(CALL_MISSED, 0);
    printf('[Call] Missed');
  } else if (callState === CALL_ACTIVE) {
    const dur = callStartMs ? Math.floor((Date.now() - callStartMs) / 1000) : 0;
    callFinalize(callOutgoing ? CALL_OUT : CALL_IN, dur);
    audioBlip();
    printf('[Call] Ended');
  }
}

function onSMSReceived(number, text) {
  if (state === ST_OFF) return;
  messagesAdd(number, text, MSG_DIR_IN);
  // Sitting in the thread it lands in? Then it is read, not unread.
  if (state === ST_CHAT && chatNumber === number) {
    renderInner();
  } else {
    unreadTextCount++;
    if (state === ST_MESSAGES) threadsScan();
    if (hardwareAPI.isFlipOpen()) renderInner();
    else { clearOuterFade(); hardwareAPI.setOuterBrightness(100); renderOuter(); startOuterTimer(); }
  }
  printf('[SMS] From ' + number + ': ' + text);
}

function onSimChange(present) {
  if (state === ST_OFF) return;
  simPollState();
  if (hardwareAPI.isFlipOpen()) renderInner(); else renderOuter();
}

// ==================== FIRST RUN / SAMPLE DATA ====================
// A fresh browser gets two contacts and one thread, so the emulator has
// something to show. Delete them and they stay deleted.
//
// SEED_VERSION is bumped whenever the sample data itself changes. A browser
// holding an older version gets the new sample once - but only if what it holds
// still LOOKS like untouched sample data: two contacts, two messages on the
// sample number, one each way. Any real use changes that shape (replying makes
// three messages, adding someone makes three contacts, deleting makes none), so
// anything the user actually did is left alone.
//
// Deliberately matches on shape, never on stored names or message text. Keeping
// the old sample strings in this file just to recognise them later is exactly
// what this avoids.
const SEED_VERSION = 2;
const SEED_NUMBER  = '+36701234567';

function sampleDataUntouched() {
  return contacts.length === 2
      && contacts[1].number === SEED_NUMBER
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

  contacts = [
    { name: 'Mum', number: '+36301112222' },
    { name: 'P_P', number: SEED_NUMBER }
  ];
  contactsSave();
  const t = nowEpoch();
  messages = [
    { number: SEED_NUMBER, body: 'did the board turn up yet?', direction: MSG_DIR_IN,  epoch: t - 3600 },
    { number: SEED_NUMBER, body: 'yeah, soldering it now',     direction: MSG_DIR_OUT, epoch: t - 3500 }
  ];
  messagesSave();
  printf(empty ? 'First run - sample contacts and one thread'
               : 'Sample data refreshed');
}

// ==================== INIT ====================
function osInit() {
  state = ST_OFF;
  menuIdx = 0; appsIdx = 0; appsTop = 0; gamesIdx = 0; gamesTop = 0; setIdx = 0;
  contactIdx = 0; contactTop = 0; callLogIdx = 0; callLogTop = 0;
  threadIdx = 0; threadTop = 0; galleryIdx = 0; voiceIdx = 0;
  screenState = SCREEN_NORMAL;
  debugMode = false;
  optOpen = false; optOwner = OPT_NONE;
  callState = CALL_IDLE; callNumber = '';
  missedCallCount = 0; unreadTextCount = 0;
  clearScreenTimers(); clearOuterTimer(); clearOuterFade();
  stopRepeat();
  settingsLoad(); contactsLoad(); messagesLoad(); callLogLoad(); voiceScan();

  seedSampleData();
  threadsScan();
  printf('OS Ready - hold the red key 3s to power on');
}

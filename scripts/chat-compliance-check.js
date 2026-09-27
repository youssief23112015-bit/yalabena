/**
 * Chat compliance engine smoke test (SRS §6.1–6.4, §10 acceptance).
 * Runs evasion samples + false-positive samples against the COMPILED
 * ChatService.scanMessage(). Run `npm run build` first.
 *
 * Usage: node scripts/chat-compliance-check.js
 */
const { ChatService } = require('../dist/modules/chat/chat.service');

// scanMessage is pure — it never touches the repositories
const svc = new ChatService(null, null, null, null, null, null);

// ── Evasion samples that MUST be blocked/flagged (SRS 6.1–6.3) ──
const evasion = [
  // 6.1 Phone numbers
  '01012345678',
  'call me on 01198765432',
  '010 1234 5678',
  '010-1234-5678',
  '(010) 1234.5678',
  '+20 101 234 5678',
  '+201012345678',
  '0020 101 234 5678',
  '00201012345678',
  '٠١٠١٢٣٤٥٦٧٨', // Arabic-Indic digits
  'صفر واحد صفر واحد اتنين تلاته اربعه خمسه سته سبعه', // spelled-out AR
  'zero one zero one two three four five six seven eight', // spelled-out EN
  '0 1 0 1 2 3 4 5 6 7 8', // spaced digits
  'O1O l234 5678', // homoglyphs O->0, l->1
  'wa.me/201012345678',
  'https://api.whatsapp.com/send?phone=201012345678',

  // 6.2 Emails
  'my email is ahmed@gmail.com',
  'ahmed [at] gmail [dot] com',
  'ahmed(at)gmail(dot)com',
  'ahmed AT gmail DOT com',
  'ahmed at gmail dot com',
  'ahmed@gmail dot com',
  'a h m e d @ g m a i l . c o m',

  // 6.3 Social / messengers / trigger phrases
  'follow me t.me/ahmed_speakup',
  'my telegram: @ahmed123',
  'instagram: @ahmed.english',
  'كلمني بره',
  'ابعتلي على الواتس',
  'رقمي هو صفر واحد صفر',
  'DM me for private lessons',
  'text me when you finish',
  'call me at home',
  'my number is 01012345678',
];

// ── Legit messages that MUST pass (false-positive guard) ──
const legit = [
  'Hello teacher, I finished the homework',
  'See you at 5 pm tomorrow',
  'The lesson starts at 10:30',
  'We will meet at the gate', // "at" must not break normal English
  'Page 10 of 15 in the workbook',
  'I scored 85 on the quiz',
  'شكرا يا مستر على الحصة',
  'عندي سؤال عن الواجب',
  'What does "at" mean in this sentence?',
  'My exam is on 15/10/2026 at 3 pm',
  'I have 2 brothers and 3 sisters',
  'The course code is ENG-201',
];

let blocked = 0;
const missed = [];
for (const msg of evasion) {
  const r = svc.scanMessage(msg);
  if (r?.violation) blocked++;
  else missed.push(msg);
}

let passed = 0;
const falsePos = [];
for (const msg of legit) {
  const r = svc.scanMessage(msg);
  if (r?.violation) falsePos.push({ msg, rule: r.rule });
  else passed++;
}

const blockRate = ((blocked / evasion.length) * 100).toFixed(1);
console.log('════════════════ CHAT COMPLIANCE REPORT ════════════════');
console.log(`Evasion samples blocked : ${blocked}/${evasion.length}  (${blockRate}%)  — SRS target ≥95%`);
console.log(`Legit messages passed   : ${passed}/${legit.length}`);
if (missed.length) {
  console.log('\n❌ MISSED (should have been blocked):');
  missed.forEach((m) => console.log('   -', m));
}
if (falsePos.length) {
  console.log('\n⚠️  FALSE POSITIVES (legit but blocked):');
  falsePos.forEach((f) => console.log(`   - [${f.rule}]`, f.msg));
}
console.log('════════════════════════════════════════════════════════');

const ok = blocked / evasion.length >= 0.95 && falsePos.length === 0;
console.log(ok ? '✅ PASS' : '❌ FAIL');
process.exit(ok ? 0 : 1);

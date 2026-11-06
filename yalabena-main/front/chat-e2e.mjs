/**
 * TEMP E2E probe for the chat stack (delete before delivery).
 * Run from front/:  node chat-e2e.mjs [apiBase]
 * Covers: login -> consent -> rooms -> socket join -> send/receive ->
 *         violation blocking -> upload response shape.
 */
import { io } from 'socket.io-client';
import { writeFileSync } from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:3000/api/v1';
const out = [];
const log = (...a) => {
  const line = a.join(' ');
  console.log(line);
  out.push(line);
};

async function req(path, { method = 'GET', body, token, headers = {}, raw = false } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  if (raw) return { status: res.status, text: await res.text() };
  let json = null;
  try { json = await res.json(); } catch { /* ignore */ }
  return { status: res.status, json };
}

async function login(email, password) {
  const r = await req('/auth/login', { method: 'POST', body: { email, password } });
  const d = r.json?.data ?? r.json;
  return { status: r.status, token: d?.access_token, user: d?.user, raw: r.json };
}

function connectSocket(token, label) {
  return new Promise((resolve, reject) => {
    const socket = io('http://localhost:3000/chat', {
      transports: ['polling', 'websocket'],
      reconnection: false,
      timeout: 8000,
      auth: (cb) => cb({ token }),
    });
    const timer = setTimeout(() => reject(new Error(`${label}: connect timeout`)), 9000);
    socket.on('connect', () => {
      clearTimeout(timer);
      log(`[${label}] socket connected id=${socket.id}`);
      resolve(socket);
    });
    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      reject(new Error(`${label}: connect_error ${err.message}`));
    });
    socket.on('consent_required', (p) => log(`[${label}] EVENT consent_required ${JSON.stringify(p)}`));
    socket.on('chat_error', (p) => log(`[${label}] EVENT chat_error ${JSON.stringify(p)}`));
    socket.on('disconnect', (reason) => log(`[${label}] disconnected: ${reason}`));
  });
}

function once(socket, event, ms = 5000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout waiting for ${event}`)), ms);
    socket.once(event, (payload) => { clearTimeout(t); resolve(payload); });
  });
}

function emitAck(socket, event, payload, ms = 6000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout waiting ack for ${event}`)), ms);
    socket.emit(event, payload, (res) => { clearTimeout(t); resolve(res); });
  });
}

async function ensureConsent(token) {
  const g = await req('/chat/consent', { token });
  const accepted = g.json?.data?.accepted ?? g.json?.accepted;
  if (!accepted) await req('/chat/consent', { method: 'POST', token });
  return accepted;
}

async function main() {
  // 1 ─ Logins (admin = super_admin staff, student = room member)
  const admin = await login('test.admin@speakup.test', 'Admin@1234');
  log(`login admin: ${admin.status} token=${admin.token ? 'yes' : 'NO'}`);
  const student = await login('student.one@speakup.test', 'Test@1234');
  log(`login student: ${student.status} token=${student.token ? 'yes' : 'NO'} roles=${JSON.stringify(student.user?.roles)}`);
  if (!admin.token || !student.token) { log('ABORT: login failed'); return; }

  log(`consent admin: ${await ensureConsent(admin.token)}`);
  log(`consent student: ${await ensureConsent(student.token)}`);

  // 2 ─ Rooms for both users; find a shared room
  const roomsA = (await req('/chat/rooms', { token: admin.token })).json;
  const roomsS = (await req('/chat/rooms', { token: student.token })).json;
  const listA = roomsA?.data ?? roomsA;
  const listS = roomsS?.data ?? roomsS;
  log(`rooms admin=${Array.isArray(listA) ? listA.length : 'ERR'} student=${Array.isArray(listS) ? listS.length : 'ERR'}`);
  if (!Array.isArray(listA) || !listA.length) { log('ABORT: admin has no rooms'); return; }
  const shared = Array.isArray(listS) ? listA.filter((r) => listS.some((s) => s.id === r.id)) : [];
  log(`shared rooms: ${shared.length}`);
  const room = shared[0] ?? listA[0];
  if (!shared.length) log('WARN: no shared room — two-user delivery test will use admin only');

  // 3 ─ Room detail must NOT contain credential fields (security regression)
  const detail = await req(`/chat/rooms/${room.id}`, { token: admin.token });
  const detailText = JSON.stringify(detail.json);
  log(`room detail status=${detail.status} members=${detail.json?.data?.members?.length ?? '?'}`);
  log(`room detail leaks password_hash? ${detailText.includes('password_hash') ? 'YES (BUG)' : 'NO (ok)'}`);
  log(`room detail leaks two_factor_secret? ${detailText.includes('two_factor_secret') ? 'YES (BUG)' : 'NO (ok)'}`);

  // 4 ─ Two sockets
  const a = await connectSocket(admin.token, 'admin');
  const joinA = await emitAck(a, 'join_room', { room_id: room.id });
  log(`admin join_room: ${JSON.stringify(joinA)}`);

  let s = null;
  if (shared.length) {
    s = await connectSocket(student.token, 'student');
    const joinS = await emitAck(s, 'join_room', { room_id: room.id });
    log(`student join_room: ${JSON.stringify(joinS)}`);
  }

  // 5 ─ admin → student real-time delivery
  const studentWait = s ? once(s, 'new_message', 6000).catch((e) => ({ __err: e.message })) : null;
  const ack = await emitAck(a, 'send_message', { room_id: room.id, body: 'E2E admin→student ' + Date.now() });
  log(`send ack: ${ack?.success ? 'success' : JSON.stringify(ack)}`);
  if (studentWait) {
    const got = await studentWait;
    const shown = got?.__err ?? got?.body ?? JSON.stringify(got).slice(0, 120);
    log(`student received: ${String(shown).slice(0, 80)}`);
  }

  // 6 ─ Payload hygiene on new_message (sender must be sanitized)
  if (ack?.message) {
    const mt = JSON.stringify(ack.message);
    log(`ack.message leaks password_hash? ${mt.includes('password_hash') ? 'YES (BUG)' : 'NO (ok)'}`);
  }

  // 7 ─ History must be sanitized too
  const hist = await req(`/chat/rooms/${room.id}/messages?limit=5`, { token: admin.token });
  const ht = JSON.stringify(hist.json);
  log(`history leaks password_hash? ${ht.includes('password_hash') ? 'YES (BUG)' : 'NO (ok)'}`);
  const histData = hist.json?.data;
  log(`history shape ok? ${Array.isArray(histData?.data) ? 'yes ({data,total})' : typeof histData}`);

  // 8 ─ Violation must return the SRS §6.4 message (was 500 before)
  const bad = await emitAck(a, 'send_message', { room_id: room.id, body: 'call me at 01001234567' }).catch((e) => ({ __err: e.message }));
  log(`violation ack: ${JSON.stringify(bad)}`);

  // 9 ─ Moderator violations endpoint (correct path /chat/violations)
  const viol = await req('/chat/violations?limit=5', { token: admin.token });
  const vData = viol.json?.data ?? viol.json;
  log(`violations: ${viol.status} total=${vData?.total ?? '?'} rows=${Array.isArray(vData?.data) ? vData.data.length : 'ERR'}`);
  log(`violations leak password_hash? ${JSON.stringify(viol.json).includes('password_hash') ? 'YES (BUG)' : 'NO (ok)'}`);

  // 10 ─ Upload: allowed type (png) — frontend now unwraps {success,data}
  const png = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
  const fd = new FormData();
  fd.append('file', new Blob([png], { type: 'image/png' }), 'e2e.png');
  const up = await req('/chat/upload', { method: 'POST', token: admin.token, body: fd });
  const nested = up.json?.data?.url;
  log(`upload: ${up.status} wrappedDataUrl=${nested ?? 'MISSING'} rawUrl=${up.json?.url ?? 'n/a'}`);
  if (up.status === 201 && nested) {
    const sent = await emitAck(a, 'send_message', { room_id: room.id, type: 'image', file_url: nested, file_name: 'e2e.png' });
    log(`image message ack: ${sent?.success ? 'success' : JSON.stringify(sent)}`);
  }

  a.disconnect();
  if (s) s.disconnect();
}

main()
  .catch((e) => log('FATAL', e?.stack || String(e)))
  .finally(() => {
    writeFileSync(new URL('./chat-e2e-out.txt', import.meta.url), out.join('\n'), 'utf8');
    setTimeout(() => process.exit(0), 300);
  });


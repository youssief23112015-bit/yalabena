import { ChatService } from './chat.service';
import { normalizeChatMessage } from './utils/normalize-chat';
import { ViolationAction } from '../../common/enums/violation-action.enum';

/**
 * SRS 6.1–6.3 — compliance engine unit tests.
 * scanMessage() is pure (no repo access), so the service is built with
 * null dependencies; persistence paths are covered elsewhere.
 */
describe('ChatService — compliance engine', () => {
 const svc = new ChatService(
null as any, null as any, null as any, null as any,
    null as any, null as any, null as any, null as any,
    null as any, null as any, null as any
);
  describe('scanMessage — evasion MUST be caught', () => {
    const evasion: Array<[string, string, ViolationAction]> = [
      ['01012345678', 'phone_egyptian', ViolationAction.BLOCKED],
      ['010 1234 5678', 'phone_egyptian', ViolationAction.BLOCKED],
      ['010-1234-5678', 'phone_egyptian', ViolationAction.BLOCKED],
      ['+201012345678', 'phone_egyptian', ViolationAction.BLOCKED],
      ['00201012345678', 'phone_egyptian', ViolationAction.BLOCKED],
      ['٠١٠١٢٣٤٥٦٧٨', 'phone_egyptian', ViolationAction.BLOCKED], // Arabic-Indic digits
      ['0 1 0 1 2 3 4 5 6 7 8', 'phone_egyptian', ViolationAction.BLOCKED], // spaced
      ['O1O l234 5678', 'phone_egyptian', ViolationAction.BLOCKED], // homoglyphs
      ['zero one zero one two three four five six seven eight', 'phone_egyptian', ViolationAction.BLOCKED],
      ['صفر واحد صفر واحد اتنين تلاته اربعه خمسه سته سبعه', 'phone_generic', ViolationAction.BLOCKED], // 10 spelled digits → generic digit run
      ['my email is ahmed@gmail.com', 'email', ViolationAction.BLOCKED],
      ['ahmed [at] gmail [dot] com', 'email', ViolationAction.BLOCKED],
      ['ahmed AT gmail DOT com', 'email', ViolationAction.BLOCKED],
      ['a h m e d @ g m a i l . c o m', 'email', ViolationAction.BLOCKED],
      ['wa.me/201012345678', 'phone_egyptian', ViolationAction.BLOCKED], // link contains an EG number; phone rule fires first
      ['follow me t.me/ahmed_speakup', 'messenger_link', ViolationAction.BLOCKED],
      ['my telegram: @ahmed123', 'social_handle', ViolationAction.WARNED],
      ['instagram: @ahmed.english', 'social_handle', ViolationAction.WARNED],
      ['كلمني بره', 'trigger_contact_share', ViolationAction.BLOCKED],
      ['ابعتلي على الواتس', 'trigger_contact_share', ViolationAction.BLOCKED],
      ['DM me for private lessons', 'trigger_contact_share', ViolationAction.BLOCKED],
    ];

    it.each(evasion)('blocks %j via rule %s', (msg, rule, action) => {
      const r = svc.scanMessage(msg);
      expect(r).not.toBeNull();
      expect(r!.violation).toBe(true);
      expect(r!.rule).toBe(rule);
      expect(r!.action).toBe(action);
    });
  });

  describe('scanMessage — legit messages MUST pass (no false positives)', () => {
    const legit = [
      'Hello teacher, I finished the homework',
      'See you at 5 pm tomorrow',
      'The lesson starts at 10:30',
      'We will meet at the gate',
      'Page 10 of 15 in the workbook',
      'I scored 85 on the quiz',
      'شكرا يا مستر على الحصة',
      'عندي سؤال عن الواجب',
      'My exam is on 15/10/2026 at 3 pm',
      'The course code is ENG-201',
    ];

    it.each(legit)('allows %j', (msg) => {
      expect(svc.scanMessage(msg)).toBeNull();
    });

    it('returns null for empty input', () => {
      expect(svc.scanMessage('')).toBeNull();
      expect(svc.scanMessage(null as any)).toBeNull();
    });
  });
});

describe('normalizeChatMessage', () => {
  it('converts Arabic-Indic digits to Western', () => {
    expect(normalizeChatMessage('٠١٠١٢٣٤٥٦٧٨').canonical).toBe('01012345678');
  });

it('collapses "at"/"dot" email obfuscation', () => {
  const n = normalizeChatMessage('ahmed [at] gmail [dot] com');
  expect(n.canonical).toContain('ahmed@gmail.com');
});
  it('squashes separators between digits', () => {
    expect(normalizeChatMessage('010-1234-5678').squashed).toBe('01012345678');
  });

  it('maps homoglyphs only when adjacent to digits', () => {
    expect(normalizeChatMessage('O1O').squashed).toBe('010');
    // Plain words without digits are left alone
    expect(normalizeChatMessage('See you soon').canonical).toBe('See you soon');
  });

  it('handles null/undefined safely', () => {
    expect(normalizeChatMessage(null as any).canonical).toBe('');
  });
});

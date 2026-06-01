import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { VoiceService } from './voice.service';

// ── Mock @google/genai ────────────────────────────────────────────────────────
const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
  Type: {
    OBJECT: 'OBJECT', STRING: 'STRING', NUMBER: 'NUMBER',
    BOOLEAN: 'BOOLEAN', ARRAY: 'ARRAY',
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────
const geminiOk = (overrides: object = {}) =>
  mockGenerateContent.mockResolvedValueOnce({
    text: JSON.stringify({
      success: true,
      title: 'Lunch',
      amount: 50000,
      type: 'expense',
      category: 'Food',
      date: '2026-06-01',
      notes: null,
      confidence: 0.95,
      suggestedCategories: ['Food'],
      ...overrides,
    }),
  });

const geminiNoMatch = () =>
  mockGenerateContent.mockResolvedValueOnce({
    text: JSON.stringify({
      success: false,
      title: '', amount: 0, type: 'expense', category: 'Other',
      date: '2026-06-01', notes: null, confidence: 0, suggestedCategories: [],
    }),
  });

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('VoiceService', () => {
  let service: VoiceService;

  beforeEach(async () => {
    mockGenerateContent.mockReset();

    const module = await Test.createTestingModule({
      providers: [
        VoiceService,
        { provide: ConfigService, useValue: { getOrThrow: jest.fn().mockReturnValue('fake-key') } },
      ],
    }).compile();

    service = module.get(VoiceService);
  });

  // ─── Success path ───────────────────────────────────────────────────────────

  describe('parse – success path', () => {
    it('returns success=true with all fields mapped from Gemini response', async () => {
      geminiOk();
      const result = await service.parse({ text: 'I spent 50000 on lunch' });

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        title: 'Lunch', amount: 50000, type: 'expense',
        category: 'Food', date: '2026-06-01',
      });
      expect(result.confidence).toBe(0.95);
      expect(result.suggestedCategories).toContain('Food');
    });

    it('trims surrounding whitespace before sending to Gemini', async () => {
      geminiOk();
      const result = await service.parse({ text: '  spent 50000  ' });
      expect(result.rawText).toBe('spent 50000');
    });

    it('uses rawText as notes when Gemini returns null for notes', async () => {
      geminiOk({ notes: null });
      const result = await service.parse({ text: 'I spent 50000 on lunch' });
      expect(result.data!.notes).toBe('I spent 50000 on lunch');
    });

    it('falls back to today when Gemini returns an empty date', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-06-01T12:00:00Z'));

      geminiOk({ date: '' });
      const result = await service.parse({ text: 'spent 50000', timezoneOffset: 0 });
      expect(result.data!.date).toBe('2026-06-01');

      jest.useRealTimers();
    });

    it('clamps confidence above 1.0 down to 1', async () => {
      geminiOk({ confidence: 1.5 });
      const result = await service.parse({ text: 'spent 50000 on lunch' });
      expect(result.confidence).toBe(1);
    });

    it('clamps confidence below 0.0 up to 0', async () => {
      geminiOk({ confidence: -0.2 });
      const result = await service.parse({ text: 'spent 50000 on lunch' });
      expect(result.confidence).toBe(0);
    });

    it('maps income type correctly', async () => {
      geminiOk({ type: 'income', category: 'Salary', title: 'Salary', amount: 5_000_000 });
      const result = await service.parse({ text: 'received salary 5000000' });
      expect(result.data!.type).toBe('income');
      expect(result.data!.category).toBe('Salary');
    });
  });

  // ─── Failure path ───────────────────────────────────────────────────────────

  describe('parse – failure path', () => {
    it('returns success=false when Gemini cannot extract a transaction', async () => {
      geminiNoMatch();
      const result = await service.parse({ text: 'I had a great day' });

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.confidence).toBe(0);
      expect(result.suggestedCategories).toEqual([]);
    });

    it('returns success=false when Gemini marks success=true but amount is 0', async () => {
      geminiOk({ amount: 0 });
      const result = await service.parse({ text: 'no real amount here' });
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
    });

    it('returns success=false and does not throw when the Gemini API call fails', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('Network error'));
      const result = await service.parse({ text: 'spent 50000 on lunch' });

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
    });

    it('returns success=false when the API returns malformed JSON', async () => {
      mockGenerateContent.mockResolvedValueOnce({ text: 'not-valid-json' });
      const result = await service.parse({ text: 'spent 50000 on lunch' });

      expect(result.success).toBe(false);
    });
  });

  // ─── Prompt content ─────────────────────────────────────────────────────────

  describe('parse – prompt', () => {
    it('includes the raw user text in the prompt', async () => {
      geminiOk();
      await service.parse({ text: 'spent 50000 on lunch' });

      const call = mockGenerateContent.mock.calls[0][0];
      expect(call.contents).toContain('spent 50000 on lunch');
    });

    it('includes today\'s date in the prompt', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-06-01T12:00:00Z'));

      geminiOk();
      await service.parse({ text: 'spent 50000', timezoneOffset: 0 });

      const call = mockGenerateContent.mock.calls[0][0];
      expect(call.contents).toContain('2026-06-01');

      jest.useRealTimers();
    });

    it('resolves the correct local date from timezoneOffset', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-06-01T20:00:00Z')); // UTC 20:00

      geminiOk({ date: '2026-06-02' });
      // UTC+7 (offset = -420): local time = 2026-06-02T03:00 → date is 2026-06-02
      await service.parse({ text: 'spent 50000', timezoneOffset: -420 });

      const call = mockGenerateContent.mock.calls[0][0];
      expect(call.contents).toContain('2026-06-02');

      jest.useRealTimers();
    });

    it('passes the structured output config to Gemini', async () => {
      geminiOk();
      await service.parse({ text: 'spent 50000' });

      const call = mockGenerateContent.mock.calls[0][0];
      expect(call.config?.responseMimeType).toBe('application/json');
      expect(call.config?.responseSchema).toBeDefined();
    });
  });
});

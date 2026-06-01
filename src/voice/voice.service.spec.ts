import { Test } from '@nestjs/testing';
import { VoiceService } from './voice.service';

describe('VoiceService', () => {
  let service: VoiceService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [VoiceService],
    }).compile();
    service = module.get(VoiceService);
  });

  describe('parse – amount extraction', () => {
    it('returns failure when the input contains no number', () => {
      const result = service.parse({ text: 'I had a great day' });
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.confidence).toBe(0);
      expect(result.rawText).toBe('I had a great day');
    });

    it('extracts a plain integer amount', () => {
      const result = service.parse({ text: 'spent 50000' });
      expect(result.success).toBe(true);
      expect(result.data!.amount).toBe(50000);
    });

    it('expands a k-suffix to thousands', () => {
      const result = service.parse({ text: 'spent 50k' });
      expect(result.data!.amount).toBe(50000);
    });

    it('handles decimal amounts', () => {
      const result = service.parse({ text: 'paid 9.99 dollars' });
      expect(result.data!.amount).toBe(9.99);
    });

    it('trims surrounding whitespace from the input', () => {
      const result = service.parse({ text: '  spent 50000  ' });
      expect(result.rawText).toBe('spent 50000');
    });

    it('stores rawText as the notes field on the parsed data', () => {
      const result = service.parse({ text: 'spent 50000 on lunch' });
      expect(result.data!.notes).toBe(result.rawText);
    });
  });

  describe('parse – type detection', () => {
    it('defaults to expense when no type keyword is present', () => {
      const result = service.parse({ text: '50000 on food' });
      expect(result.data!.type).toBe('expense');
    });

    it('detects income from an income keyword', () => {
      const result = service.parse({ text: 'received salary 5000000' });
      expect(result.data!.type).toBe('income');
    });

    it('prefers expense when both income and expense keywords are present', () => {
      const result = service.parse({ text: 'I earned but spent 50000' });
      expect(result.data!.type).toBe('expense');
    });
  });

  describe('parse – category detection', () => {
    it('detects Food category from "lunch"', () => {
      const result = service.parse({ text: 'spent 50000 on lunch' });
      expect(result.data!.category).toBe('Food');
    });

    it('detects Transport category from "taxi"', () => {
      const result = service.parse({ text: 'paid 50000 for taxi' });
      expect(result.data!.category).toBe('Transport');
    });

    it('detects Health category from "gym"', () => {
      const result = service.parse({ text: 'paid 200000 for gym' });
      expect(result.data!.category).toBe('Health');
    });

    it('falls back to Other and returns ["Other"] when no keyword matches', () => {
      const result = service.parse({ text: 'spent 50000' });
      expect(result.data!.category).toBe('Other');
      expect(result.suggestedCategories).toEqual(['Other']);
    });

    it('lists all matched categories in suggestedCategories', () => {
      // "food" → Food, "gym" → Health
      const result = service.parse({ text: 'paid 100000 for food and gym' });
      expect(result.suggestedCategories).toContain('Food');
      expect(result.suggestedCategories).toContain('Health');
    });
  });

  describe('parse – title extraction', () => {
    it('extracts a title from the "on <thing>" pattern', () => {
      const result = service.parse({ text: 'I spent 50000 on lunch yesterday' });
      expect(result.data!.title).toBe('Lunch');
    });

    it('extracts a title from the "for <thing>" pattern', () => {
      const result = service.parse({ text: 'paid 50000 for taxi' });
      expect(result.data!.title).toBe('Taxi');
    });

    it('falls back to the category name when no title pattern matches', () => {
      const result = service.parse({ text: 'spent 50000' });
      expect(result.data!.title).toBe(result.data!.category);
    });
  });

  describe('parse – date parsing', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-06-01T12:00:00Z'));
    });

    afterEach(() => jest.useRealTimers());

    it('uses today when no date keyword is present (UTC offset 0)', () => {
      const result = service.parse({ text: 'spent 50000', timezoneOffset: 0 });
      expect(result.data!.date).toBe('2026-06-01');
    });

    it('returns yesterday for the "yesterday" keyword', () => {
      const result = service.parse({ text: 'spent 50000 yesterday', timezoneOffset: 0 });
      expect(result.data!.date).toBe('2026-05-31');
    });

    it('returns 7 days ago for the "last week" keyword', () => {
      const result = service.parse({ text: 'spent 50000 last week', timezoneOffset: 0 });
      expect(result.data!.date).toBe('2026-05-25');
    });

    it('uses an explicit ISO date when one is present in the text', () => {
      const result = service.parse({ text: 'spent 50000 on 2025-12-25' });
      expect(result.data!.date).toBe('2025-12-25');
    });
  });

  describe('parse – confidence score', () => {
    it('is 0 when parsing fails', () => {
      expect(service.parse({ text: 'no numbers here' }).confidence).toBe(0);
    });

    it('is 0.4 for amount alone with no other signals', () => {
      // plain number, no type keyword, no category, no title pattern
      expect(service.parse({ text: '50000' }).confidence).toBe(0.4);
    });

    it('increases with each additional signal', () => {
      const amount   = service.parse({ text: '50000' });
      const keyword  = service.parse({ text: 'spent 50000' });
      const category = service.parse({ text: 'spent 50000 on lunch' });
      expect(keyword.confidence).toBeGreaterThan(amount.confidence);
      expect(category.confidence).toBeGreaterThan(keyword.confidence);
    });

    it('never exceeds 1.0', () => {
      const result = service.parse({ text: 'I spent 50000 on lunch yesterday' });
      expect(result.confidence).toBeLessThanOrEqual(1.0);
    });
  });
});

import { Injectable } from '@nestjs/common';
import { VoiceParseRequestDto } from './dto/voice-parse-request.dto';
import { CreateTransactionDto } from '../transactions/dto/create-transaction.dto';

export interface VoiceParseResponse {
  success: boolean;
  data: CreateTransactionDto | null;
  confidence: number;
  rawText: string;
  suggestedCategories?: string[];
}

const EXPENSE_KEYWORDS = ['spent', 'spend', 'paid', 'pay', 'bought', 'buy', 'purchased', 'cost', 'expense'];
const INCOME_KEYWORDS = ['earned', 'earn', 'received', 'receive', 'got paid', 'income', 'salary', 'wage', 'profit', 'deposit'];

const CATEGORIES: Array<{ name: string; keywords: string[] }> = [
  { name: 'Food', keywords: ['food', 'lunch', 'dinner', 'breakfast', 'eat', 'restaurant', 'meal', 'coffee', 'drink', 'snack', 'groceries', 'grocery', 'cafe'] },
  { name: 'Transport', keywords: ['uber', 'grab', 'taxi', 'bus', 'transport', 'ride', 'gas', 'fuel', 'parking', 'train', 'metro', 'petrol'] },
  { name: 'Shopping', keywords: ['clothes', 'shopping', 'shop', 'store', 'purchase', 'amazon', 'mall', 'market', 'shoes'] },
  { name: 'Entertainment', keywords: ['movie', 'game', 'netflix', 'spotify', 'music', 'cinema', 'concert', 'entertainment'] },
  { name: 'Health', keywords: ['medicine', 'doctor', 'pharmacy', 'hospital', 'medical', 'health', 'gym', 'clinic'] },
  { name: 'Utilities', keywords: ['electricity', 'water', 'internet', 'bill', 'phone', 'rent', 'utilities'] },
  { name: 'Salary', keywords: ['salary', 'wage', 'paycheck', 'payroll'] },
];

@Injectable()
export class VoiceService {
  parse(dto: VoiceParseRequestDto): VoiceParseResponse {
    const rawText = dto.text.trim();
    const lower = rawText.toLowerCase();

    const amount = this.extractAmount(lower);
    if (amount === null) {
      return { success: false, data: null, confidence: 0, rawText, suggestedCategories: [] };
    }

    const type = this.detectType(lower);
    const { category, suggestedCategories } = this.detectCategory(lower);
    const title = this.extractTitle(rawText, category);
    const date = this.parseDate(lower, dto.timezoneOffset);

    // Confidence: 0.4 base (found amount) + 0.2 each for type signal, category match, title extraction
    let confidence = 0.4;
    if (EXPENSE_KEYWORDS.some((k) => lower.includes(k)) || INCOME_KEYWORDS.some((k) => lower.includes(k))) confidence += 0.2;
    if (category !== 'Other') confidence += 0.2;
    if (title !== category) confidence += 0.2;

    return {
      success: true,
      data: { title, amount, type, category, date, notes: rawText },
      confidence: Math.round(confidence * 100) / 100,
      rawText,
      suggestedCategories,
    };
  }

  private extractAmount(lower: string): number | null {
    // Handles: $50, 50k, 50 dollars, 50000 vnd, 50.5, 1,000
    const match = lower.match(/(?:[$₫đ]\s*)?(\d[\d,]*(?:\.\d+)?)(\s*k)?\s*(?:dollars?|usd|vnd|dong|bucks?|đ\b)?/);
    if (!match) return null;

    let amount = parseFloat(match[1].replace(/,/g, ''));
    if (match[2]) amount *= 1000; // "k" suffix
    return isNaN(amount) ? null : amount;
  }

  private detectType(lower: string): 'income' | 'expense' {
    const isIncome = INCOME_KEYWORDS.some((k) => lower.includes(k));
    const isExpense = EXPENSE_KEYWORDS.some((k) => lower.includes(k));
    // Income only if explicitly mentioned and no expense keyword overrides
    return isIncome && !isExpense ? 'income' : 'expense';
  }

  private detectCategory(lower: string): { category: string; suggestedCategories: string[] } {
    const matched: string[] = [];
    for (const { name, keywords } of CATEGORIES) {
      if (keywords.some((k) => lower.includes(k))) matched.push(name);
    }
    return {
      category: matched[0] ?? 'Other',
      suggestedCategories: matched.length ? matched : ['Other'],
    };
  }

  private extractTitle(original: string, fallback: string): string {
    // "on <thing>" or "for <thing>" — capture until a date/number boundary
    const onMatch = original.match(/\b(?:on|for)\s+([a-zA-Z][a-zA-Z\s]{1,30}?)(?:\s+(?:yesterday|today|last|\d)|$)/i);
    if (onMatch) return this.capitalize(onMatch[1].trim());
    return fallback;
  }

  private parseDate(lower: string, timezoneOffset?: number): string {
    // timezoneOffset from Date.getTimezoneOffset(): UTC - local in minutes
    const now = timezoneOffset !== undefined
      ? new Date(Date.now() - timezoneOffset * 60000)
      : new Date();

    if (lower.includes('yesterday')) {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    }
    if (lower.includes('last week')) {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d.toISOString().split('T')[0];
    }
    const isoMatch = lower.match(/(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) return isoMatch[1];

    return now.toISOString().split('T')[0];
  }

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

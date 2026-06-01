import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';
import { VoiceParseRequestDto } from './dto/voice-parse-request.dto';
import { CreateTransactionDto } from '../transactions/dto/create-transaction.dto';

export interface VoiceParseResponse {
  success: boolean;
  data: CreateTransactionDto | null;
  confidence: number;
  rawText: string;
  suggestedCategories: string[];
}

// Structured output schema — Gemini is constrained to return valid JSON matching this shape.
const EXTRACTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    success:             { type: Type.BOOLEAN, description: 'True if a financial transaction was found.' },
    title:               { type: Type.STRING,  description: 'Short human-readable label for the transaction.' },
    amount:              { type: Type.NUMBER,  description: 'Transaction amount as a positive number.' },
    type:                { type: Type.STRING,  enum: ['income', 'expense'] },
    category:            { type: Type.STRING,  enum: ['Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Utilities', 'Salary', 'Other'] },
    date:                { type: Type.STRING,  description: 'Resolved date in YYYY-MM-DD format.' },
    notes:               { type: Type.STRING,  nullable: true },
    confidence:          { type: Type.NUMBER,  description: 'Parsing confidence between 0.0 and 1.0.' },
    suggestedCategories: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['success', 'title', 'amount', 'type', 'category', 'date', 'confidence', 'suggestedCategories'],
};

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);
  private readonly ai: GoogleGenAI;

  constructor(config: ConfigService) {
    this.ai = new GoogleGenAI({ apiKey: config.getOrThrow<string>('GEMINI_API_KEY') });
  }

  async parse(dto: VoiceParseRequestDto): Promise<VoiceParseResponse> {
    const rawText = dto.text.trim();
    const today = this.resolveLocalDate(dto.timezoneOffset);

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: this.buildPrompt(rawText, today),
        config: {
          responseMimeType: 'application/json',
          responseSchema: EXTRACTION_SCHEMA,
        },
      });

      const extracted = JSON.parse(response.text ?? '');

      if (!extracted.success || !extracted.amount) {
        return { success: false, data: null, confidence: 0, rawText, suggestedCategories: [] };
      }

      return {
        success: true,
        data: {
          title:    extracted.title,
          amount:   extracted.amount,
          type:     extracted.type,
          category: extracted.category,
          date:     extracted.date || today,
          notes:    extracted.notes ?? rawText,
        },
        confidence:          Math.min(Math.max(extracted.confidence, 0), 1),
        rawText,
        suggestedCategories: extracted.suggestedCategories ?? [],
      };
    } catch (error) {
      this.logger.error('Gemini voice parse failed', error?.message);
      return { success: false, data: null, confidence: 0, rawText, suggestedCategories: [] };
    }
  }

  private buildPrompt(text: string, today: string): string {
    return [
      `You are a financial transaction parser for a personal expense tracking app.`,
      `Today's date is ${today}.`,
      ``,
      `Extract a transaction from the following voice or text input:`,
      `"${text}"`,
      ``,
      `Rules:`,
      `- Set success=true only when the input clearly describes a financial transaction with an identifiable amount.`,
      `- Interpret relative dates ("today", "yesterday", "last week") using today's date (${today}).`,
      `- confidence: 0.0–1.0 reflecting how unambiguously the transaction is described.`,
      `- suggestedCategories: all plausible categories (at minimum ["Other"]).`,
      `- If success=false, still fill every field with sensible defaults (amount=0, type="expense", etc.).`,
    ].join('\n');
  }

  // timezoneOffset from Date.getTimezoneOffset(): UTC − local in minutes.
  private resolveLocalDate(timezoneOffset?: number): string {
    const now = timezoneOffset !== undefined
      ? new Date(Date.now() - timezoneOffset * 60000)
      : new Date();
    return now.toISOString().split('T')[0];
  }
}

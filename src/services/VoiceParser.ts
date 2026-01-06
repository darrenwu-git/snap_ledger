
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Category, TransactionType } from '../types';

export interface ParsedTransaction {
  amount: number;
  categoryId?: string;
  type: TransactionType;
  note: string;
  date: string;
  confidence: number;
}

export type VoiceIntent =
  | { type: 'transaction'; data: ParsedTransaction }
  | { type: 'uncategorized'; data: Partial<ParsedTransaction> & { originalText: string } }
  | { type: 'non_accounting'; message: string };

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const parseVoiceInput = async (audioBlob: Blob, categories: Category[], apiKey: string): Promise<VoiceIntent> => {
  if (!apiKey || apiKey.trim() === '') {
    return {
      type: 'non_accounting',
      message: "⚠️ Missing Gemini API Key. Please click the Gear icon to set it up."
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const categoryList = categories.map(c => `- ${c.name} (ID: ${c.id}, Type: ${c.type})`).join('\n');
    const today = new Date().toISOString().split('T')[0];

    const prompt = `
You are a smart financial assistant. Listen to the audio and extract the transaction details.

Available Categories:
${categoryList}

Current Date: ${today}

Rules:
1. AUDIO ANALYSIS: Listen to the user's speech.
2. Identify if this is a transaction (expense/income) or purely non-accounting speech.
3. If it is a transaction, extract:
   - Amount (number)
   - Category ID (map to closest ID. If unsure, null)
   - Type (expense/income)
   - Date (YYYY-MM-DD)
   - Note (Summarize in Traditional Chinese (Taiwan/繁體中文))
4. CONFIDENCE check:
   - If amount, category, and date are clear -> confidence: 1.0
   - If category is ambiguous -> confidence: 0.6
   - If amount missing -> confidence: 0.0
5. LANGUAGE OUTPUT:
   - All text fields (note, message) MUST be in Traditional Chinese (Taiwan/繁體中文) ONLY.

Return ONLY raw JSON:
{
  "is_transaction": boolean,
  "amount": number | null,
  "categoryId": string | null,
  "type": "expense" | "income",
  "date": string,
  "note": string,
  "message": string,
  "confidence": number
}
`;

    const base64Audio = await blobToBase64(audioBlob);

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: audioBlob.type || 'audio/webm',
          data: base64Audio
        }
      }
    ]);

    const responseText = result.response.text();
    console.log("Gemini Raw Response:", responseText);

    // Clean potential markdown code blocks
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonStr);

    if (!data.is_transaction) {
      return { type: 'non_accounting', message: data.message || "I didn't catch a transaction in that." };
    }

    // Determine type based on data completeness
    // If we have amount and date, it's at least a draft transaction
    if (typeof data.amount === 'number') {
      const confidence = data.confidence || (data.categoryId ? 0.9 : 0.5);
      return {
        type: 'transaction',
        data: {
          amount: data.amount,
          categoryId: data.categoryId || '', // Emtpy string if unknown
          type: data.type || 'expense', // Default to expense
          date: data.date || today,
          note: data.note || '',
          confidence: confidence
        }
      };
    } else {
      return { type: 'non_accounting', message: "I heard numbers but couldn't make sense of the transaction." };
    }

  } catch (error) {
    console.error("Gemini Parse Error:", error);
    return {
      type: 'non_accounting',
      message: "❌ AI processing failed. Please check your API Key or try again."
    };
  }
};

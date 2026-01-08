import type { Category, TransactionType } from '../types';

export interface ParsedTransaction {
  amount: number;
  categoryId?: string;
  type: TransactionType;
  note: string;
  date: string;
  confidence: number;
  newCategory?: {
    name: string;
    icon: string;
    type: TransactionType;
  };
}

export type VoiceIntent =
  | { type: 'transaction'; data: ParsedTransaction }
  | { type: 'uncategorized'; data: Partial<ParsedTransaction> & { originalText: string } }
  | { type: 'non_accounting'; message: string };

const API_BASE_URL = '/api';

interface ParseOptions {
  allowAutoCategoryCreation: boolean;
}

export const parseVoiceInput = async (
  audioBlob: Blob,
  categories: Category[],
  apiKey: string,
  options: ParseOptions = { allowAutoCategoryCreation: false }
): Promise<VoiceIntent> => {
  if (!apiKey || apiKey.trim() === '') {
    return {
      type: 'non_accounting',
      message: "⚠️ Missing API Key. Please click the Gear icon to set up your AI Builder Space API Key."
    };
  }

  try {
    // Step 1: Transcribe Audio
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'recording.webm');
    // Optional: Add language hint if supported/needed, e.g., 'zh-TW'
    // formData.append('language', 'zh-TW'); 

    const transcriptResponse = await fetch(`${API_BASE_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text();
      console.error("Transcription API Error:", errorText);
      throw new Error(`Transcription failed: ${transcriptResponse.statusText}`);
    }

    const transcriptData = await transcriptResponse.json();
    const transcribedText = transcriptData.text;

    console.log("Transcribed Text:", transcribedText);

    if (!transcribedText || transcribedText.trim().length === 0) {
      return { type: 'non_accounting', message: "I didn't hear anything clearly." };
    }

    // Step 2: Parse Transaction Logic (using Chat Completion)
    const categoryList = categories.map(c => `- ${c.name} (ID: ${c.id}, Type: ${c.type})`).join('\n');
    const today = new Date().toISOString().split('T')[0];

    const newCategoryInstructions = options.allowAutoCategoryCreation
      ? `6. NEW CATEGORY:
   - If NONE of the existing categories fit well, you MAY suggest a new category.
   - Set "categoryId" to null.
   - Fill "new_category" object with:
     - "name": Concise name (Traditional Chinese)
     - "icon": A single emoji representing the category
     - "type": "expense" or "income"
   - If an existing category is a good fit, do NOT suggest a new one.`
      : `6. NEW CATEGORY:
   - Do NOT suggest new categories. If no category fits, set "categoryId" to null.`;

    const systemPrompt = `
You are a smart financial assistant. user has provided a transaction description.
Analyze the text and extract the transaction details.

Available Categories:
${categoryList}

Current Date: ${today}

Rules:
1. ANALYSIS: text is the user's spoken input.
2. Identify if this is a transaction (expense/income) or purely non-accounting speech.
3. If it is a transaction, extract:
   - Amount (number)
   - Category ID (map to closest ID. If unsure, null)
   - Type (expense/income)
   - Date (YYYY-MM-DD)
   - Note (Summarize in Traditional Chinese (Taiwan/繁體中文))
4. CONFIDENCE check:
   - If amount, category (or valid new category), and date are clear -> confidence: 1.0
   - If category is ambiguous -> confidence: 0.6
   - If amount missing -> confidence: 0.0
5. LANGUAGE OUTPUT:
   - All text fields (note, message, new category name) MUST be in Traditional Chinese (Taiwan/繁體中文) ONLY.
${newCategoryInstructions}

Return ONLY raw JSON:
{
  "is_transaction": boolean,
  "amount": number | null,
  "categoryId": string | null,
  "type": "expense" | "income",
  "date": string,
  "note": string,
  "message": string,
  "confidence": number,
  "new_category": {
    "name": string,
    "icon": string,
    "type": "expense" | "income"
  } | null
}
`;

    const chatResponse = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gemini-2.5-pro", // Or "supermind-agent-v1" / "deepseek"
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcribedText }
        ],
        temperature: 0.1
      })
    });

    if (!chatResponse.ok) {
        const errorText = await chatResponse.text();
        console.error("Chat API Error:", errorText);
        throw new Error(`Parsing failed: ${chatResponse.statusText}`);
    }

    const chatData = await chatResponse.json();
    const content = chatData.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from AI");
    }

    console.log("AI Parse Response:", content);

    // Clean potential markdown code blocks
    const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonStr);

    if (!data.is_transaction) {
      return { 
        type: 'non_accounting', 
        message: data.message || "I didn't catch a transaction in that.",
        // originalText: transcribedText // Optional: could pass back original text
      };
    }

    // Determine type based on data completeness
    if (typeof data.amount === 'number') {
      let confidence = data.confidence || 0.5;

      // Boost confidence if we have a valid new category suggestion
      if (!data.categoryId && data.new_category && options.allowAutoCategoryCreation) {
        if (confidence < 0.9) confidence = 0.9; // Trust the AI's creation if specifically asked
      } else if (data.categoryId) {
        if (confidence < 0.9) confidence = 0.9;
      }

      return {
        type: 'transaction',
        data: {
          amount: data.amount,
          categoryId: data.categoryId || '', // Empty string if null
          type: data.type || 'expense',
          date: data.date || today,
          note: data.note || '',
          confidence: confidence,
          newCategory: data.new_category || undefined
        }
      };
    } else {
      return { type: 'non_accounting', message: "I heard numbers but couldn't make sense of the transaction." };
    }

  } catch (error) {
    console.error("Voice Processing Error:", error);
    return {
      type: 'non_accounting',
      message: "❌ AI processing failed. Please check your API Key."
    };
  }
};

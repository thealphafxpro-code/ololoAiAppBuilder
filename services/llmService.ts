import { Settings, Message, SYSTEM_PROMPT } from '../types';

export const generateCode = async (
  prompt: string,
  settings: Settings,
  currentCode: string
): Promise<string> => {
  const messages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    // Context management: simplified to avoid token overflow, but keeps current state
    ...(currentCode ? [{ role: 'assistant' as const, content: currentCode }] : []),
    { role: 'user', content: prompt }
  ];

  try {
    const response = await fetch(settings.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.modelId,
        messages: messages,
      })
    });

    // Anti-Crash JSON Logic: Read text first
    const text = await response.text();

    if (!response.ok) {
      alert("API Error: " + text);
      throw new Error("API Error: " + text);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error("Failed to parse API response as JSON: " + text.substring(0, 100) + "...");
    }
    
    // OpenRouter/OpenAI compatible response structure
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Invalid API response format: No content found.");
    }

    // Aggressive cleanup to handle models that ignore system prompts
    let cleanContent = content;
    
    // Remove markdown code blocks
    cleanContent = cleanContent.replace(/```html/gi, '').replace(/```/g, '');
    
    // Trim whitespace
    return cleanContent.trim();

  } catch (error) {
    console.error("LLM Generation Failed:", error);
    throw error;
  }
};
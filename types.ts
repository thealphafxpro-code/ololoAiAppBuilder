export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface Settings {
  apiUrl: string;
  apiKey: string;
  modelId: string;
}

export interface Project {
  id: string;
  name: string;
  code: string; // The current HTML code
  lastModified: number;
  history: string[]; // Array of past code states
  historyIndex: number; // Current position in the history array
}

export const DEFAULT_SETTINGS: Settings = {
  apiUrl: "https://openrouter.ai/api/v1/chat/completions",
  apiKey: "",
  modelId: "deepseek/deepseek-r1:free"
};

export const SYSTEM_PROMPT = "You are an expert web developer specializing in modern, responsive design using Tailwind CSS. Output ONLY valid, raw HTML code (including <style> and <script> tags if needed). Do NOT wrap the code in markdown code blocks (e.g., ```html). Do NOT include explanations. Ensure the code is self-contained and works in an iframe.";
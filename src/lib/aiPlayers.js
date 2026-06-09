import { supabase } from '../supabaseClient';
// This assumes we will call a custom edge function or backend API endpoint to invoke Gemini.
// In the Workshop environment, if the user requested Gemini, they usually have an API key. 
// We will export a generic askGemini function.

export async function askGemini(prompt) {
  try {
    const res = await fetch('/api/ask-gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    return data.reply;
  } catch (err) {
    console.error("Gemini AI error:", err);
    return null;
  }
}

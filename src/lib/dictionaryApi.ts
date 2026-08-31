/**
 * Plain-English Note:
 * This module connects to free educational dictionary services and provides
 * instant pronunciation, definitions, examples, and Google search queries for any
 * word or phrase selected inside the PDF.
 */

import { DictionaryDefinition } from '../types/pdf';

export async function lookupWordDefinition(text: string): Promise<{
  success: boolean;
  data?: DictionaryDefinition;
  error?: string;
}> {
  const cleanWord = text.trim().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').toLowerCase();

  if (!cleanWord) {
    return { success: false, error: 'No word selected.' };
  }

  // If multiple words are selected, take the first primary word for exact dictionary lookup, or search phrase
  const firstWord = cleanWord.split(/\s+/)[0];

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(firstWord)}`);
    if (!res.ok) {
      if (res.status === 404) {
        return {
          success: false,
          error: `No exact dictionary entry found for "${firstWord}". You can search on Google or Wikipedia instead!`,
        };
      }
      return { success: false, error: `Dictionary lookup failed (${res.status}).` };
    }

    const json = await res.json();
    if (Array.isArray(json) && json.length > 0) {
      return {
        success: true,
        data: json[0] as DictionaryDefinition,
      };
    }

    return { success: false, error: 'No definitions found.' };
  } catch (err: any) {
    return {
      success: false,
      error: 'Network error while fetching definition. Check your connection or search on Google.',
    };
  }
}

/**
 * Text to speech synthesizer to read words or sentences aloud
 */
export function speakText(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

/**
 * Format Google search link or query
 */
export function getGoogleSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`;
}

export function getGoogleScholarUrl(query: string): string {
  return `https://scholar.google.com/scholar?q=${encodeURIComponent(query.trim())}`;
}

export function getWikipediaSearchUrl(query: string): string {
  return `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query.trim())}`;
}

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Strip markdown + AI formatting to plain flowing text for dashboard preview snippets */
export function stripMarkdown(text: string): string {
  // Helper: remove emoji characters
  const noEmoji = (s: string) =>
    s.replace(/[\u{1F000}-\u{1FFFF}]/gu, '').replace(/[\u2600-\u27BF]/g, '').trim()

  return text
    .split('\n')
    // Drop markdown table rows and separator lines
    .filter((line) => !line.trim().startsWith('|') && !line.trim().match(/^[-|:\s]+$/))
    // Drop section-header lines: after stripping emojis/symbols, text is all-caps
    .filter((line) => {
      const letters = noEmoji(line).replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ]/g, '')
      return letters.length === 0 || letters !== letters.toUpperCase()
    })
    .join('\n')
    // Strip markdown headings, bold, italic
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    // Remove bullet symbols — keep just the text
    .replace(/^\s*[-*+•]\s*/gm, '')
    // Remove any remaining emojis
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u2600-\u27BF]/g, '')
    // Collapse newlines into spaces for a flowing paragraph
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

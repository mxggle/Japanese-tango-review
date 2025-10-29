import { TangoWord, Example, RelatedWord } from '../types';

// Helper to remove sound tags and other artifacts from strings
const cleanHtml = (html: string): string => {
  if (!html) return '';
  // Remove sound tags and convert furigana syntax to <ruby> tags
  return html
    .replace(/\[sound:.+?\]/g, '')
    .replace(/([\u4e00-\u9faf]+)\[(.+?)\]/g, '<ruby>$1<rt>$2</rt></ruby>')
    .trim();
};

const cleanExpression = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\[sound:.+?\]/g, '')
    .replace(/<\/?ruby.*?>/g, '')
    .replace(/<rt>.*?<\/rt>/g, '')
    .replace(/([\u4e00-\u9faf]+)\[(.+?)\]/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
};

const TAG_PREFIX = 'eggrolls-JLPT10k-v3::';
const TAG_COLUMN_INDEX = 36; // 1-based column: 37

const parseTags = (columns: string[]): string[] => {
  const tagColumn = columns[TAG_COLUMN_INDEX] ?? '';
  return tagColumn
    .split(/\s+/)
    .map(tag => tag.trim())
    .filter(Boolean);
};

const extractLevelFromTags = (tags: string[]): string | null => {
  for (const tag of tags) {
    if (!tag.startsWith(TAG_PREFIX)) continue;
    const segments = tag.split('::').slice(1);
    for (const segment of segments) {
      if (!segment) continue;
      const cleaned = segment.replace(/^[0-9]+-/, '');
      if (/^N\d/.test(cleaned)) {
        return cleaned;
      }
    }
  }
  return null;
};

export const parseTangoData = (rawData: string): TangoWord[] => {
  if (!rawData) {
    return [];
  }
  const lines = rawData.trim().split('\n').filter(line => !line.startsWith('#'));
  const words: TangoWord[] = [];

  for (const line of lines) {
    const columns = line.split('\t');

    // Basic Info
    const word: TangoWord = {
      id: columns[0] || `id-${Math.random()}`,
      expression: cleanExpression(columns[1] || ''),
      pitchAccent: columns[2] || '',
      partOfSpeech: columns[3] || '',
      reading: columns[4] || '',
      definition: columns[5] || '',
      examples: [],
      related: [],
      level: null,
      tags: [],
    };
    
    let i = 9; // Start parsing from the first potential example/related block
    while (i < columns.length) {
      // Skip empty columns to find the start of the next block
      if (!columns[i] || columns[i].startsWith('[sound:')) {
        i++;
        continue;
      }

      const blockType = columns[i];
      
      // If the first item is a relation type (対, 関), it's a related word block
      if (blockType === '対' || blockType === '関') {
        // Block: type, plain, html, cn, tw, sound
        if (columns[i + 2] && columns[i + 3]) {
            word.related.push({
                type: blockType,
                jp: cleanHtml(columns[i + 2]), // html jp
                cn: cleanHtml(columns[i + 3]), // cn
            });
        }
        i += 6;
      } 
      // Otherwise, it's an example block, starting with plain jp text.
      // Block: plain, html, cn, tw, sound
      else if (columns[i + 1] && columns[i + 2]) {
         word.examples.push({
            jp: cleanHtml(columns[i + 1]), // html jp
            cn: cleanHtml(columns[i + 2]), // cn
        });
        i += 5;
      }
      else {
          // Unrecognized block or end of data, advance to avoid infinite loop
          i++;
      }
    }

    if (word.id && word.expression) {
      const tags = parseTags(columns);
      word.tags = tags;
      word.level = extractLevelFromTags(tags);
      words.push(word);
    }
  }

  return words;
};

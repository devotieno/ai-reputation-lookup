/**
 * Splits text into chunks of roughly equal size
 * @param text Text to split into chunks
 * @param maxChunkSize Maximum size of each chunk
 * @returns Array of text chunks
 */
export function chunkText(text: string, maxChunkSize: number): string[] {
  if (!text) return [];
  if (text.length <= maxChunkSize) return [text];
  
  // Split by paragraph first
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    // If the paragraph itself is too long, split by sentence
    if (paragraph.length > maxChunkSize) {
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      
      for (const sentence of sentences) {
        // If adding this sentence would exceed the chunk size, start a new chunk
        if (currentChunk.length + sentence.length > maxChunkSize) {
          if (currentChunk) {
            chunks.push(currentChunk);
            currentChunk = '';
          }
          
          // If a single sentence is too long, split it by words
          if (sentence.length > maxChunkSize) {
            const words = sentence.split(' ');
            let wordChunk = '';
            
            for (const word of words) {
              if (wordChunk.length + word.length + 1 > maxChunkSize) {
                chunks.push(wordChunk);
                wordChunk = word;
              } else {
                wordChunk += (wordChunk ? ' ' : '') + word;
              }
            }
            
            if (wordChunk) {
              currentChunk = wordChunk;
            }
          } else {
            currentChunk = sentence;
          }
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
      }
    } else {
      // If adding this paragraph would exceed the chunk size, start a new chunk
      if (currentChunk.length + paragraph.length + 2 > maxChunkSize) {
        chunks.push(currentChunk);
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}
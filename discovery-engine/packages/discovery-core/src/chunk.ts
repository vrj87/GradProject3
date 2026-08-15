import type { NormalizedReview, ReviewChunk } from "./types.js";

const MAX_CHARS = 8000;

export function chunkReviews(reviews: NormalizedReview[]): ReviewChunk[] {
  const chunks: ReviewChunk[] = [];

  for (const review of reviews) {
    if (review.text.length <= MAX_CHARS) {
      chunks.push({
        chunkId: `${review.id}-0`,
        reviewId: review.id,
        text: review.text,
        source: review.source,
        url: review.url
      });
      continue;
    }

    const paragraphs = review.text.split(/\n{2,}|(?<=\.)\s+/);
    let buffer = "";
    let index = 0;

    const flush = () => {
      if (!buffer.trim()) return;
      chunks.push({
        chunkId: `${review.id}-${index}`,
        reviewId: review.id,
        text: buffer.trim(),
        source: review.source,
        url: review.url
      });
      index += 1;
      buffer = "";
    };

    for (const part of paragraphs) {
      if ((buffer + " " + part).length > MAX_CHARS) {
        flush();
      }
      buffer = buffer ? `${buffer} ${part}` : part;
    }
    flush();
  }

  return chunks;
}

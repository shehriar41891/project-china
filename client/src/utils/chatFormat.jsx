import React from 'react';

/**
 * Renders tutor/LLM plain text with lightweight markdown:
 * - **bold** → <strong> (works with numbers and percentages, e.g. **50%**)
 * - *italic* → <em> (single asterisks; skips lone *digit* to reduce math noise)
 * - newlines → <br />
 */
function formatLineSegments(line, lineKey) {
  const boldChunks = String(line).split(/(\*\*[\s\S]+?\*\*)/g);
  const out = [];
  let k = 0;
  boldChunks.forEach((chunk) => {
    if (chunk === '') return;
    const bm = chunk.match(/^\*\*([\s\S]+)\*\*$/);
    if (bm) {
      out.push(<strong key={`${lineKey}-b-${k++}`}>{bm[1]}</strong>);
      return;
    }
    const italicChunks = chunk.split(/(\*[^*\n]+\*)/g);
    italicChunks.forEach((part) => {
      if (part === '') return;
      const im = part.match(/^\*([^*\n]+)\*$/);
      if (im && !/^\d$/.test(im[1])) {
        out.push(<em key={`${lineKey}-i-${k++}`}>{im[1]}</em>);
      } else {
        out.push(<span key={`${lineKey}-s-${k++}`}>{part}</span>);
      }
    });
  });
  return out;
}

export function formatBoldSegments(text) {
  if (text == null || text === '') return null;
  const lines = String(text).split('\n');
  const nodes = [];
  lines.forEach((line, li) => {
    nodes.push(...formatLineSegments(line, li));
    if (li < lines.length - 1) nodes.push(<br key={`nl-${li}`} />);
  });
  return nodes;
}

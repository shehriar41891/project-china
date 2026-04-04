import React from 'react';

/** Renders LLM text with **bold** segments as <strong> */
export function formatBoldSegments(text) {
  if (text == null || text === '') return null;
  const parts = String(text).split(/(\*\*[\s\S]+?\*\*)/g);
  return parts.map((part, i) => {
    const m = part.match(/^\*\*([\s\S]+)\*\*$/);
    if (m) return <strong key={i}>{m[1]}</strong>;
    return <span key={i}>{part}</span>;
  });
}

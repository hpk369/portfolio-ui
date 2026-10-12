// Wraps every word of an element in <span class="word">, keeping inline markup
// (em, links) intact. Returns the spans in reading order.

export function splitWords(line) {
  const words = [];
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const span = document.createElement('span');
          span.className = 'word';
          span.textContent = part;
          words.push(span);
          frag.append(span);
        });
        child.replaceWith(frag);
      } else {
        walk(child);
      }
    });
  };
  walk(line);
  return words;
}

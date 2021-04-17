#!/usr/bin/env -S node --experimental-modules

import marked from "marked";

const markedRenderer = {
  paragraph(text) {
    return `<div class="section">\n${text.split('\n').map(s=>`<p>${s}</p>`).join('\n')}\n</div>\n`;
  }
};
marked.use({ markedRenderer });

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});


const sample = `
Line1 //
Line2

Line1 //
Line 2

---

Line1,
Line2

Line1,
Line2
[Link1]

[Link1]: https://example.com
`;

const html = marked(sample);
console.log(html);

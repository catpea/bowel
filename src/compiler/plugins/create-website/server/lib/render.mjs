import views from 'koa-views';
import path from 'path';

// setup views mapping .html
// to the swig template engine

import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

export default views(path.resolve(__dirname, '..', 'views'), {
  map: { html: 'ejs' },
});

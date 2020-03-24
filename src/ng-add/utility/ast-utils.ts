import { Tree } from '@angular-devkit/schematics';
import { parse, stringify } from 'scss-parser';

export function modifyStylesSCSS(host: Tree, fileName: string) {
  const fileContent: Buffer | null = host.read(fileName);
  if (fileContent) {
    let ast = parse(fileContent.toString());
    let createQueryWrapper = require('query-ast');
    let $ = createQueryWrapper(ast);
    const content = `
      @import './scss/bootstrap';
      
      //gms-font
      * {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
        'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji',
        'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
      }
      
      `;

    if ($('atrule').length() > 0) {
      $('atrule')
        .last()
        .after(parse(content));
    } else {
      $()
        .children()
        .first()
        .before(parse(content));
    }

    host.overwrite(fileName, stringify($().get(0)));
  }
}

import { copyFileSync, CopyOptionsSync, copySync } from 'fs-extra';
import replaceInFile from 'replace-in-file';

const options = {
  files: 'dist/package.json',
  from: /\/src\//g,
  to: '/'
};

const filterFunc: CopyOptionsSync = {
  filter: src => {
    const isFolder = /\//.test(src);
    if (isFolder) {
      return true;
    } else {
      return /.template/.test(src);
    }
  }
};

copyFileSync('src/collection.json', 'dist/collection.json');
copyFileSync('README.md', 'dist/README.md');
copyFileSync('package.json', 'dist/package.json');
copySync('src/ng-add/files/', 'dist/ng-add/files/', filterFunc);
replaceInFile.sync(options);

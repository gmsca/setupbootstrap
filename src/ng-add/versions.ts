import {
  NodeDependency,
  NodeDependencyType
} from 'schematics-utilities/dist/angular';

export const dependencies: NodeDependency[] = [
  {
    type: NodeDependencyType.Default,
    version: '^4.4.1',
    name: 'bootstrap'
  },
  {
    type: NodeDependencyType.Dev,
    version: '^8.1.0',
    name: '@types/fs-extra'
  },
  {
    type: NodeDependencyType.Dev,
    version: '^9.0.0',
    name: 'fs-extra'
  },
  {
    type: NodeDependencyType.Dev,
    version: '^5.0.2',
    name: 'replace-in-file'
  }
];

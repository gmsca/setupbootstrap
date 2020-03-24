import {
  apply,
  chain,
  mergeWith,
  move,
  noop,
  renameTemplateFiles,
  Rule,
  SchematicContext,
  template,
  Tree,
  url,
  SchematicsException
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { getWorkspace } from 'schematics-utilities/dist/angular/config';
import {
  NodeDependency,
  NodeDependencyType,
  addPackageJsonDependency
} from 'schematics-utilities/dist/angular/dependencies';
import { getProjectFromWorkspace } from 'schematics-utilities/dist/material/get-project';
import { getStylesPath } from 'schematics-utilities/dist/material/ast';
import { modifyStylesSCSS } from './utility/ast-utils';
import { Schema } from './schema';

export function ngAdd(_options: Schema): Rule {
  return chain([
    _options && _options.skipPackageJson
      ? noop()
      : addPackageJsonDependencies(),
    _options && _options.skipPackageJson
      ? noop()
      : installPackageJsonDependencies(),
    createBootstrapDefinition(_options),
    addNPMScripts(),
    editStylesSCSS(_options)
  ]);
}

function addPackageJsonDependencies(): Rule {
  return (host: Tree, context: SchematicContext) => {
    const dependencies: NodeDependency[] = [
      {
        type: NodeDependencyType.Default,
        version: '^4.4.1',
        name: 'bootstrap'
      },
      {
        type: NodeDependencyType.Dev,
        version: '^8.1.0',
        name: 'fs-extra'
      },
      {
        type: NodeDependencyType.Dev,
        version: '^5.0.2',
        name: 'replace-in-file'
      }
    ];

    dependencies.forEach(dependency => {
      addPackageJsonDependency(host, dependency);
      context.logger.log(
        'info',
        `✔️        Added "${dependency.name}" into ${dependency.type}`
      );
    });

    return host;
  };
}

function installPackageJsonDependencies(): Rule {
  return (host: Tree, context: SchematicContext) => {
    context.addTask(new NodePackageInstallTask());
    context.logger.log(
      'info',
      `◽◽◽◽◽◽ Installing packages... ◽◽◽◽◽◽`
    );

    return host;
  };
}

function createBootstrapDefinition(_options: Schema) {
  return (host: Tree, context: SchematicContext) => {
    const sourceTemplate = url('./files');

    const sourceParametrizeTemplate = apply(sourceTemplate, [
      renameTemplateFiles(),
      template({ ..._options }),
      move('/')
    ]);

    host = mergeWith(sourceParametrizeTemplate)(host, context) as Tree;

    context.logger.log('info', `✔️        CreateBundleScript running`);
    return host;
  };
}

function addNPMScripts() {
  return (host: Tree, context: SchematicContext) => {
    const strPkgPath = '/package.json';
    const bufPkgContent: Buffer | null = host.read(strPkgPath);

    if (bufPkgContent === null) {
      throw new SchematicsException('Could not find package.json');
    }

    const strPkgContent = JSON.parse(bufPkgContent.toString());

    if (bufPkgContent.toString().indexOf('build:ngelement') == -1) {
      strPkgContent.scripts['setup:bootstrap'] = `node setup-bootstrap.js`;
      context.logger.log('info', `✔️        addNPMScripts running`);
    }

    host.overwrite(strPkgPath, JSON.stringify(strPkgContent, null, 2));
    return host;
  };
}

function editStylesSCSS(_options: Schema) {
  return (host: Tree, context: SchematicContext) => {
    const workspace = getWorkspace(host);
    const project = getProjectFromWorkspace(
      workspace,
      _options.project
        ? _options.project
        : Object.keys(workspace['projects'])[0]
    );

    const fileName = getStylesPath(project);
    try {
      modifyStylesSCSS(host, fileName);
    } catch (e) {
      context.logger.log('error', `🐛  Failed to modify ${fileName}`);
    }

    context.logger.log('info', `✔️        modified "${fileName}" `);
    return host;
  };
}

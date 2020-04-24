import {
  apply,
  chain,
  MergeStrategy,
  mergeWith,
  move,
  noop,
  renameTemplateFiles,
  Rule,
  SchematicContext,
  SchematicsException,
  template,
  Tree,
  url
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { getWorkspace } from 'schematics-utilities/dist/angular/config';
import { addPackageJsonDependency } from 'schematics-utilities/dist/angular/dependencies';
import { getStylesPath } from 'schematics-utilities/dist/material/ast';
import { getProjectFromWorkspace } from 'schematics-utilities/dist/material/get-project';
import { Schema } from './schema';
import { modifyStylesSCSS } from './utility/ast-utils';
import { dependencies } from './versions';

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
    dependencies.forEach((dependency) => {
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
    const workspace = getWorkspace(host);
    const project = getProjectFromWorkspace(
      workspace,
      _options.project
        ? _options.project
        : Object.keys(workspace['projects'])[0]
    );
    const sourceTemplate = url('./files');

    _options.projectSourceRoot = project.sourceRoot;
    const sourceParametrizeTemplate = apply(sourceTemplate, [
      renameTemplateFiles(),
      template({ ..._options }),
      move('/')
    ]);

    host = mergeWith(sourceParametrizeTemplate, MergeStrategy.Overwrite)(
      host,
      context
    ) as Tree;

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

    if (bufPkgContent.toString().indexOf('setup:bootstrap') == -1) {
      strPkgContent.scripts[
        'setup:bootstrap'
      ] = `ts-node -P ./tasks/tsconfig.tasks.json ./tasks/setup-bootstrap.ts`;
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

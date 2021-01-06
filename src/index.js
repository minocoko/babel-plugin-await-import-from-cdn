import fs from 'fs';
import path from 'path';
import packageManagers from './package-manager';

let packageVersionCache;

export default ({ types: t }) => {
  const updatePackageVersionCache = (cwd) => {
    // check yarn.lock or package-lock.json
    let packageManager;
    const exists = fs.existsSync(path.join(cwd, 'yarn.lock'));
    if (exists) {
      packageManager = packageManagers('yarn');
    }
    packageVersionCache = packageManager.list();
  };

  return {
    visitor: {
      ImportDeclaration(declaration, state) {
        // console.log(state)
        const { cwd, opts: { cdn } } = state;
        if (!packageVersionCache) {
          updatePackageVersionCache(cwd);
        }
        const source = declaration.node.source.value;
        const [packageName, ...extraPath] = source.split('/');
        const packageVersion = packageVersionCache[packageName];
        const packageUrl = t.stringLiteral(`${cdn}/${packageName}@${packageVersion}${extraPath.length ? `/${extraPath.join('/')}` : ''}`);
        const awaitCallExpression = t.callExpression(t.import(), [packageUrl]);
        const initExpression = t.awaitExpression(awaitCallExpression);
        const importNamespace = declaration.node.specifiers.find((s) => s.type === 'ImportNamespaceSpecifier');
        if (importNamespace) {
          const id = t.identifier(importNamespace.local.name);
          const variableDeclarator = t.variableDeclarator(id, initExpression);
          const variableDeclaration = t.variableDeclaration('const', [variableDeclarator]);
          declaration.replaceWith(variableDeclaration);
        } else {
          const properties = [];
          const defaultImport = declaration.node.specifiers.find((s) => s.type === 'ImportDefaultSpecifier');
          const imports = declaration.node.specifiers.filter((s) => s.type === 'ImportSpecifier');
          if (defaultImport) {
            properties.push(t.objectProperty(t.identifier('default'), t.identifier(defaultImport.local.name)));
          }
          imports.forEach((m) => {
            const imported = m.imported.name;
            const { name } = m.local;
            const shorthand = imported === name;
            properties.push(
              t.objectProperty(t.identifier(imported), t.identifier(name), false, shorthand),
            );
          });

          const idObjectPattern = t.objectPattern(properties);
          const variableDeclarator = t.variableDeclarator(idObjectPattern, initExpression);
          const variableDeclaration = t.variableDeclaration('const', [variableDeclarator]);
          declaration.replaceWith(variableDeclaration);
        }
      },
    },
  };
};

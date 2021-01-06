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

  const getAwaitCallExpressionCallee = (shim) => {
    if (shim) {
      return t.memberExpression(t.identifier(shim), t.identifier('import'));
    }

    return t.import();
  };

  const buildPackageUrl = (matches, cdn, packageName, packageVersion, extraPath) => {
    let url = `${cdn}/${packageName}@${packageVersion}${extraPath.length ? `/${extraPath.join('/')}` : ''}`;
    if (matches) {
      for (let index = 0; index < matches.length; index += 1) {
        const match = matches[index];
        if (match[0].test(packageName)) {
          url += match[1];
          break;
        }
      }
    }
    return t.stringLiteral(url);
  };

  return {
    visitor: {
      ImportDeclaration(declaration, state) {
        // console.log(state)
        const { cwd, opts: { cdn, shim, matches } } = state;
        const source = declaration.node.source.value;
        const [packageName, ...extraPath] = source.split('/');
        if (matches) {
          for (let index = 0; index < matches.length; index += 1) {
            const match = matches[index];
            if (!match[0].test(packageName)) {
              return;
            }
          }
        }

        if (!packageVersionCache) {
          updatePackageVersionCache(cwd);
        }
        const packageVersion = packageVersionCache[packageName];
        const packageUrl = buildPackageUrl(matches, cdn, packageName, packageVersion, extraPath);
        const awaitCallExpressionCallee = getAwaitCallExpressionCallee(shim);
        const awaitCallExpression = t.callExpression(awaitCallExpressionCallee, [packageUrl]);
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

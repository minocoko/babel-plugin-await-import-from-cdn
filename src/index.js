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

  const camelize = (str) => str.replace(
    /(?:^\w|[A-Z]|\b\w)/g,
    (word, index) => (index === 0 ? word.toLowerCase() : word.toUpperCase()),
  )
    .replace(/\s+@/g, '');

  const getPackageInfo = (source) => {
    // TODO more case?
    const [one, two, ...extraPath] = source.split('/');
    let packageName = one;
    let packageVersion = packageVersionCache[packageName];
    if (packageVersion) {
      return {
        packageName,
        packageVersion,
        extraPath: (two ? [two, ...extraPath] : []),
      };
    }

    packageName = `${one}/${two}`;
    packageVersion = packageVersionCache[packageName];

    return {
      packageName,
      packageVersion,
      extraPath: (extraPath || []),
    };
  };

  return {
    visitor: {
      ImportDeclaration(declaration, state) {
        const getNameObjectPattern = () => {
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

          return t.objectPattern(properties);
        };

        // console.log(state)
        const {
          cwd,
          opts: {
            cdn, shim, matches, fallback,
          },
        } = state;
        const source = declaration.node.source.value;
        if (matches) {
          for (let index = 0; index < matches.length; index += 1) {
            const match = matches[index];
            if (!match[0].test(source)) {
              return;
            }
          }
        }

        if (!packageVersionCache) {
          updatePackageVersionCache(cwd);
        }
        const {
          packageName,
          packageVersion,
          extraPath,
        } = getPackageInfo(source);

        const importNamespace = declaration.node.specifiers.find((s) => s.type === 'ImportNamespaceSpecifier');
        let variableDeclarator;
        if (fallback) {
          const getAwaitExpressionStatement = (name, url) => {
            const awaitCallExpressionCallee = getAwaitCallExpressionCallee(shim);
            const packageUrl = buildPackageUrl(
              matches, url, packageName, packageVersion, extraPath,
            );
            const awaitCallExpression = t.callExpression(awaitCallExpressionCallee, [packageUrl]);
            const assignmentExpression = t.assignmentExpression('=', name, awaitCallExpression);
            const expressionStatement = t.expressionStatement(assignmentExpression);
            return t.blockStatement([expressionStatement]);
          };

          const nameIdentifier = t.identifier(importNamespace ? importNamespace.local.name : `${camelize(packageName)}Result`);
          variableDeclarator = t.variableDeclarator(nameIdentifier, null);
          const variableDeclaration = t.variableDeclaration('let', [variableDeclarator]);
          const tryBlockStatement = getAwaitExpressionStatement(nameIdentifier, cdn);
          const catchBlockStatement = getAwaitExpressionStatement(nameIdentifier, fallback);
          const catchClause = t.catchClause(t.identifier('err'), catchBlockStatement);
          const tryStatement = t.tryStatement(tryBlockStatement, catchClause);
          if (importNamespace) {
            declaration.replaceWith(variableDeclaration);
            declaration.parent.body.push(tryStatement);
          } else {
            const nameObjectPattern = getNameObjectPattern();
            declaration.replaceWith(variableDeclaration);
            declaration.parent.body.push(tryStatement);
            const a = t.variableDeclarator(nameObjectPattern, nameIdentifier);
            const b = t.variableDeclaration('const', [a]);
            declaration.parent.body.push(b);
          }
        } else {
          const awaitCallExpressionCallee = getAwaitCallExpressionCallee(shim);
          const packageUrl = buildPackageUrl(
            matches, cdn, packageName, packageVersion, extraPath,
          );
          const awaitCallExpression = t.callExpression(awaitCallExpressionCallee, [packageUrl]);
          const initExpression = t.awaitExpression(awaitCallExpression);
          if (importNamespace) {
            const nameIdentifier = t.identifier(importNamespace.local.name);
            variableDeclarator = t.variableDeclarator(nameIdentifier, initExpression);
          } else {
            const nameObjectPattern = getNameObjectPattern();
            variableDeclarator = t.variableDeclarator(nameObjectPattern, initExpression);
          }

          const variableDeclaration = t.variableDeclaration('const', [variableDeclarator]);
          declaration.replaceWith(variableDeclaration);
        }
      },
    },
  };
};

import fs from 'fs';
import path from 'path';
import packageManagers from './package-manager';

let packageVersionCache;

const updatePackageVersionCache = (cwd) => {
  // check yarn.lock or package-lock.json
  let packageManager;
  const exists = fs.existsSync(path.join(cwd, 'yarn.lock'));
  if (exists) {
    packageManager = packageManagers('yarn');
  }
  packageVersionCache = packageManager.list();
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

export default ({ types: t }) => ({
  visitor: {
    ImportDeclaration(declaration, state) {
      const {
        cwd,
        opts: {
          cdn, matches, fallback, webpackIgnore,
        },
      } = state;

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
      const buildPackageUrl = (cdnUrl, packageName, packageVersion, extraPath) => {
        let url = `${cdnUrl}/${packageName}@${packageVersion}${extraPath.length ? `/${extraPath.join('/')}` : ''}`;
        if (matches) {
          const matchesKeys = Object.keys(matches);
          for (let index = 0; index < matchesKeys.length; index += 1) {
            const key = matchesKeys[index];
            if (new RegExp(key).test(packageName) && typeof (matches[key]) === 'string') {
              url += matches[key];
              break;
            }
          }
        }
        const urlStringLiteral = t.stringLiteral(url);
        if (webpackIgnore) {
          t.addComment(urlStringLiteral, 'leading', ' webpackIgnore: true ');
        }
        return urlStringLiteral;
      };

      const source = declaration.node.source.value;
      if (matches) {
        const matchesKeys = Object.keys(matches);
        for (let index = 0; index < matchesKeys.length; index += 1) {
          const key = matchesKeys[index];
          if (!new RegExp(key).test(source)) {
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
          const packageUrl = buildPackageUrl(
            url, packageName, packageVersion, extraPath,
          );
          const awaitCallExpression = t.callExpression(t.import(), [packageUrl]);
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
        const packageUrl = buildPackageUrl(
          cdn, packageName, packageVersion, extraPath,
        );
        const awaitCallExpression = t.callExpression(t.import(), [packageUrl]);
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
});

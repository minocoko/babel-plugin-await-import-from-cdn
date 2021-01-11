import path from 'path';

const camelize = (str) => str.replace(
  /(?:^\w|[A-Z]|\b\w)/g,
  (word) => word.toLowerCase(),
)
  .replace(/\s+@/g, '');

const getPackageInfo = (cwd, source, includeDevDependencies) => {
  // TODO more case?
  const [one, two, ...extraPath] = source.split('/');
  let packageName = one;
  // eslint-disable-next-line import/no-dynamic-require,global-require
  const { dependencies, devDependencies } = require(path.join(cwd, 'package.json'));
  let packageVersion = dependencies[packageName]
    || (includeDevDependencies && devDependencies[packageName]);
  if (packageVersion) {
    return {
      packageName,
      packageVersion,
      extraPath: (two ? [two, ...extraPath] : []),
    };
  }

  packageName = `${one}/${two}`;
  packageVersion = dependencies[packageName]
    || (includeDevDependencies && devDependencies[packageName]);

  return {
    packageName,
    packageVersion,
    extraPath,
  };
};

export default ({ types: t }) => ({
  visitor: {
    ImportDeclaration(declaration, state) {
      const {
        cwd,
        opts: {
          cdn, matches, fallback, webpackIgnore, includeDevDependencies,
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

      const {
        packageName,
        packageVersion,
        extraPath,
      } = getPackageInfo(cwd, source, includeDevDependencies);

      const buildPackageUrl = (cdnUrl) => {
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

      const getAwaitCallExpression = (url) => {
        const packageUrl = buildPackageUrl(url);
        return t.callExpression(t.import(), [packageUrl]);
      };

      const getAwaitExpressionBlockStatement = (name, url) => {
        const awaitCallExpression = getAwaitCallExpression(url);
        const assignmentExpression = t.assignmentExpression('=', name, awaitCallExpression);
        const expressionStatement = t.expressionStatement(assignmentExpression);
        return t.blockStatement([expressionStatement]);
      };

      const importNamespace = declaration.node.specifiers.find((s) => s.type === 'ImportNamespaceSpecifier');
      let variableDeclarator;
      if (fallback) {
        const nameIdentifier = t.identifier(importNamespace ? importNamespace.local.name : `${camelize(packageName)}Result`);
        variableDeclarator = t.variableDeclarator(nameIdentifier, null);
        const variableDeclaration = t.variableDeclaration('let', [variableDeclarator]);
        const tryBlockStatement = getAwaitExpressionBlockStatement(nameIdentifier, cdn);
        const catchBlockStatement = getAwaitExpressionBlockStatement(nameIdentifier, fallback);
        const catchClause = t.catchClause(t.identifier('err'), catchBlockStatement);
        const tryStatement = t.tryStatement(tryBlockStatement, catchClause);
        if (importNamespace) {
          declaration.replaceWith(variableDeclaration);
          declaration.parent.body.push(tryStatement);
        } else {
          const nameObjectPattern = getNameObjectPattern();
          declaration.replaceWith(variableDeclaration);
          declaration.parent.body.push(tryStatement);
          const nameVariableDeclarator = t.variableDeclarator(nameObjectPattern, nameIdentifier);
          const nameVariableDeclaration = t.variableDeclaration('const', [nameVariableDeclarator]);
          declaration.parent.body.push(nameVariableDeclaration);
        }
      } else {
        const awaitCallExpression = getAwaitCallExpression(cdn);
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

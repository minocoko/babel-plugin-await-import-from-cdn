# templ

input:
import React, {useState} from 'react';
// import * as React from 'react';

output:
const {
  "default": "React",
  "useState": "useState"
} = await import('https://cdn.skypack.dev/react@16.13.1');

code:
// Press ctrl+space for code completion
export default function transformer(file, api) {
  const j = api.jscodeshift;
console.log(api)
  return j(file.source)
    .find(j.ImportDeclaration)
    .forEach(declaration => {
    	console.log(declaration)
    	const source = declaration.value.source.value;
    	const importNamespace = declaration.value.specifiers.find(s=>s.type === 'ImportNamespaceSpecifier');
    	if(importNamespace){
          const id = j.identifier(importNamespace.local.name);
          const awaitCallExpression = j.callExpression(j.import(), [j.stringLiteral(`https://cdn.skypack.dev/${source}@16.13.1`)]);

          const initExpression = j.awaitExpression(awaitCallExpression);
          const variableDeclarator = j.variableDeclarator(id, initExpression);
          const variableDeclaration = j.variableDeclaration('const',[variableDeclarator]);
          j(declaration).replaceWith(variableDeclaration);
        } else {
          const properties = [];
          const defaultImport = declaration.value.specifiers.find(s=>s.type === 'ImportDefaultSpecifier');
          const imports = declaration.value.specifiers.filter(s=>s.type === 'ImportSpecifier')
          if(defaultImport){
            const name = defaultImport.local.name;
            const imported = defaultImport.imported ? defaultImport.imported.name : name;
            
            properties.push(j.objectProperty(j.identifier('default'), j.identifier(imported)));
          }
          for(let m of imports){
            const imported = m.imported.name;
            const name = m.local.name;
            // const shorthand = imported === name;
            properties.push(j.objectProperty(j.identifier(imported), j.identifier(name)));
          }
          
          const idObjectPattern = j.objectPattern(properties);
          const awaitCallExpression = j.callExpression(j.import(), [j.stringLiteral(`https://cdn.skypack.dev/${source}@16.13.1`)]);

          const initExpression = j.awaitExpression(awaitCallExpression);
          const variableDeclarator = j.variableDeclarator(idObjectPattern, initExpression);
          const variableDeclaration = j.variableDeclaration('const',[variableDeclarator]);
          j(declaration).replaceWith(variableDeclaration);
        }
    	
    	// j(declaration).replaceWith(`const ${defines} = await import('https://cdn.skypack.dev/${source}@16.13.1');`);
    })
    .toSource();
}


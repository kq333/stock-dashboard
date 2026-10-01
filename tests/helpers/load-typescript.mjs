import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'

// Execute the actual TypeScript modules without adding a second test compiler.
export const loadTypeScript = (url, dependencies = {}) => {
  const code = ts.transpileModule(readFileSync(url, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const module = { exports: {} }
  const run = vm.compileFunction(code, ['exports', 'require', 'module'], { filename: url.pathname })
  const require = createRequire(url)
  run(module.exports, (name) => dependencies[name] ?? require(name), module)
  return module.exports
}

const fs = require('node:fs');
const path = require('node:path');
const { compile, optimize } = require('@tailwindcss/node');
const { Scanner } = require('@tailwindcss/oxide');
async function build() {
  const input = path.resolve('src/app/globals.css');
  const compiler = await compile(fs.readFileSync(input, 'utf8'), { base: path.dirname(input), onDependency() {} });
  const scanner = new Scanner({ sources: [{ base: path.resolve('src'), pattern: '**/*.{ts,tsx}', negated: false }] });
  fs.writeFileSync('src/app/generated.css', optimize(compiler.build(scanner.scan()), { minify: true }).code);
}
build().catch(error => { console.error(error); process.exitCode = 1; });
if (process.argv.includes('--watch')) {
  let timer;
  fs.watch('src', { recursive: true }, (_, filename) => {
    if (filename?.endsWith('generated.css')) return;
    clearTimeout(timer); timer = setTimeout(() => build().catch(console.error), 150);
  });
}

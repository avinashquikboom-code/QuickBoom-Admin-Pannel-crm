const fs = require('fs'), path = require('path'), assert = require('assert');
const walk = dir => fs.readdirSync(dir, {withFileTypes:true}).flatMap(entry => entry.isDirectory() ? walk(path.join(dir,entry.name)) : [path.join(dir,entry.name)]);
const primitives = 'button card input label select textarea checkbox switch radio-group calendar popover dialog alert-dialog drawer sheet dropdown-menu navigation-menu tabs table badge avatar tooltip separator skeleton breadcrumb command progress scroll-area form sonner chart'.split(' ');
for (const name of primitives) assert(fs.existsSync(`src/components/ui/${name}.jsx`), `Missing primitive: ${name}`);
const files = walk('src');
assert(!files.some(file => /\.tsx?$/.test(file)), 'Application sources must be JS/JSX');
assert.equal(JSON.parse(fs.readFileSync('components.json')).aliases.ui, '@/components/ui');
for (const file of files.filter(file => /\.jsx?$/.test(file))) {
  const source = fs.readFileSync(file, 'utf8');
  assert(!/from ['"](?:lucide|@mui|react-icons|@remixicon)/.test(source), file);
  assert(!source.includes('IconPlaceholder'), file);
  if (!file.includes('components/ui/')) assert(!/from ['"]@base-ui\//.test(source), `${file}: primitives belong in ui`);
  for (const match of source.matchAll(/(?:from\s+|import\s*)['"](@\/[^'"]+)['"]/g)) {
    const base = 'src/' + match[1].slice(2);
    assert(['','.js','.jsx','/index.js','/index.jsx'].some(ext => fs.existsSync(base+ext)), `${file}: unresolved ${match[1]}`);
  }
  if (file !== 'src/components/icons/FontAwesomeIcon.jsx') assert(!/from ['"]@fortawesome\/react-fontawesome['"]/.test(source), file);
  for (const match of source.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"](@fortawesome\/free-[^'"]+)['"]/g)) {
    const icons = require(match[2]);
    for (const name of match[1].split(',').map(value => value.trim()).filter(Boolean)) assert(icons[name]?.icon, `${file}: unknown ${name}`);
  }
}
for (const moduleName of ['crm','hrm','production','customer']) {
  assert(fs.existsSync(`src/modules/${moduleName}/components`), moduleName);
  assert(!fs.existsSync(`src/modules/${moduleName}/components/ui`), `Duplicated library in ${moduleName}`);
}
assert(fs.readFileSync('src/components/common/DataTable.jsx','utf8').includes('@tanstack/react-table'));
for (const dependency of Object.keys(JSON.parse(fs.readFileSync('package.json')).dependencies)) assert(!/^(lucide|react-icons|@remixicon\/|@mui\/)/.test(dependency), dependency);
console.log(`${primitives.length} shared shadcn primitives, JS/JSX, aliases, four modules, TanStack Table and Font Awesome checks passed.`);

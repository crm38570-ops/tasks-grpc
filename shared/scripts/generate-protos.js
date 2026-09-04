const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const serviceRoot = process.cwd();
const servicePkg = JSON.parse(
  fs.readFileSync(path.join(serviceRoot, 'package.json'), 'utf8'),
);
const modules = servicePkg.mcs && servicePkg.mcs.protos;

if (!Array.isArray(modules) || modules.length === 0) {
  console.error(
    'generate-protos: service does not declare its proto modules.\n' +
      'Add to the service package.json:\n' +
      '  "mcs": { "protos": ["<module>", ...] }',
  );
  process.exit(1);
}

const repositoryRoot = path.resolve(serviceRoot, '..');
const protoRoot = path.join(repositoryRoot, 'proto');

const win = process.platform === 'win32';
const rel = (p) => './' + path.relative(serviceRoot, p).replace(/\\/g, '/');
const relWin = (p) => '.' + path.sep + path.relative(serviceRoot, p);

const protoc = rel(
  path.join(serviceRoot, 'node_modules', 'grpc-tools', 'bin', `protoc${win ? '.exe' : ''}`),
);
const include = rel(path.join(serviceRoot, 'node_modules', 'grpc-tools', 'bin'));
const plugin = (win ? relWin : rel)(
  path.join(
    serviceRoot,
    'node_modules',
    '.bin',
    win ? 'protoc-gen-ts_proto.cmd' : 'protoc-gen-ts_proto',
  ),
);

function findProtos(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'generated') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findProtos(full, acc);
    else if (entry.isFile() && entry.name.endsWith('.proto')) acc.push(full);
  }
  return acc;
}

const allProtos = findProtos(protoRoot);
const availableModules = new Set(allProtos.map((p) => path.basename(path.dirname(p))));
const missing = modules.filter((m) => !availableModules.has(m));
if (missing.length) {
  console.error(
    `generate-protos: declared modules not found under ${path.relative(repositoryRoot, protoRoot)}: ` +
      missing.join(', '),
  );
  process.exit(1);
}

let generated = 0;
for (const proto of allProtos) {
  const moduleDir = path.dirname(proto);
  const moduleName = path.basename(moduleDir);
  if (!modules.includes(moduleName)) continue;

  const outDir = path.join(serviceRoot, 'src', 'proto', moduleName, 'generated');
  fs.mkdirSync(outDir, { recursive: true });
  execFileSync(
    protoc,
    [
      `--plugin=protoc-gen-ts_proto=${plugin}`,
      `--ts_proto_out=${rel(outDir)}`,
      '--ts_proto_opt=nestJs=true',
      `--proto_path=${rel(moduleDir)}`,
      `--proto_path=${include}`,
      rel(proto),
    ],
    { stdio: 'inherit' },
  );

  const protoDest = path.join(serviceRoot, 'src', 'proto', moduleName);
  fs.mkdirSync(protoDest, { recursive: true });
  fs.copyFileSync(proto, path.join(protoDest, path.basename(proto)));
  console.log(
    `generated: ${path.relative(repositoryRoot, proto)} -> ${path.relative(serviceRoot, outDir)}`,
  );
  generated++;
}

if (generated === 0) {
  console.error(
    `generate-protos: no protos generated. Declared modules [${modules.join(', ')}] ` +
      `have no .proto files under ${path.relative(repositoryRoot, protoRoot)}`,
  );
  process.exit(1);
}

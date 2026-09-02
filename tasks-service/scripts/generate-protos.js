const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const serviceRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(serviceRoot, '..');

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

for (const proto of findProtos(path.join(repositoryRoot, 'proto'))) {
  const moduleDir = path.dirname(proto);
  const outDir = path.join(
    serviceRoot,
    'src',
    'proto',
    path.basename(moduleDir),
    'generated',
  );
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
  console.log(
    `generated: ${path.relative(repositoryRoot, proto)} -> ${path.relative(serviceRoot, outDir)}`,
  );
}

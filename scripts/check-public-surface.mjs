import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const forbiddenNames = /(^|[\\/])(?:\.env(?:\.|$)|id_rsa|authorized_keys|local-config|backup|database|node_modules)(?:$|[\\/])/i;
const forbiddenText = /(?:BEGIN (?:OPENSSH|RSA|EC|PRIVATE) KEY|ENCRYPTION_KEY\s*=|DATABASE_URL\s*=|POSTGRES_PASSWORD\s*=|SMTP_PASSWORD\s*=|Bearer\s+[A-Za-z0-9._-]{20,}|sk-[A-Za-z0-9_-]{20,})/i;
const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const child = join(directory, entry.name);
    const name = relative(root, child).replaceAll('\\', '/');
    if (forbiddenNames.test(name)) throw new Error(`Forbidden public path: ${name}`);
    if (entry.isDirectory()) await walk(child);
    else files.push({ path: child, name });
  }
}
await walk(root);
for (const file of files) {
  if (file.name === '.gitignore' || /\.(png|jpg|jpeg|webp)$/i.test(file.name)) continue;
  const text = await readFile(file.path, 'utf8');
  if (forbiddenText.test(text)) throw new Error(`Possible secret or private configuration in ${file.name}`);
}
console.log(`Public surface check passed: ${files.length} files`);

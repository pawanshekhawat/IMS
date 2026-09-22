import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Helper to parse version string into array of numbers
function parseVersion(v) {
  return v.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
}

function compareVersions(v1, v2) {
  const p1 = parseVersion(v1);
  const p2 = parseVersion(v2);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
}

// 1. Read current package.json & tauri.conf.json
const pkgPath = path.join(rootDir, 'package.json');
const tauriConfPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));

// 2. Query all existing git tags
let existingTags = [];
try {
  const output = execSync('git tag -l "v*"', { cwd: rootDir, encoding: 'utf8' });
  existingTags = output.split('\n').map(t => t.trim()).filter(Boolean);
} catch {
  existingTags = [];
}

// Find highest existing version among package.json, tauri.conf, and git tags
let highestVersion = pkg.version || '1.0.0';
if (compareVersions(tauriConf.version || '1.0.0', highestVersion) > 0) {
  highestVersion = tauriConf.version;
}
for (const tag of existingTags) {
  const cleanTag = tag.replace(/^v/, '');
  if (compareVersions(cleanTag, highestVersion) > 0) {
    highestVersion = cleanTag;
  }
}

// 3. Determine target version
let targetVersion = process.argv[2];
if (!targetVersion) {
  // Auto-increment patch of the highest detected version
  const parts = parseVersion(highestVersion);
  while (parts.length < 3) parts.push(0);
  parts[2] += 1;
  targetVersion = parts.join('.');
} else {
  targetVersion = targetVersion.replace(/^v/, '');
}

// Check if tag already exists
const targetTag = `v${targetVersion}`;
if (existingTags.includes(targetTag)) {
  console.error(`\n❌ Error: Git tag '${targetTag}' already exists!`);
  console.error(`Highest existing version is v${highestVersion}.`);
  const nextPatch = parseVersion(highestVersion);
  nextPatch[2] += 1;
  console.error(`👉 Try running: npm run release ${nextPatch.join('.')}\n`);
  process.exit(1);
}

console.log(`\n📦 Preparing Release: v${pkg.version} -> v${targetVersion} (Highest tag: v${highestVersion})\n`);

// 4. Update package.json
pkg.version = targetVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`✔ Updated package.json to ${targetVersion}`);

// 5. Update tauri.conf.json
tauriConf.version = targetVersion;
fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
console.log(`✔ Updated src-tauri/tauri.conf.json to ${targetVersion}`);

// 6. Git Commit & Tag
try {
  console.log(`\n🚀 Committing version bump and tagging ${targetTag}...`);
  execSync(`git add package.json src-tauri/tauri.conf.json`, { cwd: rootDir, stdio: 'inherit' });
  execSync(`git commit -m "release: ${targetTag}"`, { cwd: rootDir, stdio: 'inherit' });
  execSync(`git tag ${targetTag}`, { cwd: rootDir, stdio: 'inherit' });

  console.log(`\n📤 Pushing branch and tag to GitHub...`);
  execSync(`git push origin main`, { cwd: rootDir, stdio: 'inherit' });
  execSync(`git push origin ${targetTag}`, { cwd: rootDir, stdio: 'inherit' });

  console.log(`\n🎉 SUCCESS! Release tag ${targetTag} pushed to GitHub.`);
  console.log(`👉 GitHub Actions is now compiling setup.exe and publishing the update.`);
  console.log(`👉 All user apps will automatically detect, download, and restart into ${targetTag}!\n`);
} catch (err) {
  console.error('\n❌ Release failed during git operations:', err.message);
  process.exit(1);
}

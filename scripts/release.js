import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Read current package.json
const pkgPath = path.join(rootDir, 'package.json');
const tauriConfPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));

const currentVersion = pkg.version || '1.0.0';

// 2. Determine target version
let targetVersion = process.argv[2];
if (!targetVersion) {
  // Auto-increment patch
  const parts = currentVersion.split('.').map(n => parseInt(n, 10) || 0);
  parts[2] = (parts[2] || 0) + 1;
  targetVersion = parts.join('.');
}

// Clean any leading 'v'
targetVersion = targetVersion.replace(/^v/, '');

console.log(`\n📦 Preparing Release: v${currentVersion} -> v${targetVersion}\n`);

// 3. Update package.json
pkg.version = targetVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`✔ Updated package.json to ${targetVersion}`);

// 4. Update tauri.conf.json
tauriConf.version = targetVersion;
fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
console.log(`✔ Updated src-tauri/tauri.conf.json to ${targetVersion}`);

// 5. Git Commit & Tag
try {
  console.log(`\n🚀 Committing version bump and tagging v${targetVersion}...`);
  execSync(`git add package.json src-tauri/tauri.conf.json`, { cwd: rootDir, stdio: 'inherit' });
  execSync(`git commit -m "release: v${targetVersion}"`, { cwd: rootDir, stdio: 'inherit' });
  execSync(`git tag v${targetVersion}`, { cwd: rootDir, stdio: 'inherit' });
  
  console.log(`\n📤 Pushing branch and tag to GitHub...`);
  execSync(`git push origin main`, { cwd: rootDir, stdio: 'inherit' });
  execSync(`git push origin v${targetVersion}`, { cwd: rootDir, stdio: 'inherit' });

  console.log(`\n🎉 SUCCESS! Release tag v${targetVersion} pushed to GitHub.`);
  console.log(`👉 GitHub Actions is now compiling setup.exe and publishing the update.`);
  console.log(`👉 All user apps will automatically detect, download, and restart into v${targetVersion}!\n`);
} catch (err) {
  console.error('\n❌ Release failed during git operations:', err.message);
  process.exit(1);
}

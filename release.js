import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

const rl = readline.createInterface({ input, output });

/**
 * Platform-independent release script written in Node.js
 */
async function run() {
  console.log('\x1b[36m%s\x1b[0m', '--- List Dock Release Assistant ---');

  // 1. Check if there are uncommitted changes
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    if (status) {
      console.log('\x1b[31m%s\x1b[0m', 'Error: You have uncommitted changes. Please commit or stash them first.');
      console.log(execSync('git status', { encoding: 'utf8' }));
      process.exit(1);
    }
  } catch (error) {
    console.error('Failed to check git status:', error.message);
    process.exit(1);
  }

  // 2. Get current version info
  const pkgPath = './package.json';
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  let currentVersion = pkg.version;
  let latestTag = 'None';
  
  try {
    latestTag = execSync('git describe --tags --abbrev=0', { 
      encoding: 'utf8', 
      stdio: ['pipe', 'pipe', 'ignore'] 
    }).trim();
  } catch (e) {
    // No tags found yet
  }

  const tagVersion = latestTag.replace(/^v/, '');

  console.log('\x1b[90m%s\x1b[0m', `Current Package Version: v${currentVersion}`);
  console.log('\x1b[90m%s\x1b[0m', `Latest Git Tag:         ${latestTag}`);

  // 3. Handle Version Mismatch
  if (latestTag !== 'None' && currentVersion !== tagVersion) {
    console.log('\x1b[33m%s\x1b[0m', 'VERSION MISMATCH DETECTED!');
    console.log(`Package version (v${currentVersion}) does not match Git tag (${latestTag}).`);
    console.log('\x1b[33m%s\x1b[0m', 'Which version should be used as the base for this release?');
    console.log(`1) Use Package Version (v${currentVersion})`);
    console.log(`2) Use Git Tag Version (${latestTag})`);
    console.log('q) Quit');

    const syncChoice = await rl.question('Choice: ');
    if (syncChoice === '2') {
      console.log('\x1b[36m%s\x1b[0m', `Syncing package.json to match Git tag (${latestTag})...`);
      execSync(`pnpm version ${tagVersion} --no-git-tag-version --allow-same-version`, { stdio: 'inherit' });
      currentVersion = tagVersion;
    } else if (syncChoice === 'q') {
      console.log('Cancelled.');
      process.exit(0);
    } else {
      console.log('\x1b[90m%s\x1b[0m', 'Proceeding with Package Version as base.');
    }
  }

  // 4. Ask for release type
  console.log('\n\x1b[33m%s\x1b[0m', 'Select release type:');
  console.log('1) Patch (0.0.x)');
  console.log('2) Minor (0.x.0)');
  console.log('3) Major (x.0.0)');
  console.log('q) Quit');

  const choice = await rl.question('Choice: ');
  let type = '';

  switch (choice) {
    case '1': type = 'patch'; break;
    case '2': type = 'minor'; break;
    case '3': type = 'major'; break;
    case 'q': 
      console.log('Cancelled.'); 
      rl.close();
      process.exit(0);
    default: 
      console.log('Invalid choice.'); 
      rl.close();
      process.exit(1);
  }

  // 5. Ask for custom commit message
  console.log('\n\x1b[33m%s\x1b[0m', `Enter commit message (leave blank for auto: '${type} release vX.X.X'):`);
  const customMsg = await rl.question('Message: ');

  // 6. Final Confirmation
  console.log('\n\x1b[36m%s\x1b[0m', `Ready to release ${type}...`);
  const confirmation = await rl.question('Proceed? (y/n) ');
  if (confirmation.toLowerCase() !== 'y') {
    console.log('\x1b[90m%s\x1b[0m', 'Release cancelled.');
    rl.close();
    process.exit(0);
  }

  console.log('\n\x1b[36m%s\x1b[0m', 'Bumping version...');

  // 7. Run pnpm version
  try {
    let command = `pnpm version ${type}`;
    if (customMsg) {
      // Escape double quotes in message
      const escapedMsg = customMsg.replace(/"/g, '\\"');
      command += ` -m "${escapedMsg}"`;
    }
    
    const newVersion = execSync(command, { encoding: 'utf8' }).trim();
    console.log('\x1b[32m%s\x1b[0m', `New Version: ${newVersion}`);

    // 8. Push to origin
    console.log('\n\x1b[36m%s\x1b[0m', 'Pushing changes and tags to origin...');
    execSync('git push', { stdio: 'inherit' });
    execSync('git push --tags', { stdio: 'inherit' });

    console.log('\n\x1b[32m%s\x1b[0m', `✨ Release ${newVersion} successful! GitHub Actions check has started.`);
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', 'Error: Release failed.');
    console.error(error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

run();

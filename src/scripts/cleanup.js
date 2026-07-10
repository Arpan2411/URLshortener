// scripts/cleanup.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Starting project cleanup...\n');

// Check for empty files
function findEmptyFiles(dir) {
  const emptyFiles = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      emptyFiles.push(...findEmptyFiles(filePath));
    } else if (stat.size === 0) {
      emptyFiles.push(filePath);
    }
  }

  return emptyFiles;
}

// Check for unused dependencies
function findUnusedDependencies() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const usedModules = new Set();

  // Check src directory for require/import statements
  const srcDir = 'src';
  const files = getAllFiles(srcDir);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(/require\(['"]([^'"]+)['"]\)/g) || [];
    for (const match of matches) {
      const module = match.replace(/require\(['"]/, '').replace(/['"]\)/, '');
      if (!module.startsWith('.')) {
        usedModules.add(module);
      }
    }
  }

  const unused = [];
  for (const dep of Object.keys(dependencies)) {
    if (!usedModules.has(dep) && !dep.startsWith('@')) {
      unused.push(dep);
    }
  }

  return unused;
}

function getAllFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      files.push(...getAllFiles(itemPath));
    } else if (item.endsWith('.js')) {
      files.push(itemPath);
    }
  }

  return files;
}

// Main cleanup
function cleanup() {
  // 1. Find empty files
  console.log('📁 Finding empty files...');
  const emptyFiles = findEmptyFiles('src');
  if (emptyFiles.length > 0) {
    console.log('Empty files found:');
    emptyFiles.forEach(f => console.log(`  - ${f}`));
  } else {
    console.log('✅ No empty files found');
  }

  // 2. Check for unused dependencies
  console.log('\n📦 Checking for unused dependencies...');
  try {
    const unused = findUnusedDependencies();
    if (unused.length > 0) {
      console.log('Unused dependencies found:');
      unused.forEach(d => console.log(`  - ${d}`));
    } else {
      console.log('✅ No unused dependencies found');
    }
  } catch (error) {
    console.error('Error checking dependencies:', error.message);
  }

  console.log('\n✨ Cleanup complete!');
}

cleanup();
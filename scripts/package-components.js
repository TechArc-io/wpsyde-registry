#!/usr/bin/env node

/**
 * Component Packaging Script for WPSyde Registry
 *
 * This script packages components for the registry by:
 * 1. Creating the correct directory structure
 * 2. Generating manifests
 * 3. Creating component.zip files
 * 4. Preparing for registry deployment
 */

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const crypto = require('crypto');

const ROOT = process.cwd();
const COMPONENTS_DIR = path.join(ROOT, 'components');
const REGISTRY_DIR = path.join(ROOT, 'registry');
const VERSION = '1.0.0';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warn(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

// Get all component names
function getComponents() {
  if (!fs.existsSync(COMPONENTS_DIR)) {
    error('Components directory not found');
    return [];
  }

  return fs
    .readdirSync(COMPONENTS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
}

// Calculate SHA256 hash
function calculateHash(data) {
  return crypto.createHash('sha256').update(data).digest('base64');
}

// Create component manifest
function createManifest(componentName) {
  const componentDir = path.join(COMPONENTS_DIR, componentName);
  const registryComponentDir = path.join(
    REGISTRY_DIR,
    'components',
    componentName,
    VERSION
  );

  // Ensure registry directory exists
  fs.mkdirSync(registryComponentDir, { recursive: true });

  // List component files
  const componentFiles = [];
  const files = [
    'component.php',
    'styles.css',
    'enhancer.js',
    'example.php',
    'README.md',
    'manifest.json',
  ];

  files.forEach(file => {
    const filePath = path.join(componentDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const hash = calculateHash(content);

      // Map generic names to component-specific names
      let destFile = file;
      if (file === 'component.php')
        destFile = `${componentName.toLowerCase()}.php`;
      if (file === 'styles.css') destFile = `${componentName}.css`;
      if (file === 'enhancer.js')
        destFile = `${componentName.toLowerCase()}.js`;

      componentFiles.push({
        path: `template-parts/components/${componentName}/${file}`,
        dest: `template-parts/components/${componentName}/${destFile}`,
        integrity: `sha256-${hash}`,
      });
    }
  });

  // Create manifest
  const manifest = {
    name: componentName,
    version: VERSION,
    description: `${componentName} component for WordPress`,
    files: componentFiles,
    dependencies: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Write manifest
  const manifestPath = path.join(registryComponentDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  return manifest;
}

// Create component.zip
function createComponentZip(componentName) {
  const componentDir = path.join(COMPONENTS_DIR, componentName);
  const registryComponentDir = path.join(
    REGISTRY_DIR,
    'components',
    componentName,
    VERSION
  );
  const zipPath = path.join(registryComponentDir, 'component.zip');

  const zip = new AdmZip();

  // Add component files to zip
  const files = [
    'component.php',
    'styles.css',
    'enhancer.js',
    'example.php',
    'README.md',
  ];

  files.forEach(file => {
    const filePath = path.join(componentDir, file);
    if (fs.existsSync(filePath)) {
      // Add to zip with WordPress-style path structure
      const zipEntryPath = `template-parts/components/${componentName}/${file}`;
      zip.addLocalFile(filePath, `template-parts/components/${componentName}/`);
    }
  });

  // Write zip file
  zip.writeZip(zipPath);

  // Calculate zip integrity
  const zipData = fs.readFileSync(zipPath);
  const zipHash = calculateHash(zipData);

  return `sha256-${zipHash}`;
}

// Package a single component
function packageComponent(componentName) {
  try {
    info(`Packaging ${componentName}...`);

    // Create manifest
    const manifest = createManifest(componentName);

    // Create component.zip
    const zipIntegrity = createComponentZip(componentName);

    // Update manifest with zip integrity
    manifest.archives = {
      zip: `component.zip`,
      integrity: zipIntegrity,
    };

    // Write updated manifest
    const manifestPath = path.join(
      REGISTRY_DIR,
      'components',
      componentName,
      VERSION,
      'manifest.json'
    );
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    success(`  Packaged ${componentName}`);
    return true;
  } catch (err) {
    warn(`Failed to package ${componentName}: ${err.message}`);
    return false;
  }
}

// Package all components
function packageAllComponents() {
  log('\n📦 Packaging components for registry...', 'bright');

  // Clean registry directory
  if (fs.existsSync(REGISTRY_DIR)) {
    fs.rmSync(REGISTRY_DIR, { recursive: true, force: true });
  }

  const components = getComponents();
  if (components.length === 0) {
    error('No components found');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  components.forEach(componentName => {
    if (packageComponent(componentName)) {
      successCount++;
    } else {
      failCount++;
    }
  });

  // Copy index.json to registry
  const indexPath = path.join(ROOT, 'index.json');
  if (fs.existsSync(indexPath)) {
    const registryIndexPath = path.join(REGISTRY_DIR, 'index.json');
    fs.copyFileSync(indexPath, registryIndexPath);
    success('  Copied index.json to registry');
  }

  log(`\n📊 Packaging Summary:`, 'bright');
  log(`   ✅ Success: ${successCount}`, 'green');
  if (failCount > 0) {
    log(`   ❌ Failed: ${failCount}`, 'red');
  }

  log(`\n📁 Registry ready at: ${REGISTRY_DIR}`, 'cyan');
  log(`   Deploy this directory to your registry server`, 'white');
}

// Main function
function main() {
  const command = process.argv[2];

  switch (command) {
    case 'package':
      packageAllComponents();
      break;

    case 'help':
    default:
      log('\n📦 WPSyde Component Packager', 'bright');
      log('\nUsage:', 'cyan');
      log(
        '  pnpm run package:components     Package all components for registry',
        'white'
      );
      log('  pnpm run package:components help Show this help', 'white');
      log(
        '\nThis script packages components for the WPSyde registry.',
        'white'
      );
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { packageComponent, packageAllComponents };

#!/usr/bin/env node

/**
 * Build WPSyde Registry
 *
 * This script builds the complete registry by:
 * 1. Packaging all components in WordPress-style structure
 * 2. Updating index.json with component information
 * 3. Preparing for deployment to Cloudflare Pages
 *
 * Usage: node scripts/build-registry.js [--version=1.0.0] [--only=Button,Card]
 */

const fs = require('fs');
const path = require('path');
const { packageComponent } = require('./package-components.js');

const ROOT = process.cwd();
const COMPONENTS_DIR = path.join(ROOT, 'components');
const REGISTRY_DIR = path.join(ROOT, 'registry');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
  process.exit(1);
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

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    version: '1.0.0',
    only: null,
    help: false,
  };

  args.forEach(arg => {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg.startsWith('--version=')) {
      options.version = arg.split('=')[1];
    } else if (arg.startsWith('--only=')) {
      options.only = arg.split('=')[1].split(',');
    }
  });

  return options;
}

// Show help
function showHelp() {
  log('\n🚀 WPSyde Registry Builder', 'bright');
  log('==========================', 'bright');
  log('\nUsage:', 'cyan');
  log('  node scripts/build-registry.js [options]', 'white');
  log('\nOptions:', 'cyan');
  log(
    '  --version=1.0.0        Set version for all components (default: 1.0.0)',
    'white'
  );
  log('  --only=Button,Card     Build only specific components', 'white');
  log('  --help                 Show this help message', 'white');
  log('\nExamples:', 'cyan');
  log('  node scripts/build-registry.js', 'white');
  log('  node scripts/build-registry.js --version=1.1.0', 'white');
  log('  node scripts/build-registry.js --only=Button,Card', 'white');
  log('\nThis will:', 'cyan');
  log('  1. Package all components in WordPress-style structure', 'white');
  log('  2. Update index.json with component information', 'white');
  log('  3. Prepare registry for deployment', 'white');
}

// Ensure directories exist
function ensureDirectories() {
  if (!fs.existsSync(REGISTRY_DIR)) {
    fs.mkdirSync(REGISTRY_DIR, { recursive: true });
  }
}

// Get components to build
function getComponentsToBuild(options) {
  if (!fs.existsSync(COMPONENTS_DIR)) {
    error(`Components directory not found: ${COMPONENTS_DIR}`);
  }

  let components = fs
    .readdirSync(COMPONENTS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  if (options.only) {
    components = components.filter(comp => options.only.includes(comp));
    if (components.length === 0) {
      error(`No components found matching: ${options.only.join(', ')}`);
    }
  }

  return components;
}

// Build component package
async function buildComponent(componentName, version) {
  try {
    log(`\n📦 Building ${componentName}@${version}...`, 'cyan');

    const result = await packageComponent(componentName, version);
    if (result) {
      success(`Built ${componentName}@${version}`);
      return result;
    }
  } catch (err) {
    warn(`Failed to build ${componentName}: ${err.message}`);
    return null;
  }
}

// Components are already in registry from package-components.js
function copyToRegistry(componentName, version) {
  const targetDir = path.join(
    REGISTRY_DIR,
    'components',
    componentName,
    version
  );

  if (!fs.existsSync(targetDir)) {
    warn(`Registry directory not found: ${targetDir}`);
    return false;
  }

  // Check if component files exist
  const manifestPath = path.join(targetDir, 'manifest.json');
  const zipPath = path.join(targetDir, 'component.zip');

  if (fs.existsSync(manifestPath) && fs.existsSync(zipPath)) {
    info(`  Component ${componentName} already in registry`);
    return true;
  } else {
    warn(`  Component ${componentName} missing required files`);
    return false;
  }
}

// Update index.json
function updateIndex(components, version) {
  const indexPath = path.join(REGISTRY_DIR, 'index.json');
  let index = { components: {} };

  // Load existing index if it exists
  if (fs.existsSync(indexPath)) {
    try {
      index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    } catch (err) {
      warn(`Failed to parse existing index.json: ${err.message}`);
    }
  }

  // Update component information
  components.forEach(componentName => {
    const manifestPath = path.join(
      REGISTRY_DIR,
      'components',
      componentName,
      version,
      'manifest.json'
    );

    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        index.components[componentName] = {
          latest: version,
          versions: [version],
          description: manifest.description || '',
          updatedAt: new Date().toISOString(),
        };
      } catch (err) {
        warn(`Failed to read manifest for ${componentName}: ${err.message}`);
      }
    }
  });

  // Write updated index
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  success(
    `Updated index.json with ${Object.keys(index.components).length} components`
  );
}

// Build registry
async function buildRegistry(options) {
  log('\n🚀 Building WPSyde Registry...', 'bright');
  log(`Version: ${options.version}`, 'cyan');

  if (options.only) {
    log(`Components: ${options.only.join(', ')}`, 'cyan');
  }

  // Ensure directories exist
  ensureDirectories();

  // Get components to build
  const components = getComponentsToBuild(options);
  log(`\nFound ${components.length} components to build`, 'blue');

  // Build each component
  const builtComponents = [];
  for (const component of components) {
    const result = await buildComponent(component, options.version);
    if (result) {
      builtComponents.push(component);
    }
  }

  if (builtComponents.length === 0) {
    error('No components were built successfully');
  }

  // Copy to registry
  log('\n📁 Copying packages to registry...', 'blue');
  const copiedComponents = [];
  builtComponents.forEach(component => {
    if (copyToRegistry(component, options.version)) {
      copiedComponents.push(component);
    }
  });

  // Update index.json
  if (copiedComponents.length > 0) {
    log('\n📋 Updating registry index...', 'blue');
    updateIndex(copiedComponents, options.version);
  }

  // Summary
  log('\n🎉 Registry Build Complete!', 'bright');
  log('============================', 'bright');
  log(
    `Built: ${builtComponents.length}/${components.length} components`,
    'green'
  );
  log(
    `Copied: ${copiedComponents.length}/${builtComponents.length} to registry`,
    'green'
  );
  log(`Registry location: ${REGISTRY_DIR}`, 'cyan');

  if (copiedComponents.length > 0) {
    log('\nNext steps:', 'bright');
    log('1. Review the registry in the registry/ directory', 'white');
    log('2. Commit and push changes to GitHub', 'white');
    log('3. Deploy to Cloudflare Pages', 'white');
  }
}

// Main function
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  try {
    await buildRegistry(options);
  } catch (err) {
    error(`Registry build failed: ${err.message}`);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { buildRegistry, parseArgs };

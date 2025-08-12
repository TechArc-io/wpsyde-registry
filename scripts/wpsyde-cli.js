#!/usr/bin/env node

/**
 * WPSyde UI - Professional Component Manager (shadcn/ui style)
 * Usage: npx wpsyde-ui add Button
 *
 * This CLI downloads and installs WordPress components from the WPSyde registry.
 * Components are copied directly to your theme directory (no npm dependencies).
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const AdmZip = require('adm-zip');

const REGISTRY_URL = 'https://registry.wpsyde.com';
const CONFIG_FILE = 'wpsyde.json';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Input validation and sanitization
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }

  // Remove any path traversal attempts
  const sanitized = input.replace(/[<>:"|?*\x00-\x1f]/g, '');

  // Ensure it's not empty and doesn't contain dangerous patterns
  if (!sanitized || sanitized.includes('..') || sanitized.includes('//')) {
    throw new Error('Invalid input: contains dangerous characters or patterns');
  }

  return sanitized;
}

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

// HTTP helper with progress
function fetch(url, showProgress = false, binary = false) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, res => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }

      let data = binary ? Buffer.alloc(0) : '';
      const total = parseInt(res.headers['content-length'], 10);
      let downloaded = 0;

      res.on('data', chunk => {
        if (binary) {
          data = Buffer.concat([data, chunk]);
        } else {
          data += chunk;
        }
        downloaded += chunk.length;

        if (showProgress && total) {
          const percent = Math.round((downloaded / total) * 100);
          process.stdout.write(
            `\rDownloading... ${percent}% (${downloaded}/${total} bytes)`
          );
        }
      });

      res.on('end', () => {
        if (showProgress) {
          process.stdout.write('\n');
        }
        resolve(data);
      });
    });

    request.on('error', reject);
    request.setTimeout(30000, () => request.destroy()); // 30s timeout
  });
}

// Initialize wpsyde.json
function init() {
  if (fs.existsSync(CONFIG_FILE)) {
    warn('wpsyde.json already exists');
    return;
  }

  const config = {
    registry: REGISTRY_URL,
    themePath: 'theme',
    componentsDir: 'theme/template-parts/components',
    blocksDir: 'theme/template-parts/blocks',
    acfJsonDir: 'acf-json',
    channels: ['stable'],
    installed: {},
  };

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  success(`Created ${CONFIG_FILE}`);
  info('Edit this file to customize your paths');
}

// List available components
async function list() {
  try {
    log('\n📦 Fetching components from registry...', 'blue');
    const indexData = await fetch(`${REGISTRY_URL}/index.json`);
    const index = JSON.parse(indexData);

    log('\n📦 Available Components:', 'bright');
    log('========================', 'bright');

    Object.entries(index.components).forEach(([name, component]) => {
      const latest = component.latest;
      const versions = component.versions;
      log(`\n${name}:`, 'cyan');
      log(`  Latest: ${latest}`, 'green');
      log(`  Versions: ${versions.join(', ')}`, 'yellow');
      if (component.description) {
        log(`  Description: ${component.description}`, 'white');
      }
    });

    log(
      `\nTotal: ${Object.keys(index.components).length} components available`,
      'bright'
    );
  } catch (err) {
    error(`Failed to fetch components: ${err.message}`);
  }
}

// Add a component (shadcn style)
async function add(componentName, version = 'latest') {
  try {
    // Validate and sanitize inputs
    const sanitizedComponentName = sanitizeInput(componentName);
    const sanitizedVersion =
      version === 'latest' ? 'latest' : sanitizeInput(version);

    // Load config
    if (!fs.existsSync(CONFIG_FILE)) {
      error('wpsyde.json not found. Run "npx wpsyde-ui init" first');
    }

    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

    log(`\n🚀 Adding ${sanitizedComponentName}...`, 'bright');

    // Fetch component info
    log('📋 Fetching component information...', 'blue');
    const indexData = await fetch(`${REGISTRY_URL}/index.json`);
    const index = JSON.parse(indexData);

    // Find component
    if (!index.components[sanitizedComponentName]) {
      error(
        `Component "${sanitizedComponentName}" not found. Run "npx wpsyde-ui list" to see available components`
      );
    }

    const component = index.components[sanitizedComponentName];

    // Get version
    const versions = component.versions;
    const targetVersion =
      sanitizedVersion === 'latest' ? component.latest : sanitizedVersion;

    if (!versions.includes(targetVersion)) {
      error(
        `Version ${targetVersion} not found for ${sanitizedComponentName}. Available: ${versions.join(', ')}`
      );
    }

    log(`📦 Installing ${sanitizedComponentName}@${targetVersion}`, 'cyan');

    // Create directories
    const targetDir = path.join(
      config.componentsDir,
      sanitizedComponentName,
      targetVersion
    );
    fs.mkdirSync(targetDir, { recursive: true });

    // Download manifest
    log('📄 Downloading manifest...', 'blue');
    const manifestUrl = `${REGISTRY_URL}/components/${componentName}/${targetVersion}/manifest.json`;
    const manifestData = await fetch(manifestUrl);
    const manifest = JSON.parse(manifestData);

    fs.writeFileSync(path.join(targetDir, 'manifest.json'), manifestData);

    // Download component.zip
    log('📦 Downloading component files...', 'blue');
    const zipUrl = `${REGISTRY_URL}/components/${componentName}/${targetVersion}/component.zip`;
    const zipPath = path.join(targetDir, 'component.zip');

    const zipData = await fetch(zipUrl, true, true); // Show progress, binary
    fs.writeFileSync(zipPath, zipData);

    // Extract component.zip
    log('🔓 Extracting component...', 'blue');
    try {
      // Use Adm-zip for clean extraction with path filtering
      const zip = new AdmZip(zipPath);

      // Extract only the component files, skipping the nested structure
      zip.getEntries().forEach(entry => {
        if (entry.isDirectory) return;

        // Check if this is a component file we want
        const entryPath = entry.entryName;
        const componentPath = `template-parts/components/${sanitizedComponentName}/`;

        if (entryPath.startsWith(componentPath)) {
          // Extract directly to target directory, removing the nested path
          const relativePath = entryPath.replace(componentPath, '');
          const targetPath = path.join(targetDir, relativePath);

          // Ensure target directory exists
          const targetDirPath = path.dirname(targetPath);
          fs.mkdirSync(targetDirPath, { recursive: true });

          // Extract the file
          zip.extractEntryTo(entry, targetDirPath, false, true);
        }
      });

      // Clean up zip file
      fs.unlinkSync(zipPath);
    } catch (err) {
      error(`Failed to extract component: ${err.message}`);
    }

    // Update installed list
    config.installed[sanitizedComponentName] = {
      version: targetVersion,
      installedAt: new Date().toISOString(),
    };

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

    success(
      `\n🎉 Successfully installed ${sanitizedComponentName}@${targetVersion}!`
    );
    info(`Component files are ready in: ${targetDir}`);

    // Show next steps
    log('\n📚 Next steps:', 'bright');
    log('1. Include the component in your theme:', 'white');
    log(
      `   get_template_part('template-parts/components/${sanitizedComponentName}/${targetVersion}/component')`,
      'cyan'
    );
    log('2. Customize the component files as needed', 'white');
    log(
      '3. Run "npx wpsyde-ui list" to see other available components',
      'white'
    );
  } catch (err) {
    error(`Failed to add component: ${err.message}`);
  }
}

// Show help
function help() {
  log('\n🚀 WPSyde UI - Professional Component Manager', 'bright');
  log('==================================================', 'bright');
  log('\nUsage:', 'cyan');
  log('  npx wpsyde-ui <command> [options]', 'white');
  log('\nCommands:', 'cyan');
  log(
    '  init                    Initialize wpsyde.json configuration',
    'white'
  );
  log('  list                    List available components', 'white');
  log(
    '  add <name> [version]    Install a component (default: latest)',
    'white'
  );
  log('  help                    Show this help message', 'white');
  log('\nExamples:', 'cyan');
  log('  npx wpsyde-ui init', 'white');
  log('  npx wpsyde-ui list', 'white');
  log('  npx wpsyde-ui add Button', 'white');
  log('  npx wpsyde-ui add Card 1.0.0', 'white');
  log('\nHow it works:', 'cyan');
  log('  • Downloads component files directly from registry', 'white');
  log(
    '  • Copies files to your theme directory (no npm dependencies)',
    'white'
  );
  log('  • Full control over component code - customize as needed', 'white');
  log('  • Similar to shadcn/ui approach', 'white');
  log('\nRequirements:', 'cyan');
  log('  - Node.js (built-in, no npm install needed)', 'white');
  log('  - Pure JavaScript extraction (no external commands)', 'white');
}

// Main CLI logic
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    help();
    return;
  }

  switch (command) {
    case 'init':
      init();
      break;
    case 'list':
      list();
      break;
    case 'add':
      if (!args[1]) {
        error(
          'Component name required. Usage: npx wpsyde-ui add <ComponentName>'
        );
      }
      add(sanitizeInput(args[1]), args[2] ? sanitizeInput(args[2]) : 'latest');
      break;
    default:
      error(`Unknown command: ${command}. Run "npx wpsyde-ui help" for usage`);
  }
}

// Run CLI
if (require.main === module) {
  main();
}

module.exports = { init, list, add, help, sanitizeInput };

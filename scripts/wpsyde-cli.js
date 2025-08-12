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
const { execSync } = require('child_process');

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
    // Load config
    if (!fs.existsSync(CONFIG_FILE)) {
      error('wpsyde.json not found. Run "npx wpsyde-ui init" first');
    }

    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

    log(`\n🚀 Adding ${componentName}...`, 'bright');

    // Fetch component info
    log('📋 Fetching component information...', 'blue');
    const indexData = await fetch(`${REGISTRY_URL}/index.json`);
    const index = JSON.parse(indexData);

    // Find component
    if (!index.components[componentName]) {
      error(
        `Component "${componentName}" not found. Run "npx wpsyde-ui list" to see available components`
      );
    }

    const component = index.components[componentName];

    // Get version
    const versions = component.versions;
    const targetVersion = version === 'latest' ? component.latest : version;

    if (!versions.includes(targetVersion)) {
      error(
        `Version ${targetVersion} not found for ${componentName}. Available: ${versions.join(', ')}`
      );
    }

    log(`📦 Installing ${componentName}@${targetVersion}`, 'cyan');

    // Create directories
    const targetDir = path.join(
      config.componentsDir,
      componentName,
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
      execSync(`unzip -o "${zipPath}" -d "${targetDir}"`, { stdio: 'inherit' });
      fs.unlinkSync(zipPath); // Remove zip after extraction
    } catch (err) {
      warn('Failed to extract with unzip, trying with tar...');
      try {
        execSync(`tar -xf "${zipPath}" -C "${targetDir}"`, {
          stdio: 'inherit',
        });
        fs.unlinkSync(zipPath);
      } catch (tarErr) {
        error(`Failed to extract component: ${tarErr.message}`);
      }
    }

    // Update installed list
    config.installed[componentName] = {
      version: targetVersion,
      installedAt: new Date().toISOString(),
    };

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

    success(`\n🎉 Successfully installed ${componentName}@${targetVersion}!`);
    info(`Component files are ready in: ${targetDir}`);

    // Show next steps
    log('\n📚 Next steps:', 'bright');
    log('1. Include the component in your theme:', 'white');
    log(
      `   get_template_part('template-parts/components/${componentName}/${targetVersion}/component')`,
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
  log('  - unzip or tar command for extraction', 'white');
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
      add(args[1], args[2]);
      break;
    default:
      error(`Unknown command: ${command}. Run "npx wpsyde-ui help" for usage`);
  }
}

// Run CLI
if (require.main === module) {
  main();
}

module.exports = { init, list, add, help };

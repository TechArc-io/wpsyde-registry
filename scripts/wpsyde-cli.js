#!/usr/bin/env node

/**
 * WPSyde UI - Professional Component Manager (WordPress-native style)
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

        // Check if we got HTML instead of expected content
        if (!binary && data.trim().startsWith('<!doctype')) {
          reject(
            new Error(
              'Registry returned HTML instead of expected content. The registry may not be properly deployed.'
            )
          );
          return;
        }

        resolve(data);
      });
    });

    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
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

// Add a component (WordPress style)
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

    // Create WordPress-style component directory
    const componentDir = path.join(
      config.componentsDir,
      sanitizedComponentName
    );
    fs.mkdirSync(componentDir, { recursive: true });

    // Download manifest
    log('📄 Downloading manifest...', 'blue');
    const manifestUrl = `${REGISTRY_URL}/components/${componentName}/${targetVersion}/manifest.json`;
    const manifestData = await fetch(manifestUrl);
    const manifest = JSON.parse(manifestData);

    fs.writeFileSync(path.join(componentDir, 'manifest.json'), manifestData);

    // Download component.zip
    log('📦 Downloading component files...', 'blue');
    const zipUrl = `${REGISTRY_URL}/components/${componentName}/${targetVersion}/component.zip`;
    const zipPath = path.join(componentDir, 'component.zip');

    const zipData = await fetch(zipUrl, true, true); // Show progress, binary
    fs.writeFileSync(zipPath, zipData);

    // Extract component.zip to WordPress-style structure
    log('🔓 Extracting component...', 'blue');
    try {
      // Use Adm-zip for clean extraction with WordPress-style paths
      const zip = new AdmZip(zipPath);

      // Extract only the component files, creating WordPress-style structure
      zip.getEntries().forEach(entry => {
        if (entry.isDirectory) return;

        // Check if this is a component file we want
        const entryPath = entry.entryName;
        const componentPath = `template-parts/components/${sanitizedComponentName}/`;

        if (entryPath.startsWith(componentPath)) {
          // Extract to WordPress-style paths (flat structure)
          const relativePath = entryPath.substring(componentPath.length);

          // Convert to WordPress naming convention
          let fileName = relativePath;

          // Handle main component file
          if (fileName === 'component.php') {
            fileName = `${sanitizedComponentName.toLowerCase()}.php`;
          } else if (fileName === 'styles.css') {
            fileName = `${sanitizedComponentName.toLowerCase()}.css`;
          } else if (fileName === 'enhancer.js') {
            fileName = `${sanitizedComponentName.toLowerCase()}.js`;
          } else if (fileName === 'README.md') {
            fileName = 'readme.md';
          }

          const targetPath = path.join(componentDir, fileName);

          // Ensure target directory exists
          const targetDirPath = path.dirname(targetPath);
          fs.mkdirSync(targetDirPath, { recursive: true });

          // Write the file directly to avoid nested paths
          const fileContent = zip.readAsText(entry);
          fs.writeFileSync(targetPath, fileContent);
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
    info(`Component files are ready in: ${componentDir}`);

    // Show next steps
    log('\n📚 Next steps:', 'bright');
    log('1. Include the component in your theme:', 'white');
    log(
      `   get_template_part('template-parts/components/${sanitizedComponentName}/${sanitizedComponentName.toLowerCase()}')`,
      'cyan'
    );
    log('2. Customize the component files as needed', 'white');
    log(
      '3. Run "npx wpsyde-ui list" to see other available components',
      'white'
    );
  } catch (err) {
    if (err.message.includes('HTML instead of expected content')) {
      error(`Registry Error: ${err.message}`);
      log('\n🔧 Troubleshooting:', 'cyan');
      log('• The WPSyde registry may not be properly deployed', 'white');
      log('• Check if Cloudflare Pages deployment is complete', 'white');
      log('• Try again in a few minutes', 'white');
      log('• Contact support if the issue persists', 'white');
    } else {
      error(`Failed to add component: ${err.message}`);
    }
  }
}

// Add multiple components
async function addMultiple(componentNames, version) {
  log(`\n🚀 Adding ${componentNames.length} components...`, 'bright');

  for (const componentName of componentNames) {
    try {
      await add(componentName, version);
      log(''); // Add spacing between components
    } catch (err) {
      warn(`Failed to add ${componentName}: ${err.message}`);
      // Continue with other components
    }
  }

  success(`\n🎉 Completed adding ${componentNames.length} components!`);
}

// Add all available components
async function addAll() {
  log('\n🚀 Adding all available components...', 'bright');

  try {
    // Fetch component list
    const response = await fetch(`${REGISTRY_URL}/index.json`);
    const data = JSON.parse(response);

    if (!data.components || Object.keys(data.components).length === 0) {
      error('No components found in registry');
    }

    const componentNames = Object.keys(data.components);
    log(`📋 Found ${componentNames.length} components to install`, 'cyan');

    // Confirm with user
    log('\n⚠️  This will install ALL components. Continue? (y/N)', 'yellow');
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.once('data', async data => {
      const answer = data.trim().toLowerCase();
      if (answer === 'y' || answer === 'yes') {
        await addMultiple(componentNames, 'latest');
      } else {
        log('Installation cancelled.', 'yellow');
      }
      process.exit(0);
    });
  } catch (err) {
    error(`Failed to fetch component list: ${err.message}`);
  }
}

// Remove a component
function remove(componentName) {
  try {
    const sanitizedComponentName = sanitizeInput(componentName);

    // Load config
    if (!fs.existsSync(CONFIG_FILE)) {
      error('wpsyde.json not found. Run "npx wpsyde-ui init" first');
    }

    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

    // Check if component is installed
    if (!config.installed[sanitizedComponentName]) {
      warn(`Component "${sanitizedComponentName}" is not installed`);
      return;
    }

    log(`\n🗑️  Removing ${sanitizedComponentName}...`, 'bright');

    // Remove component directory
    const componentDir = path.join(
      config.componentsDir,
      sanitizedComponentName
    );
    if (fs.existsSync(componentDir)) {
      fs.rmSync(componentDir, { recursive: true, force: true });
      success(`Removed component directory: ${componentDir}`);
    }

    // Remove from installed list
    delete config.installed[sanitizedComponentName];
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

    success(`\n🎉 Successfully removed ${sanitizedComponentName}!`);
  } catch (err) {
    error(`Failed to remove component: ${err.message}`);
  }
}

// Show help
function help() {
  log(
    '\n🚀 WPSyde UI - Professional Component Manager (WordPress-native)',
    'bright'
  );
  log(
    '================================================================',
    'bright'
  );
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
  log('  add <name1> <name2>...  Install multiple components', 'white');
  log('  add --all               Install all available components', 'white');
  log('  remove <name>           Remove an installed component', 'white');
  log('  health                  Check registry health', 'white');
  log('  help                    Show this help message', 'white');
  log('\nExamples:', 'cyan');
  log('  npx wpsyde-ui init', 'white');
  log('  npx wpsyde-ui list', 'white');
  log('  npx wpsyde-ui add Button', 'white');
  log('  npx wpsyde-ui add Card 1.0.0', 'white');
  log('  npx wpsyde-ui add Button Card Input', 'white');
  log('  npx wpsyde-ui add --all', 'white');
  log('  npx wpsyde-ui remove Button', 'white');
  log('\nHow it works:', 'cyan');
  log('  • Downloads component files directly from registry', 'white');
  log(
    '  • Copies files to your theme directory (no npm dependencies)',
    'white'
  );
  log('  • Full control over component code - customize as needed', 'white');
  log('  • WordPress-native component structure', 'white');
  log('\nRequirements:', 'cyan');
  log('  - Node.js (built-in, no npm install needed)', 'white');
  log('  - Pure JavaScript extraction (no external commands)', 'white');
}

// Check registry health
async function checkRegistryHealth() {
  try {
    log('\n🔍 Checking registry health...', 'cyan');

    const response = await fetch(`${REGISTRY_URL}/index.json`);
    const data = JSON.parse(response);

    if (!data.components || Object.keys(data.components).length === 0) {
      warn('Registry index is empty or invalid');
      return false;
    }

    const componentCount = Object.keys(data.components).length;
    success(`Registry is healthy - ${componentCount} components available`);

    // Test a specific component endpoint
    const testComponent = Object.keys(data.components)[0];
    const testVersion = data.components[testComponent].latest;

    try {
      const manifestResponse = await fetch(
        `${REGISTRY_URL}/components/${testComponent}/${testVersion}/manifest.json`
      );
      if (manifestResponse.trim().startsWith('<!doctype')) {
        warn('Component endpoints are returning HTML instead of JSON');
        log('This indicates a deployment issue with the registry', 'yellow');
        return false;
      }
      success('Component endpoints are working correctly');
      return true;
    } catch (manifestErr) {
      warn(`Component endpoint test failed: ${manifestErr.message}`);
      return false;
    }
  } catch (err) {
    error(`Registry health check failed: ${err.message}`);
    return false;
  }
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
          'Component name required. Usage: npx wpsyde-ui add <ComponentName> [--all]'
        );
      }

      // Check for --all flag
      if (args[1] === '--all') {
        addAll();
        return;
      }

      // Check for multiple components
      const components = args.slice(1);
      const version = components[components.length - 1].match(/^\d+\.\d+\.\d+$/)
        ? components.pop()
        : 'latest';

      if (components.length === 1) {
        // Single component
        add(sanitizeInput(components[0]), version);
      } else {
        // Multiple components
        addMultiple(
          components.map(c => sanitizeInput(c)),
          version
        );
      }
      break;

    case 'remove':
      if (!args[1]) {
        error(
          'Component name required. Usage: npx wpsyde-ui remove <ComponentName>'
        );
      }
      remove(sanitizeInput(args[1]));
      break;
    case 'health':
      checkRegistryHealth();
      break;
    default:
      error(`Unknown command: ${command}. Run "npx wpsyde-ui help" for usage`);
  }
}

// Run CLI
if (require.main === module) {
  main();
}

module.exports = {
  init,
  list,
  add,
  addMultiple,
  addAll,
  remove,
  health: checkRegistryHealth,
  help,
  sanitizeInput,
};

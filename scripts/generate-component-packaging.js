#!/usr/bin/env node

/**
 * WPSyde Component Generator and Packager
 * 
 * This script creates and packages components for the WPSyde registry:
 * - Creates components directory structure
 * - Generates sample components with proper files
 * - Packages components for distribution
 * - Updates existing components with missing files
 * 
 * Usage: node scripts/generate-component-packaging.js [command] [options]
 */

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const crypto = require('crypto');

const ROOT = process.cwd();
const COMPONENTS_DIR = path.join(ROOT, 'components');
const OUTPUT_DIR = path.join(ROOT, 'packages');

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

// Ensure directories exist
function ensureDirectories() {
  if (!fs.existsSync(COMPONENTS_DIR)) {
    fs.mkdirSync(COMPONENTS_DIR, { recursive: true });
    info(`Created components directory: ${COMPONENTS_DIR}`);
  }
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    info(`Created packages directory: ${OUTPUT_DIR}`);
  }
}

// Parse existing component PHP to extract defaults
function parseDefaultsFromPHP(phpContent) {
  const defaultsMatch = phpContent.match(/function\s+defaults\s*\(\)\s*:\s*array\s*{([\s\S]*?)}/);
  if (!defaultsMatch) return {};
  
  const defaultsBody = defaultsMatch[1];
  const props = {};
  
  // Extract key-value pairs from the defaults array
  const lines = defaultsBody.split('\n');
  lines.forEach(line => {
    const match = line.match(/['"`]([^'"`]+)['"`]\s*=>\s*([^,]+)/);
    if (match) {
      const key = match[1];
      let value = match[2].trim();
      
      // Clean up the value
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      if (value === '[]') value = [];
      if (value === 'null') value = null;
      
      props[key] = value;
    }
  });
  
  return props;
}

// Generate component manifest for existing components
function generateManifestForExisting(name, description, props) {
  return {
    name: name,
    version: "1.0.0",
    description: description,
    dependencies: [],
    files: [
      {
        path: `template-parts/components/${name}/component.php`,
        dest: `theme/template-parts/components/${name}/component.php`,
        integrity: ""
      },
      {
        path: `template-parts/components/${name}/README.md`,
        dest: `theme/template-parts/components/${name}/README.md`,
        integrity: ""
      },
      {
        path: `template-parts/components/${name}/example.php`,
        dest: `theme/template-parts/components/${name}/example.php`,
        integrity: ""
      },
      {
        path: `template-parts/components/${name}/enhancer.js`,
        dest: `theme/template-parts/components/${name}/enhancer.js`,
        integrity: ""
      },
      {
        path: `template-parts/components/${name}/styles.css`,
        dest: `theme/template-parts/components/${name}/styles.css`,
        integrity: ""
      }
    ],
    archives: {
      zip: `https://registry.wpsyde.com/components/${name}/1.0.0/component.zip`,
      integrity: ""
    },
    pro: false,
    checksum: "",
    signature: ""
  };
}

// Create ZIP package for existing component
function createZipForExistingComponent(componentName) {
  const componentDir = path.join(COMPONENTS_DIR, componentName);
  const zip = new AdmZip();
  
  // Add component files to ZIP with proper structure
  const files = [
    'component.php',
    'README.md', 
    'example.php',
    'enhancer.js',
    'styles.css'
  ];
  
  files.forEach(file => {
    const filePath = path.join(componentDir, file);
    if (fs.existsSync(filePath)) {
      const zipPath = `template-parts/components/${componentName}/${file}`;
      zip.addLocalFile(filePath, path.dirname(zipPath));
    }
  });
  
  // Save ZIP file
  const zipPath = path.join(componentDir, 'component.zip');
  zip.writeZip(zipPath);
  
  return zipPath;
}

// Update existing components with missing files
function updateExistingComponents() {
  log('\n🔧 Updating existing components with missing files...', 'bright');
  
  if (!fs.existsSync(COMPONENTS_DIR)) {
    warn('No components directory found.');
    return;
  }
  
  const components = fs.readdirSync(COMPONENTS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  if (components.length === 0) {
    warn('No components found.');
    return;
  }
  
  let updatedCount = 0;
  let skippedCount = 0;
  
  components.forEach(componentName => {
    const componentDir = path.join(COMPONENTS_DIR, componentName);
    const phpPath = path.join(componentDir, 'component.php');
    
    if (!fs.existsSync(phpPath)) {
      warn(`Skipping ${componentName}: no component.php found`);
      skippedCount++;
      return;
    }
    
    try {
      // Read existing PHP file
      const phpContent = fs.readFileSync(phpPath, 'utf8');
      
      // Extract description from README if it exists
      let description = `${componentName} component`;
      const readmePath = path.join(componentDir, 'README.md');
      if (fs.existsSync(readmePath)) {
        const readmeContent = fs.readFileSync(readmePath, 'utf8');
        const titleMatch = readmeContent.match(/^#\s+(.+)$/m);
        if (titleMatch) {
          description = titleMatch[1];
        }
      }
      
      // Parse props from PHP
      const props = parseDefaultsFromPHP(phpContent);
      
      // Generate manifest if it doesn't exist
      const manifestPath = path.join(componentDir, 'manifest.json');
      if (!fs.existsSync(manifestPath)) {
        const manifest = generateManifestForExisting(componentName, description, props);
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        info(`  Generated manifest.json for ${componentName}`);
      }
      
      // Create ZIP if it doesn't exist
      const zipPath = path.join(componentDir, 'component.zip');
      if (!fs.existsSync(zipPath)) {
        createZipForExistingComponent(componentName);
        info(`  Created component.zip for ${componentName}`);
      }
      
      // Update checksums and integrities
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      // Calculate ZIP checksum
      if (fs.existsSync(zipPath)) {
        const zipContent = fs.readFileSync(zipPath);
        const checksum = crypto.createHash('sha256').update(zipContent).digest('hex');
        manifest.checksum = `sha256-${checksum}`;
        manifest.archives.integrity = `sha256-${checksum}`;
      }
      
      // Update file integrities
      manifest.files.forEach(file => {
        const fileName = path.basename(file.path);
        const filePath = path.join(componentDir, fileName);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath);
          file.integrity = `sha256-${crypto.createHash('sha256').update(content).digest('base64')}`;
        }
      });
      
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      
      success(`✅ Updated ${componentName} (${Object.keys(props).length} props)`);
      updatedCount++;
      
    } catch (err) {
      error(`Failed to update ${componentName}: ${err.message}`);
      skippedCount++;
    }
  });
  
  console.log(`\n🎉 Component updates complete!`);
  console.log(`   Updated: ${updatedCount} components`);
  if (skippedCount > 0) {
    console.log(`   Skipped: ${skippedCount} components`);
  }
}

// Generate component PHP file
function generateComponentPHP(name, props) {
  const propsCode = Object.entries(props)
    .map(([key, value]) => `        '${key}' => ${JSON.stringify(value)}`)
    .join(",\n");
  
  return `<?php
/**
 * ${name} Component
 * 
 * A professional ${name.toLowerCase()} component for WordPress themes and plugins.
 */

function wpsyde_${name.toLowerCase()}_component($props = []) {
    $defaults = defaults();
    $props = array_merge($defaults, $props);
    
    // Extract props
    ${Object.keys(props).map(key => `$${key} = $props['${key}'];`).join("\n    ")}
    
    // Component HTML
    ob_start();
    ?>
    <div class="wpsyde-${name.toLowerCase()}" data-wpsyde-component="${name.toLowerCase()}">
        <!-- ${name} component content -->
        <div class="wpsyde-${name.toLowerCase()}__content">
            ${name} Component
        </div>
    </div>
    <?php
    return ob_get_clean();
}

function defaults(): array {
    return [
${propsCode}
    ];
}

// Register component
if (function_exists('wpsyde_register_component')) {
    wpsyde_register_component('${name}', 'wpsyde_${name.toLowerCase()}_component');
}
`;
}

// Generate component README
function generateREADME(name, description, props) {
  const propsTable = Object.entries(props)
    .map(([k, v]) => `| ${k} | ${typeof v} | ${JSON.stringify(v)} |`)
    .join('\n');
  
  return `# ${name}

${description}

## Props

| Name | Type | Default |
|------|------|---------|
${propsTable}

## Usage

\`\`\`php
<?php
echo wpsyde_component('${name}', [/* props */]);
\`\`\`

## Installation

This component is part of the WPSyde UI library. Install it via:

\`\`\`bash
wpsyde add ${name}
\`\`\`

## Documentation

For more information, visit: https://registry.wpsyde.com/components/${name}
`;
}

// Generate component example
function generateExample(name) {
  return `<?php
/**
 * Example usage for ${name} component
 */

// Basic usage with default props
echo wpsyde_component('${name}');

// Usage with custom props
echo wpsyde_component('${name}', [
    // Add your custom props here
]);

// Usage in a template context
$props = [
    // Define your props
];
echo wpsyde_component('${name}', $props);
`;
}

// Generate component enhancer
function generateEnhancer(name) {
  return `/**
 * Progressive enhancement for ${name} component
 */

(function() {
    'use strict';
    
    // Find all ${name} components on the page
    const components = document.querySelectorAll('[data-wpsyde-component="${name.toLowerCase()}"]');
    
    if (components.length === 0) return;
    
    // Initialize each component
    components.forEach(component => {
        // Add your enhancement logic here
        console.log('${name} component enhanced:', component);
    });
    
    // Export for potential external use
    window.WPSyde = window.WPSyde || {};
    window.WPSyde.${name} = {
        init: function() {
            console.log('${name} components initialized');
        }
    };
})();
`;
}

// Generate component styles
function generateStyles(name) {
  return `/**
 * Component-specific styles for ${name}
 */

.wpsyde-${name.toLowerCase()} {
    /* Base component styles */
}

.wpsyde-${name.toLowerCase()}:hover {
    /* Hover state */
}

.wpsyde-${name.toLowerCase()}:focus {
    /* Focus state */
}

@media (max-width: 768px) {
    .wpsyde-${name.toLowerCase()} {
        /* Mobile styles */
    }
}
`;
}

// Generate component manifest
function generateManifest(name, version, description, props) {
  return {
    name: name,
    version: version,
    description: description,
    dependencies: [],
    files: [
      {
        path: "template-parts/components/" + name + "/component.php",
        dest: "theme/template-parts/components/" + name + "/component.php",
        integrity: ""
      },
      {
        path: "template-parts/components/" + name + "/README.md",
        dest: "theme/template-parts/components/" + name + "/README.md",
        integrity: ""
      },
      {
        path: "template-parts/components/" + name + "/example.php",
        dest: "theme/template-parts/components/" + name + "/example.php",
        integrity: ""
      },
      {
        path: "template-parts/components/" + name + "/enhancer.js",
        dest: "theme/template-parts/components/" + name + "/enhancer.js",
        integrity: ""
      },
      {
        path: "template-parts/components/" + name + "/styles.css",
        dest: "theme/template-parts/components/" + name + "/styles.css",
        integrity: ""
      }
    ],
    archives: {
      zip: `https://registry.wpsyde.com/components/${name}/${version}/component.zip`,
      integrity: ""
    },
    pro: false,
    checksum: "",
    signature: ""
  };
}

// Create component structure
function createComponent(name, version, description, props) {
  const componentDir = path.join(COMPONENTS_DIR, name);
  fs.mkdirSync(componentDir, { recursive: true });
  
  // Create component files
  const componentPHP = generateComponentPHP(name, props);
  const readme = generateREADME(name, description, props);
  const example = generateExample(name);
  const enhancer = generateEnhancer(name);
  const styles = generateStyles(name);
  
  // Write files to component directory
  fs.writeFileSync(path.join(componentDir, 'component.php'), componentPHP);
  fs.writeFileSync(path.join(componentDir, 'README.md'), readme);
  fs.writeFileSync(path.join(componentDir, 'example.php'), example);
  fs.writeFileSync(path.join(componentDir, 'enhancer.js'), enhancer);
  fs.writeFileSync(path.join(componentDir, 'styles.css'), styles);
  
  // Generate and write manifest
  const manifest = generateManifest(name, version, description, props);
  fs.writeFileSync(path.join(componentDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  
  success(`Created component: ${name}@${version}`);
  return componentDir;
}

// Create ZIP package
function createZipPackage(componentName, version, componentDir) {
  const zip = new AdmZip();
  
  // Add component files to ZIP with proper structure
  const files = [
    'component.php',
    'README.md', 
    'example.php',
    'enhancer.js',
    'styles.css'
  ];
  
  files.forEach(file => {
    const filePath = path.join(componentDir, file);
    if (fs.existsSync(filePath)) {
      const zipPath = `template-parts/components/${componentName}/${file}`;
      zip.addLocalFile(filePath, path.dirname(zipPath));
    }
  });
  
  // Save ZIP file
  const zipPath = path.join(componentDir, 'component.zip');
  zip.writeZip(zipPath);
  
  return zipPath;
}

// Package component for registry
function packageComponent(componentName, version) {
  log(`\n📦 Packaging ${componentName}@${version}...`, 'bright');
  
  try {
    const componentDir = path.join(COMPONENTS_DIR, componentName);
    
    if (!fs.existsSync(componentDir)) {
      error(`Component directory not found: ${componentDir}`);
    }
    
    // Create ZIP package
    info('Creating ZIP package...');
    const zipPath = createZipPackage(componentName, version, componentDir);
    
    // Calculate checksum
    const zipContent = fs.readFileSync(zipPath);
    const checksum = crypto.createHash('sha256').update(zipContent).digest('hex');
    
    // Update manifest with checksum
    const manifestPath = path.join(componentDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.checksum = `sha256-${checksum}`;
    manifest.archives.integrity = `sha256-${checksum}`;
    
    // Update file integrities
    manifest.files.forEach(file => {
      const filePath = path.join(componentDir, path.basename(file.path));
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath);
        file.integrity = `sha256-${crypto.createHash('sha256').update(content).digest('base64')}`;
      }
    });
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    // Calculate package size
    const stats = fs.statSync(zipPath);
    const sizeKB = Math.round(stats.size / 1024);
    
    success(`\n🎉 Successfully packaged ${componentName}@${version}!`);
    info(`Package location: ${componentDir}`);
    info(`ZIP file: ${zipPath} (${sizeKB} KB)`);
    info(`Checksum: sha256-${checksum}`);
    
    return { componentDir, zipPath, size: stats.size, checksum };
    
  } catch (err) {
    error(`Failed to package component: ${err.message}`);
  }
}

// Initialize with sample components
function initializeSampleComponents() {
  log('\n🚀 Initializing WPSyde Component Registry...', 'bright');
  
  const sampleComponents = [
    {
      name: 'Button',
      description: 'Professional button component with multiple variants',
      props: {
        text: 'Click me',
        variant: 'primary',
        size: 'medium',
        disabled: false
      }
    },
    {
      name: 'Card',
      description: 'Flexible card component for content display',
      props: {
        title: 'Card Title',
        subtitle: 'Card Subtitle',
        image: '',
        footer: ''
      }
    },
    {
      name: 'Input',
      description: 'Form input component with validation support',
      props: {
        type: 'text',
        placeholder: 'Enter text...',
        required: false,
        disabled: false
      }
    },
    {
      name: 'Modal',
      description: 'Modal dialog component for overlays',
      props: {
        title: 'Modal Title',
        content: 'Modal content goes here',
        size: 'medium',
        closable: true
      }
    }
  ];
  
  sampleComponents.forEach(component => {
    createComponent(component.name, '1.0.0', component.description, component.props);
    packageComponent(component.name, '1.0.0');
  });
  
  success('\n🎉 Sample components created and packaged successfully!');
}

// List available components
function listComponents() {
  if (!fs.existsSync(COMPONENTS_DIR)) {
    warn('No components directory found. Run "init" first.');
    return;
  }

  const components = fs.readdirSync(COMPONENTS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  if (components.length === 0) {
    warn('No components found. Run "init" to create sample components.');
    return;
  }

  log('\n📦 Available Components:', 'bright');
  log('========================', 'bright');
  
  components.forEach(component => {
    const manifestPath = path.join(COMPONENTS_DIR, component, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        log(`\n${component}:`, 'cyan');
        log(`  Version: ${manifest.version}`, 'green');
        if (manifest.description) {
          log(`  Description: ${manifest.description}`, 'white');
        }
      } catch (err) {
        log(`  Version: 1.0.0`, 'green');
        log(`  Description: No manifest found`, 'yellow');
      }
    }
  });
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    log('\n🚀 WPSyde Component Generator and Packager', 'bright');
    log('==========================================', 'bright');
    log('\nUsage:', 'cyan');
    log('  node scripts/generate-component-packaging.js [command] [options]', 'white');
    log('\nCommands:', 'cyan');
    log('  init                    Initialize with sample components', 'white');
    log('  update                  Update existing components with missing files', 'white');
    log('  list                    List available components', 'white');
    log('  package <name> [version] Package a component (default: 1.0.0)', 'white');
    log('  help                    Show this help message', 'white');
    log('\nExamples:', 'cyan');
    log('  node scripts/generate-component-packaging.js init', 'white');
    log('  node scripts/generate-component-packaging.js update', 'white');
    log('  node scripts/generate-component-packaging.js list', 'white');
    log('  node scripts/generate-component-packaging.js package Button', 'white');
    log('  node scripts/generate-component-packaging.js package Card 1.0.0', 'white');
    return;
  }

  ensureDirectories();

  switch (command) {
    case 'init':
      initializeSampleComponents();
      break;
    case 'update':
      updateExistingComponents();
      break;
    case 'list':
      listComponents();
      break;
    case 'package':
      if (!args[1]) {
        error('Component name required. Usage: package <ComponentName> [version]');
      }
      const version = args[2] || '1.0.0';
      packageComponent(args[1], version);
      break;
    default:
      error(`Unknown command: ${command}. Run with 'help' for usage`);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { 
  createComponent, 
  packageComponent, 
  listComponents,
  initializeSampleComponents,
  updateExistingComponents
}; 
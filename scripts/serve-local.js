#!/usr/bin/env node

/**
 * Local Registry Server for Testing
 *
 * This script serves the registry locally for testing the CLI
 * Usage: node scripts/serve-local.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3001;
const REGISTRY_DIR = path.join(process.cwd(), 'registry');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
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

// Serve static files
function serveFile(filePath, res) {
  try {
    const content = fs.readFileSync(filePath);
    const ext = path.extname(filePath);

    // Set appropriate content type
    const mimeTypes = {
      '.json': 'application/json',
      '.zip': 'application/zip',
      '.pem': 'application/x-pem-file',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.php': 'text/plain',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', content.length);

    // Set cache headers
    if (filePath.includes('index.json')) {
      res.setHeader('Cache-Control', 'public, max-age=60');
    } else if (filePath.includes('components/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (filePath.includes('public-key.pem')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }

    res.end(content);
    return true;
  } catch (err) {
    return false;
  }
}

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Log request
  info(`${req.method} ${pathname}`);

  // Handle different routes
  if (pathname === '/') {
    // Serve index.html or redirect to index.json
    res.writeHead(302, { Location: '/index.json' });
    res.end();
    return;
  }

  if (pathname === '/index.json') {
    const indexPath = path.join(REGISTRY_DIR, 'index.json');
    if (serveFile(indexPath, res)) {
      success('Served: /index.json');
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
    return;
  }

  if (pathname === '/health.json') {
    const healthPath = path.join(process.cwd(), 'health.json');
    if (serveFile(healthPath, res)) {
      success('Served: /health.json');
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
    return;
  }

  if (pathname === '/public-key.pem') {
    const keyPath = path.join(process.cwd(), 'public-key.pem');
    if (serveFile(keyPath, res)) {
      success('Served: /public-key.pem');
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
    return;
  }

  // Handle component files
  if (pathname.startsWith('/components/')) {
    const filePath = path.join(REGISTRY_DIR, pathname);
    if (serveFile(filePath, res)) {
      success(`Served: ${pathname}`);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
    return;
  }

  // Handle _headers file
  if (pathname === '/_headers') {
    const headersPath = path.join(process.cwd(), '_headers');
    if (serveFile(headersPath, res)) {
      success('Served: /_headers');
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
    return;
  }

  // 404 for unknown routes
  res.writeHead(404);
  res.end('Not Found');
});

// Start server
server.listen(PORT, () => {
  log('\n🚀 Local Registry Server Running!', 'green');
  log('====================================', 'green');
  log(`📍 URL: http://localhost:${PORT}`, 'blue');
  log(`📁 Serving from: ${REGISTRY_DIR}`, 'blue');
  log('\n📋 Test the CLI with:', 'yellow');
  log(`   npx wpsyde-ui init`, 'blue');
  log(`   npx wpsyde-ui add Button`, 'blue');
  log('\n🛑 Press Ctrl+C to stop', 'yellow');
});

// Handle shutdown
process.on('SIGINT', () => {
  log('\n\n🛑 Shutting down server...', 'yellow');
  server.close(() => {
    log('✅ Server stopped', 'green');
    process.exit(0);
  });
});

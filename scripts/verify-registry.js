#!/usr/bin/env node

/**
 * Registry verification script
 * Run with: node scripts/verify-registry.js
 */

const https = require('https');
const crypto = require('crypto');

const REGISTRY_URL = 'https://registry.wpsyde.com';
const fs = require('fs');
const path = require('path');

async function fetch(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () =>
          resolve({ status: res.statusCode, data, headers: res.headers })
        );
      })
      .on('error', reject);
  });
}

async function verifyRegistry() {
  console.log('🔍 Verifying registry setup...\n');

  // Local file verification first
  console.log('📁 Local file verification:');

  // Check critical files exist
  const criticalFiles = [
    'index.json',
    'health.json',
    '_headers',
    'public-key.pem',
  ];
  for (const file of criticalFiles) {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
    }
  }

  // Validate local JSON files
  console.log('\n📋 Local JSON validation:');
  if (fs.existsSync('index.json')) {
    try {
      const indexData = JSON.parse(fs.readFileSync('index.json', 'utf8'));
      console.log('✅ index.json is valid JSON');
      if (indexData.components && typeof indexData.components === 'object') {
        console.log(
          `   Found ${Object.keys(indexData.components).length} component categories`
        );
      }
    } catch (e) {
      console.log('❌ index.json is not valid JSON:', e.message);
    }
  } else {
    console.log('❌ index.json is missing, skipping JSON validation');
  }

  if (fs.existsSync('health.json')) {
    try {
      const healthData = JSON.parse(fs.readFileSync('health.json', 'utf8'));
      console.log('✅ health.json is valid JSON');
      if (healthData.status === 'ok' && healthData.ts) {
        console.log('✅ health.json has correct structure');
      } else {
        console.log('⚠️  health.json structure may need adjustment');
      }
    } catch (e) {
      console.log('❌ health.json is not valid JSON:', e.message);
    }
  } else {
    console.log('❌ health.json is missing, skipping JSON validation');
  }

  // Check _headers format
  console.log('\n🔒 Headers validation:');
  try {
    const headersContent = fs.readFileSync('_headers', 'utf8');
    if (
      headersContent.includes('Cache-Control: public, max-age=60') &&
      headersContent.includes(
        'Cache-Control: public, max-age=31536000, immutable'
      )
    ) {
      console.log('✅ _headers has proper cache directives');
    } else {
      console.log('⚠️  _headers may need cache directive adjustments');
    }
  } catch (e) {
    console.log('❌ Could not read _headers file');
  }

  // Check public key format
  console.log('\n🔑 Public key validation:');
  try {
    const keyContent = fs.readFileSync('public-key.pem', 'utf8');
    if (keyContent.includes('-----BEGIN PUBLIC KEY-----')) {
      console.log('✅ public-key.pem has correct PEM format');
    } else {
      console.log('⚠️  public-key.pem may not be in correct PEM format');
    }
  } catch (e) {
    console.log('❌ Could not read public-key.pem file');
  }

  console.log('\n🌐 Remote registry verification:');
  try {
    // 1. Check if registry is accessible
    console.log('1. Testing registry accessibility...');
    const indexResponse = await fetch(`${REGISTRY_URL}/index.json`);
    if (indexResponse.status === 200) {
      console.log('✅ Registry is accessible');

      // Check cache headers
      const cacheControl = indexResponse.headers['cache-control'];
      if (cacheControl && cacheControl.includes('max-age=60')) {
        console.log('✅ index.json has proper short cache (60s)');
      } else {
        console.log('⚠️  index.json cache headers may need adjustment');
      }
    } else {
      console.log('❌ Registry not accessible (expected if not deployed yet)');
    }

    // 2. Check public key
    console.log('\n2. Testing public key...');
    const keyResponse = await fetch(`${REGISTRY_URL}/public-key.pem`);
    if (keyResponse.status === 200) {
      console.log('✅ Public key is accessible');

      // Check cache headers
      const cacheControl = keyResponse.headers['cache-control'];
      if (cacheControl && cacheControl.includes('immutable')) {
        console.log('✅ public-key.pem has proper immutable cache');
      } else {
        console.log('⚠️  public-key.pem cache headers may need adjustment');
      }
    } else {
      console.log('❌ Public key not accessible');
    }

    // 3. Check headers file
    console.log('\n3. Testing security headers...');
    const headersResponse = await fetch(`${REGISTRY_URL}/_headers`);
    if (headersResponse.status === 200) {
      console.log('✅ _headers file is accessible');
    } else {
      console.log(
        '⚠️  _headers file not accessible (this is normal for Cloudflare Pages)'
      );
    }

    // 4. Parse index.json
    console.log('\n4. Validating index.json structure...');
    try {
      const indexData = JSON.parse(indexResponse.data);
      if (indexData.components && typeof indexData.components === 'object') {
        console.log('✅ index.json has valid structure');
        console.log(
          `   Found ${Object.keys(indexData.components).length} component categories`
        );
      } else {
        console.log('⚠️  index.json structure may need adjustment');
      }
    } catch (e) {
      console.log('❌ index.json is not valid JSON');
    }

    console.log('\n🎉 Registry verification complete!');
    console.log('\nNext steps:');
    console.log(
      '1. Replace public-key.pem with your actual Ed25519 public key'
    );
    console.log('2. Test component installation with your CLI');
    console.log('3. Verify component integrity checks work');
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyRegistry();

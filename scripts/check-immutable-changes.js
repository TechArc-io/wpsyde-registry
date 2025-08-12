#!/usr/bin/env node

/**
 * Smart immutable version checker
 * Allows formatting changes but blocks content changes
 */

const fs = require('fs');
const { execSync } = require('child_process');

// Fields that should NEVER change in published versions
const IMMUTABLE_FIELDS = [
  'version',
  'files',
  'archives',
  'checksum',
  'signature',
];

// Fields that can change (formatting, metadata, etc.)
const MUTABLE_FIELDS = [
  'name',
  'description',
  'author',
  'license',
  'repository',
  'keywords',
  'dependencies',
];

function getGitDiff(baseRef, currentRef) {
  try {
    const diff = execSync(`git diff --name-status ${baseRef}...${currentRef}`, {
      encoding: 'utf8',
    });
    return diff
      .trim()
      .split('\n')
      .filter(line => line.trim());
  } catch (error) {
    console.log('No changes detected or git error:', error.message);
    return [];
  }
}

function parseManifest(path) {
  try {
    const content = fs.readFileSync(path, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error parsing ${path}:`, error.message);
    return null;
  }
}

function normalizeManifest(manifest) {
  // Create a normalized version with only immutable fields
  const normalized = {};
  IMMUTABLE_FIELDS.forEach(field => {
    if (manifest[field] !== undefined) {
      normalized[field] = manifest[field];
    }
  });
  return normalized;
}

function hasContentChanges(oldManifest, newManifest) {
  const oldNormalized = normalizeManifest(oldManifest);
  const newNormalized = normalizeManifest(newManifest);

  return JSON.stringify(oldNormalized) !== JSON.stringify(newNormalized);
}

function checkComponentChanges(baseRef, currentRef) {
  console.log('🔍 Checking for meaningful changes in component manifests...\n');

  const changes = getGitDiff(baseRef, currentRef);
  let hasImmutableChanges = false;

  for (const change of changes) {
    const [status, filePath] = change.split(/\s+/);

    // Only check manifest.json files in component directories
    if (
      filePath &&
      filePath.match(
        /^components\/[^/]+\/[0-9]+\.[0-9]+\.[0-9]+\/manifest\.json$/
      )
    ) {
      console.log(`📁 Checking ${filePath} (${status})`);

      if (status === 'M' || status === 'A') {
        try {
          // Get the old version from base ref
          let oldManifest = null;
          try {
            const oldContent = execSync(`git show ${baseRef}:${filePath}`, {
              encoding: 'utf8',
            });
            oldManifest = JSON.parse(oldContent);
          } catch (error) {
            // File didn't exist in base ref (new file)
            console.log(`  ✅ New file - no immutability concerns`);
            continue;
          }

          // Get the current version
          const newManifest = parseManifest(filePath);
          if (!newManifest) continue;

          // Check if there are meaningful changes
          if (hasContentChanges(oldManifest, newManifest)) {
            console.log(`  ❌ IMMUTABLE CONTENT CHANGED!`);
            console.log(
              `     Old: ${JSON.stringify(normalizeManifest(oldManifest))}`
            );
            console.log(
              `     New: ${JSON.stringify(normalizeManifest(newManifest))}`
            );
            hasImmutableChanges = true;
          } else {
            console.log(`  ✅ Only formatting/metadata changes detected`);
          }
        } catch (error) {
          console.log(`  ⚠️  Could not analyze changes: ${error.message}`);
        }
      }
    }
  }

  if (hasImmutableChanges) {
    console.log('\n❌ IMMUTABLE CHANGES DETECTED!');
    console.log(
      'The following fields should never change in published versions:'
    );
    IMMUTABLE_FIELDS.forEach(field => console.log(`  - ${field}`));
    process.exit(1);
  } else {
    console.log('\n✅ No immutable changes detected');
    console.log('Formatting and metadata changes are allowed');
  }
}

// Get the base reference (main branch or PR base)
const baseRef = process.env.GITHUB_BASE_REF || 'main';
const currentRef = process.env.GITHUB_SHA || 'HEAD';

checkComponentChanges(baseRef, currentRef);

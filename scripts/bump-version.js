#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packagePath = path.join(__dirname, '..', 'package.json');

// Get the current package.json
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const currentVersion = packageJson.version;

// Parse version components
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Determine which part to bump based on command line argument
const bumpType = process.argv[2] || 'patch';

let newVersion;
switch (bumpType) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
  default:
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

// Update the version in package.json
packageJson.version = newVersion;

// Write the updated package.json back to disk
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

console.log(`Version bumped from ${currentVersion} to ${newVersion}`);
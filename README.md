## WPSyde Public Registry

Read-only registry for WPSyde atomic components.

> **📦 Package Update**: The CLI tool has been renamed from `wpsyde-cli` to `wpsyde-ui` for better clarity. Use `npx wpsyde-ui` for the latest version.

### 🚀 Installation

**For WordPress users** - Install components in your theme:
```bash
cd wp-content/themes/your-theme-name
npx wpsyde-ui init
npx wpsyde-ui add Button
```

**For developers** - Set up the registry:
```bash
git clone https://github.com/TechArc-io/wpsyde-registry.git
cd wpsyde-registry
```

- Base URL: https://registry.wpsyde.com
- Public key: https://registry.wpsyde.com/public-key.pem
- Catalog: https://registry.wpsyde.com/index.json
- Components: https://registry.wpsyde.com/components/<Name>/<Version>/{manifest.json, component.zip}

### Quick Start

#### For Users (Install Components):

1. **Navigate to your WordPress theme directory**:
   ```bash
   cd wp-content/themes/your-theme-name
   ```

2. **Initialize WPSyde**:
   ```bash
   npx wpsyde-ui init
   ```

3. **Install components**:
   ```bash
   npx wpsyde-ui add Button
   npx wpsyde-ui add Card
   ```

#### For Developers (Registry Setup):

1. **Configure your project**:

   ```bash
   # Copy the example config
   cp wpsyde.json.example wpsyde.json

   # Edit wpsyde.json with your project paths
   ```

2. **Install components**:

   ```bash
   # Using the CLI
   npx wpsyde-ui add Button@1.0.0

   # Or using WP-CLI
   wp wpsyde add Button
   ```

3. **Verify your setup**:

   ```bash
   node scripts/verify-registry.js
   ```

4. **Format your code** (optional):
   ```bash
   pnpm format        # Format all files
   pnpm format:check  # Check formatting without changing files
   ```

### Caching

- index.json: Cache-Control: public, max-age=60
- components/\*: Cache-Control: public, max-age=31536000, immutable
- public-key.pem: Cache-Control: public, max-age=31536000, immutable

### Manifests

Each manifest contains:

- files[]: { path, dest, integrity } where integrity = sha256-<base64> of each file
- archives: { zip, integrity } where integrity = sha256-<base64> of the ZIP
- checksum: sha256-<base64> of the canonical manifest (with signature set to empty)
- signature: Ed25519 signature (base64) over the canonical manifest

### Build & Sign (run in the theme repo)

```bash
# Ensure your private key exists
export WPSYDE_PRIVATE_KEY_PATH="$HOME/.wpsyde/keys/private.pem"

# Build all components at default version
node node_scripts/build-registry.js

# Build at an explicit version
node node_scripts/build-registry.js --version=1.0.1

# Build only a subset
node node_scripts/build-registry.js --only=Button,Card
```

### Install (in a WordPress theme)

```bash
# Uses the Node CLI under the hood (signature + integrity verified, auto-manages wpsyde.json)
wp wpsyde add Button     # alias of `wp wpsyde install Button`
wp wpsyde install Button
```

### Publishing Components

1. **Build and package your component**:

   ```bash
   # In your theme repo
   node node_scripts/build-registry.js --version=1.0.1
   ```

2. **Create a feature branch and commit**:

   ```bash
   git checkout -b feat/add-YourComponent-v1.0.1
   git add components/YourComponent/1.0.1/
   git commit -m "feat: add YourComponent v1.0.1"
   git push origin feat/add-YourComponent-v1.0.1
   ```

3. **Create a Pull Request**:
   - Go to GitHub and create a PR from your feature branch to `main`
   - CI automatically runs all validation checks
   - Code owners review and approve the changes

4. **After PR merge**:
   - CI automatically deploys to Cloudflare Pages
   - Purges index.json cache
   - New component becomes available in the registry

### Installing Components (Professional shadcn/ui Style!)

Users can install components with just **npx** (no npm install needed!):

#### Option 1: Direct npx (Recommended)
```bash
# Initialize your project
npx wpsyde-ui init

# List available components
npx wpsyde-ui list

# Install a component
npx wpsyde-ui add Button
npx wpsyde-ui add Card 1.0.0
```

#### Option 2: With npm/pnpm scripts
```bash
# If you have package.json with our scripts
npm run wpsyde:init
npm run wpsyde:list
npm run wpsyde:add Button

# Or with pnpm
pnpm run wpsyde:init
pnpm run wpsyde:list
pnpm run wpsyde:add Button
```

#### Option 3: Copy the CLI script to your project
```bash
# Copy the CLI script to your theme project
cp scripts/wpsyde-cli.js /path/to/your/theme/

# Then use it directly
node wpsyde-cli.js add Button
```

## How It Works (Like shadcn/ui):

✅ **No npm dependencies** - components are copied directly to your theme  
✅ **Full control** - customize component code as needed  
✅ **Version management** - install specific versions or latest  
✅ **Professional workflow** - similar to modern component libraries  

**No global installations, no WP-CLI plugins, no complex setup!** 🎉

### Key Management

- **Rotate signing keys**: Update `public-key.pem` and re-sign all manifests with the new private key
- **Keep private keys secure**: Never commit `private.pem` to this repo
- **Key format**: Ed25519 public key in PEM format

### Notes

- Versions are immutable; publish a new version for changes
- CI blocks edits to published versioned paths (`components/*/1.0.0/`)
- All component archives are verified for integrity before deployment

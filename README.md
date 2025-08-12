## WPSyde Public Registry

Read-only registry for WPSyde atomic components.

- Base URL: https://registry.wpsyde.com
- Public key: https://registry.wpsyde.com/public-key.pem
- Catalog: https://registry.wpsyde.com/index.json
- Components: https://registry.wpsyde.com/components/<Name>/<Version>/{manifest.json, component.zip}

### Caching
- index.json: Cache-Control: public, max-age=60
- components/*: Cache-Control: public, max-age=31536000, immutable
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

### Notes
- Versions are immutable; publish a new version for changes.
- Rotate keys by updating public-key.pem and signing subsequent releases with the new key.
#!/bin/bash

# Generate Ed25519 keys for component signing
# Run this script ONCE to set up your signing keys

set -e

KEYS_DIR="$HOME/.wpsyde/keys"
PRIVATE_KEY="$KEYS_DIR/private.pem"
PUBLIC_KEY="$KEYS_DIR/public.pem"

echo "🔑 Setting up WPSyde signing keys..."

# Create keys directory
mkdir -p "$KEYS_DIR"

# Generate private key
echo "Generating Ed25519 private key..."
openssl genpkey -algorithm ed25519 -out "$PRIVATE_KEY"
chmod 600 "$PRIVATE_KEY"

# Extract public key
echo "Extracting public key..."
openssl pkey -in "$PRIVATE_KEY" -pubout -out "$PUBLIC_KEY"

echo "✅ Keys generated successfully!"
echo ""
echo "Private key: $PRIVATE_KEY (KEEP SECRET!)"
echo "Public key:  $PUBLIC_KEY"
echo ""
echo "Next steps:"
echo "1. Copy $PUBLIC_KEY to this repo as public-key.pem"
echo "2. Set WPSYDE_PRIVATE_KEY_PATH=$PRIVATE_KEY in your environment"
echo "3. Use the private key to sign your component manifests"
echo ""
echo "⚠️  NEVER commit the private key to this repo!" 
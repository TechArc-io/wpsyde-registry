# WPSyde UI

Professional UI component manager for WordPress (shadcn/ui style).

## 🚀 Quick Start

### Install Components in Your WordPress Theme

```bash
# Navigate to your theme directory
cd wp-content/themes/your-theme-name

# Initialize WPSyde
npx wpsyde-ui init

# Install components
npx wpsyde-ui add Button
npx wpsyde-ui add Card
```

### Available Commands

```bash
npx wpsyde-ui init          # Initialize wpsyde.json configuration
npx wpsyde-ui list          # List available components
npx wpsyde-ui add <name>    # Install a component
npx wpsyde-ui remove <name> # Remove an installed component
npx wpsyde-ui help          # Show help message
```

## 📦 What You Get

- **No npm dependencies** - components are copied directly to your theme
- **Full control** - customize component code as needed
- **WordPress-native** - proper PHP integration and CSS enqueuing
- **Professional workflow** - similar to modern component libraries like shadcn/ui

## 🏗️ Registry Information

This repository serves as the source for the WPSyde component registry:

- **Base URL**: https://registry.wpsyde.com
- **Public key**: https://registry.wpsyde.com/public-key.pem
- **Catalog**: https://registry.wpsyde.com/index.json
- **Components**: https://registry.wpsyde.com/components/<Name>/<Version>/{manifest.json, component.zip}

### Caching

- `index.json`: Cache-Control: public, max-age=60
- `components/*`: Cache-Control: public, max-age=31536000, immutable
- `public-key.pem`: Cache-Control: public, max-age=31536000, immutable

## 🔧 Development

### Available Scripts

```bash
# Code quality
pnpm run format          # Format all files
pnpm run format:check    # Check formatting without changing
pnpm run lint            # Run prettier + registry verification
pnpm run verify          # Verify registry setup

# WPSyde CLI
pnpm run wpsyde          # Run CLI directly
pnpm run wpsyde:init     # Initialize wpsyde.json
pnpm run wpsyde:list     # List available components
pnpm run wpsyde:add      # Add a component
```

### Registry Verification

```bash
# Verify your registry setup
pnpm run verify
```

## 📚 How It Works

1. **Users install** `npm install wpsyde-ui`
2. **CLI downloads** components from your live registry at [https://registry.wpsyde.com](https://registry.wpsyde.com)
3. **Components are extracted** directly to the user's WordPress theme
4. **No external dependencies** - everything works offline after installation

## 🎯 Component Structure

When you install a component, you get:

```
your-theme/
├── components/
│   └── Button/
│       ├── Button.css          # Component styles
│       └── component.php       # WordPress integration
└── wpsyde.json                 # Configuration
```

## 🔑 Key Management

- **Rotate signing keys**: Update `public-key.pem` and re-sign all manifests with the new private key
- **Keep private keys secure**: Never commit `private.pem` to this repo
- **Key format**: Ed25519 public key in PEM format

## 📝 Notes

- Versions are immutable; publish a new version for changes
- CI blocks edits to published versioned paths (`components/*/1.0.0/`)
- All component archives are verified for integrity before deployment

## 🌐 Links

- **Registry**: https://registry.wpsyde.com
- **NPM Package**: https://www.npmjs.com/package/wpsyde-ui
- **Repository**: https://github.com/TechArc-io/wpsyde-registry

---

**No global installations, no WP-CLI plugins, no complex setup!** 🎉

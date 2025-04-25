#!/bin/bash

# Create a portable version of the project
echo "Creating portable version of the CAPS Management System..."

# Create a directory for the portable project
mkdir -p portable-caps-system
echo "Created directory: portable-caps-system"

# Copy all source code files
echo "Copying source code..."
cp -r client portable-caps-system/
cp -r server portable-caps-system/
cp -r shared portable-caps-system/
cp -r attached_assets portable-caps-system/

# Copy portable configuration files
echo "Copying portable configuration files..."
cp portable-package.json portable-caps-system/package.json
cp portable-vite.config.ts portable-caps-system/vite.config.ts
cp portable-tsconfig.json portable-caps-system/tsconfig.json
cp portable-tsconfig.node.json portable-caps-system/tsconfig.node.json
cp .env.example portable-caps-system/.env.example
cp PORTABLE-README.md portable-caps-system/README.md

# Create .env file with placeholders
echo "Creating .env file with placeholders..."
cp .env.example portable-caps-system/.env

# Create .gitignore
echo "Creating .gitignore..."
cat << 'EOF' > portable-caps-system/.gitignore
# dependencies
node_modules
.pnp
.pnp.js

# testing
coverage

# production
dist
build

# misc
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.vscode

npm-debug.log*
yarn-debug.log*
yarn-error.log*
EOF

echo "Portable project created successfully!"
echo "You can find it in the 'portable-caps-system' directory."
echo "Instructions for setting up and running the project are in the README.md file."
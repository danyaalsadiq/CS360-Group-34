# PowerShell script to create a portable version of the project

# Create a portable version of the project
Write-Host "Creating portable version of the CAPS Management System..."

# Create a directory for the portable project
New-Item -Path "portable-caps-system" -ItemType Directory -Force
Write-Host "Created directory: portable-caps-system"

# Copy all source code files
Write-Host "Copying source code..."
Copy-Item -Path "client" -Destination "portable-caps-system" -Recurse
Copy-Item -Path "server" -Destination "portable-caps-system" -Recurse
Copy-Item -Path "shared" -Destination "portable-caps-system" -Recurse
Copy-Item -Path "attached_assets" -Destination "portable-caps-system" -Recurse

# Copy portable configuration files
Write-Host "Copying portable configuration files..."
Copy-Item -Path "portable-package.json" -Destination "portable-caps-system/package.json"
Copy-Item -Path "portable-vite.config.ts" -Destination "portable-caps-system/vite.config.ts"
Copy-Item -Path "portable-tsconfig.json" -Destination "portable-caps-system/tsconfig.json"
Copy-Item -Path "portable-tsconfig.node.json" -Destination "portable-caps-system/tsconfig.node.json"
Copy-Item -Path ".env.example" -Destination "portable-caps-system/.env.example"
Copy-Item -Path "PORTABLE-README.md" -Destination "portable-caps-system/README.md"

# Create .env file with placeholders
Write-Host "Creating .env file with placeholders..."
Copy-Item -Path ".env.example" -Destination "portable-caps-system/.env"

# Create .gitignore
Write-Host "Creating .gitignore..."
@"
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
"@ | Out-File -FilePath "portable-caps-system/.gitignore" -Encoding utf8

Write-Host "Portable project created successfully!"
Write-Host "You can find it in the 'portable-caps-system' directory."
Write-Host "Instructions for setting up and running the project are in the README.md file."
#!/bin/bash

# Readarr Portal Setup Script
# This script helps you set up the environment for the Readarr Portal

set -e

echo "======================================"
echo "  Readarr Portal Setup"
echo "======================================"
echo ""

# Check if .env file exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

# Collect Readarr API information
echo "📝 Please provide the following information:"
echo ""

read -p "Readarr URL (e.g., http://10.10.10.105:8787): " READARR_URL
read -p "Readarr API Key: " READARR_KEY

# Validate inputs
if [ -z "$READARR_URL" ] || [ -z "$READARR_KEY" ]; then
    echo "❌ Error: Readarr URL and API Key are required!"
    exit 1
fi

# Create .env file
cat > .env << EOF
# Readarr Configuration
READARR_API_URL=$READARR_URL
READARR_API_KEY=$READARR_KEY

# Books Path (inside container)
BOOKS_PATH=/books
EOF

echo ""
echo "✅ .env file created successfully!"
echo ""

# Check for docker-compose
if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
    echo "⚠️  Warning: Docker is not installed or not in PATH"
    echo "   Please install Docker to run this application"
    exit 0
fi

echo "📦 Docker is installed"
echo ""

# Ask about books directory
read -p "Path to your books directory (e.g., /mnt/books): " BOOKS_DIR

if [ -n "$BOOKS_DIR" ]; then
    # Update docker-compose.yml with the books directory
    if [ -f docker-compose.yml ]; then
        echo "📝 Updating docker-compose.yml with your books directory..."
        sed -i.bak "s|./my-local-books|$BOOKS_DIR|g" docker-compose.yml
        echo "✅ docker-compose.yml updated"
    fi
fi

echo ""
echo "======================================"
echo "  Setup Complete! 🎉"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Review docker-compose.yml to ensure paths are correct"
echo "2. Run: docker-compose up -d"
echo "3. Open: http://localhost:3000"
echo ""
echo "For more information, see README.md"
echo ""

#!/bin/bash

# Setup script for environment variables
# Run: bash setup-env.sh

echo "🚀 Setting up environment variables..."

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted. Keeping existing .env.local"
        exit 1
    fi
fi

# Copy template
cp env.local.template .env.local

echo "✅ Created .env.local from template"
echo ""
echo "📝 Next steps:"
echo "1. Open .env.local and fill in your values:"
echo "   - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID (get from https://cloud.walletconnect.com)"
echo "   - PINATA_API_KEY and PINATA_SECRET_KEY (get from https://pinata.cloud)"
echo "   - NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS (after deploying contracts)"
echo ""
echo "2. After filling values, restart your dev server:"
echo "   pnpm dev"
echo ""


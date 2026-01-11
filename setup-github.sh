#!/bin/bash

# GitHub Repository Setup Script for Shame Clock

echo "🚀 Setting up GitHub repository for Shame Clock..."
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "   Install it from: https://cli.github.com/"
    echo ""
    echo "Or follow manual setup instructions in GITHUB_SETUP.md"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "⚠️  Not authenticated with GitHub CLI"
    echo "   Running: gh auth login"
    echo ""
    gh auth login
    echo ""
fi

# Get repository name
read -p "Enter GitHub repository name (default: shame-clock): " repo_name
repo_name=${repo_name:-shame-clock}

# Get description
read -p "Enter repository description (or press Enter for default): " repo_desc
repo_desc=${repo_desc:-"A privacy-first browser extension that tracks time spent on distracting websites with AI-generated motivational messages"}

# Ask for visibility
echo ""
echo "Repository visibility:"
echo "1) Public (recommended)"
echo "2) Private"
read -p "Choose (1 or 2, default: 1): " visibility
visibility=${visibility:-1}

if [ "$visibility" = "2" ]; then
    visibility_flag="--private"
else
    visibility_flag="--public"
fi

echo ""
echo "📦 Creating GitHub repository: $repo_name"
echo "   Description: $repo_desc"
echo "   Visibility: $([ "$visibility" = "2" ] && echo "Private" || echo "Public")"
echo ""

# Create repository and push
gh repo create "$repo_name" \
    $visibility_flag \
    --source=. \
    --remote=origin \
    --description "$repo_desc" \
    --push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully created and pushed to GitHub!"
    echo ""
    echo "🌐 Repository URL:"
    gh repo view --web
    echo ""
    echo "📝 Next steps:"
    echo "   - Add topics: browser-extension, productivity, privacy, time-tracking, ai"
    echo "   - Review repository settings"
    echo "   - Consider adding GitHub Actions for CI/CD"
else
    echo ""
    echo "❌ Failed to create repository"
    echo "   Check GITHUB_SETUP.md for manual setup instructions"
fi


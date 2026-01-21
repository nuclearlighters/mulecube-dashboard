#!/bin/bash
# sync-docs.sh
# Syncs documentation from products/mulecube/os to websites/mulecube.com/www
# Run from www repo root or via CI/CD

set -e

# Configuration
OS_REPO="${OS_REPO:-../../../products/mulecube/os}"
DOCS_SOURCE="$OS_REPO/docs"
DOCS_DEST="content/docs"

# Document metadata (title, weight for ordering, description)
declare -A DOC_META=(
    ["getting-started"]="Getting Started|1|Unboxing, powering on, and connecting your devices"
    ["services"]="Using the Services|2|Wikipedia, maps, AI, translation, and all 30+ services"
    ["battery"]="Battery Management|3|Charging, monitoring, swapping cells, maximizing runtime"
    ["network"]="Network Setup|4|WiFi configuration, security, and advanced networking"
    ["content"]="Adding Content|5|Loading your own maps, books, media, and AI models"
    ["updates"]="Software Updates|6|Keeping your MuleCube current"
    ["diy-guide"]="Building Your Own|7|Complete DIY build guide from scratch"
    ["troubleshooting"]="Troubleshooting|8|Common issues and solutions"
    ["service-reference"]="Service Reference|9|Complete list of ports, configs, and details"
)

echo "📚 Syncing MuleCube documentation..."

# Check source exists
if [ ! -d "$DOCS_SOURCE" ]; then
    echo "❌ Source not found: $DOCS_SOURCE"
    echo "   Set OS_REPO environment variable or run from correct location"
    exit 1
fi

# Create destination
mkdir -p "$DOCS_DEST"

# Create section index
cat > "$DOCS_DEST/_index.md" << 'EOF'
---
title: "Documentation"
description: "MuleCube guides and resources"
layout: "docs-list"
---

Complete documentation for setting up, using, and maintaining your MuleCube offline knowledge server.

## Quick Links

| New to MuleCube? | Building Your Own? |
|------------------|-------------------|
| Start with [Getting Started](/docs/getting-started/) | Check out the [DIY Guide](/docs/diy-guide/) |

## All Guides

EOF

# Process each document
for doc_file in "$DOCS_SOURCE"/*.md; do
    filename=$(basename "$doc_file" .md)
    
    # Skip README (it's the index)
    if [ "$filename" = "README" ]; then
        continue
    fi
    
    # Get metadata
    meta="${DOC_META[$filename]}"
    if [ -z "$meta" ]; then
        echo "⚠️  No metadata for $filename, skipping"
        continue
    fi
    
    # Parse metadata
    IFS='|' read -r title weight description <<< "$meta"
    
    echo "  → $filename: $title"
    
    # Create output file with Hugo front matter
    cat > "$DOCS_DEST/$filename.md" << EOF
---
title: "$title"
description: "$description"
weight: $weight
layout: "docs"
---

EOF
    
    # Append content (skip any existing front matter in source)
    # Remove first line if it's a # heading (we use title from front matter)
    tail -n +2 "$doc_file" >> "$DOCS_DEST/$filename.md"
    
done

echo ""
echo "✅ Documentation synced to $DOCS_DEST"
echo ""
echo "Files created:"
ls -la "$DOCS_DEST"

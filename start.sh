#!/bin/bash
# Start script for Render deployment
# More robust script that handles different directory structures

# Try multiple possible locations
if [ -f "package.json" ]; then
    echo "Found package.json in current directory"
    npm run dashboard
elif [ -f "./package.json" ]; then
    echo "Found package.json in ./"
    npm run dashboard
elif [ -f "../package.json" ]; then
    echo "Found package.json in parent directory"
    cd .. && npm run dashboard
elif [ -f "../../package.json" ]; then
    echo "Found package.json in grandparent directory"
    cd ../.. && npm run dashboard
else
    # Search for package.json
    PKG_PATH=$(find . -name "package.json" -type f 2>/dev/null | head -1)
    if [ -n "$PKG_PATH" ]; then
        echo "Found package.json at: $PKG_PATH"
        cd "$(dirname "$PKG_PATH")" && npm run dashboard
    else
        echo "ERROR: package.json not found anywhere!"
        echo "Current directory: $(pwd)"
        echo "Directory contents:"
        ls -la
        exit 1
    fi
fi

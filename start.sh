#!/bin/bash
# Start script for Render deployment
# Finds package.json and runs the dashboard

cd "$(find . -name "package.json" -type f | head -1 | xargs dirname)" || exit 1
npm run dashboard


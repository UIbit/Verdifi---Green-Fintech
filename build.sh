#!/bin/bash
# Build script for Render deployment
# This ensures we're in the correct directory

cd /opt/render/project/src || cd /opt/render/project || pwd
npm install


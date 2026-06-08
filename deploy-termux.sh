#!/bin/bash

# --- Color Definitions ---
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}          Only Memes Earn - Termux Deployer    ${NC}"
echo -e "${BLUE}===============================================${NC}"

# 1. Ensure we are in the repository directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR" || exit 1

echo -e "${GREEN}✓ Switched to app directory: $SCRIPT_DIR${NC}"

# 2. Pull latest code from GitHub
if [ -d ".git" ]; then
    echo -e "${YELLOW}Pulling latest changes from GitHub...${NC}"
    git pull origin main || git pull origin master || echo -e "${RED}⚠️ Could not pull from GitHub. Proceeding with local files.${NC}"
else
    echo -e "${YELLOW}⚠️ Git main repository not initialized. Skipping git pull.${NC}"
fi

# 3. Install packages if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}node_modules not found. Installing dependencies...${NC}"
    npm install || { echo -e "${RED}❌ npm install failed! Check errors.${NC}"; exit 1; }
fi

# 4. Build the application
echo -e "${YELLOW}Building the static applet...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build succeeded! Assets compiled in dist/${NC}"
else
    echo -e "${RED}❌ Build failed! Please check your source files.${NC}"
    exit 1
fi

# 5. Deploy to Firebase Hosting
echo -e "${YELLOW}Deploying to Firebase Hosting...${NC}"
npx -p firebase-tools firebase deploy --only hosting
if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 Deploy complete! Your live site is updated.${NC}"
else
    echo -e "${RED}❌ Deployment failed. Make sure you are logged in using 'npx -p firebase-tools firebase login'.${NC}"
    exit 1
fi

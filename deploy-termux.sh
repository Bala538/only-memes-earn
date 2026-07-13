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

# Check if Node.js & npm are installed in the environment
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js/npm is not installed!${NC}"
    echo -e "${YELLOW}To install Node.js in Termux, run this command:${NC}"
    echo -e ""
    echo -e "    ${BLUE}pkg install nodejs${NC}"
    echo -e ""
    echo -e "${YELLOW}Once installed, run ./deploy-termux.sh again.${NC}"
    exit 1
fi

# 2. Pull latest code from GitHub
if [ -d ".git" ]; then
    echo -e "${YELLOW}Pulling latest changes from GitHub...${NC}"
    git pull origin main || git pull origin master || echo -e "${RED}⚠️ Could not pull from GitHub. Proceeding with local files.${NC}"
else
    echo -e "${YELLOW}⚠️ Git main repository not initialized. Skipping git pull.${NC}"
fi

# 3. Install/Verify packages
echo -e "${YELLOW}Installing and verifying dependencies (this ensures everything is up-to-date)...${NC}"
npm install || { echo -e "${RED}❌ npm install failed! Check errors.${NC}"; exit 1; }

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
if [ -n "$FIREBASE_TOKEN" ]; then
    echo -e "${GREEN}Using provided FIREBASE_TOKEN for deployment...${NC}"
    npx -p firebase-tools firebase deploy --only hosting --project only-memes-earn --token "$FIREBASE_TOKEN"
else
    npx -p firebase-tools firebase deploy --only hosting --project only-memes-earn
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 Deploy complete! Your live site is updated.${NC}"
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo -e "${YELLOW}👉 This is likely due to an expired/stale Firebase CLI session in Termux.${NC}"
    echo -e "${YELLOW}To fix this, please run this single command to force a fresh re-authentication session:${NC}"
    echo -e ""
    echo -e "${BLUE}npx -p firebase-tools firebase login --reauth --no-localhost${NC}"
    echo -e ""
    echo -e "${YELLOW}👉 If that still fails, run this line to wipe the stale configuration completely and log in again:${NC}"
    echo -e "${BLUE}rm -rf ~/.config/configstore/firebase-tools.json && npx -p firebase-tools firebase login --reauth --no-localhost${NC}"
    echo -e ""
    echo -e "${YELLOW}👉 Alternatively, if standard login continues to have issues, use login:ci to obtain a token:${NC}"
    echo -e "${BLUE}npx -p firebase-tools firebase login:ci --no-localhost${NC}"
    echo -e ""
    echo -e "${YELLOW}Copy the generated token, and then run the deploy script with it:${NC}"
    echo -e "${BLUE}FIREBASE_TOKEN=\"your_ci_token_here\" ./deploy-termux.sh${NC}"
    exit 1
fi

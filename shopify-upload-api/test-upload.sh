#!/bin/bash

# Test script for upload API

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API URL (change this to your deployed URL)
API_URL="${1:-http://localhost:3000}"

echo -e "${YELLOW}Testing Shopify Upload API${NC}"
echo "API URL: $API_URL"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
HEALTH_RESPONSE=$(curl -s "${API_URL}/health")
if [[ $HEALTH_RESPONSE == *"ok"* ]]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "$HEALTH_RESPONSE"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "$HEALTH_RESPONSE"
    exit 1
fi

echo ""
echo "---"
echo ""

# Test 2: File Upload
echo -e "${YELLOW}Test 2: File Upload${NC}"

# Create a test image if it doesn't exist
if [ ! -f "test-image.png" ]; then
    echo "Creating test image..."
    # Create a simple 100x100 red image
    convert -size 100x100 xc:red test-image.png 2>/dev/null || {
        echo -e "${RED}ImageMagick not installed. Please provide a test-image.png file${NC}"
        echo "Or install ImageMagick: brew install imagemagick (Mac) or apt install imagemagick (Linux)"
        exit 1
    }
fi

echo "Uploading test-image.png..."
UPLOAD_RESPONSE=$(curl -s -X POST "${API_URL}/upload" -F "file=@test-image.png")

if [[ $UPLOAD_RESPONSE == *"success\":true"* ]]; then
    echo -e "${GREEN}✅ File upload successful${NC}"
    echo "$UPLOAD_RESPONSE" | jq . 2>/dev/null || echo "$UPLOAD_RESPONSE"

    # Extract URL
    FILE_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.url' 2>/dev/null)
    if [ -n "$FILE_URL" ] && [ "$FILE_URL" != "null" ]; then
        echo ""
        echo -e "${GREEN}📎 File URL: $FILE_URL${NC}"
    fi
else
    echo -e "${RED}❌ File upload failed${NC}"
    echo "$UPLOAD_RESPONSE"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All tests passed!${NC}"

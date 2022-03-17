#!/bin/bash
echo "Removing old packages..."
rm -r ./dist
echo "Compiling for ESM..."
tsc -p ./tsconfig-mjs.json
echo "Compiling for CommonJS..."
tsc -p ./tsconfig-cjs.json
echo "Creating package.json files..."
echo '{"type": "commonjs"}' > ./dist/cjs/package.json
echo '{"type": "module"}' > ./dist/mjs/package.json
echo "Compilation completed!"

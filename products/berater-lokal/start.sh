#!/bin/bash
# Berater Lokal starten (Linux)
cd "$(dirname "$0")"
npx electron . --no-sandbox "$@"

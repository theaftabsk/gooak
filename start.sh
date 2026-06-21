#!/bin/bash
node scripts/start-all.js
if [ $? -ne 0 ]; then
  echo ""
  echo "Setup/Start failed. Please check the error messages above."
  read -n 1 -s -r -p "Press any key to continue..."
fi

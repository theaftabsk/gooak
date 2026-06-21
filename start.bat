@echo off
title Oak Commerce Starter
node scripts/start-all.js
if %errorlevel% neq 0 (
  echo.
  echo Setup/Start failed. Please check the error messages above.
  pause
)

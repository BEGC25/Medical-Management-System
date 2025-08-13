# Simple Windows Start Guide

## Method 1: Use Debug Script (Recommended)

1. **Double-click: `start-clinic-debug.bat`**
   - This shows detailed error messages
   - Keeps the window open so you can see what's happening
   - Will tell you exactly what's wrong

## Method 2: Manual Command Prompt

1. **Open Command Prompt**:
   - Press `Windows + R`
   - Type: `cmd`
   - Press Enter

2. **Navigate to your clinic folder**:
   ```
   cd C:\MedicalTracker
   ```

3. **Install dependencies** (if not done):
   ```
   npm install
   ```

4. **Start the clinic**:
   ```
   npx tsx server/index.ts
   ```

## Method 3: Check Node.js Installation

The quick closing might mean Node.js isn't properly installed:

1. **Open Command Prompt**
2. **Check Node.js**:
   ```
   node --version
   ```
   - Should show something like `v18.x.x` or `v20.x.x`
   - If you get an error, install Node.js from: https://nodejs.org/

3. **Check npm**:
   ```
   npm --version
   ```

## What Should Happen When It Works

You should see:
```
✓ Database tables initialized
serving on port 5000
```

Then open browser to: **http://localhost:5000**

## Most Common Issues

1. **Node.js not installed** - Download from https://nodejs.org/
2. **Dependencies not installed** - Run `npm install` first
3. **Wrong folder** - Make sure you're in the MedicalTracker folder
4. **Antivirus blocking** - Temporarily disable antivirus during setup

Try the debug script first - it will show you exactly what's going wrong!
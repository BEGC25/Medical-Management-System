# Manual Start Instructions for Windows

Since the batch files are closing immediately, here are the manual steps that will definitely work:

## Method 1: PowerShell (Recommended)

You already have PowerShell open. In PowerShell, run these commands one by one:

```powershell
# Navigate to your clinic folder
cd C:\MedicalTracker

# Install dependencies (if not done already)
npm install

# Start the clinic system
npx tsx server/index.ts
```

## Method 2: Use the PowerShell Script

1. **Double-click: `START_CLINIC_POWERSHELL.bat`**
   - This launches PowerShell with the right permissions
   - Should work even if regular batch files don't

## Method 3: Step-by-Step in PowerShell

Since you already have PowerShell open and Node.js working:

1. **Stay in PowerShell** (you're already there)
2. **Type this command**: `npm install`
3. **Wait for it to complete** (may take 2-3 minutes)
4. **Type this command**: `npx tsx server/index.ts`

## What You Should See When It Works

```
✓ Database tables initialized
serving on port 5000
```

Then open your browser to: **http://localhost:5000**

## Why Batch Files Are Failing

Windows sometimes has execution policy restrictions or antivirus interference with batch files. PowerShell commands work more reliably.

## Quick Test Right Now

In your PowerShell window that's already open, just type:

```
npm install
```

And press Enter. This should start downloading packages. If this works, the clinic will start properly.
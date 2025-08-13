# Simple Setup Checklist for Bahr El Ghazal Clinic

## Before You Start (USA - Preparation)

### Download These Files:
1. **Clinic System ZIP**: Download from Replit (all project files)
2. **Node.js Installer**: https://nodejs.org/ → Download LTS Windows x64

### Send to Clinic:
- ZIP file (via email/cloud storage/USB)
- Node.js installer file
- This checklist

## At the Clinic (South Sudan - Installation)

### Step 1: Install Node.js ⏱️ 5 minutes
```
□ Run the Node.js installer (.msi file)
□ Click "Next" for all options (use defaults)
□ Restart computer after installation
□ Test: Open Command Prompt, type "node --version" - should show v20.x.x
```

### Step 2: Setup Clinic System ⏱️ 5 minutes
```
□ Extract ZIP file to C:\MedicalTracker
□ Double-click: setup-windows-simple.bat
□ Wait for "Setup Complete" message
□ Should see: "✓ Dependencies installed"
```

### Step 3: First Time Start ⏱️ 2 minutes
```
□ Open PowerShell (not Command Prompt)
□ Type: cd C:\MedicalTracker
□ Type: npx tsx server/index.ts
□ Wait for: "✓ Database tables initialized" and "serving on port 5000"
□ Open browser to: http://localhost:5000
```

### Step 4: Test the System ⏱️ 5 minutes
```
□ Register a test patient (should get ID: GC1)
□ Navigate between pages (Dashboard, Patients, etc.)
□ Close browser, reopen - data should still be there
□ Press Ctrl+C in PowerShell to stop system
```

## Daily Operation (After Setup)

### Starting Each Day:
1. Open PowerShell
2. Type: `cd C:\MedicalTracker`
3. Type: `npx tsx server/index.ts`
4. Staff open browsers to: `http://localhost:5000`

### Ending Each Day:
1. Double-click: `backup.bat` (creates daily backup)
2. Press Ctrl+C in PowerShell window
3. Close all browsers

## Troubleshooting

### If Setup Fails:
- Check internet connection
- Try running PowerShell "as Administrator"
- Ensure Windows is updated

### If System Won't Start:
- Verify you're in C:\MedicalTracker folder
- Check that Node.js installed correctly: `node --version`
- Try: `npm install` then `npx tsx server/index.ts`

### If Browser Shows "Site Can't Be Reached":
- Confirm PowerShell shows "serving on port 5000"
- Try: http://127.0.0.1:5000 instead of localhost
- Check Windows firewall isn't blocking port 5000

## Success Indicators

✅ **System Working Properly When:**
- PowerShell shows "serving on port 5000"
- Browser loads clinic dashboard
- Can register patients with GC1, GC2, etc. IDs
- Multiple staff can access simultaneously
- Data survives system restarts

## Important Notes

- **Keep PowerShell window open** during clinic hours
- **One computer runs the server**, others access via browser
- **All data stored locally** in clinic.db file
- **No internet needed** after initial setup
- **Backup daily** using backup.bat

## Support

If problems persist:
1. Take screenshot of error messages
2. Note exact steps that caused the problem
3. Check if clinic.db file exists in MedicalTracker folder
4. Contact system administrator with details

**Total Setup Time: ~15-20 minutes**
**Daily Startup Time: ~2 minutes**
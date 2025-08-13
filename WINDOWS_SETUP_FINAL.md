# Bahr El Ghazal Clinic - Windows Setup Guide

## ONE-CLICK SETUP (Recommended)

1. **Download and extract the clinic files to any folder** (e.g., C:\MedicalTracker)

2. **Double-click: `setup-windows-simple.bat`**
   - This installs all required software components
   - Creates the SQLite database
   - Sets up backup system
   - Takes 3-5 minutes with internet connection

3. **After setup completes, double-click: `start-clinic.bat`**
   - Opens the clinic system
   - Access at: http://localhost:5000

## System Requirements

- **Windows 10 or newer**
- **Internet connection** (for initial setup only)
- **Node.js** (will be installed automatically if missing)

## What Gets Installed

- SQLite database (clinic.db file)
- All required software dependencies
- Backup system (backup.bat)
- Start script (start-clinic.bat)

## Daily Usage

### Starting the Clinic System
- Double-click: `start-clinic.bat`
- Open browser to: http://localhost:5000
- System runs completely offline

### Stopping the System
- Press **Ctrl+C** in the command window
- Or close the command window

### Backing Up Data
- Double-click: `backup.bat`
- Creates dated backup in `backups` folder

## Features Available

✓ **Patient Registration** - GC-format patient IDs  
✓ **Treatment Records** - Visits, vital signs, diagnoses  
✓ **Laboratory Tests** - Blood, urine, stool, microbiology  
✓ **X-Ray System** - Safety checklists, technical reports  
✓ **Ultrasound Documentation** - Complete examination records  
✓ **Dashboard & Statistics** - Daily summaries and reports  
✓ **Complete Offline Operation** - No internet required after setup  

## File Locations

- **Patient Data**: `clinic.db` (SQLite database)
- **Backups**: `backups\` folder
- **System Files**: All other files in the clinic folder

## Troubleshooting

### If setup fails:
1. Check internet connection
2. Run Command Prompt as Administrator
3. Navigate to clinic folder: `cd C:\MedicalTracker`
4. Run: `npm install`

### If start fails:
1. Ensure setup completed successfully
2. Try running: `npx tsx server/index.ts` in Command Prompt
3. Check that Node.js is installed: `node --version`

## Security & Privacy

- All data stored locally on your computer
- No data sent to external servers
- Complete privacy for patient information
- Regular backups recommended

## Support

For technical issues:
1. Check this guide first
2. Verify all steps completed successfully
3. Contact system administrator if problems persist

---
**Bahr El Ghazal Clinic Management System**  
*Designed for rural healthcare in South Sudan*
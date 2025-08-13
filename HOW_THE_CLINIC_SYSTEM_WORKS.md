# How the Bahr El Ghazal Clinic Management System Works

## Overview for Staff Training

The clinic system is a complete digital replacement for paper records. All patient data is stored securely on your local computer in a database file called `clinic.db`.

## How the System Architecture Works

### 1. The Command Window (Server)
- **What you see**: The black command window with scrolling text
- **What it does**: This is the "engine" that runs the clinic system
- **Important**: This window MUST stay open for the system to work
- **When to close**: Only close it at the end of the day when done with all work

### 2. The Web Browser (User Interface)
- **What you see**: The clinic website at http://localhost:5000
- **What it does**: This is where you register patients, record treatments, order tests
- **Multiple users**: Several staff can open browsers and use the system simultaneously
- **If it stops working**: Check that the command window is still running

### 3. The Database File (Data Storage)
- **File location**: `clinic.db` in your MedicalTracker folder
- **What it contains**: ALL patient records, test results, treatments, etc.
- **Real-time updates**: When you add a patient like "Rasmus", it's instantly saved
- **Backup importance**: This file contains everything - must be backed up daily

## Daily Operations

### Starting the Clinic System
1. **Navigate to folder**: Open PowerShell, type `cd C:\MedicalTracker`
2. **Start system**: Type `npx tsx server/index.ts`
3. **Wait for confirmation**: See "✓ Database tables initialized" and "serving on port 5000"
4. **Open browsers**: Staff can now access http://localhost:5000

### During the Day
- **Keep command window open**: Never close the black command window
- **Multiple staff access**: Each person opens their own browser tab
- **Real-time updates**: Changes appear immediately for all users
- **Network independence**: Works completely offline

### End of Day Shutdown
1. **Backup data**: Run `backup.bat` to create daily backup
2. **Close browsers**: Staff close their browser tabs
3. **Stop system**: Press Ctrl+C in the command window
4. **Safe shutdown**: Wait for "System stopped" message

## What the Command Window Shows

The scrolling text shows real-time system activity:

```
Dashboard stats route called          → Someone viewed the dashboard
POST /api/patients 201               → New patient registered  
GET /api/dashboard/recent-patients   → Someone checked recent patients
```

This is normal system activity and shows the system is working properly.

## Data Flow

1. **Staff Action**: Nurse registers patient "Rasmus" in browser
2. **System Processing**: Data sent to server (command window)
3. **Database Storage**: Information saved to clinic.db file
4. **Real-time Update**: All connected browsers show new patient immediately

## System Features Available

### Patient Management
- **Registration**: New patient with GC-format ID (GC1, GC2, etc.)
- **Search**: Find patients by name, ID, or phone number
- **History**: View all previous visits and treatments

### Medical Records
- **Treatments**: Record visits, vital signs, diagnoses
- **Laboratory**: Order blood, urine, stool, microbiology tests including Widal (typhoid), H. pylori, Brucella
- **Chemistry Panel**: Automated chemistry machine tests (LFT, KFT, Lipid Profile, HbA1c, etc.)
- **Hormonal Tests**: Hormonal machine tests (Thyroid, Diabetes, Reproductive hormones, etc.)
- **X-Ray**: Document examinations with safety checklists
- **Ultrasound**: Complete examination records

### Reports & Statistics
- **Dashboard**: Daily statistics and recent activity
- **Patient Lists**: Current patients and their status
- **Test Results**: Lab and imaging results tracking

## Important for Staff Training

### What Staff Need to Know
1. **Never close the command window during work hours**
2. **Always backup data daily using backup.bat**
3. **Multiple people can use the system simultaneously**
4. **All data is stored locally - no internet required**
5. **Patient IDs are automatically generated (GC1, GC2, etc.)**

### Troubleshooting
- **Website not loading**: Check command window is running
- **Changes not saving**: Refresh browser page
- **System slow**: Only one computer should run the server
- **Data lost**: Restore from daily backup in backups folder

### Security & Privacy
- **Local storage**: All data stays on clinic computer
- **No internet access**: Patient data never leaves the building
- **Backup safety**: Store backup files securely
- **Access control**: Only authorized staff should access the system

## Training Checklist

Before staff use the system independently:
- [ ] Understand the command window must stay open
- [ ] Can start and stop the system properly
- [ ] Know how to access http://localhost:5000
- [ ] Practice patient registration
- [ ] Understand daily backup procedure
- [ ] Know basic troubleshooting steps

The system is designed to be intuitive for healthcare workers while maintaining complete data security and offline operation.
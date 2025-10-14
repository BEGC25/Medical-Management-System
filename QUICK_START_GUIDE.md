# Quick Start Guide - Bahr El Ghazal Clinic Setup

## For Non-Technical Users

### What You Need
- A computer (Windows, Mac, or Linux)
- About 30 minutes for setup
- Basic ability to follow instructions

### Step 1: Download Required Software

#### On Windows:
1. **Download Node.js**: Go to https://nodejs.org → Download LTS version → Install
2. **Download PostgreSQL**: Go to https://www.postgresql.org/download/windows/ → Download → Install
   - **Important**: Write down the password you set for 'postgres' user!
3. **Download the clinic system**: Copy all files from this project to a folder on your computer

#### On Mac:
1. Open Terminal (press Cmd+Space, type "terminal")
2. Install required software:
   - **If you have Homebrew installed**:
     ```bash
     brew install node postgresql@15
     brew services start postgresql@15
     ```
   - **If you don't have Homebrew**:
     - Download Node.js from https://nodejs.org (LTS version)
     - Download PostgreSQL from https://www.postgresql.org/download/macos/
     - Install both with default settings

### Step 2: Set Up the System

#### Windows Users:
1. Copy all clinic system files to: `C:\clinic-management\`
2. Double-click `setup-local.bat`
3. Follow the prompts (enter PostgreSQL password when asked)
4. Wait for setup to complete

#### Mac/Linux Users:
1. Copy all clinic system files to your home folder
2. Open Terminal and run:
   ```bash
   cd clinic-management
   chmod +x setup-local.sh
   ./setup-local.sh
   ```

### Step 3: Start Using the System

#### Every Day Operations:

**To Start the Clinic System:**
- Windows: Double-click `start-clinic.bat` (if created) OR open Command Prompt → type `npm run start`
- Mac/Linux: Open Terminal → type `npm run start`

**To Access the System:**
- Open any web browser
- Go to: `http://localhost:3000`
- You'll see the clinic management dashboard

**To Stop the System:**
- Press `Ctrl+C` in the command window
- Close the browser

### Step 4: Daily Data Backup

**Windows:**
- Double-click `backup.bat` once per day

**Mac/Linux:**
- Run `./backup.sh` once per day

### Troubleshooting

**System won't start:**
1. Make sure PostgreSQL is running
2. Restart your computer
3. Try the setup script again

**Can't access the website:**
1. Check if system is running (you should see "serving on port 3000")
2. Try: `http://127.0.0.1:3000` instead

**Need help:**
1. Write down any error messages
2. Check the OFFLINE_DEPLOYMENT_GUIDE.md file
3. Contact your IT support person

## Network Access (Multiple Computers)

If you want to access the system from other computers in your clinic:

1. **Find your computer's IP address:**
   - Windows: Open Command Prompt → type `ipconfig`
   - Mac/Linux: Open Terminal → type `ifconfig`

2. **Look for IP address like: 192.168.1.100**

3. **On other computers, open browser to:**
   - `http://192.168.1.100:3000` (replace with your IP)

## Important Notes

- **No Internet Required**: Once set up, works completely offline
- **Data Security**: All patient data stays on your computer
- **Backup Daily**: Use the backup script to protect your data
- **Power Protection**: Use a UPS (battery backup) to protect against power outages

## Emergency Procedures

**If computer crashes:**
1. Restart computer
2. Start the clinic system normally
3. If data is missing, restore from latest backup

**If system is corrupted:**
1. Reinstall from backup
2. Use the OFFLINE_DEPLOYMENT_GUIDE.md for full setup
3. Restore data from backup files
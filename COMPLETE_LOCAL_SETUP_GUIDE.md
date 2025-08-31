# Complete Local Network Setup Guide
## Bahr El Ghazal Clinic Management System

### 🏥 Overview
This guide sets up the clinic management system on a local network with 5 computers across different departments, requiring **no internet connection** after initial setup.

### 🖥️ Hardware Setup

#### Required Equipment:
- **5 Desktop Computers** (1 server + 4 departments)
- **1 Network Switch** (8-port minimum)
- **5 Ethernet Cables** (Cat5e or Cat6)
- **1 UPS/Power Backup** (recommended)

#### Network Layout:
```
Internet ❌ (NOT REQUIRED)
    │
[Router/Switch] ────────────── Main Server (192.168.1.100)
    │                          Reception/Admin Computer
    ├─────────────────────────── Lab Computer (192.168.1.101)
    ├─────────────────────────── X-ray Computer (192.168.1.102)
    ├─────────────────────────── Ultrasound Computer (192.168.1.103)
    └─────────────────────────── Consultation Computer (192.168.1.104)
```

---

## 🔧 Step-by-Step Installation

### STEP 1: Physical Network Connection
1. **Connect the network switch** to power
2. **Connect all 5 computers** to the switch using ethernet cables
3. **Power on all computers**

### STEP 2: Configure Main Server Computer (Reception)

#### A. Copy Clinic System Files
1. Copy the entire clinic system folder to `C:\ClinicSystem\`
2. Ensure all files are present including:
   - `start-local-server.bat`
   - `configure-ip-address.bat`
   - `setup-firewall-rules.bat`
   - `check-network-connection.bat`

#### B. Configure Network Settings
1. **Right-click** `configure-ip-address.bat` → **Run as administrator**
2. **Select option 1** (Main Server)
3. **Type YES** to confirm
4. **Wait for completion**

#### C. Setup Firewall Rules
1. **Right-click** `setup-firewall-rules.bat` → **Run as administrator**
2. **Wait for all rules to be created**
3. **Press any key** to close

#### D. Create Desktop Shortcuts
1. **Double-click** `create-desktop-shortcuts.bat`
2. **Shortcuts will appear** on desktop

### STEP 3: Configure Department Computers

#### Repeat for Each Department Computer:

**Laboratory Computer (192.168.1.101):**
1. **Right-click** `configure-ip-address.bat` → **Run as administrator**
2. **Select option 2** (Laboratory)
3. **Type YES** to confirm

**X-ray Computer (192.168.1.102):**
1. **Right-click** `configure-ip-address.bat` → **Run as administrator**
2. **Select option 3** (X-ray)
3. **Type YES** to confirm

**Ultrasound Computer (192.168.1.103):**
1. **Right-click** `configure-ip-address.bat` → **Run as administrator**
2. **Select option 4** (Ultrasound)
3. **Type YES** to confirm

**Consultation Computer (192.168.1.104):**
1. **Right-click** `configure-ip-address.bat` → **Run as administrator**
2. **Select option 5** (Consultation)
3. **Type YES** to confirm

### STEP 4: Test Network Connectivity
1. On **any computer**, double-click `check-network-connection.bat`
2. **Verify all computers** respond to ping
3. **Fix any connection issues** before proceeding

---

## 🚀 Daily Operations

### Starting the System Each Day:

#### On Main Server Computer (Reception):
1. **Double-click** "Start Clinic Server" desktop shortcut
2. **Wait for** "Server running on port 5000" message
3. **Keep this window open** all day (minimize if needed)

#### On Department Computers:
1. **Double-click** "Access Clinic System" desktop shortcut
2. **Bookmark** `http://192.168.1.100:5000` in browser
3. **Login** with your department credentials

### Stopping the System:
1. **Close browsers** on all department computers
2. **Press Ctrl+C** in server window on main computer
3. **Close all programs** and shutdown computers

---

## 👥 User Access by Department

| Department | Computer | Access Method | Primary Functions |
|------------|----------|---------------|-------------------|
| **Reception/Admin** | Main Server | Desktop shortcut | Patient registration, scheduling |
| **Laboratory** | Lab Computer | Browser bookmark | Lab orders, results entry |
| **X-ray** | X-ray Computer | Browser bookmark | X-ray orders, image viewing |
| **Ultrasound** | Ultrasound Computer | Browser bookmark | Ultrasound scheduling, reports |
| **Consultation** | Consultation Computer | Browser bookmark | Patient consultation, prescriptions |

---

## 🔒 Security & Access Control

### User Account Setup:
- **Admin Users**: Full system access (Reception)
- **Lab Technicians**: Lab module only
- **Radiographers**: X-ray/Ultrasound modules
- **Doctors**: All clinical modules, read-only admin

### Physical Security:
- **Lock server computer room**
- **Secure network switch location**
- **Regular password changes**
- **Access log monitoring**

---

## 💾 Backup Strategy

### Automatic Daily Backups:
```batch
# Runs automatically at 11:59 PM daily
xcopy "C:\ClinicSystem\clinic.db" "C:\Backups\Daily\" /Y
```

### Manual Weekly Backups:
1. **Insert USB drive** into server computer
2. **Copy entire** `C:\ClinicSystem\` folder to USB
3. **Store USB drive** in secure location
4. **Keep 4 weeks** of backups

### Monthly Full System Backup:
1. **Create system image** of server computer
2. **Test restore procedure**
3. **Document any changes**

---

## 🛠️ Troubleshooting Guide

### Department Computer Cannot Access System:

#### Quick Fixes:
1. **Check ethernet cable** connections
2. **Restart web browser**
3. **Clear browser cache**
4. **Ping server**: Open Command Prompt, type `ping 192.168.1.100`

#### Advanced Fixes:
1. **Check IP configuration**: `ipconfig`
2. **Restart network adapter**
3. **Check firewall settings**
4. **Restart network switch**

### Server Computer Issues:

#### If Server Won't Start:
1. **Run as Administrator**
2. **Check port 5000**: `netstat -an | findstr :5000`
3. **Kill conflicting processes**
4. **Restart computer**

#### If Database Errors:
1. **Check disk space**
2. **Restore from backup**
3. **Run database repair**
4. **Contact technical support**

### Network Performance Issues:

#### Slow Response Times:
1. **Check network cables**
2. **Restart network switch**
3. **Monitor CPU usage** on server
4. **Check for Windows updates**

#### Connection Drops:
1. **Check UPS battery** status
2. **Verify network switch** power
3. **Test ethernet cables**
4. **Update network drivers**

---

## 📊 Performance Monitoring

### Daily Checks:
- ✅ All departments can access system
- ✅ Server computer running smoothly
- ✅ Network response times under 2 seconds
- ✅ Database backup completed

### Weekly Checks:
- ✅ Disk space availability (>20% free)
- ✅ Network cable connections secure
- ✅ UPS battery test
- ✅ Windows security updates

### Monthly Checks:
- ✅ Full system backup test
- ✅ Hardware cleaning (dust removal)
- ✅ Software performance review
- ✅ User access audit

---

## 📞 Support Contacts

### Internal IT Support:
- **Primary**: [Local IT Person Name & Phone]
- **Secondary**: [Backup IT Person Name & Phone]
- **After Hours**: [Emergency Contact]

### External Support:
- **System Developer**: [Development Team Contact]
- **Hardware Vendor**: [Computer/Network Supplier]
- **Emergency**: [24/7 Technical Support]

---

## 💰 Total Setup Cost Estimate

| Component | Cost Range | Notes |
|-----------|------------|-------|
| **Network Switch** | $50 - $100 | 8-port gigabit |
| **Ethernet Cables** | $30 - $60 | Cat6, various lengths |
| **UPS Battery Backup** | $100 - $200 | 1000VA minimum |
| **Installation Labor** | $200 - $500 | 1-2 days |
| **Training** | $100 - $300 | Staff training |
| **Documentation** | $50 - $100 | Printing, binders |
| **Total** | **$530 - $1,260** | Complete setup |

---

## ✅ Success Indicators

### System is Working Properly When:
- ✅ All 5 computers can access the clinic system
- ✅ Response times are under 3 seconds
- ✅ Data syncs instantly across departments
- ✅ Daily backups run automatically
- ✅ No network connection errors
- ✅ All staff can perform their duties efficiently

### Quality Metrics:
- **System Uptime**: >99% during clinic hours
- **Network Response**: <2 seconds average
- **User Satisfaction**: >95% positive feedback
- **Data Integrity**: 100% backup success rate

---

## 🎯 Maintenance Schedule

### Daily (5 minutes):
- Start server system
- Check all departments connect
- Verify backup completion

### Weekly (30 minutes):
- Test network connectivity
- Check system performance
- Review error logs
- Clean computer monitors

### Monthly (2 hours):
- Full system backup test
- Hardware cleaning
- Software updates
- User access review

### Quarterly (4 hours):
- Complete system health check
- Network performance analysis
- Security audit
- Staff refresher training

---

**This local network setup ensures your clinic management system operates independently of internet connectivity while providing fast, secure access across all departments.**
# Local Network Setup for Bahr El Ghazal Clinic
## Multi-Department Access Without Internet

### Overview
This setup allows 5 computers in different departments to access the clinic system through a local network, with no internet required after initial setup.

## Network Architecture

```
[Main Server Computer] ←→ [Network Switch/Router] ←→ [Department Computers]
     (Reception)              (Local Network)         (Lab, X-ray, etc.)
```

### Hardware Requirements
- **1 Main Server Computer** (Reception/Admin)
- **4 Department Computers** (Lab, X-ray, Ultrasound, Consultation)
- **1 Network Switch or Router** (8-port recommended)
- **5 Ethernet Cables**
- **Power strips/UPS** (recommended for power stability)

## Setup Instructions

### Step 1: Physical Network Setup
1. Connect the network switch/router to power
2. Connect Main Server Computer to Port 1 of switch
3. Connect 4 Department Computers to Ports 2-5 of switch
4. Use ethernet cables for all connections

### Step 2: Configure Static IP Addresses

#### Main Server Computer (Reception):
- IP Address: `192.168.1.100`
- Subnet Mask: `255.255.255.0`
- Gateway: `192.168.1.1`

#### Department Computers:
- **Lab Computer**: `192.168.1.101`
- **X-ray Computer**: `192.168.1.102` 
- **Ultrasound Computer**: `192.168.1.103`
- **Consultation Computer**: `192.168.1.104`
- Subnet Mask: `255.255.255.0`
- Gateway: `192.168.1.1`

### Step 3: Windows Network Configuration
1. Go to **Control Panel** → **Network and Sharing Center**
2. Click **Change adapter settings**
3. Right-click **Ethernet** → **Properties**
4. Select **Internet Protocol Version 4 (TCP/IPv4)** → **Properties**
5. Select **Use the following IP address**
6. Enter the IP address for each computer as listed above
7. Click **OK** to save

### Step 4: Install and Configure Clinic Software

#### On Main Server Computer (192.168.1.100):
1. Copy the clinic system files to `C:\ClinicSystem\`
2. Open Command Prompt as Administrator
3. Navigate to clinic directory: `cd C:\ClinicSystem`
4. Install dependencies: `npm install`
5. Create production environment file:
```
NODE_ENV=production
DATABASE_FILE=clinic.db
SERVER_HOST=0.0.0.0
SERVER_PORT=5000
```
6. Start the server: `npm run start-local`

#### On Department Computers:
- No installation required - just use web browser
- Bookmark: `http://192.168.1.100:5000`

## Department Access URLs

| Department | Computer IP | Access URL |
|-----------|-------------|------------|
| Reception/Admin | 192.168.1.100 | http://localhost:5000 |
| Laboratory | 192.168.1.101 | http://192.168.1.100:5000 |
| X-ray | 192.168.1.102 | http://192.168.1.100:5000 |
| Ultrasound | 192.168.1.103 | http://192.168.1.100:5000 |
| Consultation | 192.168.1.104 | http://192.168.1.100:5000 |

## Daily Operations

### Starting the System:
1. Turn on Main Server Computer first
2. Open Command Prompt as Administrator
3. Run: `cd C:\ClinicSystem && npm run start-local`
4. Wait for "Server running on port 5000" message
5. Turn on department computers
6. Open web browsers and go to `http://192.168.1.100:5000`

### Stopping the System:
1. Close browsers on department computers
2. Press `Ctrl+C` in Command Prompt on server
3. Turn off computers

## Backup Strategy

### Daily Backups (Automated):
```batch
@echo off
xcopy "C:\ClinicSystem\clinic.db" "C:\Backups\Daily\clinic-%date:~-4,4%-%date:~-10,2%-%date:~-7,2%.db" /Y
echo Backup completed for %date%
```

### Weekly Backups to External Drive:
1. Insert USB drive weekly
2. Copy entire `C:\ClinicSystem\` folder to USB
3. Keep USB drive in secure location

## Troubleshooting

### If Department Computer Cannot Access System:
1. Check ethernet cable connections
2. Ping server: `ping 192.168.1.100`
3. Check IP configuration: `ipconfig`
4. Restart network adapter
5. Check firewall settings on server

### If Server Won't Start:
1. Check if port 5000 is already in use
2. Run as Administrator
3. Check antivirus software blocking
4. Verify Node.js installation

### Network Connection Issues:
1. Check all cable connections
2. Restart network switch
3. Verify IP addresses are unique
4. Check subnet mask settings

## Security Considerations

### Physical Security:
- Lock server computer room
- Secure network switch location
- Regular password changes
- User access controls

### Data Security:
- Daily database backups
- Weekly full system backups
- UPS for power protection
- Regular system updates

## Performance Optimization

### Server Computer Specs (Recommended):
- **CPU**: Intel i5 or AMD Ryzen 5 (minimum)
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: SSD recommended for database performance
- **Network**: Gigabit ethernet adapter

### Network Performance:
- Use Cat6 ethernet cables
- Gigabit network switch
- Avoid WiFi for main connections
- Monitor network traffic

## Maintenance Schedule

### Daily:
- ✓ System startup/shutdown log
- ✓ Automatic database backup
- ✓ Check all departments can access

### Weekly:
- ✓ Manual backup to external drive
- ✓ Check system performance
- ✓ Verify network connections

### Monthly:
- ✓ Clean computer dust filters
- ✓ Check UPS battery status
- ✓ Review backup integrity
- ✓ System security check

## User Training

### Each Department Staff Should Know:
1. How to access the system via web browser
2. Their department's specific functions
3. How to log in/out properly
4. Basic troubleshooting (restart browser, check network)
5. Who to contact for technical issues

### IT Administrator Should Know:
1. How to start/stop the server
2. How to perform backups
3. Basic network troubleshooting
4. How to add new users
5. Database maintenance

## Emergency Procedures

### If Main Server Fails:
1. Have backup server computer ready
2. Restore latest database backup
3. Reconfigure network settings
4. Test all department access

### If Network Switch Fails:
1. Have spare switch available
2. Document current port assignments
3. Reconfigure network quickly
4. Test all connections

### Power Outage Recovery:
1. Wait for stable power
2. Start server computer first
3. Check database integrity
4. Verify all departments connect
5. Resume normal operations

## Cost Estimate

| Item | Quantity | Estimated Cost |
|------|----------|---------------|
| Network Switch (8-port) | 1 | $50-100 |
| Ethernet Cables (25ft) | 5 | $50 |
| UPS Battery Backup | 1 | $100-200 |
| Installation Labor | 1 day | $200-500 |
| **Total** | | **$400-850** |

## Support Contact

For technical support and questions:
- **System Administrator**: [Local IT Person]
- **Remote Support**: [Support Contact if available]
- **Emergency Contact**: [24/7 Support Number]

---

This local network setup ensures the clinic management system works reliably without internet dependency, providing secure and fast access across all departments.
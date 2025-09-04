# CRM Network Launcher - Fixed Port Solution

## 🚀 One Script, Fixed Ports, Zero Configuration

```bash
./crm-network-launcher.sh
```

## 🔒 **FIXED PORTS - NO CHANGES ALLOWED**

This script uses **FIXED PORTS** and will **NEVER** change them:

- **Backend API**: Port **3000** (FIXED)
- **Frontend Web**: Port **5173** (FIXED)  
- **Mobile Web**: Port **5180** (FIXED)

## ⚡ **Automatic Port Conflict Resolution**

When ports are occupied, the script will:

1. ✅ **Detect** existing processes on required ports
2. ✅ **Automatically stop** conflicting services
3. ✅ **Force kill** if graceful stop fails
4. ✅ **Verify** ports are free before starting
5. ✅ **Start services** on exact required ports
6. ✅ **Confirm** each service is running on correct port

## 🎯 **What It Does**

### **Network Detection**
- Auto-detects your network IP address
- Configures all apps for both localhost and network access

### **Port Management** 
- **NEVER changes ports** - always uses 3000, 5173, 5180
- **Forcefully frees** occupied ports
- **Verifies** each service starts on correct port
- **Fails fast** if unable to secure required ports

### **Service Startup**
- Starts Backend on port **3000** (verified)
- Starts Frontend on port **5173** (verified)
- Starts Mobile on port **5180** (verified)
- **Stops all services** if any single service fails

## 🌐 **Access URLs**

### **Localhost:**
- Frontend: `http://localhost:5173`
- Mobile: `http://localhost:5180`
- Backend: `http://localhost:3000`

### **Network:**
- Frontend: `http://YOUR_IP:5173`
- Mobile: `http://YOUR_IP:5180`
- Backend: `http://YOUR_IP:3000`

## 🛠️ **Commands**

```bash
# Start all services (auto-detect network IP)
./crm-network-launcher.sh

# Show help
./crm-network-launcher.sh --help

# Show version
./crm-network-launcher.sh --version

# Stop all services
./crm-network-launcher.sh --stop
```

## 🔧 **Port Conflict Handling**

The script handles port conflicts automatically:

```bash
# Example output when port 3000 is occupied:
⚠️  Port 3000 is occupied by PID 12345. Freeing port for Backend API...
✅ Port 3000 is now available for Backend API

# If graceful kill fails:
ℹ️  Force killing process on port 3000...
✅ Port 3000 is now available for Backend API
```

## 📱 **Mobile Testing**

1. **Run the script**: `./crm-network-launcher.sh`
2. **Note the network IP** in the output
3. **Connect mobile device** to same WiFi
4. **Open browser** and go to: `http://YOUR_IP:5180`

## 🔍 **Verification Process**

The script performs multiple verification steps:

1. **Pre-start verification**: Ensures ports are free
2. **Post-start verification**: Confirms services are running
3. **Port ownership verification**: Validates correct PID on each port
4. **Final status check**: Reports all services running correctly

## ⚠️ **Important Guarantees**

- ✅ **Ports NEVER change** - Always 3000, 5173, 5180
- ✅ **Conflicts resolved automatically** - No manual intervention needed
- ✅ **All-or-nothing startup** - If any service fails, all are stopped
- ✅ **Port verification** - Each service confirmed on correct port
- ✅ **Network and localhost** - Both access methods work simultaneously

## 🛑 **Stopping Services**

```bash
# Stop all CRM services
./crm-network-launcher.sh --stop
```

This will:
- Stop services by PID files
- Stop services by port (backup)
- Clean up remaining processes
- Remove PID files

## 📊 **Monitoring**

Log files created in `./logs/`:
- `backend.log` - Backend API logs
- `frontend.log` - Frontend Web logs  
- `mobile.log` - Mobile Web logs

```bash
# View logs in real-time
tail -f logs/backend.log
tail -f logs/frontend.log
tail -f logs/mobile.log
```

## 💡 **Key Features**

- ✅ **Fixed ports** - Never changes 3000, 5173, 5180
- ✅ **Automatic conflict resolution** - Stops existing services
- ✅ **Verification at every step** - Ensures correct startup
- ✅ **All-or-nothing** - Clean failure handling
- ✅ **Network + localhost** - Both access methods
- ✅ **Zero configuration** - Just run the script
- ✅ **Cross-platform** - Works on macOS, Linux, Windows (WSL)

This script guarantees that your CRM application will always run on the exact same ports (3000, 5173, 5180) regardless of what else is running on your system.

# Network Troubleshooting - Zama Testnet Deployment

## Issue
DNS resolution is failing for Zama testnet endpoints:
- `devnet.zama.ai` - ENOTFOUND
- `testnet.zama.ai` - ENOTFOUND  
- `api.nitrogen.fhenix.zone` - ENOTFOUND

## Possible Causes
1. **Network/Firewall**: Corporate firewall or network restrictions blocking DNS resolution
2. **DNS Server**: DNS server not resolving these domains
3. **VPN Required**: Endpoints might require VPN access
4. **Endpoint Changes**: URLs might have changed

## Solutions to Try

### 1. Check DNS Resolution
```powershell
# Test DNS resolution
nslookup devnet.zama.ai
nslookup testnet.zama.ai
```

### 2. Try Different DNS Servers
```powershell
# Use Google DNS
nslookup devnet.zama.ai 8.8.8.8
```

### 3. Check Network Connectivity
```powershell
# Test basic connectivity
Test-NetConnection -ComputerName devnet.zama.ai -Port 443
```

### 4. Use Alternative Endpoint
If Zama endpoints don't work, try Fhenix Nitrogen:
- URL: `https://api.nitrogen.fhenix.zone`
- Chain ID: `8008148`

### 5. Check Zama Documentation
Visit: https://docs.zama.org for current RPC endpoints

### 6. Contact Zama Support
- Discord: Zama Discord server
- Check if endpoints require authentication or VPN

## Current Configuration
- **Network**: `zama` 
- **URL**: `https://devnet.zama.ai` (from .env)
- **Chain ID**: `8009`
- **Private Key**: Configured in .env

## Alternative: Deploy to Localhost First
If network issues persist, deploy to localhost for testing:
```bash
npx hardhat run scripts/deploy.ts --network hardhat
```

Then update frontend with localhost address for local testing.


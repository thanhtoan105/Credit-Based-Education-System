# SQL Server Multi-Instance Setup Guide for QLDSV_TC

## Overview
The QLDSV_TC system uses multiple SQL Server instances, all with the same database structure and authentication setup.

## Required SQL Server Instances
- **MSI\MSSQLSERVER1** - Department 1 (e.g., IT Department)
- **MSI\MSSQLSERVER2** - Department 2 (e.g., Telecommunications)  
- **MSI\MSSQLSERVER3** - Department 3 (e.g., Accounting)

## Database Configuration
- **Database Name**: `QLDSV_TC` (same on all instances)
- **Teacher User**: `HTKN` / Password: `123456`
- **Student User**: `SV` / Password: `123456`
- **Admin User**: `sa` / Password: `123456`

## Step-by-Step Setup

### 1. Install SQL Server Instances
```cmd
# Install SQL Server with named instances
# During installation, specify instance names:
# - MSSQLSERVER1
# - MSSQLSERVER2  
# - MSSQLSERVER3
```

### 2. Enable SQL Server Services
```cmd
# Run as Administrator
net start "MSSQL$MSSQLSERVER1"
net start "MSSQL$MSSQLSERVER2"
net start "MSSQL$MSSQLSERVER3"
net start SQLBrowser
```

### 3. Configure Each Instance
For **EACH** instance (MSSQLSERVER1, MSSQLSERVER2, MSSQLSERVER3):

#### A. Enable SQL Server Authentication
1. Connect to instance in SSMS
2. Right-click server → Properties → Security
3. Select "SQL Server and Windows Authentication mode"
4. Restart SQL Server service

#### B. Create QLDSV_TC Database
```sql
CREATE DATABASE QLDSV_TC;
```

#### C. Run the Setup Script
Execute `scripts/fix-sql-connection.sql` on each instance.

### 4. Create Required Tables and Stored Procedures
On each instance, create the necessary tables:

```sql
USE QLDSV_TC;

-- Example table structures (adjust as needed)
CREATE TABLE SINHVIEN (
    MASV NVARCHAR(50) PRIMARY KEY,
    HO NVARCHAR(50),
    TEN NVARCHAR(50),
    DANGHIHOC BIT DEFAULT 0
);

CREATE TABLE GIANGVIEN (
    MAGV NVARCHAR(50) PRIMARY KEY,
    HO NVARCHAR(50),
    TEN NVARCHAR(50)
);

-- Create required stored procedures
CREATE PROCEDURE SP_LOGIN_INFO
    @LoginName NVARCHAR(50),
    @Role NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @Role = 'SV'
    BEGIN
        SELECT 
            USERNAME = MASV,
            HOTEN = HO + ' ' + TEN,
            TENHOM = 'SV'
        FROM SINHVIEN 
        WHERE MASV = @LoginName AND DANGHIHOC = 0
    END
    ELSE IF @Role = 'GV'
    BEGIN
        SELECT 
            USERNAME = MAGV,
            HOTEN = HO + ' ' + TEN,
            TENHOM = 'GV'
        FROM GIANGVIEN 
        WHERE MAGV = @LoginName
    END
END;

CREATE PROCEDURE SP_LOGIN_SV
    @LoginName NVARCHAR(50),
    @StudentId NVARCHAR(50),
    @Password NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate student exists and is not suspended
    IF EXISTS (SELECT 1 FROM SINHVIEN WHERE MASV = @StudentId AND DANGHIHOC = 0)
    BEGIN
        SELECT 1 as Success;
    END
    ELSE
    BEGIN
        SELECT 0 as Success;
    END
END;
```

### 5. Configure Windows Firewall
```cmd
# Allow SQL Server ports
netsh advfirewall firewall add rule name="SQL Server Default" dir=in action=allow protocol=TCP localport=1433
netsh advfirewall firewall add rule name="SQL Browser" dir=in action=allow protocol=UDP localport=1434
```

### 6. Enable TCP/IP Protocol
1. Open SQL Server Configuration Manager
2. For each instance:
   - Go to SQL Server Network Configuration → Protocols for [INSTANCE]
   - Right-click TCP/IP → Enable
   - Restart the SQL Server service

### 7. Test Connections
Visit the diagnostic page: `http://localhost:3001/diagnose-sql`

This will test connections to all instances and show detailed error messages if any issues exist.

## Troubleshooting Common Issues

### Connection Timeout
- Ensure SQL Server Browser service is running
- Check Windows Firewall settings
- Verify instance names are correct

### Login Failed
- Ensure SQL Server Authentication is enabled
- Verify HTKN and SV users exist with correct passwords
- Check user permissions

### Server Not Found
- Verify instance names in SQL Server Configuration Manager
- Ensure SQL Server Browser service is running
- Try connecting with IP address instead of server name

## Verification Checklist

For each instance, verify:
- [ ] SQL Server service is running
- [ ] SQL Server Browser service is running  
- [ ] QLDSV_TC database exists
- [ ] HTKN user exists with password 123456
- [ ] SV user exists with password 123456
- [ ] SP_LOGIN_INFO stored procedure exists
- [ ] SP_LOGIN_SV stored procedure exists
- [ ] TCP/IP protocol is enabled
- [ ] Windows Firewall allows connections
- [ ] Can connect from diagnostic page

## Connection Strings Used by Application

**Teacher Connection:**
```
Server: MSI\MSSQLSERVER1, Database: QLDSV_TC, User: HTKN, Password: 123456
```

**Student Connection:**
```
Server: MSI\MSSQLSERVER1, Database: QLDSV_TC, User: SV, Password: 123456
```

All instances use the same pattern with different instance names (MSSQLSERVER1, MSSQLSERVER2, MSSQLSERVER3).

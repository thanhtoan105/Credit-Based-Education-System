-- SQL Server Connection Fix Script for QLDSV_TC Multi-Database System
-- Run this script on ALL SQL Server instances:
-- - MSI\MSSQLSERVER1
-- - MSI\MSSQLSERVER2
-- - MSI\MSSQLSERVER3
-- All instances should have QLDSV_TC database and the same user setup

-- 1. Enable SQL Server Authentication (if not already enabled)
-- This needs to be done through SSMS Properties -> Security

-- 2. Create required login users
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'HTKN')
BEGIN
    CREATE LOGIN HTKN WITH PASSWORD = '123456';
    PRINT 'Created HTKN login';
END
ELSE
    PRINT 'HTKN login already exists';

IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'SV')
BEGIN
    CREATE LOGIN SV WITH PASSWORD = '123456';
    PRINT 'Created SV login';
END
ELSE
    PRINT 'SV login already exists';

-- 3. Create database users
USE QLDSV_TC;

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'HTKN')
BEGIN
    CREATE USER HTKN FOR LOGIN HTKN;
    PRINT 'Created HTKN user in QLDSV_TC';
END
ELSE
    PRINT 'HTKN user already exists in QLDSV_TC';

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'SV')
BEGIN
    CREATE USER SV FOR LOGIN SV;
    PRINT 'Created SV user in QLDSV_TC';
END
ELSE
    PRINT 'SV user already exists in QLDSV_TC';

-- 4. Grant basic permissions
GRANT CONNECT TO HTKN;
GRANT CONNECT TO SV;

-- 5. Grant execute permissions on stored procedures (if they exist)
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'SP_THONGTINDANGNHAP' AND type = 'P')
BEGIN
    GRANT EXECUTE ON SP_THONGTINDANGNHAP TO HTKN;
    GRANT EXECUTE ON SP_THONGTINDANGNHAP TO SV;
    PRINT 'Granted EXECUTE on SP_THONGTINDANGNHAP';
END
ELSE
    PRINT 'SP_THONGTINDANGNHAP does not exist - you may need to create it';

IF EXISTS (SELECT * FROM sys.objects WHERE name = 'SP_DANGNHAP_SV' AND type = 'P')
BEGIN
    GRANT EXECUTE ON SP_DANGNHAP_SV TO SV;
    PRINT 'Granted EXECUTE on SP_DANGNHAP_SV';
END
ELSE
    PRINT 'SP_DANGNHAP_SV does not exist - you may need to create it';

IF EXISTS (SELECT * FROM sys.objects WHERE name = 'SP_DANGNHAP' AND type = 'P')
BEGIN
    GRANT EXECUTE ON SP_DANGNHAP TO HTKN;
    GRANT EXECUTE ON SP_DANGNHAP TO SV;
    PRINT 'Granted EXECUTE on SP_DANGNHAP';
END
ELSE
    PRINT 'SP_DANGNHAP does not exist - you may need to create it';

-- 6. Grant SELECT permissions on necessary tables/views
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'VIEW_FRAGMENT_LIST' AND type = 'V')
BEGIN
    GRANT SELECT ON VIEW_FRAGMENT_LIST TO HTKN;
    GRANT SELECT ON VIEW_FRAGMENT_LIST TO SV;
    PRINT 'Granted SELECT on VIEW_FRAGMENT_LIST';
END
ELSE
    PRINT 'VIEW_FRAGMENT_LIST does not exist - check if it needs to be created';

-- 7. Check if required tables exist
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'SINHVIEN' AND type = 'U')
    PRINT 'SINHVIEN table exists';
ELSE
    PRINT 'WARNING: SINHVIEN table does not exist';

IF EXISTS (SELECT * FROM sys.objects WHERE name = 'GIANGVIEN' AND type = 'U')
    PRINT 'GIANGVIEN table exists';
ELSE
    PRINT 'WARNING: GIANGVIEN table does not exist';

-- 8. Test connections
PRINT 'Testing HTKN connection...';
EXECUTE AS LOGIN = 'HTKN';
SELECT 'HTKN connection successful' AS Result;
REVERT;

PRINT 'Testing SV connection...';
EXECUTE AS LOGIN = 'SV';
SELECT 'SV connection successful' AS Result;
REVERT;

PRINT 'SQL Server setup completed for QLDSV_TC database!';
PRINT 'IMPORTANT: Run this same script on ALL instances:';
PRINT '- MSI\MSSQLSERVER1';
PRINT '- MSI\MSSQLSERVER2';
PRINT '- MSI\MSSQLSERVER3';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Ensure SQL Server Browser service is running';
PRINT '2. Check Windows Firewall settings';
PRINT '3. Verify TCP/IP protocol is enabled';
PRINT '4. Test connection from the diagnostic page: http://localhost:3001/diagnose-sql';

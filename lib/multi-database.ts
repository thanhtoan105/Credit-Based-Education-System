import sql, { ConnectionPool } from 'mssql';
import { DatabaseConfig, createDepartmentConfig, createStudentConfig } from './db-config';

// Connection pool manager for multiple databases
class MultiDatabaseManager {
  private static instance: MultiDatabaseManager;
  private connectionPools: Map<string, ConnectionPool> = new Map();
  private connectingPools: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): MultiDatabaseManager {
    if (!MultiDatabaseManager.instance) {
      MultiDatabaseManager.instance = new MultiDatabaseManager();
    }
    return MultiDatabaseManager.instance;
  }

  // Get connection pool for a specific server
  public async getPool(serverKey: string, config: DatabaseConfig): Promise<ConnectionPool> {
    // Check if pool already exists and is connected
    const existingPool = this.connectionPools.get(serverKey);
    if (existingPool && existingPool.connected) {
      return existingPool;
    }

    // Check if connection is in progress
    if (this.connectingPools.has(serverKey)) {
      // Wait for existing connection attempt
      while (this.connectingPools.has(serverKey)) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      const pool = this.connectionPools.get(serverKey);
      if (pool && pool.connected) {
        return pool;
      }
    }

    return this.createConnection(serverKey, config);
  }

  // Create new connection pool
  private async createConnection(serverKey: string, config: DatabaseConfig): Promise<ConnectionPool> {
    try {
      this.connectingPools.add(serverKey);
      console.log(`Connecting to ${serverKey}...`);

      const pool = new ConnectionPool(config);
      
      // Set up event handlers
      pool.on('connect', () => {
        console.log(`Connected to ${serverKey} successfully`);
      });

      pool.on('error', (err) => {
        console.error(`${serverKey} connection error:`, err);
        this.connectionPools.delete(serverKey);
      });

      await pool.connect();
      this.connectionPools.set(serverKey, pool);
      
      return pool;
    } catch (error) {
      console.error(`Failed to connect to ${serverKey}:`, error);
      this.connectionPools.delete(serverKey);
      throw error;
    } finally {
      this.connectingPools.delete(serverKey);
    }
  }

  // Get primary server connection (MSI)
  public async getPrimaryPool(): Promise<ConnectionPool> {
    const { dbConfig } = await import('./db-config');
    return this.getPool('primary', dbConfig);
  }

  // Get department-specific connection
  public async getDepartmentPool(serverName: string): Promise<ConnectionPool> {
    const config = createDepartmentConfig(serverName);
    return this.getPool(serverName, config);
  }

  // Get student access connection
  public async getStudentPool(serverName: string): Promise<ConnectionPool> {
    const config = createStudentConfig(serverName);
    return this.getPool(`student_${serverName}`, config);
  }

  // Close specific connection
  public async closeConnection(serverKey: string): Promise<void> {
    const pool = this.connectionPools.get(serverKey);
    if (pool) {
      await pool.close();
      this.connectionPools.delete(serverKey);
    }
  }

  // Close all connections
  public async closeAllConnections(): Promise<void> {
    const closePromises = Array.from(this.connectionPools.entries()).map(
      async ([key, pool]) => {
        try {
          await pool.close();
        } catch (error) {
          console.error(`Error closing connection ${key}:`, error);
        }
      }
    );
    
    await Promise.all(closePromises);
    this.connectionPools.clear();
  }

  // Test connection to a specific server
  public async testConnection(serverKey: string, config: DatabaseConfig): Promise<boolean> {
    try {
      const pool = await this.getPool(serverKey, config);
      const request = pool.request();
      await request.query('SELECT 1 as test');
      return true;
    } catch (error) {
      console.error(`Connection test failed for ${serverKey}:`, error);
      return false;
    }
  }

  // Get connection status for all pools
  public getConnectionStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    this.connectionPools.forEach((pool, key) => {
      status[key] = pool.connected;
    });
    return status;
  }
}

// Export singleton instance
export const multiDb = MultiDatabaseManager.getInstance();

// Convenience functions
export const getPrimaryPool = () => multiDb.getPrimaryPool();
export const getDepartmentPool = (serverName: string) => multiDb.getDepartmentPool(serverName);
export const getStudentPool = (serverName: string) => multiDb.getStudentPool(serverName);
export const closeAllConnections = () => multiDb.closeAllConnections();
export const testDepartmentConnection = (serverName: string) => {
  const config = createDepartmentConfig(serverName);
  return multiDb.testConnection(serverName, config);
};

// Department server mapping based on VIEW_FRAGMENT_LIST results
export const mapServerNameToDepartment = (serverName: string): string => {
  const serverMap: Record<string, string> = {
    'MSI\\MSSQLSERVER1': 'IT',
    'MSI\\MSSQLSERVER2': 'Telecommunications', 
    'MSI\\MSSQLSERVER3': 'Accounting'
  };
  return serverMap[serverName] || serverName;
};

// Get server name from department
export const getDepartmentServerName = (departmentName: string): string => {
  const departmentMap: Record<string, string> = {
    'IT': 'MSI\\MSSQLSERVER1',
    'Telecommunications': 'MSI\\MSSQLSERVER2',
    'Accounting': 'MSI\\MSSQLSERVER3'
  };
  return departmentMap[departmentName] || departmentName;
};

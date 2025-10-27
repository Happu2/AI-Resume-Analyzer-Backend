    import 'dotenv/config.js'; // Ensure .env is loaded
    import pg from 'pg'; // Use named import for Pool

    // Destructure Pool from the pg import
    const { Pool } = pg;

    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      console.error("ERROR: DATABASE_URL is not set in your .env file.");
      console.error("Please set it in backend/.env");
      console.error("Example: DATABASE_URL=\"postgresql://user:pass@host:5432/dbname\"");
      console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      process.exit(1); // Exit if connection string is missing
    }

    // --- SSL Configuration ---
    // Enable SSL if the connection string suggests it's needed (e.g., for Render external URL)
    // Render URLs often include '?ssl=true' or are known to require it externally.
    const sslConfig = connectionString.includes('render.com') || connectionString.includes('ssl=true')
      ? { ssl: { rejectUnauthorized: false } } // Use SSL, allow self-signed certs (common on cloud DBs)
      : {}; // Don't use SSL for local connections
    // --- End SSL Configuration ---

    const pool = new Pool({
      connectionString: connectionString,
      ...sslConfig // Spread the SSL config into the Pool options
    });

    // Test the connection (optional, but good for debugging)
    pool.connect((err, client, release) => {
      if (err) {
        console.error('Error acquiring client for DB connection test:', err.stack);
      } else if (client) {
        console.log('Database connection successful (test connection).');
        client.release();
      } else {
        console.error('Failed to acquire client for DB connection test, but no error thrown.');
      }
    });

    // Export the pool object directly
    export default pool;


    


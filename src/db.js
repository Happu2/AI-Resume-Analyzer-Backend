    import 'dotenv/config.js'; 
    import pg from 'pg'; 
    const { Pool } = pg;

    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      console.error("ERROR: DATABASE_URL is not set in your .env file.");
      console.error("Please set it in backend/.env");
      console.error("Example: DATABASE_URL=\"postgresql://user:pass@host:5432/dbname\"");
      console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      process.exit(1); 
    }
    const sslConfig = connectionString.includes('render.com') || connectionString.includes('ssl=true')
      ? { ssl: { rejectUnauthorized: false } } 
      : {}; 

    const pool = new Pool({
      connectionString: connectionString,
      ...sslConfig 
    });

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
    export default pool;


    


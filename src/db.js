import { Sequelize } from "sequelize";

export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Neon PostgreSQL connected");
  } catch (error) {
    console.error("Neon DB connection failed:", error);
    process.exit(1);
  }
};
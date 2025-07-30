import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false, // Disable query logging
  }
);

// 🔄 Sync all models to the database
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL Connected");

    // Sync models (create tables if they don't exist)
    await sequelize.sync({ alter: true });  // ✅ Ensures tables exist and updates schema

    console.log("✅ Database Synced");
  } catch (error) {
    console.error("❌ DB Connection Error:", error);
    process.exit(1); // Exit process if connection fails
  }
};

connectDB();

export default sequelize;
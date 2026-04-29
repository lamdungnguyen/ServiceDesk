/**
 * Script tạo tài khoản Admin
 * Chạy: node src/db/scripts/create-admin.js
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../../../.env") });

const sequelize = require("../../config/database");
const { initModels, Employee } = require("../models");

async function createAdmin() {
  try {
    await sequelize.authenticate();
    initModels();
    console.log("Connected to database.");

    const [admin, created] = await Employee.findOrCreate({
      where: { email: "myblt@falcongames.com" },
      defaults: {
        name: "myblt",
        email: "myblt@falcongames.com",
        password: "12345678",
        role: "admin",
        team: "Admin",
        supportsAllGames: true,
        allowedGameIds: [],
      },
    });

    if (created) {
      console.log("✅ Admin account created successfully!");
    } else {
      // Update existing account
      admin.password = "12345678";
      admin.role = "admin";
      admin.name = "myblt";
      admin.team = "Admin";
      admin.supportsAllGames = true;
      admin.allowedGameIds = [];
      await admin.save();
      console.log("✅ Admin account already existed — updated password & role.");
    }

    console.log("   Name:     myblt");
    console.log("   Email:    myblt@falcongames.com");
    console.log("   Password: 12345678");
    console.log("   Role:     admin");

    await sequelize.close();
  } catch (error) {
    console.error("❌ Failed to create admin:", error.message);
    process.exit(1);
  }
}

createAdmin();

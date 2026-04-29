/**
 * Script tạo tài khoản User (Agent)
 * Chạy: node src/db/scripts/create-user.js
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../../../.env") });

const sequelize = require("../../config/database");
const { initModels, Employee } = require("../models");

async function createUser() {
  try {
    await sequelize.authenticate();
    initModels();
    console.log("Connected to database.");

    // Tạo tài khoản Le Linh
    const [linh, linhCreated] = await Employee.findOrCreate({
      where: { name: "Le Linh" },
      defaults: {
        name: "Le Linh",
        email: "le.linh@falcongames.com",
        password: "12345678",
        role: "customer_care_agent",
        team: "Vietnam Care",
        supportsAllGames: true,
        allowedGameIds: [],
      },
    });

    if (linhCreated) {
      console.log("✅ Le Linh account created successfully!");
    } else {
      // Update existing account
      linh.password = "12345678";
      linh.role = "customer_care_agent";
      linh.email = "le.linh@falcongames.com";
      linh.team = "Vietnam Care";
      linh.supportsAllGames = true;
      linh.allowedGameIds = [];
      await linh.save();
      console.log("✅ Le Linh account already existed — updated password & role.");
    }

    // Tạo tài khoản James Carter
    const [james, jamesCreated] = await Employee.findOrCreate({
      where: { name: "James Carter" },
      defaults: {
        name: "James Carter",
        email: "james.carter@falcongames.com",
        password: "12345678",
        role: "customer_care_agent",
        team: "Global Care",
        supportsAllGames: true,
        allowedGameIds: [],
      },
    });

    if (jamesCreated) {
      console.log("✅ James Carter account created successfully!");
    } else {
      // Update existing account
      james.password = "12345678";
      james.role = "customer_care_agent";
      james.email = "james.carter@falcongames.com";
      james.team = "Global Care";
      james.supportsAllGames = true;
      james.allowedGameIds = [];
      await james.save();
      console.log("✅ James Carter account already existed — updated password & role.");
    }

    console.log("\n📋 User Accounts:");
    console.log("   Name:     Le Linh");
    console.log("   Email:    le.linh@falcongames.com");
    console.log("   Password: 12345678");
    console.log("   Role:     customer_care_agent");
    console.log("   Team:     Vietnam Care");
    console.log("");
    console.log("   Name:     James Carter");
    console.log("   Email:    james.carter@falcongames.com");
    console.log("   Password: 12345678");
    console.log("   Role:     customer_care_agent");
    console.log("   Team:     Global Care");

    await sequelize.close();
  } catch (error) {
    console.error("❌ Failed to create user accounts:", error.message);
  }
}

createUser();
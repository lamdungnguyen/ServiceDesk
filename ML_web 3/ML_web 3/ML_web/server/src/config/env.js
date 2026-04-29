const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: process.env.DOTENV_CONFIG_PATH || path.resolve(__dirname, "../../../.env")
});

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 8080),
  mlServiceUrl: process.env.ML_SERVICE_URL || "http://localhost:8000",
  jwtSecret: process.env.JWT_SECRET || "change_this_secret",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    name: process.env.DB_NAME || "ml_web",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password",
    dialect: process.env.DB_DIALECT || "mysql"
  }
};

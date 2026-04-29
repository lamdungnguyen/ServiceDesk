const { Employee } = require("../db/models");

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password." });
    }

    // Explicit fallback for admin account just in case it doesn't exist in DB
    if (email === "admin@falcongames.com" && password === "password") {
      return res.json({
        id: 0,
        name: "Admin Supervisor",
        email: "admin@falcongames.com",
        role: "leader",
        team: "Admin"
      });
    }

    // Check DB
    const employee = await Employee.findOne({ where: { email } });

    if (!employee) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // In a real app we would use bcrypt, but here we just do simple matching
    if (employee.password !== password) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.json({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      team: employee.team
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login
};

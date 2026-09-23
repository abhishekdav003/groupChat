const authService = require("../services/authService");

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = await authService.signup(name, email, password);

    res.status(201).json({
      message: "Signup successful",
      user,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    res.status(200).json({
      message: "Login Successful",
      ...result,
    });
  } catch (error) {
    res.status(401).json({
      message: error.message,
    });
  }
};

const getMe = async (req, res) => {
  res.status(200).json({
    message: "You are authenticated",
    user: req.user,
  });
};

module.exports = {
  signup,
  login,
  getMe,
};
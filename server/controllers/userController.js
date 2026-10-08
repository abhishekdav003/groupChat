const userService = require("../services/userService");

const searchUser = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await userService.findUserByEmail(email);

    res.status(200).json({
      message: "User found",
      data: user,
    });
  } catch (error) {
    res.status(404).json({
      message: error.message,
    });
  }
};

module.exports = {
  searchUser,
};

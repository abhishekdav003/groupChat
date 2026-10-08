const User = require("../models/User");

const findUserByEmail = async (email) => {
  const user = await User.findOne({
    where: { email },
    attributes: ["id", "name", "email"],
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

module.exports = {
  findUserByEmail,
};

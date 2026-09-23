const bcrypt = require("bcrypt")
const User = require("../models/User")
const jwt = require("jsonwebtoken")

const signup = async (name, email, password) => {
  const existingUser = await User.findOne({
    where:{email}
  })

  if (existingUser) {
    throw new Error("Email already registered")
  }  

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await User.create({
    name,
    email,
    password:hashedPassword
  })

  return {
    id: user.id,
    name: user.name,
    email:user.email
  }
}

const login = async (email, password) => {
  const user = await User.findOne({
    where: {email}
  })

  if (!user) {
    throw new Error("Invalid email or password")
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password)

  if (!isPasswordCorrect) {
    throw new Error("Invalid email or password")
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn:"1d"
    }
  )

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email:user.email
    }
  }
}

module.exports = {
  signup,
  login
}


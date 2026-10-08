const express = require("express");

const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/search", authMiddleware, userController.searchUser);

module.exports = router;

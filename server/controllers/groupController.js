
const groupService = require("../services/groupService");

const createGroup = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Group name is required",
      });
    }

    const group = await groupService.createGroup(
      name,
      req.user.id
    );

    res.status(201).json({
      message: "Group created successfully",
      data: group,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getUserGroups = async (req, res) => {
  try {
    const groups = await groupService.getUserGroups(
      req.user.id
    );

    res.status(200).json({
      message: "Groups fetched successfully",
      data: groups,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        message: "Member email is required",
      });
    }

    const member = await groupService.addMember(
      groupId,
      email,
      req.user.id
    );

    res.status(201).json({
      message: "Member added successfully",
      data: member,
    });
  } catch (error) {
    const statusCode =
      error.message === "Group not found" ||
      error.message === "User not found"
        ? 404
        : error.message.includes("Only group admins") ||
          error.message.includes("already a group member")
        ? 403
        : 500;

    res.status(statusCode).json({
      message: error.message,
    });
  }
};

module.exports = {
  createGroup,
  getUserGroups,
  addMember,
};
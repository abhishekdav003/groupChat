const createRoomId = (userId1, userId2) => {
  const ids = [userId1, userId2].sort((a, b) => a - b);

  return `private_${ids[0]}_${ids[1]}`;
};

module.exports = createRoomId;

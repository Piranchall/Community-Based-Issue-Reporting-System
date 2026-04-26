// Temporary no-op notification service to keep routes operational until
// a dedicated Notification model and persistence layer are implemented.

const notFoundError = () => {
  const err = new Error("Notification feature is not configured yet");
  err.status = 404;
  return err;
};

async function listNotifications(_userId) {
  return [];
}

async function getNotificationById(_id) {
  throw notFoundError();
}

async function markRead(_id, _userId) {
  throw notFoundError();
}

async function deleteNotification(_id, _userId) {
  throw notFoundError();
}

module.exports = {
  listNotifications,
  getNotificationById,
  markRead,
  deleteNotification
};

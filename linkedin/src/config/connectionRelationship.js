export function peerId(value) {
  return String(value?._id || value || "");
}

export function getRelationship(userId, {
  pendingIds = [],
  sentRequests = [],
  incomingRequests = [],
  profileConnected = false,
  connectionsHydrated = false,
} = {}) {
  const viewedId = String(userId || "");
  if (!viewedId) {
    return {
      status: "none",
      incomingRequest: null,
      isConnected: false,
      isOutgoingPending: false,
    };
  }

  const incomingRequest = (incomingRequests || []).find((row) => (
    row.status_accepted == null && peerId(row.userId) === viewedId
  )) || null;

  const reduxConnected = (sentRequests || []).some((row) => (
    row.status_accepted === true && peerId(row.connectionId) === viewedId
  )) || (incomingRequests || []).some((row) => (
    row.status_accepted === true && peerId(row.userId) === viewedId
  ));

  const isOutgoingPending = (pendingIds || []).some((id) => String(id) === viewedId)
    || (sentRequests || []).some((row) => (
      row.status_accepted == null && peerId(row.connectionId) === viewedId
    ));

  const isConnected = reduxConnected
    || (!connectionsHydrated && Boolean(profileConnected) && !incomingRequest && !isOutgoingPending);

  if (isConnected) {
    return {
      status: "connected",
      incomingRequest: null,
      isConnected: true,
      isOutgoingPending: false,
    };
  }
  if (incomingRequest) {
    return {
      status: "incoming",
      incomingRequest,
      isConnected: false,
      isOutgoingPending: false,
    };
  }
  if (isOutgoingPending) {
    return {
      status: "outgoing",
      incomingRequest: null,
      isConnected: false,
      isOutgoingPending: true,
    };
  }
  return {
    status: "none",
    incomingRequest: null,
    isConnected: false,
    isOutgoingPending: false,
  };
}

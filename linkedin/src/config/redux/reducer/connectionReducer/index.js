import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAllUsers,
  sendConnectionRequest,
  fetchSentRequests,
  fetchIncomingRequests,
  respondToRequest,
  removeConnection,
} from "@/config/redux/action/connectionAction";

const initialState = {
  users: [],
  sentRequests: [],
  incomingRequests: [],
  pendingIds: [],
  sentReady: false,
  incomingReady: false,
  isLoading: false,
  message: "",
};

const connectionSlice = createSlice({
  name: "connections",
  initialState,
  reducers: {
    clearConnections: () => initialState,
    clearConnectionMessage: (state) => {
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.message = action.payload?.message || "Failed to load users";
      })
      .addCase(sendConnectionRequest.fulfilled, (state, action) => {
        const connectionId = action.payload.connectionId;
        const connectionKey = String(connectionId);
        if (!state.pendingIds.some((id) => String(id) === connectionKey)) {
          state.pendingIds.push(connectionId);
        }
        const alreadySent = state.sentRequests.some((row) => (
          row.status_accepted == null && String(row.connectionId?._id || row.connectionId) === connectionKey
        ));
        if (!alreadySent) {
          const profile = state.users.find((entry) => String(entry.userId?._id) === connectionKey);
          state.sentRequests = [
            {
              _id: `pending-${connectionKey}`,
              status_accepted: null,
              createdAt: new Date().toISOString(),
              connectionId: profile?.userId || connectionId,
            },
            ...state.sentRequests,
          ];
        }
        state.message = action.payload.message;
      })
      .addCase(sendConnectionRequest.rejected, (state, action) => {
        state.message = action.payload?.message || "Request failed";
      })
      .addCase(fetchSentRequests.fulfilled, (state, action) => {
        state.sentRequests = action.payload;
        state.pendingIds = action.payload
          .filter((r) => r.status_accepted == null)
          .map((r) => r.connectionId?._id || r.connectionId);
        state.sentReady = true;
      })
      .addCase(fetchIncomingRequests.fulfilled, (state, action) => {
        state.incomingRequests = action.payload;
        state.incomingReady = true;
      })
      .addCase(respondToRequest.fulfilled, (state, action) => {
        const requestId = String(action.payload?.requestId || action.payload || "");
        const accepted = action.payload?.action_type === "accept";
        state.incomingRequests = state.incomingRequests.map((row) => (
          String(row._id) === requestId
            ? { ...row, status_accepted: accepted, acceptedAt: accepted ? new Date().toISOString() : null }
            : row
        ));
        state.message = "Request updated";
      })
      .addCase(removeConnection.fulfilled, (state, action) => {
        const removedId = String(action.payload.userId);
        state.sentRequests = state.sentRequests.filter((row) => {
          if (row.status_accepted !== true) return true;
          return String(row.connectionId?._id || row.connectionId) !== removedId;
        });
        state.incomingRequests = state.incomingRequests.filter((row) => {
          if (row.status_accepted !== true) return true;
          return String(row.userId?._id || row.userId) !== removedId;
        });
        state.message = action.payload.message || "Connection removed";
      })
      .addCase(removeConnection.rejected, (state, action) => {
        state.message = action.payload?.message || "Failed to remove connection";
      });
  },
});

export const { clearConnections, clearConnectionMessage } = connectionSlice.actions;
export default connectionSlice.reducer;

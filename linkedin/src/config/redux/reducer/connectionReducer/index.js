import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAllUsers,
  sendConnectionRequest,
  fetchSentRequests,
  fetchIncomingRequests,
  respondToRequest,
} from "@/config/redux/action/connectionAction";

const initialState = {
  users: [],
  sentRequests: [],
  incomingRequests: [],
  pendingIds: [],
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
        state.pendingIds.push(action.payload.connectionId);
        state.message = action.payload.message;
      })
      .addCase(sendConnectionRequest.rejected, (state, action) => {
        state.message = action.payload?.message || "Request failed";
      })
      .addCase(fetchSentRequests.fulfilled, (state, action) => {
        state.sentRequests = action.payload;
        state.pendingIds = action.payload.map((r) => r.connectionId?._id || r.connectionId);
      })
      .addCase(fetchIncomingRequests.fulfilled, (state, action) => {
        state.incomingRequests = action.payload;
      })
      .addCase(respondToRequest.fulfilled, (state) => {
        state.message = "Request updated";
      });
  },
});

export const { clearConnections, clearConnectionMessage } = connectionSlice.actions;
export default connectionSlice.reducer;

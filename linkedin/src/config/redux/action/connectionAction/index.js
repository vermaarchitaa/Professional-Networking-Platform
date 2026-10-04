import { clientServer } from "@/config";
import { getToken } from "@/config/utils";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchAllUsers = createAsyncThunk("connections/fetchUsers", async (_, thunkAPI) => {
  try {
    const response = await clientServer.get("/user/get_all_users", {
      params: { token: getToken() },
    });
    return response.data.profiles;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to load users" });
  }
});

export const sendConnectionRequest = createAsyncThunk(
  "connections/sendRequest",
  async (connectionId, thunkAPI) => {
    try {
      const response = await clientServer.post("/user/send_connection_request", {
        token: getToken(),
        connectionId,
      });
      thunkAPI.dispatch(fetchSentRequests());
      thunkAPI.dispatch(fetchIncomingRequests());
      return { connectionId, message: response.data.message };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to send request" });
    }
  }
);

export const fetchSentRequests = createAsyncThunk("connections/fetchSent", async (_, thunkAPI) => {
  try {
    const response = await clientServer.post("/user/getConnectionRequests", { token: getToken() });
    return response.data.connections;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to load sent requests" });
  }
});

export const fetchIncomingRequests = createAsyncThunk("connections/fetchIncoming", async (_, thunkAPI) => {
  try {
    const response = await clientServer.get("/user/user_connection_request", {
      params: { token: getToken() },
    });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to load incoming requests" });
  }
});

export const respondToRequest = createAsyncThunk(
  "connections/respond",
  async ({ requestId, action_type }, thunkAPI) => {
    try {
      await clientServer.post("/user/accept_connection_request", {
        token: getToken(),
        requestId,
        action_type,
      });
      thunkAPI.dispatch(fetchIncomingRequests());
      thunkAPI.dispatch(fetchSentRequests());
      const incoming = thunkAPI.getState().connections.incomingRequests || [];
      const row = incoming.find((item) => String(item._id) === String(requestId));
      return {
        requestId,
        action_type,
        userId: row?.userId?._id || row?.userId || "",
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to respond to request" });
    }
  }
);

export const removeConnection = createAsyncThunk(
  "connections/remove",
  async (userId, thunkAPI) => {
    try {
      const response = await clientServer.post("/user/remove_connection", {
        token: getToken(),
        userId,
      });
      thunkAPI.dispatch(fetchSentRequests());
      thunkAPI.dispatch(fetchIncomingRequests());
      return { userId, message: response.data.message };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to remove connection" });
    }
  }
);

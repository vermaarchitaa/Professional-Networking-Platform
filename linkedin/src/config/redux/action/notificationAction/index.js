import { clientServer } from "@/config";
import { getToken } from "@/config/utils";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchAll",
  async (_, thunkAPI) => {
    try {
      const response = await clientServer.get("/notifications", {
        params: { token: getToken() },
      });
      return response.data.notifications;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to load notifications" });
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  "notifications/fetchUnreadCount",
  async (_, thunkAPI) => {
    try {
      const response = await clientServer.get("/notifications/unread_count", {
        params: { token: getToken() },
      });
      return response.data.count;
    } catch (error) {
      return thunkAPI.rejectWithValue({ count: 0 });
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllRead",
  async (_, thunkAPI) => {
    try {
      await clientServer.post("/notifications/mark_read", { token: getToken() });
      thunkAPI.dispatch(fetchUnreadCount());
      return true;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data);
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  "notifications/markRead",
  async (notificationId, thunkAPI) => {
    try {
      await clientServer.post("/notifications/mark_read", {
        token: getToken(),
        notificationId,
      });
      return notificationId;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data);
    }
  }
);

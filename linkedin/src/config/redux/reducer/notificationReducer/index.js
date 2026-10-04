import { createSlice } from "@reduxjs/toolkit";
import {
  fetchNotifications,
  fetchUnreadCount,
  fetchNewPostCount,
  markAllNotificationsRead,
  markNewPostsSeen,
  markNotificationRead,
} from "@/config/redux/action/notificationAction";

const initialState = {
  items: [],
  unreadCount: 0,
  newPostCount: 0,
  isLoading: false,
  isOpen: false,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    clearNotifications: () => initialState,
    toggleNotificationPanel: (state) => {
      state.isOpen = !state.isOpen;
    },
    closeNotificationPanel: (state) => {
      state.isOpen = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        state.unreadCount = action.payload.filter((n) => !n.read).length;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items = state.items.map((n) => ({ ...n, read: true }));
        state.unreadCount = 0;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const item = state.items.find((n) => n._id === action.payload);
        if (item && !item.read) {
          item.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(fetchNewPostCount.fulfilled, (state, action) => {
        state.newPostCount = action.payload;
      })
      .addCase(markNewPostsSeen.fulfilled, (state) => {
        state.newPostCount = 0;
      });
  },
});

export const { clearNotifications, toggleNotificationPanel, closeNotificationPanel } =
  notificationSlice.actions;
export default notificationSlice.reducer;

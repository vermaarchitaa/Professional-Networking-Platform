import { clientServer } from "@/config";
import { getToken } from "@/config/utils";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchConversations = createAsyncThunk("messages/fetchConversations", async (_, thunkAPI) => {
  try {
    const response = await clientServer.get("/messages/conversations", {
      params: { token: getToken() },
    });
    return response.data.conversations || [];
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to load conversations" });
  }
});

export const fetchConversationMessages = createAsyncThunk(
  "messages/fetchConversation",
  async (conversationId, thunkAPI) => {
    try {
      const response = await clientServer.get(`/messages/${conversationId}`, {
        params: { token: getToken() },
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to load messages" });
    }
  }
);

export const sendChatMessage = createAsyncThunk(
  "messages/send",
  async ({ receiverId, text, file, giftId, stickerId, gifUrl, profileUserId, shareUsername }, thunkAPI) => {
    try {
      const payload = file
        ? (() => {
          const formData = new FormData();
          formData.append("token", getToken());
          formData.append("receiverId", receiverId);
          if (text) formData.append("text", text);
          if (giftId) formData.append("giftId", giftId);
          if (stickerId) formData.append("stickerId", stickerId);
          if (gifUrl) formData.append("gifUrl", gifUrl);
          if (profileUserId) formData.append("profileUserId", profileUserId);
          if (shareUsername) formData.append("shareUsername", shareUsername);
          formData.append("file", file);
          return formData;
        })()
        : {
          token: getToken(),
          receiverId,
          text: text || "",
          ...(giftId ? { giftId } : {}),
          ...(stickerId ? { stickerId } : {}),
          ...(gifUrl ? { gifUrl } : {}),
          ...(profileUserId ? { profileUserId } : {}),
          ...(shareUsername ? { shareUsername } : {}),
        };

      const response = await clientServer.post("/messages/send", payload, file
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : undefined);
      thunkAPI.dispatch(fetchMessageUnreadCount());
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to send message" });
    }
  }
);

export const markConversationRead = createAsyncThunk(
  "messages/markRead",
  async (conversationId, thunkAPI) => {
    try {
      await clientServer.patch(`/messages/${conversationId}/read`, { token: getToken() });
      thunkAPI.dispatch(fetchMessageUnreadCount());
      return conversationId;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to mark as read" });
    }
  }
);

export const fetchMessageUnreadCount = createAsyncThunk("messages/unreadCount", async (_, thunkAPI) => {
  try {
    const response = await clientServer.get("/messages/unread_count", {
      params: { token: getToken() },
    });
    return Number(response.data.count || 0);
  } catch (error) {
    return thunkAPI.rejectWithValue({ count: 0 });
  }
});

export const fetchShareProfile = createAsyncThunk("messages/fetchShareProfile", async (userKey, thunkAPI) => {
  try {
    const response = await clientServer.get(`/messages/share_profile/${userKey}`, {
      params: { token: getToken() },
    });
    return response.data.profile;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Profile not found" });
  }
});

export const fetchMessageRecipients = createAsyncThunk("messages/fetchRecipients", async (_, thunkAPI) => {
  try {
    const response = await clientServer.get("/messages/recipients", {
      params: { token: getToken() },
    });
    return response.data.recipients || [];
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to load connections" });
  }
});

export const fetchMessagingPeer = createAsyncThunk("messages/fetchPeer", async (userId, thunkAPI) => {
  try {
    const response = await clientServer.get(`/messages/peer/${userId}`, {
      params: { token: getToken() },
    });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "You can only message accepted connections" });
  }
});

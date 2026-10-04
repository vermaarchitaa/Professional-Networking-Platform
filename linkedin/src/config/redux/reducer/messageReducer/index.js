import { createSlice } from "@reduxjs/toolkit";
import {
  fetchConversations,
  fetchConversationMessages,
  sendChatMessage,
  markConversationRead,
  fetchMessageUnreadCount,
  fetchMessagingPeer,
} from "@/config/redux/action/messageAction";

const initialState = {
  conversations: [],
  activeConversationId: "",
  activePeer: null,
  messages: [],
  unreadCount: 0,
  loading: false,
  sending: false,
  error: "",
  peerUnavailable: false,
};

const messageSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    clearMessages: () => initialState,
    setActiveConversation: (state, action) => {
      state.activeConversationId = action.payload || "";
      state.error = "";
      state.peerUnavailable = false;
    },
    clearActiveConversation: (state) => {
      state.activeConversationId = "";
      state.activePeer = null;
      state.messages = [];
      state.error = "";
      state.peerUnavailable = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to load conversations";
      })
      .addCase(fetchConversationMessages.pending, (state) => {
        state.loading = true;
        state.error = "";
        state.peerUnavailable = false;
      })
      .addCase(fetchConversationMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.activeConversationId = action.payload.conversationId;
        state.activePeer = action.payload.peer;
        state.messages = action.payload.messages || [];
        state.peerUnavailable = false;
      })
      .addCase(fetchConversationMessages.rejected, (state, action) => {
        state.loading = false;
        state.messages = [];
        state.peerUnavailable = true;
        state.error = action.payload?.message || "Failed to load messages";
      })
      .addCase(sendChatMessage.pending, (state) => {
        state.sending = true;
        state.error = "";
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.sending = false;
        const next = action.payload.message;
        const conversationId = action.payload.conversationId;
        state.activeConversationId = conversationId;
        if (next) state.messages.push(next);
        const peer = state.activePeer;
        const existing = state.conversations.find((row) => row.conversationId === conversationId);
        const preview = {
          conversationId,
          peer,
          lastMessage: next
            ? {
              _id: next._id,
              text: next.text,
              messageType: next.messageType || "text",
              attachment: next.attachment || null,
              createdAt: next.createdAt,
              senderId: next.senderId?._id || next.senderId,
              read: next.read,
            }
            : existing?.lastMessage,
          unreadCount: 0,
        };
        state.conversations = [
          preview,
          ...state.conversations.filter((row) => row.conversationId !== conversationId),
        ];
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.sending = false;
        state.error = action.payload?.message || "Failed to send message";
      })
      .addCase(markConversationRead.fulfilled, (state, action) => {
        const conversationId = action.payload;
        state.conversations = state.conversations.map((row) => (
          row.conversationId === conversationId ? { ...row, unreadCount: 0 } : row
        ));
        state.messages = state.messages.map((item) => ({ ...item, read: true }));
      })
      .addCase(fetchMessageUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(fetchMessagingPeer.pending, (state) => {
        state.peerUnavailable = false;
        state.error = "";
      })
      .addCase(fetchMessagingPeer.fulfilled, (state, action) => {
        state.activePeer = action.payload.peer;
        state.activeConversationId = action.payload.conversationId || "";
        state.peerUnavailable = false;
        if (!action.payload.hasMessages) state.messages = [];
      })
      .addCase(fetchMessagingPeer.rejected, (state, action) => {
        state.activePeer = null;
        state.messages = [];
        state.peerUnavailable = true;
        state.error = action.payload?.message || "You can only message accepted connections";
      });
  },
});

export const { clearMessages, setActiveConversation, clearActiveConversation } = messageSlice.actions;
export default messageSlice.reducer;

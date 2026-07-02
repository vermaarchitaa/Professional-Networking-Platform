import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./reducer/authReducer";
import postReducer from "./reducer/postReducer";
import profileReducer from "./reducer/profileReducer";
import connectionReducer from "./reducer/connectionReducer";
import notificationReducer from "./reducer/notificationReducer";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postReducer,
    profile: profileReducer,
    connections: connectionReducer,
    notifications: notificationReducer,
  },
});

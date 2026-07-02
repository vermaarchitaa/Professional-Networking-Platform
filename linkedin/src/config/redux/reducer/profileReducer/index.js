import { createSlice } from "@reduxjs/toolkit";
import {
  fetchUserProfile,
  updateProfileData,
  updateUserInfo,
  uploadProfilePicture,
} from "@/config/redux/action/profileAction";

const initialState = {
  profile: null,
  isLoading: false,
  isError: false,
  message: "",
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    clearProfile: () => initialState,
    clearProfileMessage: (state) => {
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload?.message || "Failed to load profile";
      })
      .addCase(updateProfileData.fulfilled, (state, action) => {
        state.message = action.payload?.message || "Profile updated";
      })
      .addCase(updateProfileData.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload?.message || "Update failed";
      })
      .addCase(updateUserInfo.fulfilled, (state, action) => {
        state.message = action.payload?.message || "User updated";
      })
      .addCase(uploadProfilePicture.fulfilled, (state, action) => {
        state.message = action.payload?.message || "Picture updated";
      });
  },
});

export const { clearProfile, clearProfileMessage } = profileSlice.actions;
export default profileSlice.reducer;

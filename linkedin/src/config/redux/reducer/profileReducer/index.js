import { createSlice } from "@reduxjs/toolkit";
import {
  fetchUserProfile,
  updateProfileData,
  updateUserInfo,
  uploadProfilePicture,
  deleteProfilePicture,
  updateProfilePhotoVisibility,
  updateProfilePictureFrame,
  uploadCoverPicture,
  deleteCoverPicture,
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
      })
      .addCase(deleteProfilePicture.fulfilled, (state, action) => {
        state.message = action.payload?.message || "Profile picture deleted";
      })
      .addCase(deleteProfilePicture.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload?.message || "Failed to delete profile picture";
      })
      .addCase(updateProfilePhotoVisibility.fulfilled, (state, action) => {
        state.message = action.payload?.message || "Visibility updated";
      })
      .addCase(updateProfilePhotoVisibility.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload?.message || "Failed to update visibility";
      })
      .addCase(updateProfilePictureFrame.fulfilled, (state, action) => {
        state.message = action.payload?.message || "Frame updated";
      })
      .addCase(updateProfilePictureFrame.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload?.message || "Failed to update frame";
      })
      .addCase(uploadCoverPicture.fulfilled, (state, action) => {
        state.message = action.payload?.message || "Cover photo updated";
      })
      .addCase(uploadCoverPicture.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload?.message || "Failed to upload cover photo";
      })
      .addCase(deleteCoverPicture.fulfilled, (state, action) => {
        state.message = action.payload?.message || "Cover photo deleted";
      })
      .addCase(deleteCoverPicture.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload?.message || "Failed to delete cover photo";
      });
  },
});

export const { clearProfile, clearProfileMessage } = profileSlice.actions;
export default profileSlice.reducer;

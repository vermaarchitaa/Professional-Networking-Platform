import { createSlice } from "@reduxjs/toolkit";
import {
  fetchUserProfile,
  fetchProfileByUsername,
  updateProfileData,
  updateUserInfo,
  uploadProfilePicture,
  deleteProfilePicture,
  updateProfilePhotoVisibility,
  updateProfilePictureFrame,
  uploadCoverPicture,
  deleteCoverPicture,
  addProfileSkill,
  updateProfileSkill,
  deleteProfileSkill,
} from "@/config/redux/action/profileAction";
import { removeConnection, respondToRequest } from "@/config/redux/action/connectionAction";

function viewedUserId(profile) {
  return String(profile?.userId?._id || "");
}

function applyViewedRelationship(state, userId, { connected, countDelta = 0 }) {
  if (!state.viewedProfile || !userId) return;
  if (viewedUserId(state.viewedProfile) !== String(userId)) return;
  state.viewedProfile.isConnected = connected;
  const current = Number(state.viewedProfile.connectionsCount || 0);
  state.viewedProfile.connectionsCount = Math.max(0, current + countDelta);
}

const initialState = {
  profile: null,
  viewedProfile: null,
  viewedLoading: false,
  viewedError: "",
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
    clearViewedProfile: (state) => {
      state.viewedProfile = null;
      state.viewedLoading = false;
      state.viewedError = "";
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
      .addCase(fetchProfileByUsername.pending, (state) => {
        state.viewedLoading = true;
        state.viewedError = "";
      })
      .addCase(fetchProfileByUsername.fulfilled, (state, action) => {
        state.viewedLoading = false;
        state.viewedProfile = action.payload;
        state.viewedError = "";
      })
      .addCase(fetchProfileByUsername.rejected, (state, action) => {
        state.viewedLoading = false;
        state.viewedProfile = null;
        state.viewedError = action.payload?.message || "Profile not found";
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
      })
      .addCase(addProfileSkill.fulfilled, (state, action) => {
        state.message = action.payload?.message || "Skill added";
        if (action.payload?.skills && state.profile) state.profile.skills = action.payload.skills;
      })
      .addCase(addProfileSkill.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload?.message || "Failed to add skill";
      })
      .addCase(updateProfileSkill.fulfilled, (state, action) => {
        state.message = action.payload?.message || "Skill updated";
        if (action.payload?.skills && state.profile) state.profile.skills = action.payload.skills;
      })
      .addCase(updateProfileSkill.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload?.message || "Failed to update skill";
      })
      .addCase(deleteProfileSkill.fulfilled, (state, action) => {
        state.message = action.payload?.message || "Skill deleted";
        if (action.payload?.skills && state.profile) state.profile.skills = action.payload.skills;
      })
      .addCase(deleteProfileSkill.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload?.message || "Failed to delete skill";
      })
      .addCase(respondToRequest.fulfilled, (state, action) => {
        if (action.payload?.action_type === "accept") {
          applyViewedRelationship(state, action.payload.userId, { connected: true, countDelta: 1 });
        } else {
          applyViewedRelationship(state, action.payload.userId, { connected: false });
        }
      })
      .addCase(removeConnection.fulfilled, (state, action) => {
        applyViewedRelationship(state, action.payload.userId, { connected: false, countDelta: -1 });
      });
  },
});

export const { clearProfile, clearProfileMessage, clearViewedProfile } = profileSlice.actions;
export default profileSlice.reducer;

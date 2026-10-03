import { clientServer } from "@/config";
import { getToken } from "@/config/utils";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchUserProfile = createAsyncThunk("profile/fetch", async (_, thunkAPI) => {
  try {
    const response = await clientServer.post("/get_user_and_profile", { token: getToken() });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to load profile" });
  }
});

export const fetchProfileByUsername = createAsyncThunk("profile/fetchByUsername", async (username, thunkAPI) => {
  try {
    const response = await clientServer.post("/get_profile_by_username", {
      token: getToken(),
      username,
    });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Profile not found" });
  }
});

export const updateProfileData = createAsyncThunk("profile/update", async (profileData, thunkAPI) => {
  try {
    const response = await clientServer.post("/update_profile_data", {
      token: getToken(),
      ...profileData,
    });
    thunkAPI.dispatch(fetchUserProfile());
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to update profile" });
  }
});

export const updateUserInfo = createAsyncThunk("profile/updateUser", async (userData, thunkAPI) => {
  try {
    const response = await clientServer.post("/user_update", {
      token: getToken(),
      ...userData,
    });
    thunkAPI.dispatch(fetchUserProfile());
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to update user" });
  }
});

export const uploadProfilePicture = createAsyncThunk("profile/uploadPicture", async (file, thunkAPI) => {
  try {
    const formData = new FormData();
    formData.append("token", getToken());
    formData.append("profile_picture", file);

    const response = await clientServer.post("/update_profile_picture", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    thunkAPI.dispatch(fetchUserProfile());
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to upload picture" });
  }
});

export const uploadCoverPicture = createAsyncThunk("profile/uploadCover", async (file, thunkAPI) => {
  try {
    const formData = new FormData();
    formData.append("token", getToken());
    formData.append("cover_picture", file);

    const response = await clientServer.post("/update_cover_picture", formData);
    thunkAPI.dispatch(fetchUserProfile());
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to upload cover photo" });
  }
});

export const deleteProfilePicture = createAsyncThunk("profile/deletePicture", async (_, thunkAPI) => {
  try {
    const response = await clientServer.post("/delete_profile_picture", { token: getToken() });
    thunkAPI.dispatch(fetchUserProfile());
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to delete profile picture" });
  }
});

export const updateProfilePhotoVisibility = createAsyncThunk(
  "profile/updatePhotoVisibility",
  async (profilePhotoVisibility, thunkAPI) => {
    try {
      const response = await clientServer.post("/update_profile_photo_visibility", {
        token: getToken(),
        profilePhotoVisibility,
      });
      thunkAPI.dispatch(fetchUserProfile());
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to update visibility" });
    }
  }
);

export const updateProfilePictureFrame = createAsyncThunk(
  "profile/updatePictureFrame",
  async (profilePictureFrame, thunkAPI) => {
    try {
      const response = await clientServer.post("/update_profile_picture_frame", {
        token: getToken(),
        profilePictureFrame,
      });
      thunkAPI.dispatch(fetchUserProfile());
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to update frame" });
    }
  }
);

export const deleteCoverPicture = createAsyncThunk("profile/deleteCover", async (_, thunkAPI) => {
  try {
    const response = await clientServer.post("/delete_cover_picture", { token: getToken() });
    thunkAPI.dispatch(fetchUserProfile());
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to delete cover photo" });
  }
});

export const uploadEducationMedia = createAsyncThunk("profile/uploadEducationMedia", async (file, thunkAPI) => {
  try {
    const formData = new FormData();
    formData.append("token", getToken());
    formData.append("media", file);
    const response = await clientServer.post("/upload_education_media", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to upload media" });
  }
});

export const downloadResume = createAsyncThunk("profile/downloadResume", async (userId, thunkAPI) => {
  try {
    const response = await clientServer.get("/user/download_resume", {
      params: { id: userId, token: getToken() },
    });
    const filename = response.data.message;
    window.open(`http://localhost:9090/${filename}`, "_blank");
    return filename;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to download resume" });
  }
});

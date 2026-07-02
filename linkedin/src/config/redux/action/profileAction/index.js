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

export const downloadResume = createAsyncThunk("profile/downloadResume", async (userId, thunkAPI) => {
  try {
    const response = await clientServer.get("/user/download_resume", { params: { id: userId } });
    const filename = response.data.message;
    window.open(`http://localhost:9090/${filename}`, "_blank");
    return filename;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to download resume" });
  }
});

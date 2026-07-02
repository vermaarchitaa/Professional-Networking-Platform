import { clientServer } from "@/config";
import { getToken } from "@/config/utils";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchPosts = createAsyncThunk("posts/fetchAll", async (_, thunkAPI) => {
  try {
    const response = await clientServer.get("/posts", {
      params: { token: getToken() },
    });
    return response.data.posts;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to load posts" });
  }
});

export const fetchTrendingPosts = createAsyncThunk("posts/fetchTrending", async (_, thunkAPI) => {
  try {
    const response = await clientServer.get("/posts/trending");
    return response.data.posts;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to load trending posts" });
  }
});

export const createPost = createAsyncThunk("posts/create", async ({ body, media }, thunkAPI) => {
  try {
    const formData = new FormData();
    formData.append("token", getToken());
    formData.append("body", body);
    if (media) formData.append("media", media);

    const response = await clientServer.post("/post", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to create post" });
  }
});

export const deletePost = createAsyncThunk("posts/delete", async (postId, thunkAPI) => {
  try {
    await clientServer.post("/delete_post", { token: getToken(), post_id: postId });
    return postId;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to delete post" });
  }
});

export const toggleLike = createAsyncThunk("posts/toggleLike", async (postId, thunkAPI) => {
  try {
    const response = await clientServer.post("/toggle_post_like", {
      token: getToken(),
      post_id: postId,
    });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to update like" });
  }
});

export const fetchComments = createAsyncThunk("posts/fetchComments", async (postId, thunkAPI) => {
  try {
    const response = await clientServer.get("/get_comments", { params: { post_id: postId } });
    return { postId, comments: response.data.comments || [] };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to load comments" });
  }
});

export const addComment = createAsyncThunk(
  "posts/addComment",
  async ({ postId, commentBody }, thunkAPI) => {
    try {
      await clientServer.post("/comment", {
        token: getToken(),
        post_id: postId,
        commentBody,
      });
      thunkAPI.dispatch(fetchComments(postId));
      return postId;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to add comment" });
    }
  }
);

export const deleteComment = createAsyncThunk(
  "posts/deleteComment",
  async ({ commentId, postId }, thunkAPI) => {
    try {
      await clientServer.delete("/delete_comment", {
        data: { token: getToken(), comment_id: commentId },
      });
      thunkAPI.dispatch(fetchComments(postId));
      return commentId;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to delete comment" });
    }
  }
);

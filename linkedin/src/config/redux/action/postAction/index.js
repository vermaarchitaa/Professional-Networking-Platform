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

export const createPost = createAsyncThunk("posts/create", async ({ body, mediaFiles, commentPermission }, thunkAPI) => {
  try {
    const formData = new FormData();
    formData.append("token", getToken());
    formData.append("body", body ?? "");
    if (commentPermission) formData.append("commentPermission", commentPermission);
    (mediaFiles || []).forEach((file) => {
      if (file) formData.append("media", file);
    });

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

export const updatePost = createAsyncThunk(
  "posts/update",
  async ({ postId, body, commentPermission, featured }, thunkAPI) => {
    try {
      const payload = { token: getToken(), post_id: postId };
      if (body !== undefined) payload.body = body;
      if (commentPermission !== undefined) payload.commentPermission = commentPermission;
      if (featured !== undefined) payload.featured = featured;
      const response = await clientServer.post("/update_post", payload);
      return response.data.post;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to update post" });
    }
  }
);

export const toggleLike = createAsyncThunk("posts/toggleLike", async (payload, thunkAPI) => {
  try {
    const postId = typeof payload === "string" ? payload : payload.postId;
    const reactionType = typeof payload === "string" ? "like" : payload.reactionType || "like";
    const response = await clientServer.post("/toggle_post_like", {
      token: getToken(),
      post_id: postId,
      reactionType,
    });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to update like" });
  }
});

export const toggleCommentLike = createAsyncThunk(
  "posts/toggleCommentLike",
  async ({ commentId, reactionType = "like" }, thunkAPI) => {
    try {
      const response = await clientServer.post("/toggle_comment_like", {
        token: getToken(),
        comment_id: commentId,
        reactionType,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to update comment reaction" });
    }
  }
);

export const fetchComments = createAsyncThunk("posts/fetchComments", async (postId, thunkAPI) => {
  try {
    const response = await clientServer.get("/get_comments", {
      params: { post_id: postId, token: getToken() },
    });
    return { postId, comments: response.data.comments || [] };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to load comments" });
  }
});

export const addComment = createAsyncThunk(
  "posts/addComment",
  async ({ postId, commentBody, parentCommentId, mediaFile, gifUrl }, thunkAPI) => {
    try {
      const formData = new FormData();
      formData.append("token", getToken());
      formData.append("post_id", postId);
      formData.append("commentBody", commentBody ?? "");
      if (parentCommentId) formData.append("parent_comment_id", parentCommentId);
      if (mediaFile) formData.append("media", mediaFile);
      if (gifUrl) formData.append("gifUrl", gifUrl);

      await clientServer.post("/comment", formData);
      thunkAPI.dispatch(fetchComments(postId));
      return postId;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to add comment" });
    }
  }
);

export const searchGifs = async (query) => {
  const response = await clientServer.get("/gifs", { params: { q: query } });
  return response.data;
};

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

export const savePost = createAsyncThunk("posts/save", async (postId, thunkAPI) => {
  try {
    const response = await clientServer.post("/save_post", {
      token: getToken(),
      post_id: postId,
    });
    return { postId, ...response.data };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to save post" });
  }
});

export const unsavePost = createAsyncThunk("posts/unsave", async (postId, thunkAPI) => {
  try {
    const response = await clientServer.post("/unsave_post", {
      token: getToken(),
      post_id: postId,
    });
    return { postId, ...response.data };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to unsave post" });
  }
});

export const fetchSavedPosts = createAsyncThunk("posts/fetchSaved", async (_, thunkAPI) => {
  try {
    const response = await clientServer.get("/saved_posts", {
      params: { token: getToken() },
    });
    return response.data.posts || [];
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to load saved posts" });
  }
});

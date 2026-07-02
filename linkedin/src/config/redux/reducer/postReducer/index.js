import { createSlice } from "@reduxjs/toolkit";
import {
  fetchPosts,
  createPost,
  deletePost,
  toggleLike,
  fetchComments,
  addComment,
} from "@/config/redux/action/postAction";

const initialState = {
  posts: [],
  comments: {},
  isLoading: false,
  isError: false,
  message: "",
};

const postSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    clearPostMessage: (state) => {
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts = action.payload;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload?.message || "Failed to load posts";
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.message = action.payload?.message || "Post created";
      })
      .addCase(createPost.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload?.message || "Failed to create post";
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter((p) => p._id !== action.payload);
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        const post = state.posts.find((p) => p._id === action.payload.postId);
        if (post) {
          post.likes = action.payload.likes;
          post.isLiked = action.payload.liked;
        }
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.comments[action.payload.postId] = action.payload.comments;
      })
      .addCase(addComment.rejected, (state, action) => {
        state.message = action.payload?.message || "Failed to add comment";
      });
  },
});

export const { clearPostMessage } = postSlice.actions;
export default postSlice.reducer;

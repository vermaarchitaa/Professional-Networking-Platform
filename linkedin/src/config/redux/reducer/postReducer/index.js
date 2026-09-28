import { createSlice } from "@reduxjs/toolkit";
import {
  fetchPosts,
  createPost,
  deletePost,
  updatePost,
  toggleLike,
  fetchComments,
  addComment,
  toggleCommentLike,
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
      .addCase(updatePost.fulfilled, (state, action) => {
        const updated = action.payload;
        if (!updated?._id) return;
        const index = state.posts.findIndex((p) => String(p._id) === String(updated._id));
        if (index >= 0) {
          state.posts[index] = { ...state.posts[index], ...updated };
        }
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        const post = state.posts.find((p) => p._id === action.payload.postId);
        if (post) {
          post.likes = action.payload.likes;
          post.isLiked = action.payload.liked;
          post.myReaction = action.payload.myReaction || null;
        }
      })
      .addCase(toggleCommentLike.fulfilled, (state, action) => {
        const list = state.comments[action.payload.postId];
        if (!list) return;
        const comment = list.find((item) => item._id === action.payload.commentId);
        if (comment) {
          comment.likes = action.payload.likes;
          comment.isLiked = action.payload.liked;
          comment.myReaction = action.payload.myReaction || null;
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

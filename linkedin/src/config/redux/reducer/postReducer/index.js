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
  savePost,
  unsavePost,
  fetchSavedPosts,
} from "@/config/redux/action/postAction";

const idOf = (value) => String(value);

const mergeSavedIds = (current, incoming) => {
  const next = new Set((current || []).map(idOf));
  (incoming || []).forEach((id) => next.add(idOf(id)));
  return Array.from(next);
};

const markPostSaved = (posts, postId, isSaved) => {
  const id = idOf(postId);
  (posts || []).forEach((post) => {
    if (idOf(post._id) === id) post.isSaved = isSaved;
  });
};

const initialState = {
  posts: [],
  comments: {},
  isLoading: false,
  isError: false,
  message: "",
  savedPosts: [],
  savedPostIds: [],
  savedPostsLoading: false,
  savedPostsError: "",
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
        const feedSavedIds = (action.payload || [])
          .filter((post) => post.isSaved)
          .map((post) => idOf(post._id));
        const feedIds = new Set((action.payload || []).map((post) => idOf(post._id)));
        const kept = state.savedPostIds.filter((id) => !feedIds.has(idOf(id)));
        state.savedPostIds = [...new Set([...kept, ...feedSavedIds])];
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
        const deletedId = idOf(action.payload);
        state.posts = state.posts.filter((p) => idOf(p._id) !== deletedId);
        state.savedPosts = state.savedPosts.filter((p) => idOf(p._id) !== deletedId);
        state.savedPostIds = state.savedPostIds.filter((id) => idOf(id) !== deletedId);
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        const updated = action.payload;
        if (!updated?._id) return;
        const apply = (list) => {
          const index = list.findIndex((p) => idOf(p._id) === idOf(updated._id));
          if (index >= 0) list[index] = { ...list[index], ...updated };
        };
        apply(state.posts);
        apply(state.savedPosts);
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        const apply = (post) => {
          if (idOf(post._id) !== idOf(action.payload.postId)) return;
          post.likes = action.payload.likes;
          post.isLiked = action.payload.liked;
          post.myReaction = action.payload.myReaction || null;
        };
        state.posts.forEach(apply);
        state.savedPosts.forEach(apply);
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
      })
      .addCase(savePost.fulfilled, (state, action) => {
        const postId = idOf(action.payload.postId);
        state.savedPostIds = mergeSavedIds(state.savedPostIds, [postId]);
        markPostSaved(state.posts, postId, true);
        markPostSaved(state.savedPosts, postId, true);
      })
      .addCase(unsavePost.fulfilled, (state, action) => {
        const postId = idOf(action.payload.postId);
        state.savedPostIds = state.savedPostIds.filter((id) => idOf(id) !== postId);
        state.savedPosts = state.savedPosts.filter((post) => idOf(post._id) !== postId);
        markPostSaved(state.posts, postId, false);
      })
      .addCase(fetchSavedPosts.pending, (state) => {
        state.savedPostsLoading = true;
        state.savedPostsError = "";
      })
      .addCase(fetchSavedPosts.fulfilled, (state, action) => {
        state.savedPostsLoading = false;
        state.savedPosts = action.payload || [];
        state.savedPostIds = (action.payload || []).map((post) => idOf(post._id));
        state.posts.forEach((post) => {
          post.isSaved = false;
        });
        (action.payload || []).forEach((post) => markPostSaved(state.posts, post._id, true));
      })
      .addCase(fetchSavedPosts.rejected, (state, action) => {
        state.savedPostsLoading = false;
        state.savedPostsError = action.payload?.message || "Failed to load saved posts";
      });
  },
});

export const { clearPostMessage } = postSlice.actions;
export default postSlice.reducer;

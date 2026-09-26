import { Router } from "express";
import { activeCheck, createPost, getAllPosts, getTrendingPosts, deletePost, commentPost, get_comments_by_post, delete_comment_of_user, toggleLike } from "../controllers/posts.controller.js";
import { postMediaUpload } from "../utils/uploads.js";

const router = Router();

router.route('/').get(activeCheck);
router.route("/post").post(postMediaUpload.single('media'), createPost)
router.route("/posts").get(getAllPosts)
router.route("/posts/trending").get(getTrendingPosts)
router.route("/delete_post").post(deletePost);
router.route("/comment").post(commentPost);
router.route("/get_comments").get(get_comments_by_post);
router.route("/delete_comment").delete(delete_comment_of_user);
router.route("/toggle_post_like").post(toggleLike);

export default router;
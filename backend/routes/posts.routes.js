import { Router } from "express";
import { activeCheck, createPost, getAllPosts, getTrendingPosts, deletePost, commentPost, get_comments_by_post, delete_comment_of_user, toggleLike, toggleCommentLike, searchGifs } from "../controllers/posts.controller.js";
import { postMediaUpload, commentImageUpload } from "../utils/uploads.js";

const router = Router();

router.route('/').get(activeCheck);
router.route("/post").post(postMediaUpload.array('media', 10), createPost)
router.route("/posts").get(getAllPosts)
router.route("/posts/trending").get(getTrendingPosts)
router.route("/delete_post").post(deletePost);
router.route("/comment").post(commentImageUpload.single("media"), commentPost);
router.route("/gifs").get(searchGifs);
router.route("/get_comments").get(get_comments_by_post);
router.route("/delete_comment").delete(delete_comment_of_user);
router.route("/toggle_post_like").post(toggleLike);
router.route("/toggle_comment_like").post(toggleCommentLike);

export default router;
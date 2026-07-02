import Post from "../models/posts.model.js";
import User from "../models/user.model.js";
import Comment from "../models/comments.model.js";
import { createNotification } from "../utils/notificationHelper.js";

export const activeCheck = async (req, res) => {
    return res.status(200).json({ message: "RUNNING" })
}

export const createPost = async (req, res) => {
    const { token } = req.body;

    try{

        const user = await User.findOne({ token: token });
        
        if(!user){
            return res.status(404).json({ message: "User not found"})
        }

        const post = new Post({
            userId: user._id,
            body: req.body.body,
            media: req.file != undefined ? req.file.filename : "",
            fileType: req.file != undefined ? req.file.mimetype.split("/")[1] : ""
        })

        await post.save();

        return res.status(200).json({ message: "Post Created" });

    } catch(error){
        return res.status(500).json({ message: error.message});
    }
}


export const getAllPosts = async (req, res) => {
    try {
        const token = req.query.token;
        let currentUserId = null;

        if (token) {
            const user = await User.findOne({ token }).select("_id");
            if (user) currentUserId = user._id.toString();
        }

        const posts = await Post.find()
            .populate('userId', 'name username email profilePicture')
            .sort({ createdAt: -1 });

        const postsWithLikeStatus = posts.map((post) => {
            const postObj = post.toObject();
            const isLiked = currentUserId
                ? post.likedBy.some((id) => id.toString() === currentUserId)
                : false;
            return { ...postObj, isLiked };
        });

        return res.json({ posts: postsWithLikeStatus })
    } catch(error){
        return res.status(500).json({ message: error.message});
    }
}

export const getTrendingPosts = async (req, res) => {
    try {
        const posts = await Post.find({ likes: { $gt: 0 } })
            .populate('userId', 'name username email profilePicture')
            .sort({ likes: -1, createdAt: -1 })
            .limit(5);

        return res.json({ posts });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const deletePost = async (req, res) => {

    const {token, post_id} = req.body;

    try{

        const user = await User
            .findOne({ token: token })
            .select("_id");
        
        if(!user){
            return res.status(404).json({ message: "User not found"})
        }

        const post = await Post.findOne({ _id: post_id });

        if(!post){
            return res.status(404).json({ message: "Post not found "});
        }

        if(post.userId.toString() !== user._id.toString()) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        await Post.deleteOne({ _id: post_id });

        return res.json({ message: "Post Deleted" });

    } catch(error){
        return res.status(500).json({ message: error.message});
    }
}

export const commentPost = async (req, res) => {

    const { token, post_id, commentBody } = req.body;

    try{

        const user = await User.findOne({ token: token }).select("_id name");

        if(!user){
            return res.status(404).json({ message: "User not found"})
        }

        const post = await Post.findOne({
            _id: post_id
        });

        if(!post){
            return res.status(404).json({ message: "Post not found "});
        }

        const comment = new Comment ({
            userId: user._id,
            postId: post_id,
            body: commentBody
        });

        await comment.save();

        if (post.userId.toString() !== user._id.toString()) {
            await createNotification({
                recipientId: post.userId,
                senderId: user._id,
                type: "comment",
                message: `${user.name} commented on your post`,
                referenceId: post_id,
            });
        }

        return res.status(200).json({ message: "Comment Added" });

    } catch(error){
        return res.status(500).json({ message: error.message});
    }
}

export const get_comments_by_post = async (req, res) => {
    const { post_id } = req.query;

    try{

        const post = await Post.findOne({_id: post_id });

        if(!post){
            return res.status(404).json({ message: "Post not found" });
        }

        const comments = await Comment.find({ postId: post_id })
            .populate('userId', 'name username profilePicture')
            .sort({ _id: -1 });

        return res.json({ comments });

    } catch(error){
        return res.status(500).json({ message: error.message});
    }
}

export const delete_comment_of_user = async (req, res) => {
    const { token, comment_id } = req.body;

    try{

       const user = await User
            .findOne({ token: token })
            .select("_id");
        
        if(!user){
            return res.status(404).json({ message: "User not found"})
        }

        const comment = await Comment.findOne({"_id": comment_id })

        if(!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        if(comment.userId.toString() !== user._id.toString()) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        await Comment.deleteOne({"_id": comment_id });

        return res.json({ message: "Comment Deleted"});

    } catch(error){
        return res.status(500).json({ message: error.message});
    }
}

export const toggleLike = async (req, res) => {
    const { token, post_id } = req.body;

    try {
        const user = await User.findOne({ token }).select("_id name");
        if (!user) return res.status(404).json({ message: "User not found" });

        const post = await Post.findOne({ _id: post_id });
        if (!post) return res.status(404).json({ message: "Post not found" });

        const userId = user._id;
        const alreadyLiked = post.likedBy.some((id) => id.toString() === userId.toString());

        if (alreadyLiked) {
            post.likedBy = post.likedBy.filter((id) => id.toString() !== userId.toString());
            post.likes = Math.max(0, post.likes - 1);
        } else {
            post.likedBy.push(userId);
            post.likes = post.likes + 1;

            if (post.userId.toString() !== userId.toString()) {
                await createNotification({
                    recipientId: post.userId,
                    senderId: userId,
                    type: "like",
                    message: `${user.name} liked your post`,
                    referenceId: post_id,
                });
            }
        }

        await post.save();

        return res.json({
            liked: !alreadyLiked,
            likes: post.likes,
            postId: post_id,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

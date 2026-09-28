import Post from "../models/posts.model.js";
import User from "../models/user.model.js";
import Comment from "../models/comments.model.js";
import ConnectionRequest from "../models/connections.model.js";
import { createNotification } from "../utils/notificationHelper.js";

const REACTION_TYPES = new Set(["like", "love", "celebrate", "funny", "insightful", "support"]);

const normalizeReactionType = (type) => (REACTION_TYPES.has(type) ? type : "like");

const applyUserReaction = (reactions = [], likedBy = [], userId, type) => {
    const uid = userId.toString();
    const nextReactions = (reactions || []).map((reaction) => ({
        userId: reaction.userId,
        type: reaction.type,
    }));
    let nextLikedBy = [...(likedBy || [])];
    const existingIndex = nextReactions.findIndex((reaction) => reaction.userId.toString() === uid);
    let myReaction = null;

    if (existingIndex >= 0 && nextReactions[existingIndex].type === type) {
        nextReactions.splice(existingIndex, 1);
        nextLikedBy = nextLikedBy.filter((id) => id.toString() !== uid);
    } else if (existingIndex >= 0) {
        nextReactions[existingIndex].type = type;
        myReaction = type;
        if (!nextLikedBy.some((id) => id.toString() === uid)) nextLikedBy.push(userId);
    } else {
        nextReactions.push({ userId, type });
        if (!nextLikedBy.some((id) => id.toString() === uid)) nextLikedBy.push(userId);
        myReaction = type;
    }

    return {
        reactions: nextReactions,
        likedBy: nextLikedBy,
        myReaction,
        likes: nextLikedBy.length,
        liked: Boolean(myReaction),
    };
};

const isAllowedGifUrl = (url) => {
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        return parsed.protocol === "https:" && (
            host === "giphy.com" ||
            host.endsWith(".giphy.com") ||
            host.endsWith("giphy.net")
        );
    } catch {
        return false;
    }
};

const resolveMyReaction = (reactions = [], likedBy = [], currentUserId) => {
    if (!currentUserId) return null;
    const found = (reactions || []).find((reaction) => reaction.userId.toString() === currentUserId);
    if (found) return found.type;
    if ((likedBy || []).some((id) => id.toString() === currentUserId)) return "like";
    return null;
};

const COMMENT_PERMISSIONS = new Set(["anyone", "connections", "off"]);

const normalizeCommentPermission = (value) => (
    COMMENT_PERMISSIONS.has(value) ? value : "anyone"
);

const loadConnectedUserIds = async (currentUserId) => {
    const ids = new Set();
    if (!currentUserId) return ids;
    const rows = await ConnectionRequest.find({
        status_accepted: true,
        $or: [{ userId: currentUserId }, { connectionId: currentUserId }],
    }).select("userId connectionId");
    rows.forEach((row) => {
        const a = row.userId.toString();
        const b = row.connectionId.toString();
        ids.add(a === currentUserId ? b : a);
    });
    return ids;
};

const isAcceptedConnection = async (userA, userB) => {
    if (!userA || !userB) return false;
    if (userA.toString() === userB.toString()) return true;
    const found = await ConnectionRequest.findOne({
        status_accepted: true,
        $or: [
            { userId: userA, connectionId: userB },
            { userId: userB, connectionId: userA },
        ],
    }).select("_id");
    return Boolean(found);
};

const canUserCommentOnPost = (post, currentUserId, connectedIds) => {
    const permission = normalizeCommentPermission(post.commentPermission);
    if (permission === "off") return false;
    if (permission === "anyone") return true;
    if (!currentUserId) return false;
    const ownerId = post.userId?._id?.toString?.() || post.userId.toString();
    if (ownerId === currentUserId) return true;
    return connectedIds.has(ownerId);
};

const serializePost = (post, currentUserId, connectedIds) => {
    const postObj = post.toObject();
    const myReaction = resolveMyReaction(post.reactions, post.likedBy, currentUserId);
    return {
        ...postObj,
        commentPermission: normalizeCommentPermission(postObj.commentPermission),
        featured: postObj.featured === true,
        canComment: canUserCommentOnPost(post, currentUserId, connectedIds),
        isLiked: Boolean(myReaction),
        myReaction,
        likes: (post.likedBy || []).length,
    };
};

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

        const files = Array.isArray(req.files) ? req.files : [];
        const firstFile = files[0];
        const mediaItems = files.map((file) => ({
            filename: file.filename,
            fileType: file.mimetype.split("/")[1]
        }));
        const commentPermission = normalizeCommentPermission(req.body.commentPermission);

        const post = new Post({
            userId: user._id,
            body: req.body.body,
            media: firstFile ? firstFile.filename : "",
            fileType: firstFile ? firstFile.mimetype.split("/")[1] : "",
            mediaItems,
            commentPermission
        });

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

        const connectedIds = await loadConnectedUserIds(currentUserId);
        const postsWithLikeStatus = posts.map((post) => serializePost(post, currentUserId, connectedIds));

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

export const updatePost = async (req, res) => {
    const { token, post_id, body, commentPermission, featured } = req.body;

    try {
        const user = await User.findOne({ token }).select("_id");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const post = await Post.findOne({ _id: post_id });
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (post.userId.toString() !== user._id.toString()) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const updates = {};

        if (body !== undefined) {
            const nextBody = String(body);
            if (nextBody.trim().length > 5000) {
                return res.status(400).json({ message: "Post must be under 5000 characters" });
            }
            updates.body = nextBody;
            updates.updatedAt = new Date();
        }

        if (commentPermission !== undefined) {
            if (!COMMENT_PERMISSIONS.has(commentPermission)) {
                return res.status(400).json({ message: "Invalid comment permission" });
            }
            updates.commentPermission = commentPermission;
        }

        if (featured !== undefined) {
            if (featured === true || featured === "true") updates.featured = true;
            else if (featured === false || featured === "false") updates.featured = false;
            else return res.status(400).json({ message: "Invalid featured value" });
        }

        const fresh = Object.keys(updates).length
            ? await Post.findOneAndUpdate(
                { _id: post_id, userId: user._id },
                { $set: updates },
                { returnDocument: "after" }
            ).populate("userId", "name username email profilePicture")
            : await Post.findById(post._id).populate("userId", "name username email profilePicture");

        if (!fresh) {
            return res.status(404).json({ message: "Post not found" });
        }

        const connectedIds = await loadConnectedUserIds(user._id.toString());
        return res.json({ post: serializePost(fresh, user._id.toString(), connectedIds) });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const commentPost = async (req, res) => {

    const { token, post_id, commentBody, parent_comment_id } = req.body;

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

        const commentPermission = normalizeCommentPermission(post.commentPermission);
        if (commentPermission === "off") {
            return res.status(403).json({ message: "Comments are turned off for this post" });
        }
        if (commentPermission === "connections") {
            const ownerId = post.userId.toString();
            const commenterId = user._id.toString();
            if (ownerId !== commenterId) {
                const connected = await isAcceptedConnection(ownerId, commenterId);
                if (!connected) {
                    return res.status(403).json({ message: "Only connections can comment on this post" });
                }
            }
        }

        let parentCommentId = null;
        if (parent_comment_id) {
            const parent = await Comment.findOne({ _id: parent_comment_id, postId: post_id });
            if (!parent) {
                return res.status(404).json({ message: "Parent comment not found" });
            }
            parentCommentId = parent.parentCommentId || parent._id;
        }

        const rawGifUrl = typeof req.body.gifUrl === "string" ? req.body.gifUrl.trim() : "";
        if (rawGifUrl && !isAllowedGifUrl(rawGifUrl)) {
            return res.status(400).json({ message: "Invalid GIF URL" });
        }
        const gifUrl = rawGifUrl;
        const uploaded = req.file
            ? { filename: req.file.filename, fileType: req.file.mimetype.split("/")[1] }
            : { filename: "", fileType: "" };
        const hasImage = Boolean(uploaded.filename);
        const hasGif = Boolean(gifUrl) && !hasImage;
        const body = (commentBody || "").trim();

        if (!body && !hasImage && !hasGif) {
            return res.status(400).json({ message: "Comment cannot be empty" });
        }

        const comment = new Comment ({
            userId: user._id,
            postId: post_id,
            body,
            parentCommentId,
            media: uploaded,
            gifUrl: hasGif ? gifUrl : ""
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
    const { post_id, token } = req.query;

    try{

        const post = await Post.findOne({_id: post_id });

        if(!post){
            return res.status(404).json({ message: "Post not found" });
        }

        let currentUserId = null;
        if (token) {
            const user = await User.findOne({ token }).select("_id");
            if (user) currentUserId = user._id.toString();
        }

        const comments = await Comment.find({ postId: post_id })
            .populate('userId', 'name username profilePicture')
            .sort({ _id: -1 });

        const commentsWithReactions = comments.map((comment) => {
            const commentObj = comment.toObject();
            const myReaction = resolveMyReaction(comment.reactions, [], currentUserId);
            return {
                ...commentObj,
                likes: (comment.reactions || []).length,
                myReaction,
                isLiked: Boolean(myReaction),
            };
        });

        return res.json({ comments: commentsWithReactions });

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
        await Comment.deleteMany({ parentCommentId: comment_id });

        return res.json({ message: "Comment Deleted"});

    } catch(error){
        return res.status(500).json({ message: error.message});
    }
}

export const toggleLike = async (req, res) => {
    const { token, post_id, reactionType } = req.body;

    try {
        const user = await User.findOne({ token }).select("_id name");
        if (!user) return res.status(404).json({ message: "User not found" });

        const post = await Post.findOne({ _id: post_id });
        if (!post) return res.status(404).json({ message: "Post not found" });

        const type = normalizeReactionType(reactionType);
        const userId = user._id;
        const hadReaction = Boolean(resolveMyReaction(post.reactions, post.likedBy, userId.toString()));
        const next = applyUserReaction(post.reactions, post.likedBy, userId, type);

        post.reactions = next.reactions;
        post.likedBy = next.likedBy;
        post.likes = next.likes;

        if (!hadReaction && next.myReaction && post.userId.toString() !== userId.toString()) {
            await createNotification({
                recipientId: post.userId,
                senderId: userId,
                type: "like",
                message: `${user.name} reacted to your post`,
                referenceId: post_id,
            });
        }

        await post.save();

        return res.json({
            liked: next.liked,
            likes: next.likes,
            myReaction: next.myReaction,
            postId: post_id,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const toggleCommentLike = async (req, res) => {
    const { token, comment_id, reactionType } = req.body;

    try {
        const user = await User.findOne({ token }).select("_id");
        if (!user) return res.status(404).json({ message: "User not found" });

        const comment = await Comment.findOne({ _id: comment_id });
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        const type = normalizeReactionType(reactionType);
        const next = applyUserReaction(comment.reactions, [], user._id, type);
        comment.reactions = next.reactions;
        await comment.save();

        return res.json({
            commentId: comment_id,
            postId: comment.postId.toString(),
            liked: next.liked,
            likes: next.reactions.length,
            myReaction: next.myReaction,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const searchGifs = async (req, res) => {
    const apiKey = process.env.GIPHY_API_KEY;
    if (!apiKey) {
        return res.status(503).json({
            message: "GIF search is not configured. Add GIPHY_API_KEY to the backend environment.",
        });
    }

    const query = String(req.query.q || "").trim();
    const endpoint = query
        ? `https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}&limit=16&rating=g`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${encodeURIComponent(apiKey)}&limit=16&rating=g`;

    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            return res.status(502).json({ message: "GIF provider request failed" });
        }
        const data = await response.json();
        const gifs = (data.data || []).map((item) => ({
            id: item.id,
            url: item.images?.original?.url || item.images?.downsized?.url || "",
            preview: item.images?.fixed_height_small?.url || item.images?.preview_gif?.url || item.images?.original?.url || "",
            description: item.title || "GIF",
        })).filter((item) => item.url);

        return res.json({ gifs, attribution: "GIPHY" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

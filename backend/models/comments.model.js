import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    body: {
        type: String,
        default: ""
    },
    parentCommentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
        default: null
    },
    reactions: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        type: {
            type: String,
            default: "like"
        }
    }],
    media: {
        filename: {
            type: String,
            default: ""
        },
        fileType: {
            type: String,
            default: ""
        }
    },
    gifUrl: {
        type: String,
        default: ""
    }
});

CommentSchema.pre("validate", function () {
    const hasBody = Boolean(String(this.body || "").trim());
    const hasGif = Boolean(String(this.gifUrl || "").trim());
    const hasMedia = Boolean(this.media?.filename);
    if (!hasBody && !hasGif && !hasMedia) {
        this.invalidate("body", "Comment cannot be empty");
    }
});

const Comment = mongoose.model("Comment", CommentSchema);
export default Comment;
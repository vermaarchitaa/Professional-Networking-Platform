import mongoose from "mongoose";

const postSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    body: {
        type: String,
        required: true
    },
    likes: {
        type: Number,
        default: 0       
    },
    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
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
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    media: {
        type: String,
        default: ''
    },
    active: {
        type: Boolean,
        default: true
    },
    fileType: {
        type: String,
        default: ''
    },
    mediaItems: {
        type: [{
            filename: {
                type: String,
                default: ''
            },
            fileType: {
                type: String,
                default: ''
            }
        }],
        default: []
    }
});

const Post = mongoose.model("Post", postSchema)

export default Post;

import mongoose, { Schema } from "mongoose";

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true               
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    active: {
        type: Boolean,
        default: true
    },
    password: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String,
        default: 'default.jpg'
    },
    coverPicture: {
        type: String,
        default: ''
    },
    profilePhotoVisibility: {
        type: String,
        enum: ["connections", "network", "members", "anyone"],
        default: "anyone"
    },
    profilePictureFrame: {
        type: String,
        enum: ["original", "open-to-work", "hiring"],
        default: "original"
    },
    createdAt:{
        type: Date,
        default: Date.now
    },
    token: {
        type: String,
        default: ''
    }
})

const User = mongoose.model("User", UserSchema);
export default User;
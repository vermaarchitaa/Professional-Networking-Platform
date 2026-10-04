import mongoose from "mongoose";

const connectionRequest = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    connectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status_accepted: {
        type: Boolean,
        default: null
    },
    acceptedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

const ConnectionRequest = mongoose.model("connectionRequest", connectionRequest);

export default ConnectionRequest;
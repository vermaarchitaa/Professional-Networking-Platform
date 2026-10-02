import Profile from "../models/profile.model.js";
import User from "../models/user.model.js";
import Comment from "../models/comments.model.js";
import crypto from 'crypto';
import ConnectionRequest from "../models/connections.model.js";
import { createNotification } from "../utils/notificationHelper.js";

import PDFDocument from 'pdfkit';
import bcrypt from 'bcrypt';
import fs from "fs";
import path from "path";
import Post from "../models/posts.model.js";
import { UPLOADS_DIR, ensureUploadsDir, isPdfEmbeddableImage, removeUploadedFile } from "../utils/uploads.js";

const convertUserDataToPDF = async (userData) => {
    ensureUploadsDir();

    const doc = new PDFDocument();

    const outputPath = crypto.randomBytes(32).toString("hex") + ".pdf";
    const stream = fs.createWriteStream(path.join(UPLOADS_DIR, outputPath));

    doc.pipe(stream);

    const picture = userData.userId?.profilePicture;
    const picturePath = picture ? path.join(UPLOADS_DIR, path.basename(picture)) : "";
    if (
        picture &&
        picture !== "default.jpg" &&
        isPdfEmbeddableImage(picture) &&
        fs.existsSync(picturePath)
    ) {
        doc.image(picturePath, { align: "center", width: 100 });
    }

    doc.fontSize(14).text(`Name: ${userData.userId.name}`);
    doc.fontSize(14).text(`Username: ${userData.userId.username}`);
    doc.fontSize(14).text(`Email: ${userData.userId.email}`);
    doc.fontSize(14).text(`Bio: ${userData.bio}`);
    doc.fontSize(14).text(`Current Position: ${userData.currentPost}`);

    doc.fontSize(14).text("Past Work: ")
    userData.pastWork.forEach((work, index) => {
        doc.fontSize(14).text(`Company Name: ${work.company}`);
        doc.fontSize(14).text(`Position: ${work.position}`);
        doc.fontSize(14).text(`Years: ${work.years}`);
    })

    await new Promise((resolve, reject) => {
        stream.on("finish", resolve);
        stream.on("error", reject);
        doc.end();
    });

    return outputPath;
}

export const register = async (req, res) => {

    try{
        const { name, email, password, username } = req.body;

        if(!name || !email || !password || !username) return res.status(400).json({ message: "All fields are erquired"});

        const user = await User.findOne({
            email
        });

        if(user) return res.status(400).json({ message: "User already exists"});

        const hashPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            email,
            password: hashPassword,
            username,
        });

        await newUser.save();
  
        const profile = new Profile({ userId: newUser._id});

        await profile.save();

        return res.json({ message: "User Created " });

    } catch(error){
        return res.status(500).json({ message: error.message});
    }
}

export const login = async (req, res) => {

    try {
        const { email, password } = req.body;

        if(!email || !password) return res.status(400).json({ message: "All fields are required"});

        const user = await User.findOne({
            email
        });

        if(!user) return res.status(404).json({ message: "User does not exist" })

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) return res.status(400).json({ message: "Invalid Credentials" });

        const token = crypto.randomBytes(32).toString("hex");

        await User.updateOne({ _id: user._id }, { token });

        return res.json({ token: token });

    } catch (error){
        return res.status(500).json({ message: error.message });
    }
}

export const uploadProfilePicture = async (req, res) => {
    const { token } = req.body;
    const uploaded = req.file?.filename;

    const discardUpload = () => {
        if (uploaded) removeUploadedFile(uploaded);
    };

    let saved = false;
    try {
        if (!token || typeof token !== "string") {
            discardUpload();
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await User.findOne({ token: token });

        if (!user) {
            discardUpload();
            return res.status(404).json({ message: "User not found" });
        }
        if (!uploaded) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const previous = user.profilePicture;
        user.profilePicture = uploaded;
        await user.save();
        saved = true;

        if (previous && previous !== "default.jpg" && previous !== uploaded) {
            removeUploadedFile(previous);
        }

        return res.json({ message: "Profile Picture Updated" });
    } catch (error) {
        if (!saved) discardUpload();
        return res.status(500).json({ message: error.message });
    }
}

export const uploadCoverPicture = async (req, res) => {
    const { token } = req.body;

    try {
        const user = await User.findOne({ token: token });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        user.coverPicture = req.file.filename;
        await user.save();

        return res.json({ message: "Cover photo updated" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const deleteCoverPicture = async (req, res) => {
    const { token } = req.body;

    try {
        if (!token || typeof token !== "string") {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await User.findOne({ token: token });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const previous = user.coverPicture;
        user.coverPicture = "";
        await user.save();

        if (previous) {
            removeUploadedFile(previous);
        }

        return res.json({ message: "Cover photo deleted" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const deleteProfilePicture = async (req, res) => {
    const { token } = req.body;

    try {
        if (!token || typeof token !== "string") {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await User.findOne({ token: token });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const previous = user.profilePicture;
        user.profilePicture = "default.jpg";
        user.profilePictureFrame = "original";
        await user.save();

        if (previous && previous !== "default.jpg") {
            removeUploadedFile(previous);
        }

        return res.json({ message: "Profile picture deleted" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const PHOTO_VISIBILITY_VALUES = ["connections", "network", "members", "anyone"];
const PHOTO_FRAME_VALUES = ["original", "open-to-work", "hiring"];

export const updateProfilePhotoVisibility = async (req, res) => {
    const { token, profilePhotoVisibility } = req.body;

    try {
        if (!token || typeof token !== "string") {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!PHOTO_VISIBILITY_VALUES.includes(profilePhotoVisibility)) {
            return res.status(400).json({ message: "Invalid visibility option" });
        }

        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.profilePhotoVisibility = profilePhotoVisibility;
        await user.save();

        return res.json({ message: "Profile photo visibility updated" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const updateProfilePictureFrame = async (req, res) => {
    const { token, profilePictureFrame } = req.body;

    try {
        if (!token || typeof token !== "string") {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!PHOTO_FRAME_VALUES.includes(profilePictureFrame)) {
            return res.status(400).json({ message: "Invalid frame option" });
        }

        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.profilePictureFrame = profilePictureFrame;
        await user.save();

        return res.json({ message: "Profile photo frame updated" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const updateUserProfile = async (req, res) => {
    try{

        const { token, name, username, email } = req.body;

        const user = await User.findOne({ token: token });

        if(!user){
            return res.status(404).json({ message: "User not found"})
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });

        if(existingUser) {
            if(existingUser && String(existingUser._id) !== String(user._id)){
                return res.status(400).json({ message: "User already exists" });
            }
        }

        if (name !== undefined) user.name = name;
        if (username !== undefined) user.username = username;
        if (email !== undefined) user.email = email;

        await user.save();

        return res.json({ message: "User Updated "});

    } catch(error){
        return res.status(500).json({ message: error.message})
    }
}

export const getUserAndProfile = async (req, res) => {

    try{
        const { token } = req.body;

        const user = await User.findOne({ token: token });

        if(!user){
            return res.status(404).json({ message: "User not found"})
        }

        const userProfile = await Profile.findOne({ userId: user._id })
           .populate('userId', 'name email username profilePicture coverPicture profilePhotoVisibility profilePictureFrame');

        if (!userProfile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        const connectionsCount = await ConnectionRequest.countDocuments({
            status_accepted: true,
            $or: [{ userId: user._id }, { connectionId: user._id }],
        });

        return res.json({
            ...userProfile.toObject(),
            connectionsCount,
        });

    } catch(error){
        return res.status(500).json({ message: error.message});
    }
}

const sanitizeContactForViewer = (contact, isOwner) => {
    if (isOwner || !contact || typeof contact !== "object") return contact || {};
    const next = { ...contact };
    if (next.emailVisibility === "only-me") next.email = "";
    if (next.phoneVisibility === "only-me") {
        next.phone = "";
        next.phoneType = "";
    }
    return next;
};

export const getProfileByUsername = async (req, res) => {
    try {
        const { token, username } = req.body;
        if (!token || typeof token !== "string") {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const viewer = await User.findOne({ token });
        if (!viewer) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const slug = String(username || "").trim();
        if (!slug) {
            return res.status(400).json({ message: "Username is required" });
        }

        const user = await User.findOne({ username: slug });
        if (!user) {
            return res.status(404).json({ message: "Profile not found" });
        }

        const userProfile = await Profile.findOne({ userId: user._id })
            .populate("userId", "name username profilePicture coverPicture profilePhotoVisibility profilePictureFrame");

        if (!userProfile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        const isOwner = String(viewer._id) === String(user._id);
        const connectionsCount = await ConnectionRequest.countDocuments({
            status_accepted: true,
            $or: [{ userId: user._id }, { connectionId: user._id }],
        });

        const data = userProfile.toObject();
        data.contactInfo = sanitizeContactForViewer(data.contactInfo, isOwner);
        if (isOwner) {
            data.userId = {
                ...data.userId,
                email: viewer.email,
            };
        }

        return res.json({
            ...data,
            connectionsCount,
            isOwner,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const OPEN_TO_VISIBILITY = new Set(["recruiters", "anyone"]);
const CONTACT_VISIBILITY = new Set(["anyone", "connections", "only-me"]);
const PHONE_TYPES = new Set(["", "Mobile", "Home", "Work"]);
const PROFILE_STRING_FIELDS = ["bio", "currentPost", "location"];

const asTrimmedString = (value, fallback = "") => {
    if (value === undefined || value === null) return fallback;
    if (typeof value !== "string") return null;
    return value.trim();
};

const joinLocation = (city, country) => [city, country].filter(Boolean).join(", ");

const normalizeOpenToWork = (value) => {
    if (value === undefined) return { ok: true };
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return { ok: false, message: "openToWork must be an object" };
    }
    if (value.enabled !== undefined && typeof value.enabled !== "boolean") {
        return { ok: false, message: "openToWork.enabled must be a boolean" };
    }
    if (value.visibility !== undefined && !OPEN_TO_VISIBILITY.has(value.visibility)) {
        return { ok: false, message: "openToWork.visibility must be recruiters or anyone" };
    }
    if (value.location !== undefined && typeof value.location !== "string") {
        return { ok: false, message: "openToWork.location must be a string" };
    }
    if (value.workTypes !== undefined && typeof value.workTypes !== "string") {
        return { ok: false, message: "openToWork.workTypes must be a string" };
    }

    return {
        ok: true,
        value: {
            enabled: Boolean(value.enabled),
            visibility: value.visibility === "anyone" ? "anyone" : "recruiters",
            location: typeof value.location === "string" ? value.location : "",
            workTypes: typeof value.workTypes === "string" ? value.workTypes : "",
        },
    };
};

const normalizeEducationIndex = (value, educationLength) => {
    if (value === undefined || value === null || value === "") return { ok: true, value: null };
    const index = Number(value);
    if (!Number.isInteger(index) || index < 0 || index >= educationLength) {
        return { ok: false, message: "intro.educationIndex must be a valid education record" };
    }
    return { ok: true, value: index };
};

const normalizeIntro = (value, educationLength) => {
    if (value === undefined) return { ok: true };
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return { ok: false, message: "intro must be an object" };
    }

    const additionalName = asTrimmedString(value.additionalName);
    const pronouns = asTrimmedString(value.pronouns);
    const industry = asTrimmedString(value.industry);
    const city = asTrimmedString(value.city);
    const country = asTrimmedString(value.country);
    const education = asTrimmedString(value.education);
    if ([additionalName, pronouns, industry, city, country, education].includes(null)) {
        return { ok: false, message: "intro string fields must be strings" };
    }

    const educationIndex = normalizeEducationIndex(value.educationIndex, educationLength);
    if (!educationIndex.ok) return educationIndex;

    return {
        ok: true,
        value: {
            additionalName,
            pronouns,
            industry,
            city,
            country,
            education,
            educationIndex: educationIndex.value,
        },
    };
};

const normalizeContactInfo = (value) => {
    if (value === undefined) return { ok: true };
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return { ok: false, message: "contactInfo must be an object" };
    }

    const email = asTrimmedString(value.email);
    const phone = asTrimmedString(value.phone);
    const phoneType = asTrimmedString(value.phoneType);
    const address = asTrimmedString(value.address);
    const birthday = asTrimmedString(value.birthday);
    const website = asTrimmedString(value.website);
    const instantMessaging = asTrimmedString(value.instantMessaging);
    if ([email, phone, phoneType, address, birthday, website, instantMessaging].includes(null)) {
        return { ok: false, message: "contactInfo string fields must be strings" };
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { ok: false, message: "contactInfo.email must be a valid email" };
    }
    if (!PHONE_TYPES.has(phoneType)) {
        return { ok: false, message: "contactInfo.phoneType must be Mobile, Home, Work, or empty" };
    }
    if (birthday && !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
        return { ok: false, message: "contactInfo.birthday must be YYYY-MM-DD" };
    }

    const emailVisibility = value.emailVisibility === undefined ? "anyone" : value.emailVisibility;
    const phoneVisibility = value.phoneVisibility === undefined ? "anyone" : value.phoneVisibility;
    if (!CONTACT_VISIBILITY.has(emailVisibility) || !CONTACT_VISIBILITY.has(phoneVisibility)) {
        return { ok: false, message: "contact visibility must be anyone, connections, or only-me" };
    }

    return {
        ok: true,
        value: {
            email,
            phone,
            phoneType,
            address,
            birthday,
            website,
            instantMessaging,
            emailVisibility,
            phoneVisibility,
        },
    };
};

export const updateProfileData = async (req, res) => {

    try {
        const {
            token,
            openToWork,
            intro,
            contactInfo,
            connectionsCount,
            userId,
            _id,
            ...rest
        } = req.body;

        if (!token || typeof token !== "string") {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userProfile = await User.findOne({ token: token });

        if (!userProfile) {
            return res.status(404).json({ message: "User not fouund" });
        }

        const profile_to_update = await Profile.findOne({ userId: userProfile._id });
        if (!profile_to_update) {
            return res.status(404).json({ message: "Profile not found" });
        }

        const normalizedOpenToWork = normalizeOpenToWork(openToWork);
        if (!normalizedOpenToWork.ok) {
            return res.status(400).json({ message: normalizedOpenToWork.message });
        }

        for (const key of PROFILE_STRING_FIELDS) {
            if (rest[key] === undefined) continue;
            if (typeof rest[key] !== "string") {
                return res.status(400).json({ message: `${key} must be a string` });
            }
            profile_to_update[key] = rest[key];
        }

        if (rest.pastWork !== undefined) {
            if (!Array.isArray(rest.pastWork)) {
                return res.status(400).json({ message: "pastWork must be an array" });
            }
            profile_to_update.pastWork = rest.pastWork;
        }
        if (rest.education !== undefined) {
            if (!Array.isArray(rest.education)) {
                return res.status(400).json({ message: "education must be an array" });
            }
            profile_to_update.education = rest.education;
        }

        const educationLength = (profile_to_update.education || []).length;
        const normalizedIntro = normalizeIntro(intro, educationLength);
        if (!normalizedIntro.ok) {
            return res.status(400).json({ message: normalizedIntro.message });
        }
        const normalizedContact = normalizeContactInfo(contactInfo);
        if (!normalizedContact.ok) {
            return res.status(400).json({ message: normalizedContact.message });
        }

        if (normalizedOpenToWork.value) {
            profile_to_update.set("openToWork", normalizedOpenToWork.value);
        }
        if (normalizedIntro.value) {
            profile_to_update.set("intro", normalizedIntro.value);
            if (rest.location === undefined) {
                profile_to_update.location = joinLocation(
                    normalizedIntro.value.city,
                    normalizedIntro.value.country
                );
            }
        }
        if (normalizedContact.value) {
            profile_to_update.set("contactInfo", normalizedContact.value);
        }

        await profile_to_update.save();

        return res.json({ message: "Profile Update" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const getAllUserProfile = async (req, res) => {

    try {
        const token = req.body.token || req.query.token;

        const user = await User.findOne({ token });

        if(!user){
            return res.status(404).json({ message: "User not found"})
        }

        const profiles = await Profile.find().populate('userId', 'name username email profilePicture');

        return res.json({ profiles });
    } catch(error){
        return res.status(500).json({ message: error.message });
    }
}

export const downloadProfile = async (req, res) => {

    try {
        const token = req.body.token || req.query.token;
        const user_id = req.query.id;

        const user = await User.findOne({ token });

        if(!user){
            return res.status(404).json({ message: "User not found"})
        }

        if(!user_id || String(user._id) !== String(user_id)){
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userProfile = await Profile.findOne({ userId: user._id })
        .populate('userId', 'name username email profilePicture');

        if(!userProfile){
            return res.status(404).json({ message: "Profile not found" });
        }

        let outputPath = await convertUserDataToPDF(userProfile);

        return res.json({ "message": outputPath});
    } catch(error){
        return res.status(500).json({ message: error.message });
    }

}

export const sendConnectionRequest = async (req, res) => {

    const { token, connectionId } = req.body;

    try{

        const user = await User.findOne({ token });

        if(!user){
            return res.status(404).json({ message: "User not found"})
        }

        const connectionUser = await User.findOne({ _id: connectionId });

        if(!connectionUser){
            return res.status(404).json({ message: "Connection user not found" });
        }

        if(String(user._id) === String(connectionUser._id)){
            return res.status(400).json({ message: "Cannot send a connection request to yourself" });
        }

        const existingPair = await ConnectionRequest.find({
            $or: [
                { userId: user._id, connectionId: connectionUser._id },
                { userId: connectionUser._id, connectionId: user._id },
            ]
        });

        const blockingRequest = existingPair.find((r) => r.status_accepted === true || r.status_accepted == null);

        if(blockingRequest){
            return res.status(400).json({ message: "Request already sent "});
        }

        const sameDirectionDeclined = existingPair.find((r) =>
            String(r.userId) === String(user._id) &&
            String(r.connectionId) === String(connectionUser._id) &&
            r.status_accepted === false
        );

        let request = sameDirectionDeclined;

        if(request){
            request.status_accepted = null;
            await request.save();
        } else {
            request = new ConnectionRequest({
                userId: user._id,
                connectionId: connectionUser._id
            });
            await request.save();
        }

        await createNotification({
            recipientId: connectionUser._id,
            senderId: user._id,
            type: "connection_request",
            message: `${user.name} sent you a connection request`,
            referenceId: request._id.toString(),
        });

        return res.json({ message: "Request Sent"});

    } catch(error){
        return res.status(500).json({ message: error.message});
    }

}

export const getMyConnectionsRequests = async (req, res) => {

    const { token } = req.body;

    try{

        const user = await User.findOne({ token });

        if(!user){
            return res.status(404).json({ message: "User not found"})
        }

        const connections = await ConnectionRequest.find({ userId: user._id })
          .populate('connectionId', 'name username email profilePicture');
        return res.json({ connections });



    } catch(error){
        return res.status(500).json({ message: error.message});
    }
}

export const whatAreMyConnections = async (req, res) => {

    const token = req.body.token || req.query.token;

    try{

        const user = await User.findOne({ token });

        if(!user){
            return res.status(404).json({ message: "User not found"})
        }

        const connections = await ConnectionRequest.find({
            connectionId: user._id,
            status_accepted: { $in: [null, true] }
        })
          .populate('userId', 'name username email profilePicture');
        return res.json(connections);

    } catch(error){
        return res.status(500).json({ message: error.message});
    }
}

export const acceptConnectionRequest = async (req, res) => {

    const { token, requestId, action_type } = req.body;

    try{

        const user = await User.findOne({ token });

        if(!user){
            return res.status(404).json({ message: "User not found"})
        }

        const connection = await ConnectionRequest.findOne({ _id: requestId });

        if(!connection){
            return res.status(404).json({ message: "Connection not found" });
        }

        if(String(connection.connectionId) !== String(user._id)){
            return res.status(401).json({ message: "Unauthorized" });
        }

        if(action_type === "accept") {
            connection.status_accepted = true;
            await createNotification({
                recipientId: connection.userId,
                senderId: user._id,
                type: "connection_accept",
                message: `${user.name} accepted your connection request`,
                referenceId: connection._id.toString(),
            });
        } else {
            connection.status_accepted = false;
        }

        await connection.save();
        return res.json({ message: "Request Updated" });

    } catch(error){
        return res.status(500).json({ message: error.message});
    }
}


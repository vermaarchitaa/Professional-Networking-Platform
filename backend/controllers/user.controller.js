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
import { destroyCloudinaryImage, uploadCoverImage, uploadProfileImage } from "../config/cloudinary.js";
import { UPLOADS_DIR, ensureUploadsDir, isPdfEmbeddableImage, removeUploadedFile } from "../utils/uploads.js";

const pictureValue = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object" && typeof value.url === "string") return value.url;
    return "";
};

const convertUserDataToPDF = async (userData) => {
    ensureUploadsDir();

    const doc = new PDFDocument();

    const outputPath = crypto.randomBytes(32).toString("hex") + ".pdf";
    const stream = fs.createWriteStream(path.join(UPLOADS_DIR, outputPath));

    doc.pipe(stream);

    const picture = pictureValue(userData.userId?.profilePicture);
    try {
        if (picture && picture !== "default.jpg" && /^https?:\/\//i.test(picture)) {
            const response = await fetch(picture);
            if (response.ok) {
                const buffer = Buffer.from(await response.arrayBuffer());
                doc.image(buffer, { align: "center", width: 100 });
            }
        } else {
            const picturePath = picture ? path.join(UPLOADS_DIR, path.basename(picture)) : "";
            if (
                picture &&
                picture !== "default.jpg" &&
                isPdfEmbeddableImage(picture) &&
                fs.existsSync(picturePath)
            ) {
                doc.image(picturePath, { align: "center", width: 100 });
            }
        }
    } catch {
        // Resume generation continues without a profile image.
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
    const buffer = req.file?.buffer;

    try {
        if (!token || typeof token !== "string") {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await User.findOne({ token: token });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!buffer) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        let uploaded;
        try {
            uploaded = await uploadProfileImage(buffer);
        } catch (error) {
            return res.status(500).json({ message: error.message || "Failed to upload profile picture" });
        }

        const previousPublicId = user.profilePicturePublicId;

        try {
            user.profilePicture = uploaded.url;
            user.profilePicturePublicId = uploaded.publicId;
            await user.save();
        } catch (error) {
            await destroyCloudinaryImage(uploaded.publicId);
            return res.status(500).json({ message: error.message });
        }

        if (previousPublicId && previousPublicId !== uploaded.publicId) {
            await destroyCloudinaryImage(previousPublicId);
        }

        return res.json({ message: "Profile Picture Updated" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const uploadCoverPicture = async (req, res) => {
    const { token } = req.body;
    const buffer = req.file?.buffer;

    try {
        if (!token || typeof token !== "string") {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await User.findOne({ token: token });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!buffer) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        let uploaded;
        try {
            uploaded = await uploadCoverImage(buffer);
        } catch (error) {
            return res.status(500).json({ message: error.message || "Failed to upload cover photo" });
        }

        const previousPublicId = user.coverPicturePublicId;

        try {
            user.coverPicture = uploaded.url;
            user.coverPicturePublicId = uploaded.publicId;
            await user.save();
        } catch (error) {
            await destroyCloudinaryImage(uploaded.publicId);
            return res.status(500).json({ message: error.message });
        }

        if (previousPublicId && previousPublicId !== uploaded.publicId) {
            await destroyCloudinaryImage(previousPublicId);
        }

        return res.json({ message: "Cover photo updated" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const uploadEducationMedia = async (req, res) => {
    const { token } = req.body;
    const uploaded = req.file?.filename;

    try {
        if (!token || typeof token !== "string") {
            if (uploaded) removeUploadedFile(uploaded);
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await User.findOne({ token }).select("_id");
        if (!user) {
            if (uploaded) removeUploadedFile(uploaded);
            return res.status(404).json({ message: "User not found" });
        }
        if (!uploaded) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const mime = req.file.mimetype || "";
        const type = mime.startsWith("image/") ? "image" : "document";
        const original = String(req.file.originalname || uploaded).slice(0, 200);

        return res.json({
            filename: uploaded,
            name: original,
            type,
        });
    } catch (error) {
        if (uploaded) removeUploadedFile(uploaded);
        return res.status(500).json({ message: error.message });
    }
};

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

        const previousPublicId = user.coverPicturePublicId;
        user.coverPicture = "";
        user.coverPicturePublicId = "";
        await user.save();

        await destroyCloudinaryImage(previousPublicId);

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

        const previousPublicId = user.profilePicturePublicId;
        user.profilePicture = "default.jpg";
        user.profilePicturePublicId = "";
        user.profilePictureFrame = "original";
        await user.save();

        await destroyCloudinaryImage(previousPublicId);

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
           .populate('userId', 'name email username profilePicture coverPicture profilePhotoVisibility profilePictureFrame createdAt');

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
            .populate("userId", "name username profilePicture coverPicture profilePhotoVisibility profilePictureFrame createdAt");

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

        const isConnected = !isOwner && Boolean(await ConnectionRequest.exists({
            status_accepted: true,
            $or: [
                { userId: viewer._id, connectionId: user._id },
                { userId: user._id, connectionId: viewer._id },
            ],
        }));

        return res.json({
            ...data,
            connectionsCount,
            isOwner,
            isConnected,
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

const EDUCATION_DESCRIPTION_MAX = 1000;
const EDUCATION_GRADE_MAX = 80;
const EDUCATION_ACTIVITIES_MAX = 500;
const EDUCATION_SKILL_MAX = 80;
const EDUCATION_SKILLS_LIMIT = 5;
const EDUCATION_MEDIA_NAME_MAX = 200;
const EDUCATION_MEDIA_DESCRIPTION_MAX = 2000;
const PROFILE_SKILL_NAME_MAX = 80;
const PROFILE_SKILL_CATEGORIES = new Set(["", "tools"]);
const PROFILE_SKILL_ASSOCIATION_KINDS = new Set(["education", "experience"]);
const PROFILE_TOOLS_SKILLS = new Set([
    "html", "html5", "css", "cascading style sheets", "cascading style sheets (css)",
    "javascript", "typescript", "react", "react.js", "reactjs", "next.js", "nextjs",
    "node.js", "nodejs", "express", "express.js", "mongodb", "sql", "mysql", "postgresql",
    "python", "java", "c", "c++", "c#", "go", "golang", "php", "ruby", "kotlin", "swift",
    "git", "github", "docker", "kubernetes", "linux", "aws", "azure", "redux",
    "tailwind css", "tailwind", "figma", "excel", "microsoft excel", "microsoft office",
    "powerpoint", "wordpress", "django", "flask", "spring", "android", "ios",
]);
const YYYY_MM = /^\d{4}-(0[1-9]|1[0-2])$/;
const STORED_MEDIA_FILE = /^[a-f0-9]{64}\.(jpg|jpeg|png|gif|webp|pdf|doc|docx)$/i;

const isValidHttpUrl = (value) => {
    try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
};

const normalizeEducationSkills = (value) => {
    if (value === undefined || value === null) return { ok: true, value: [] };
    if (!Array.isArray(value)) return { ok: false, message: "Education skills must be an array" };
    const seen = new Set();
    const next = [];
    for (const item of value) {
        const raw = typeof item === "string" ? item : item?.name;
        const name = asTrimmedString(raw);
        if (name === null) return { ok: false, message: "Education skill names must be strings" };
        if (!name) continue;
        if (name.length > EDUCATION_SKILL_MAX) {
            return { ok: false, message: `Education skill names must be under ${EDUCATION_SKILL_MAX} characters` };
        }
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        next.push({ name });
        if (next.length === EDUCATION_SKILLS_LIMIT) break;
    }
    return { ok: true, value: next };
};

const normalizeEducationMedia = (value) => {
    if (value === undefined || value === null) return { ok: true, value: [] };
    if (!Array.isArray(value)) return { ok: false, message: "Education media must be an array" };
    const next = [];
    for (const item of value) {
        if (item === null || typeof item !== "object" || Array.isArray(item)) continue;
        const type = asTrimmedString(item.type);
        const url = asTrimmedString(item.url);
        const name = asTrimmedString(item.name);
        const description = typeof item.description === "string"
            ? item.description.trim().slice(0, EDUCATION_MEDIA_DESCRIPTION_MAX)
            : "";
        if ([type, url, name].includes(null) || !url) continue;
        if (type === "link") {
            if (!isValidHttpUrl(url)) continue;
            next.push({
                type: "link",
                url,
                name: (name || url).slice(0, EDUCATION_MEDIA_NAME_MAX),
                description,
            });
            continue;
        }
        if ((type === "image" || type === "document") && STORED_MEDIA_FILE.test(url)) {
            next.push({
                type,
                url,
                name: (name || url).slice(0, EDUCATION_MEDIA_NAME_MAX),
                description,
            });
        }
    }
    return { ok: true, value: next };
};

const normalizeEducationArray = (value) => {
    if (!Array.isArray(value)) {
        return { ok: false, message: "education must be an array" };
    }

    const next = [];
    for (const entry of value) {
        if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
            return { ok: false, message: "Each education entry must be an object" };
        }

        const school = asTrimmedString(entry.school);
        const degree = asTrimmedString(entry.degree);
        const fieldOfStudy = asTrimmedString(entry.fieldOfStudy);
        const startDate = asTrimmedString(entry.startDate);
        const endDateRaw = asTrimmedString(entry.endDate);
        const description = asTrimmedString(entry.description);
        const grade = asTrimmedString(entry.grade);
        const activitiesAndSocieties = asTrimmedString(entry.activitiesAndSocieties);
        if ([school, degree, fieldOfStudy, startDate, endDateRaw, description, grade, activitiesAndSocieties].includes(null)) {
            return { ok: false, message: "Education fields must be strings" };
        }

        const current = Boolean(entry.current);
        const endDate = current ? "" : (endDateRaw || "");
        const skillsResult = normalizeEducationSkills(entry.skills);
        if (!skillsResult.ok) return skillsResult;
        const mediaResult = normalizeEducationMedia(entry.media);
        if (!mediaResult.ok) return mediaResult;

        const isEmpty = !school && !degree && !fieldOfStudy && !startDate && !endDate && !current
            && !description && !grade && !activitiesAndSocieties
            && skillsResult.value.length === 0 && mediaResult.value.length === 0;
        if (isEmpty) continue;
        if (!school) {
            return { ok: false, message: "School is required" };
        }
        if (description.length > EDUCATION_DESCRIPTION_MAX) {
            return { ok: false, message: `Education description must be under ${EDUCATION_DESCRIPTION_MAX} characters` };
        }
        if (grade.length > EDUCATION_GRADE_MAX) {
            return { ok: false, message: `Grade must be under ${EDUCATION_GRADE_MAX} characters` };
        }
        if (activitiesAndSocieties.length > EDUCATION_ACTIVITIES_MAX) {
            return { ok: false, message: `Activities and societies must be under ${EDUCATION_ACTIVITIES_MAX} characters` };
        }
        if (startDate && !YYYY_MM.test(startDate)) {
            return { ok: false, message: "Education start date must be YYYY-MM" };
        }
        if (endDate && !YYYY_MM.test(endDate)) {
            return { ok: false, message: "Education end date must be YYYY-MM" };
        }

        const item = {
            school,
            degree: degree || "",
            fieldOfStudy: fieldOfStudy || "",
            startDate: startDate || "",
            endDate,
            current,
            grade: grade || "",
            activitiesAndSocieties: activitiesAndSocieties || "",
            description: description || "",
            skills: skillsResult.value,
            media: mediaResult.value,
        };
        if (entry._id) item._id = entry._id;
        next.push(item);
    }

    return { ok: true, value: next };
};

const EXPERIENCE_DESCRIPTION_MAX = 2000;
const EXPERIENCE_LOCATION_TYPES = new Set(["", "On-site", "Hybrid", "Remote"]);
const EXPERIENCE_EMPLOYMENT_TYPES = new Set([
    "", "Full-time", "Part-time", "Self-employed", "Freelance", "Contract", "Internship", "Apprenticeship", "Seasonal",
]);
const EXPERIENCE_JOB_SOURCES = new Set(["", "LinkedIn", "Company website", "Referral", "Recruiter", "Other"]);

const deriveExperienceYears = (entry) => {
    const start = asTrimmedString(entry.startDate, "") || "";
    const end = asTrimmedString(entry.endDate, "") || "";
    const current = Boolean(entry.current);
    const startLabel = /^\d{4}-\d{2}$/.test(start) ? start.slice(0, 4) : start;
    const endLabel = /^\d{4}-\d{2}$/.test(end) ? end.slice(0, 4) : end;
    if (current && startLabel) return `${startLabel} – Present`;
    if (startLabel && endLabel) return `${startLabel} – ${endLabel}`;
    if (startLabel) return startLabel;
    return asTrimmedString(entry.years, "") || "";
};

const normalizePastWorkArray = (value) => {
    if (!Array.isArray(value)) {
        return { ok: false, message: "pastWork must be an array" };
    }
    const next = [];
    for (const entry of value) {
        if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
            return { ok: false, message: "Each experience entry must be an object" };
        }
        const company = asTrimmedString(entry.company);
        const position = asTrimmedString(entry.position);
        const years = asTrimmedString(entry.years, "");
        const location = asTrimmedString(entry.location, "");
        const locationType = asTrimmedString(entry.locationType, "");
        const employmentType = asTrimmedString(entry.employmentType, "");
        const jobSource = asTrimmedString(entry.jobSource, "");
        const startDate = asTrimmedString(entry.startDate, "");
        const endDateRaw = asTrimmedString(entry.endDate, "");
        const description = asTrimmedString(entry.description, "");
        if ([company, position].includes(null)) {
            return { ok: false, message: "Experience company and position must be strings" };
        }
        if ([location, locationType, employmentType, jobSource, startDate, endDateRaw, description, years].includes(null)) {
            return { ok: false, message: "Experience fields must be strings" };
        }
        if (!EXPERIENCE_LOCATION_TYPES.has(locationType)) {
            return { ok: false, message: "Invalid experience location type" };
        }
        if (!EXPERIENCE_EMPLOYMENT_TYPES.has(employmentType)) {
            return { ok: false, message: "Invalid experience employment type" };
        }
        if (!EXPERIENCE_JOB_SOURCES.has(jobSource)) {
            return { ok: false, message: "Invalid experience job source" };
        }
        if (startDate && !YYYY_MM.test(startDate)) {
            return { ok: false, message: "Experience startDate must be YYYY-MM" };
        }
        const current = Boolean(entry.current);
        const endDate = current ? "" : endDateRaw;
        if (endDate && !YYYY_MM.test(endDate)) {
            return { ok: false, message: "Experience endDate must be YYYY-MM" };
        }
        if (description && description.length > EXPERIENCE_DESCRIPTION_MAX) {
            return { ok: false, message: `Experience description must be under ${EXPERIENCE_DESCRIPTION_MAX} characters` };
        }
        const skillsResult = normalizeEducationSkills(entry.skills);
        if (!skillsResult.ok) return { ok: false, message: skillsResult.message.replace("Education", "Experience") };
        const mediaResult = normalizeEducationMedia(entry.media);
        if (!mediaResult.ok) return mediaResult;
        const empty = !company && !position && !years && !location && !startDate && !endDate && !description
            && skillsResult.value.length === 0 && mediaResult.value.length === 0;
        if (empty) continue;
        const item = {
            company: company || "",
            position: position || "",
            location: location || "",
            locationType,
            employmentType,
            jobSource,
            current,
            startDate: startDate || "",
            endDate,
            description: description || "",
            years: deriveExperienceYears({ ...entry, startDate, endDate, current, years }),
            skills: skillsResult.value,
            media: mediaResult.value,
        };
        if (entry._id) item._id = entry._id;
        next.push(item);
    }
    return { ok: true, value: next };
};

const LANGUAGE_NAME_MAX = 80;
const LANGUAGE_PROFICIENCIES = new Set([
    "",
    "Elementary proficiency",
    "Limited working proficiency",
    "Professional working proficiency",
    "Full professional proficiency",
    "Native or bilingual proficiency",
]);

const normalizeLanguagesArray = (value) => {
    if (!Array.isArray(value)) {
        return { ok: false, message: "languages must be an array" };
    }
    const next = [];
    for (const entry of value) {
        if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
            return { ok: false, message: "Each language entry must be an object" };
        }
        const language = asTrimmedString(entry.language);
        const proficiency = asTrimmedString(entry.proficiency, "");
        if (language === null || proficiency === null) {
            return { ok: false, message: "Language fields must be strings" };
        }
        if (!language) continue;
        if (language.length > LANGUAGE_NAME_MAX) {
            return { ok: false, message: `Language must be under ${LANGUAGE_NAME_MAX} characters` };
        }
        if (!LANGUAGE_PROFICIENCIES.has(proficiency)) {
            return { ok: false, message: "Invalid language proficiency" };
        }
        const item = { language, proficiency };
        if (entry._id) item._id = entry._id;
        next.push(item);
    }
    return { ok: true, value: next };
};

const inferProfileSkillCategory = (name) => (
    PROFILE_TOOLS_SKILLS.has(String(name || "").trim().toLowerCase()) ? "tools" : ""
);

const collectProfileRecordIds = (profile) => ({
    education: new Set((profile?.education || []).map((entry) => String(entry._id))),
    experience: new Set((profile?.pastWork || []).map((entry) => String(entry._id))),
});

const normalizeSkillAssociations = (value, profile) => {
    if (value === undefined || value === null) return { ok: true, value: [] };
    if (!Array.isArray(value)) return { ok: false, message: "Skill associations must be an array" };
    const ids = collectProfileRecordIds(profile);
    const seen = new Set();
    const next = [];
    for (const item of value) {
        if (!item || typeof item !== "object" || Array.isArray(item)) continue;
        const kind = asTrimmedString(item.kind);
        const refId = asTrimmedString(item.refId);
        if (!kind || !refId || !PROFILE_SKILL_ASSOCIATION_KINDS.has(kind)) continue;
        if (kind === "education" && !ids.education.has(refId)) continue;
        if (kind === "experience" && !ids.experience.has(refId)) continue;
        const key = `${kind}:${refId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        next.push({ kind, refId });
    }
    return { ok: true, value: next };
};

const normalizeProfileSkills = (value, profile) => {
    if (value === undefined || value === null) return { ok: true, value: [] };
    if (!Array.isArray(value)) return { ok: false, message: "skills must be an array" };
    const seen = new Set();
    const next = [];
    for (const item of value) {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
            return { ok: false, message: "Each skill must be an object" };
        }
        const name = asTrimmedString(item.name);
        if (name === null) return { ok: false, message: "Skill names must be strings" };
        if (!name) continue;
        if (name.length > PROFILE_SKILL_NAME_MAX) {
            return { ok: false, message: `Skill names must be under ${PROFILE_SKILL_NAME_MAX} characters` };
        }
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        const categoryRaw = asTrimmedString(item.category, "");
        const category = PROFILE_SKILL_CATEGORIES.has(categoryRaw)
            ? categoryRaw
            : inferProfileSkillCategory(name);
        const associations = normalizeSkillAssociations(item.associations, profile);
        if (!associations.ok) return associations;
        const skill = { name, category, associations: associations.value };
        if (item._id) skill._id = item._id;
        next.push(skill);
    }
    return { ok: true, value: next };
};

const pruneProfileSkillAssociations = (profile) => {
    if (!profile?.skills?.length) return;
    const ids = collectProfileRecordIds(profile);
    profile.skills.forEach((skill) => {
        skill.associations = (skill.associations || []).filter((item) => {
            if (item.kind === "education") return ids.education.has(String(item.refId));
            if (item.kind === "experience") return ids.experience.has(String(item.refId));
            return false;
        });
    });
};

const findProfileByToken = async (token) => {
    if (!token || typeof token !== "string") return { error: { status: 401, message: "Unauthorized" } };
    const user = await User.findOne({ token });
    if (!user) return { error: { status: 401, message: "Unauthorized" } };
    const profile = await Profile.findOne({ userId: user._id });
    if (!profile) return { error: { status: 404, message: "Profile not found" } };
    return { user, profile };
};

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
            if (key === "bio") {
                const nextBio = rest[key].trim();
                if (nextBio.length > 2600) {
                    return res.status(400).json({ message: "About must be under 2600 characters" });
                }
                profile_to_update.bio = nextBio;
                continue;
            }
            profile_to_update[key] = rest[key];
        }

        if (rest.pastWork !== undefined) {
            const normalizedWork = normalizePastWorkArray(rest.pastWork);
            if (!normalizedWork.ok) {
                return res.status(400).json({ message: normalizedWork.message });
            }
            profile_to_update.pastWork = normalizedWork.value;
        }
        if (rest.education !== undefined) {
            const normalizedEducation = normalizeEducationArray(rest.education);
            if (!normalizedEducation.ok) {
                return res.status(400).json({ message: normalizedEducation.message });
            }
            profile_to_update.education = normalizedEducation.value;
        }
        if (rest.skills !== undefined) {
            const normalizedSkills = normalizeProfileSkills(rest.skills, profile_to_update);
            if (!normalizedSkills.ok) {
                return res.status(400).json({ message: normalizedSkills.message });
            }
            profile_to_update.skills = normalizedSkills.value;
        }
        if (rest.languages !== undefined) {
            const normalizedLanguages = normalizeLanguagesArray(rest.languages);
            if (!normalizedLanguages.ok) {
                return res.status(400).json({ message: normalizedLanguages.message });
            }
            profile_to_update.languages = normalizedLanguages.value;
        }
        pruneProfileSkillAssociations(profile_to_update);

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

const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const publicSearchPerson = (user, profile, score) => {
    const introLocation = [profile?.intro?.city, profile?.intro?.country].filter(Boolean).join(", ");
    return {
        _id: user._id,
        username: user.username,
        name: user.name,
        profilePicture: user.profilePicture,
        headline: String(profile?.currentPost || "").trim(),
        location: introLocation || String(profile?.location || "").trim(),
        score,
    };
};

export const searchPeople = async (req, res) => {
    try {
        const token = req.body.token || req.query.token;
        const query = String(req.query.query || req.body.query || "").trim();
        const limit = Math.min(50, Math.max(1, Number(req.query.limit || req.body.limit || 8) || 8));

        const viewer = await User.findOne({ token });
        if (!viewer) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (query.length < 3) {
            return res.json({ people: [] });
        }

        const regex = new RegExp(escapeRegex(query), "i");
        const matchedUsers = await User.find({
            _id: { $ne: viewer._id },
            $or: [{ name: regex }, { username: regex }],
        }).select("name username profilePicture").lean();

        const headlineProfiles = await Profile.find({
            userId: { $ne: viewer._id },
            currentPost: regex,
        }).select("userId currentPost location intro").populate("userId", "name username profilePicture").lean();

        const userIds = matchedUsers.map((user) => user._id);
        const matchedProfiles = await Profile.find({ userId: { $in: userIds } })
            .select("userId currentPost location intro")
            .lean();

        const profileByUserId = new Map(
            matchedProfiles.map((profile) => [String(profile.userId), profile])
        );
        const peopleMap = new Map();

        matchedUsers.forEach((user) => {
            const nameMatch = regex.test(String(user.name || ""));
            peopleMap.set(String(user._id), publicSearchPerson(user, profileByUserId.get(String(user._id)), nameMatch ? 0 : 1));
        });

        headlineProfiles.forEach((profile) => {
            const user = profile.userId;
            if (!user?._id || String(user._id) === String(viewer._id)) return;
            const id = String(user._id);
            if (!peopleMap.has(id)) {
                peopleMap.set(id, publicSearchPerson(user, profile, 2));
            }
        });

        const people = [...peopleMap.values()]
            .sort((a, b) => a.score - b.score || String(a.name || "").localeCompare(String(b.name || "")))
            .slice(0, limit)
            .map(({ score, ...person }) => person);

        return res.json({ people });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getAllUserProfile = async (req, res) => {

    try {
        const token = req.body.token || req.query.token;

        const user = await User.findOne({ token });

        if(!user){
            return res.status(404).json({ message: "User not found"})
        }

        const profiles = await Profile.find().populate('userId', 'name username email profilePicture coverPicture');

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

        if (!user_id) {
            return res.status(400).json({ message: "User id is required" });
        }

        const userProfile = await Profile.findOne({ userId: user_id })
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
            connection.acceptedAt = new Date();
            await createNotification({
                recipientId: connection.userId,
                senderId: user._id,
                type: "connection_accept",
                message: `${user.name} accepted your connection request`,
                referenceId: connection._id.toString(),
            });
        } else {
            connection.status_accepted = false;
            connection.acceptedAt = null;
        }

        await connection.save();
        return res.json({ message: "Request Updated" });

    } catch(error){
        return res.status(500).json({ message: error.message});
    }
}

export const removeConnection = async (req, res) => {
    const { token, userId } = req.body;

    try {
        const user = await User.findOne({ token });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!userId) {
            return res.status(400).json({ message: "User id is required" });
        }
        if (String(user._id) === String(userId)) {
            return res.status(400).json({ message: "Cannot remove yourself" });
        }

        const connection = await ConnectionRequest.findOne({
            status_accepted: true,
            $or: [
                { userId: user._id, connectionId: userId },
                { userId: userId, connectionId: user._id },
            ],
        });

        if (!connection) {
            return res.status(404).json({ message: "Connection not found" });
        }

        await ConnectionRequest.deleteOne({ _id: connection._id });
        return res.json({ message: "Connection removed", userId });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getProfileConnectionSuggestions = async (req, res) => {
    const { token, username } = req.body;

    try {
        const viewer = await User.findOne({ token });
        if (!viewer) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const slug = String(username || "").trim();
        if (!slug) {
            return res.status(400).json({ message: "Username is required" });
        }

        const owner = await User.findOne({ username: slug });
        if (!owner) {
            return res.status(404).json({ message: "Profile not found" });
        }

        const viewerIsOwner = String(viewer._id) === String(owner._id);
        const viewerConnected = viewerIsOwner || Boolean(await ConnectionRequest.exists({
            status_accepted: true,
            $or: [
                { userId: viewer._id, connectionId: owner._id },
                { userId: owner._id, connectionId: viewer._id },
            ],
        }));

        if (!viewerConnected) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const ownerRows = await ConnectionRequest.find({
            status_accepted: true,
            $or: [{ userId: owner._id }, { connectionId: owner._id }],
        });

        const ownerPeerIds = ownerRows.map((row) => (
            String(row.userId) === String(owner._id) ? String(row.connectionId) : String(row.userId)
        ));

        const viewerRows = await ConnectionRequest.find({
            $or: [{ userId: viewer._id }, { connectionId: viewer._id }],
        });

        const viewerAccepted = new Set();
        const viewerPending = new Set();
        viewerRows.forEach((row) => {
            const peer = String(row.userId) === String(viewer._id) ? String(row.connectionId) : String(row.userId);
            if (row.status_accepted === true) viewerAccepted.add(peer);
            if (row.status_accepted == null) viewerPending.add(peer);
        });

        const suggestIds = [...new Set(ownerPeerIds)].filter((id) => (
            id
            && id !== String(viewer._id)
            && !viewerAccepted.has(id)
            && !viewerPending.has(id)
        ));

        const profiles = await Profile.find({ userId: { $in: suggestIds } })
            .populate("userId", "name username profilePicture coverPicture");

        return res.json({
            profiles,
            ownerName: owner.name,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const addProfileSkill = async (req, res) => {
    try {
        const { token, name, category } = req.body;
        const found = await findProfileByToken(token);
        if (found.error) return res.status(found.error.status).json({ message: found.error.message });

        const skillName = asTrimmedString(name);
        if (!skillName) return res.status(400).json({ message: "Skill is required" });
        if (skillName.length > PROFILE_SKILL_NAME_MAX) {
            return res.status(400).json({ message: `Skill names must be under ${PROFILE_SKILL_NAME_MAX} characters` });
        }

        const exists = (found.profile.skills || []).some(
            (item) => String(item.name || "").trim().toLowerCase() === skillName.toLowerCase()
        );
        if (exists) return res.status(400).json({ message: "That skill is already added" });

        let nextCategory = inferProfileSkillCategory(skillName);
        if (category !== undefined) {
            const requestedCategory = asTrimmedString(category, "");
            if (!PROFILE_SKILL_CATEGORIES.has(requestedCategory)) {
                return res.status(400).json({ message: "Invalid skill category" });
            }
            nextCategory = requestedCategory;
        }

        found.profile.skills.push({
            name: skillName,
            category: nextCategory,
            associations: [],
        });
        await found.profile.save();
        const skill = found.profile.skills[found.profile.skills.length - 1];
        return res.json({ message: "Skill added", skill, skills: found.profile.skills });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const updateProfileSkill = async (req, res) => {
    try {
        const { token, skillId, associations, category } = req.body;
        const found = await findProfileByToken(token);
        if (found.error) return res.status(found.error.status).json({ message: found.error.message });

        const skill = (found.profile.skills || []).id(skillId);
        if (!skill) return res.status(404).json({ message: "Skill not found" });

        if (associations !== undefined) {
            const normalized = normalizeSkillAssociations(associations, found.profile);
            if (!normalized.ok) return res.status(400).json({ message: normalized.message });
            skill.associations = normalized.value;
        }
        if (category !== undefined) {
            const nextCategory = asTrimmedString(category, "");
            if (!PROFILE_SKILL_CATEGORIES.has(nextCategory)) {
                return res.status(400).json({ message: "Invalid skill category" });
            }
            skill.category = nextCategory;
        }

        pruneProfileSkillAssociations(found.profile);
        await found.profile.save();
        return res.json({ message: "Skill updated", skill, skills: found.profile.skills });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const deleteProfileSkill = async (req, res) => {
    try {
        const { token, skillId } = req.body;
        const found = await findProfileByToken(token);
        if (found.error) return res.status(found.error.status).json({ message: found.error.message });

        const skill = (found.profile.skills || []).id(skillId);
        if (!skill) return res.status(404).json({ message: "Skill not found" });

        skill.deleteOne();
        await found.profile.save();
        return res.json({ message: "Skill deleted", skills: found.profile.skills });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


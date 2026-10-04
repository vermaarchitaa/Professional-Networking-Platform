import { Router } from "express";
import { register, login, uploadProfilePicture, deleteProfilePicture, updateProfilePhotoVisibility, updateProfilePictureFrame, uploadCoverPicture, deleteCoverPicture, uploadEducationMedia, updateUserProfile, getUserAndProfile, getProfileByUsername, updateProfileData, addProfileSkill, updateProfileSkill, deleteProfileSkill, getAllUserProfile, searchPeople, downloadProfile, sendConnectionRequest, acceptConnectionRequest, removeConnection, getProfileConnectionSuggestions, whatAreMyConnections, getMyConnectionsRequests } from "../controllers/user.controller.js";
import { profilePictureUpload, coverPhotoUpload, educationMediaUpload } from "../utils/uploads.js";
const router = Router();

router.route("/update_profile_picture")
.post(profilePictureUpload.single('profile_picture'), uploadProfilePicture);
router.route("/delete_profile_picture")
.post(deleteProfilePicture);
router.route("/update_profile_photo_visibility")
.post(updateProfilePhotoVisibility);
router.route("/update_profile_picture_frame")
.post(updateProfilePictureFrame);
router.route("/update_cover_picture")
.post(coverPhotoUpload.single('cover_picture'), uploadCoverPicture);
router.route("/delete_cover_picture")
.post(deleteCoverPicture);
router.route("/upload_education_media")
.post(educationMediaUpload.single("media"), uploadEducationMedia);

router.route('/register').post(register);
router.route('/login').post(login);
router.route('/user_update').post(updateUserProfile); 
router.route('/get_user_and_profile').post(getUserAndProfile);
router.route('/get_profile_by_username').post(getProfileByUsername);
router.route("/update_profile_data").post(updateProfileData);
router.route("/add_profile_skill").post(addProfileSkill);
router.route("/update_profile_skill").post(updateProfileSkill);
router.route("/delete_profile_skill").post(deleteProfileSkill);
router.route("/user/get_all_users").get(getAllUserProfile);
router.route("/user/search_people").get(searchPeople);
router.route("/user/download_resume").get(downloadProfile);
router.route("/user/send_connection_request").post(sendConnectionRequest);
router.route("/user/getConnectionRequests").post(getMyConnectionsRequests);
router.route("/user/user_connection_request").get(whatAreMyConnections);
router.route("/user/accept_connection_request").post(acceptConnectionRequest);
router.route("/user/remove_connection").post(removeConnection);
router.route("/user/get_profile_connection_suggestions").post(getProfileConnectionSuggestions);

export default router;


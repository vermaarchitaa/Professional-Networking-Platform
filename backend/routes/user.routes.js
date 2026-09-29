import { Router } from "express";
import { register, login, uploadProfilePicture, uploadCoverPicture, updateUserProfile, getUserAndProfile, updateProfileData, getAllUserProfile, downloadProfile, sendConnectionRequest, acceptConnectionRequest, whatAreMyConnections, getMyConnectionsRequests } from "../controllers/user.controller.js";
import { profilePictureUpload, coverPhotoUpload } from "../utils/uploads.js";
const router = Router();

router.route("/update_profile_picture")
.post(profilePictureUpload.single('profile_picture'), uploadProfilePicture);
router.route("/update_cover_picture")
.post(coverPhotoUpload.single('cover_picture'), uploadCoverPicture);

router.route('/register').post(register);
router.route('/login').post(login);
router.route('/user_update').post(updateUserProfile); 
router.route('/get_user_and_profile').post(getUserAndProfile);
router.route("/update_profile_data").post(updateProfileData);
router.route("/user/get_all_users").get(getAllUserProfile);
router.route("/user/download_resume").get(downloadProfile);
router.route("/user/send_connection_request").post(sendConnectionRequest);
router.route("/user/getConnectionRequests").post(getMyConnectionsRequests);
router.route("/user/user_connection_request").get(whatAreMyConnections);
router.route("/user/accept_connection_request").post(acceptConnectionRequest);

export default router;


import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { me, updateProfile, follow, unfollow, suggestions, getProfileByUsername, listFollowers, listFollowing, requestFriend, cancelFriendRequest, acceptFriend, removeFriend, listFriends, listFriendRequests, setFriendList, getFriendLists, searchUsers } from '../controllers/user.controller.js';

const router = Router();

router.get('/me', authRequired, me);
router.patch('/me', authRequired, updateProfile);
router.post('/:id/follow', authRequired, follow);
router.post('/:id/unfollow', authRequired, unfollow);
router.get('/suggestions', authRequired, suggestions);
router.get('/search', authRequired, searchUsers);
router.get('/profile/:username', authRequired, getProfileByUsername);
router.get('/:username/followers', authRequired, listFollowers);
router.get('/:username/following', authRequired, listFollowing);
router.get('/:username/friends', authRequired, listFriends);
router.get('/me/friend-requests', authRequired, listFriendRequests);
router.get('/me/friend-lists', authRequired, getFriendLists);
router.post('/:id/friend/request', authRequired, requestFriend);
router.post('/:id/friend/cancel', authRequired, cancelFriendRequest);
router.post('/:id/friend/accept', authRequired, acceptFriend);
router.post('/:id/friend/remove', authRequired, removeFriend);
router.post('/:id/friend/list', authRequired, setFriendList);

export default router;

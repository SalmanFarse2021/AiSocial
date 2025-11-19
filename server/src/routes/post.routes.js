import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { create, getUserPosts, feed, listVideos, likePost, unlikePost, addComment, listComments, deletePost, updatePost, reactPost, unreactPost, sharePost, pinPost, unpinPost, listTaggedPhotos, searchPosts, searchHashtags, likeComment, unlikeComment, replyToComment, getReplies, votePoll, clearPollVote } from '../controllers/post.controller.js';

const router = Router();

router.post('/', authRequired, create);
router.get('/user/:username', authRequired, getUserPosts);
router.get('/feed', authRequired, feed);
router.get('/videos', authRequired, listVideos);
router.get('/search', authRequired, searchPosts);
router.post('/:id/like', authRequired, likePost);
router.post('/:id/unlike', authRequired, unlikePost);
router.post('/:id/react', authRequired, reactPost);
router.delete('/:id/react', authRequired, unreactPost);
router.post('/:id/share', authRequired, sharePost);
router.post('/:id/pin', authRequired, pinPost);
router.post('/:id/unpin', authRequired, unpinPost);
router.get('/tagged/:username', authRequired, listTaggedPhotos);
router.get('/:id/comments', authRequired, listComments);
router.post('/:id/comments', authRequired, addComment);
router.post('/:postId/comments/:commentId/like', authRequired, likeComment);
router.delete('/:postId/comments/:commentId/like', authRequired, unlikeComment);
router.post('/:postId/comments/:commentId/reply', authRequired, replyToComment);
router.get('/:postId/comments/:commentId/replies', authRequired, getReplies);
router.post('/:id/poll/vote', authRequired, votePoll);
router.delete('/:id/poll/vote', authRequired, clearPollVote);
router.delete('/:id', authRequired, deletePost);
router.patch('/:id', authRequired, updatePost);

export default router;

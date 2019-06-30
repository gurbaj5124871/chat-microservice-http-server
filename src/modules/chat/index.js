const express       = require('express'),
    router          = express.Router(),
    authentication  = require('../../utils/authentication'),
    resource        = require('../../utils/constants').resource,
    accessAllowed   = require('../../utils/authorization').accessAllowed,
    validator       = require('./chat-validator'),
    controller      = require('./chat-controller');

router.get('/single', authentication.verifyToken, validator.getSingleConversation, controller.getSingleConversation)

router.get('/:conversationId', authentication.verifyToken, validator.getConversationById, controller.getConversationById)

router.get('/:conversationId/messages', authentication.verifyToken, validator.getMessages, controller.getMessages)

router.post('/:conversationId/block', authentication.verifyToken, controller.blockConversation)

router.delete('/:conversationId/unblock', authentication.verifyToken, controller.unblockConversation)

router.delete('/:conversationId/unreadCount', authentication.verifyToken, controller.clearUnreadCount)

module.exports      = router
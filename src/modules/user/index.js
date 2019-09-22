const express       = require('express'),
    router          = express.Router(),
    authentication  = require('../../utils/authentication'),
    resource        = require('../../utils/constants').resource,
    accessAllowed   = require('../../utils/authorization').accessAllowed,
    validator       = require('./user-validator'),
    controller      = require('./user-controller');

router.get('/conversations', authentication.verifyToken, validator.getUserConversations, controller.getUserConversations)

router.get('/conversationsCached', authentication.verifyToken, validator.getUserConversationsCached, controller.getUserConversationsCached)

router.post('/customer/follow/serviceProvider', authentication.verifyToken, accessAllowed('create', resource.follow), validator.followServiceProvider, controller.followServiceProvider)

router.post('/customer/unfollow/serviceProvider', authentication.verifyToken, accessAllowed('create', resource.follow), validator.unfollowServiceProvider, controller.unfollowServiceProvider)

module.exports      = router
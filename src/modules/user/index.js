const express       = require('express'),
    router          = express.Router(),
    authentication  = require('../../utils/authentication'),
    resource        = require('../../utils/constants').resource,
    accessAllowed   = require('../../utils/authorization').accessAllowed,
    validator       = require('./user-validator'),
    controller      = require('./user-controller');

router.get('/conversations', authentication.verifyToken, validator.getUserConversations, controller.getUserConversations)

module.exports      = router
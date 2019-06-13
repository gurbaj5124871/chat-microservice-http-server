const express       = require('express'),
    router          = express.Router(),
    authentication  = require('../../utils/authentication'),
    resource        = require('../../utils/constants').resource,
    accessAllowed   = require('../../utils/authorization').accessAllowed,
    validator       = require('./chat-validator'),
    controller      = require('./chat-controller');

router.get('/single', authentication.verifyToken, validator.getSingleConversation, controller.getSingleConversation)

module.exports      = router
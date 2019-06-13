'use strict'

const chatServices              = require('./chat-services'),
    errify                      = require('../../utils/errify'),
    errMsg                      = require('../../utils/error-messages');

const getSingleConversation     = async (req, res, next) => {
    try {
        const {other_user_id: otherUserId} = req.query;
        if (otherUserId === req.user.userId)
            return next(errify.unauthorized(errMsg['2000'], 2000));
        const conversationResult= await chatServices.getConversationBetweenTwoUsers(req.user.userId, otherUserId)
        const conversation      = conversationResult.rowLength ? conversationResult.rows[0]: await chatServices.createConversationBetweenTwoUsers(req.user, otherUserId);
        if(conversationResult.rowLength) {
            const conversationBlockStatus = await chatServices.getConversationsBlockStatus(conversationResult.rows)
            conversation.is_other_user_blocked = conversationBlockStatus.get(conversation.conversation_id.toString())
        }
        return res.send(conversation)
    } catch (err) {
        next(err)
    }
}


module.exports          = {
    getSingleConversation 
}
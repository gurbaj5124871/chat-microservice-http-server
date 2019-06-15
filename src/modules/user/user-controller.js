'use strict'

const userServices              = require('./user-services'),
    chatServices                = require('../chat/chat-services'),
    errify                      = require('../../utils/errify'),
    errMsg                      = require('../../utils/error-messages');

const getUserConversations      = async (req, res, next) => {
    try {
        const userId            = req.user.userId, {page_state: pageState, limit} = req.query;
        const conversationResult= await userServices.getUserConversations(userId, limit, pageState)
        const conversations     = conversationResult.rows
        if(conversationResult.rowLength) {
            const unreadCount   = await chatServices.getUnreadCounts(userId, conversations.map(convo => convo.conversation_id))
            const isUserBlocked = await chatServices.getConversationsBlockStatus(conversations)
            const otherUserDetails = await userServices.getUsersBasicDetailsFromConversations(conversations)
            for(let i=0; i<conversationResult.rowLength; i+=1) {
                let conversation                = conversations[i]
                conversation.unread_count       = unreadCount[i]
                conversation.other_user_blocked = isUserBlocked.get(conversation.conversation_id.toString()) || null
                if(conversation.other_user_id)  {
                    const {name: other_user_name, imageUrl: other_user_image_url} = otherUserDetails.get(conversation.conversation_id.toString())
                    conversation    = Object.assign(conversation, {other_user_name, other_user_image_url})
                } else conversation    = Object.assign(conversation, {other_user_name: null, other_user_image_url: null})
            }
        }
        return res.send(userServices.paginateConversations(conversations, limit, conversationResult.pageState))
    } catch (err) {
        next(err)
    }
}


module.exports          = {
    getUserConversations
}
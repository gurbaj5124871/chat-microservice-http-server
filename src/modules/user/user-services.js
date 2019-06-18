const cassandra             = require('../../../bootstrap/cassandra').client,
    cassandraDriver         = require('cassandra-driver'),
    {redis, redisKeys}      = require('../../utils/redis'),
    mongoCollections        = require('../../utils/mongo'),
    chatServices            = require('../chat/chat-services'),
    constants               = require('../../utils/constants'),
    logger                  = require('../../utils/logger'), 
    universalFunc           = require('../../utils/universal-functions'),
    accessControl           = require('../../utils/authorization').accessControl,
    resource                = constants.resource;

const getUserConversations  = (userId, fetchSize=10, pageState) => {
    const query             = `
        SELECT conversation_id, user_id, other_user_id, conversation_type, conversation_user_type, last_message_id, is_muted, 
        toTimestamp(last_message_id) as last_message_time, last_message_content, last_message_sender_id, last_message_type, 
        is_blocked, is_deleted, image_url FROM conversations_by_time WHERE user_id = ?`;
    return cassandra.execute(query, [userId], {prepare: true, fetchSize, pageState});
}

const getCustomersBasicDetailsWithoutCache = async (customerIds=[]) => {
    const result            = new Map();
    if(customerIds.length)  {
        const criteria      = {_id: {$in: customerIds.map(id => universalFunc.mongoUUID(id))}}
        const projections   = {firstName: 1, lastName: 1, imageUrl: 1}
        const customers     = await mongodb.collection(mongoCollections.customers).find(criteria, projections).toArray()
        for(let customer of customers)
            result.set(customer._id.toString(), Object.assign(customer, {name: `${customer.firstName} ${customer.lastName}`, userType: constants.userRoles.customer}))
    }
    return result
}

const getServiceProvidersBasicDetailsWithoutCache = async (serviceProviderIds=[]) => {
    const result            = new Map();
    if(serviceProviderIds.length) {
        const criteria      = {_id: {$in: serviceProviderIds.map(id => universalFunc.mongoUUID(id))}}
        const serviceProviders  = await mongodb.collection(mongoCollections.serviceproviders).find(criteria, {name: 1, imageUrl: 1}).toArray()
        for(let serviceProvider of serviceProviders)
            result.set(serviceProvider._id.toString(), Object.assign(serviceProvider, {userType: constants.userRoles.serviceProvider}))
    }
    return result
}

const getUsersBasicDetailsFromConversations  = async conversations => {
    const conversationUserType  = conversations[0].conversation_user_type, unCachedUsers = [];
    const userIds               = conversations.map(convo => {
        if(convo.other_user_id)
            return convo.other_user_id
    })
    const usersBasicDetails     = await redis.mget(userIds)
    const response              = new Map()
    for(let i=0; i<userIds.length; i+=1) {
        if(usersBasicDetails[i] === null)
            unCachedUsers.push(userIds[i])
        else response.set(userIds[i], JSON.parse(usersBasicDetails[i]))
    }
    if(unCachedUsers.length) {
        const result = conversationUserType === constants.userRoles.customer ? await getCustomersBasicDetailsWithoutCache(unCachedUsers) 
            : await getServiceProvidersBasicDetailsWithoutCache(unCachedUsers);
        const pipeline          = redis.pipeline()
        result.forEach((userId, basicDetails) => {
            pipeline.setex(redisKeys.user(userId), universalFunc.convertDaysToSeconds(30), JSON.stringify(basicDetails))
            result.set(userId, basicDetails)
        })
        await pipeline.exec()
    }
    return response
}

const paginateConversations = (conversations, limit, pageState) => {
    const result    = {conversations};
    if (conversations.length < limit)
        result.next = 'false';
    else result.next = `?limit=${limit}&page_state=${pageState}`;
    return result;
}

const getCustomerServiceProviderFollowHistory = async (customerId, serviceProviderId) => {
    customerId = universalFunc.mongoUUID(customerId); serviceProviderId = universalFunc.mongoUUID(serviceProviderId);
    const follow    = await mongodb.collection(mongoCollections.followings).findOne({customerId, serviceProviderId}, {_id: 1, isDeleted: 1})
    return follow !== null ? (follow.isDeleted === false ? {follow: true, followId: follow._id} : {follow: false, followId: follow._id}) : {follow: false, followId: null}
}

const followServiceProvider     = async (customerId, serviceProviderId, followHistory) => {
    let response                = {mqttTopics: []}
    customerId = universalFunc.mongoUUID(customerId); serviceProviderId = universalFunc.mongoUUID(serviceProviderId);
    if(followHistory.followId === null) {
        const spChannel         = await chatServices.getServiceProviderDefaultChannel(serviceProviderId.toString())
        const channelId         = spChannel.conversation_id.toString()
        const followDocument    = {
            customerId, serviceProviderId, mqttTopics: [`${serviceProviderId}-${channelId}`],
            createdAt: new Date(), followedAt: new Date(), isDeleted: false
        }
        await mongodb.collection(mongoCollections.followings).insertOne(followDocument)
        // create channel conversation for customer
        const cpChannelQuery    = `INSERT INTO conversations (conversation_id, user_id, other_user_id, conversation_type,
            conversation_user_type, last_message_id, last_message_content, last_message_sender_id, last_message_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const params            = [
            spChannel.conversation_id, customerId.toString(), serviceProviderId.toString(), constants.conversationTypes.channel, constants.userRoles.customer,
            spChannel.last_message_id, spChannel.last_message_content, spChannel.last_message_sender_id, spChannel.last_message_type
        ]
        await cassandra.execute(cpChannelQuery, params, {prepare: true})
        response                = {mqttTopics: followDocument.mqttTopics}
    } else {
        await blockUnblockAllConversations(false, customerId, serviceProviderId)
        const criteria          = {_id: followHistory.followId, customerId, serviceProviderId}
        await mongodb.collection(mongoCollections.followings).updateOne(criteria, {$set: {isDeleted: false, followedAt: new Date()}})
        response                = await mongodb.collection(mongoCollections.followings).findOne(criteria, {mqttTopics: 1})
    }
    await Promise.all([
        mongodb.collection(mongoCollections.customers).updateOne({_id: customerId}, {$inc: {noOfBusinessesFollowed: 1}}),
        mongodb.collection(mongoCollections.serviceproviders).updateOne({_id: serviceProviderId}, {$inc: {noOfCustomersFollowing: 1}})
    ])
    return response
}

const unfollowServiceProvider   = async (customerId, serviceProviderId) => {
    customerId = universalFunc.mongoUUID(customerId); serviceProviderId = universalFunc.mongoUUID(serviceProviderId);
    const criteria              = {customerId, serviceProviderId, isDeleted: false}
    const follow                = await mongodb.collection(mongoCollections.followings).findOne(criteria, {mqttTopics: 1})
    if(follow !== null)         {
        // block all conversations
        await blockUnblockAllConversations(true, customerId, serviceProviderId)
        await mongodb.collection(mongoCollections.followings).updateOne(criteria, {$set: {isDeleted: true}})
        await Promise.all([
            mongodb.collection(mongoCollections.customers).updateOne({_id: customerId}, {$inc: {noOfBusinessesFollowed: -1}}),
            mongodb.collection(mongoCollections.serviceproviders).updateOne({_id: serviceProviderId}, {$inc: {noOfCustomersFollowing: -1}})
        ])
        return {mqttTopics: follow.mqttTopics}
    } else return {mqttTopics: []}
}

async function blockUnblockAllConversations (blockConversation, customerId, serviceProviderId) {
    customerId = customerId.toString(); serviceProviderId = serviceProviderId.toString()
    const conversationQuery     = `SELECT conversation_id, conversation_type FROM conversation_by_pairs WHERE user_id = ? AND other_user_id = ?`
    const [cpConvo, spConvo]    = await Promise.all([
        cassandra.execute(conversationQuery, [customerId, serviceProviderId], {prepare: true}),
        cassandra.execute(conversationQuery, [serviceProviderId, customerId], {prepare: true})
    ])
    if(cpConvo.rowLength)       {
        // const conversationIds   = cpConvo.rows.map(convo => convo.conversation_id)
        const unblockQuery      = `UPDATE conversations SET is_blocked = ? WHERE conversation_id = ? AND user_id = ? AND conversation_type = ?`;
        const batch             = cpConvo.rows.map(convo => {return {query: unblockQuery, params: [blockConversation, convo.conversation_id, customerId, convo.conversation_type]}})
        if(spConvo.rowLength)
            batch.push(...spConvo.rows.map(convo => {return {query: unblockQuery, params: [blockConversation, convo.conversation_id, serviceProviderId, convo.conversation_type]}}))
        await cassandra.batch(batch, {prepare: true})
    } 
}

/**************************** PERMISSIONS and VALIDITY ***********************************/

const getUserConversationsPermission    = (requestUser, userId) => {
    if (requestUser.userId === userId)
        return accessControl.can(requestUser.roles).readOwn(resource.conversations).granted
    else
        return accessControl.can(requestUser.roles).readAny(resource.conversations).granted
}

module.exports          = {
    getUserConversations,
    getCustomersBasicDetailsWithoutCache,
    getServiceProvidersBasicDetailsWithoutCache,
    getUsersBasicDetailsFromConversations,
    paginateConversations,
    getCustomerServiceProviderFollowHistory,
    followServiceProvider,
    unfollowServiceProvider,


    // Permissions and Valadities
    getUserConversationsPermission
}
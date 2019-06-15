const cassandra             = require('../../../bootstrap/cassandra').client,
    cassandraDriver         = require('cassandra-driver'),
    {redis, redisKeys}      = require('../../utils/redis'),
    mongoCollections        = require('../../utils/mongo'),
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

    // Permissions and Valadities
    getUserConversationsPermission
}
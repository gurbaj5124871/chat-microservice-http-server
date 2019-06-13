const AccessControl = require('accesscontrol'),
    constants       = require('../utils/constants'),
    resource        = constants.resource;
let role            = {};

const accessControl = new AccessControl()
for(let key in constants.accessRoles)
    role = Object.assign(role, constants.accessRoles[key])

// Customer Specific
accessControl
    .grant(role.customer)
    .readAny(resource.businessTypes)
    .readAny(resource.businessSubTypes)
    .readAny(resource.serviceProvider, [
        '*', '!password', '!isAdminVerified', '!isBlocked', '!isDeleted', '!lastActivityAt', '!ownershipType', '!noOfCustomersFollowing',
        '!isEmailVerified', '!isPhoneVerified', '!emailVerificationToken', '!phoneVerificationToken', '!businessModelTypes'
    ])
    .readAny(resource.customer, [
        '*', '!password', '!emailVerificationToken', '!phoneVerificationToken', '!facebookId', '!googleId','!dob', '!lastActivityAt',
        '!googleLocation', '!noOfBusinessesFollowed', '!isBlocked', '!isDeleted', '!isEmailVerified', '!isPhoneVerified', '!gender'
    ])
    .readOwn(resource.customer, ['*', '!password', '!emailVerificationToken', '!phoneVerificationToken', '!lastActivityAt'])
    .updateOwn(resource.customer)

// Service Provider Specific
accessControl
    .grant(role.serviceProvider)
    .readAny(resource.businessTypes)
    .create(resource.businessTypes)
    .readAny(resource.businessSubTypes)
    .create(resource.businessSubTypes)
    .readAny(resource.serviceProvider, [
        '*', '!password', '!isAdminVerified', '!isBlocked', '!isDeleted', '!lastActivityAt', '!ownershipType', '!businessSubTypes',
        '!isEmailVerified', '!isPhoneVerified', '!emailVerificationToken', '!phoneVerificationToken', '!businessModelTypes', '!noOfCustomersFollowing'
    ])
    .readOwn(resource.serviceProvider, ['*', '!password', '!emailVerificationToken', '!phoneVerificationToken', '!lastActivityAt'])
    .readAny(resource.customer, [
        '*', '!password', '!emailVerificationToken', '!phoneVerificationToken', '!facebookId', '!googleId','!dob', '!lastActivityAt',
        '!googleLocation', '!noOfBusinessesFollowed', '!isBlocked', '!isDeleted', '!isEmailVerified', '!isPhoneVerified', '!gender'
    ])
    .updateOwn(resource.serviceProvider)

// Admin Specific
accessControl
    .grant(role.admin)
    .create(resource.admin)
    .readAny(resource.businessTypes)
    .create(resource.businessTypes)
    .updateAny(resource.businessTypes)
    .create(resource.businessSubTypes)
    .readAny(resource.businessSubTypes)
    .updateAny(resource.businessSubTypes)
    .create(resource.serviceProvider)
    .create(resource.customer)
    .readAny(resource.serviceProvider, ['!password','!emailVerificationToken', '!phoneVerificationToken', '!facebookId', '!googleId'])
    .readAny(resource.customer, ['!password','!emailVerificationToken', '!phoneVerificationToken', '!facebookId', '!googleId'])
    .readAny(resource.allServiceProviders, ['!password','!emailVerificationToken', '!phoneVerificationToken', '!facebookId', '!googleId'])
    .readAny(resource.allCustomers, ['!password','!emailVerificationToken', '!phoneVerificationToken', '!facebookId', '!googleId'])
    .updateAny(resource.serviceProvider)
    .updateAny(resource.customer)

const accessAllowed = (actionName, resource) => {
    return (req, res, next) => {
        try {
            const permission = accessControl.can(req.user.roles)[actionName](resource)
            if (permission.granted === true)
                next()
            else
                next(new Error())
        } catch (err) {
            next(err)
        }
    }
}

module.exports      = {
    accessAllowed,
    accessControl
}

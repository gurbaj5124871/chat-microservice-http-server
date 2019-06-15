'use strict'

const collections   = {
    customers       : 'customers',
    serviceproviders: 'serviceproviders',
    customermqtts   : 'customermqtts',
    serviceprovidermqtts: 'serviceprovidermqtts'
}

module.exports      = {mongoDb: global.mongoDb, collections}
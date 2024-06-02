const URL = {
    AUTH: {
        getAllUser: '/get-all-user',
        login: '/login',
        register: '/register',
        requestReset: '/request-reset',
        resetPassword: '/reset-password',
    }
}

const RESPONSE = {
    ERROR: false,
    SUCCESS: true,
    CODE: {
        SUCCEED: 200,
        BAD_REQUEST: 400,
        URL_NOT_FOUND: 404,
        INTERNAL_SERVER_ERROR: 500,
    }
}

module.exports = {URL, RESPONSE};
const URL = {
    AUTH: {
        getAllUser: '/get-all-user',
        login: '/login',
        userInfo: '/user-info',
        register: '/register',
        requestReset: '/request-reset',
        resetPassword: '/reset-password',
    },
    MATERI: {
        getAllMateri: '/get-all-materi',
        getAllSubMateri: '/get-all-sub-materi',
        initUserMateri: '/init-users-learning-subject',
        initUserSubMateri: '/init-users-learning-sub-subject',
        updateMateriStatus: '/update-sub-subject-status',
        finishSubMateri: '/finish-sub-materi',
    },
    REWARD: {
        getAllReward: '/get-all-reward',
        getHistoryReward: '/get-history-reward',
        attemptReward: '/attempt-reward',
    },
    PRAYING: {
        getAllPraying: '/get-all-praying',
        getHistoryPraying: '/get-history-praying',
        attemptPraying: '/attempt-praying',
    }
}

const RESPONSE = {
    ERROR: false,
    SUCCESS: true,
    CODE: {
        SUCCEED: 200,
        UNAUTHORIZED: 401,
        BAD_REQUEST: 400,
        URL_NOT_FOUND: 404,
        INTERNAL_SERVER_ERROR: 500,
    }
}

module.exports = {URL, RESPONSE};
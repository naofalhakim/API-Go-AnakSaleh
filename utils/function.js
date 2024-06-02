const generateResponse = (status, code, message, data) =>{
    return data ? {
        status, code, message, data
    } : {
        status, code, message,
    }
}

module.exports = {generateResponse}
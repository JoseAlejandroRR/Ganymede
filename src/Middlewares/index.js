import Authentication from './Auth'

const validURL = (req, res, next) => {
    const url = req.body.callbackUrl || null
    const valid = url.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g)
    
    if (valid === null || url === null) {
        return res
            .status(500)
            .send({message: 'field callbackUrl is an invalid URL'})
    } 

    next()
}

exports.Authentication = Authentication
exports.ValidURL = validURL
import jwt from 'jwt-simple'
import moment from 'moment'

module.exports = (req, res, next) => {

  if (!req.headers.authorization) {
    return res
      .status(403)
      .send({ message: 'ACCESS_TOKEN_MISSING' })
  }
  
  try {

    var token = req.headers.authorization.split(' ')[1]
    var accessToken = jwt.decode(token, req.PRIVATE_KEY, true)

    if (accessToken.exp <= moment().unix()) {
      return res
        .status(401)
        .send({ message: 'ACCESS_TOKEN_EXPIRED' })
    }

  } catch (err) {
    console.log('ACCESS ERROR: ' + err)
    return res
      .status(500)
      .send({ message: 'ACCESS_TOKEN_INVALID' })
  }

  next()
}
'use strict'
const config = {apiKey: 'UQZeWSi0ojtcrpmwK0GYuwvKzvLbBq9xvxCSKm0f'}
const request = require('request-json')
const client = request.createClient('https://api.nasa.gov/planetary/')

function serverError(body) {
    return {error_code: 'SERVER_ERROR', message: 'Server returned an error', error: body.error}
}

function unknownError() {
    return {error_code: 'UNKNOWN_PARSE_ERROR', message: 'Unknown error occurred extracting picture out of response'}
}

function clientError(error) {
    return {error_code: 'HTTP_CLIENT_ERROR', message: 'Http client reported an error', error: error}
}

function extractPicture(body) {
    const pictureUrl = body.url
    const description = body.explanation || 'No explanation provided'
    const mediaType = body.media_type

    if (pictureUrl && mediaType) {
        return {url: pictureUrl, media_type: mediaType, description: description}
    }

    return null
}

function extractPictureOrErrorFromBody(body, handler) {
    const picture = extractPicture(body)
    if (picture) {
        handler(picture, null)
    } else {
        console.log('No picture in response: ' + JSON.stringify(body))
        const error = serverError(body) || unknownError()
        handler(null, error)
    }
}

module.exports.fetchPictures = function (date, handler) {
    const path = 'apod?date=' + encodeURIComponent(date) + '&api_key=' + encodeURIComponent(config.apiKey)
    client.get(path, (error, response, body) => {            
        if (error) {
            handler(null, clientError(error))
        } else {
            extractPictureOrErrorFromBody(body, handler)            
        }
    })
}

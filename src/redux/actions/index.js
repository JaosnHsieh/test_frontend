import axios from 'axios'
import types from '../action-types'
import get from 'lodash.get'

// lodash
const _ = {
  get,
}

const apiEndpoints = {
  newEvents: 'new-alarm-events/',
  viewEvent: 'event-viewed/event-id/',
}

const LIMIT = 10
const OFFSET = 0

const apiConfig = {
  protocol: 'http',
  host: 'localhost',
  port: 8080,
  version: '/v1/',
  timeout: 3000,
}

/**
 * Generate api url
 *
 * @param {string} path uri
 * @param {bool} toEncode=true bool to encodeURI(path)
 * @returns {string} url to fetch from api layer
 */
const formAPIURL = (path, toEncode = true) => {
  const _path = toEncode ? encodeURI(path) : path
  /* For build docker image
  const host = apiConfig.host

  console.log('__SERVER__', __SERVER__)
  if (__SERVER__) {
    host = 'api'
  }
  console.log('host:', host)
  */

  // TODO add switch case to adpot production api configuration
  return `${apiConfig.protocol}://${apiConfig.host}:${apiConfig.port}${apiConfig.version}${_path}`
}

export function createEvent(event) {
  const path = apiEndpoints.newEvents
  const url = formAPIURL(path)
  return axios.post(url, event, {
    timeout: apiConfig.timeout,
  }).then(() => {
    return Promise.resolve()
  }).catch((error) => {
    return Promise.reject(error)
  })
}

/**
 * Mark event with eventID with viewed status
 *
 * @param {number} eventID event_id in the database
 * @returns {object} a Promise
 */
export function viewEvent(eventID) {
  // dispatch are passed by redux.connect
  return (dispatch) => {
    const path = `${apiEndpoints.viewEvent}`
    const url = formAPIURL(path)
    dispatch({
      type: types.START_TO_VIEW_EVENT,
    })

    return axios.post(url, {
      event_id: eventID,
    }, {
      timeout: apiConfig.timeout,
    }).then(() => {
      dispatch({
        type: types.VIEWED_EVENT,
        payload: {
          eventID,
        },
      })
      return Promise.resolve()
    }).catch((error) => {
      dispatch({
        type: types.ERROR_TO_VIEW_EVENT,
        payload: {
          error,
          eventID,
        },
      })
      return Promise.reject(error)
    })
  }
}

/**
 * Fetch events from api layer
 *
 * @param {string} url to fetch
 * @param {string} type=types.GET_LATEST_EVENTS action type
 * @returns {function}
 */
export function fetchEvents(url, type = types.GET_LATEST_EVENTS) {
  // dispatch, getState are passed by redux.connect
  return (dispatch) => {
    dispatch({
      type: types.START_TO_GET_EVENTS,
      url,
    })

    return axios.get(url, {
      timeout: apiConfig.timeout,
    }).then((response) => {
      const data = _.get(response, 'data.data', {})
      const total = _.get(data, 'total', 0)
      const events = _.get(data, 'events', [])
      const limit = _.get(data, 'limit', LIMIT)
      const offset = _.get(data, 'offset', OFFSET)
      dispatch({
        type,
        payload: {
          items: events,
          total,
          limit,
          offset,
        },
      })
    }).catch((err) => {
      dispatch({
        type: types.ERROR_TO_GET_EVENTS,
        payload: {
          error: err,
        },
      })
    })
  }
}

/**
 * Fetch latest events
 *
 * @param {number} offset=0 events you want to skip
 * @param {number} limit=5 events number you want per request
 * @returns {function}
 */
export function fetchLatestEvents(offset = 0, limit = 5) {
  return (dispatch) => {
    const path = `${apiEndpoints.newEvents}?limit=${limit}&offset=${offset}`
    const url = formAPIURL(path)

    return fetchEvents(url, types.GET_LATEST_EVENTS)(dispatch)
  }
}


/**
 * Fetch older events
 *
 * @param {number} offset=0 events you want to skip
 * @param {number} limit=5 events number you want per request
 * @returns {function}
 */
export function fetchOlderEvents(offset = 0, limit = 5) {
  return (dispatch) => {
    const path = `${apiEndpoints.newEvents}?limit=${limit}&offset=${offset}`
    const url = formAPIURL(path)

    return fetchEvents(url, types.GET_OLDER_EVENTS)(dispatch)
  }
}

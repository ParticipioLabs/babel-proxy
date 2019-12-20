import axios from 'axios'
import proxy from 'express-http-proxy'
import express from 'express'
import airtable from 'airtable'
import checkCache, {saveToCache} from './cache';

const router = express.Router()
airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: process.env.AIRTABLE_API_KEY
});

router.get('/get-responses', checkCache(), async (req,res) => {
  getAirTableResponses(req.query.base, req.query.table).then(response => {
    return res.status(200).send(response.data);
  })
}) 

router.post('/post-response', async (req, res) => {
  const base = airtable.base(process.env.AIRTABLE_BASE);
  console.log('in post-response')
  submitAirTableResponse(base, req.body).then(response => {
    console.log('submitAirTableResponse done here is response data')
    console.log(response)
    return res.status(200).send(response)
  }).catch(error => handleNetworkError(error))
})

const handleResponse = messages => (
  response => (
    response.ok
      ? response
      : response.then(({ errors }) => (
        Promise.reject(Object.keys(errors))
      )
    )
  )
)

const handleNetworkError = messages => (
  () => Promise.reject(messages)
)

const submitAirTableResponse = async (airtableBase, data) => (
  airtableBase('responses').create(data, ( err, records ) => {
    if (err) {
      return Promise.reject('Airtable submission failed');
    }
    return Promise.resolve(records)
  })
)

const getAirTableResponses = async ( base, table ) => (
  axios({
    url: process.env.AIRTABLE_URL + base + '/' + table + '/' + '?maxRecords=100',
    method: 'get',
    headers: { 'Authorization': 'Bearer ' + process.env.AIRTABLE_API_KEY, 'Content-Type': 'application/json' }
  }).then(response => 
    { 
      let key = 'bbu__/get-responses?base=' + base + '&table=' + table
      saveToCache(key, response.data)
      return response 
    })
    .catch(error => handleNetworkError(error))
)

export default router
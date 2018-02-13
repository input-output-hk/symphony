import axios from 'axios'

export default axios.create({
  baseURL: 'https://us-central1-iohk-orpheus.cloudfunctions.net/',
  timeout: 1000,
  headers: {
    'Access-Control-Allow-Origin': '*'
  }
})

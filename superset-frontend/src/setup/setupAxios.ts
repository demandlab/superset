// First we need to import axios.js
import axios, { AxiosError, isAxiosError } from 'axios';
// We also need the rateLimit plugin as well as the retry plugin
import rateLimit from 'axios-rate-limit';
import axiosRetry, { exponentialDelay } from 'axios-retry';

// Define an array of error codes that we want to handle with a custom error message
const errorCodes = [
  { code: 400, desc: 'Bad Request' },
  { code: 401, desc: 'Unauthorized' },
  { code: 403, desc: 'Forbidden' },
  { code: 404, desc: 'Not Found' },
  { code: 405, desc: 'Method Not Allowed' },
];

// Check if we are in localhost or production
const isLocalhost = window.location.host.includes('localhost');

// Next we make an 'axiosConfig' instance of axios with the rateLimit plugin
// This will limit the number of requests to 5 per second
const axiosConfig = rateLimit(
  axios.create({
    baseURL: isLocalhost
      ? `http://localhost:8002/api`
      : `https://${window.location.host.split('.report')[0]}.admin.insentric.net/api`,
  }),
  {
    maxRequests: 5,
    perMilliseconds: 1000,
    maxRPS: 5,
  },
);

// Next we add the retry plugin to the axiosConfig instance with a max of 3 retries and an exponential delay
axiosRetry(axiosConfig, {
  retries: 3,
  retryDelay: (retryCount, error) => exponentialDelay(retryCount, error, 1000),
});

// Configure interceptors
axiosConfig.interceptors.request.use(
  config => {
    // You can add custom headers here

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

axiosConfig.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    // Check if error is an axios error
    if (!isAxiosError(error)) {
      return Promise.reject(error);
    }

    // Any status codes that fall outside the range of 2xx will cause this function to trigger
    // Check if the error code is in the errorCodes array
    const matchedError = errorCodes.find(
      errorCode => error.response?.status === errorCode.code,
    );
    if (matchedError) {
      console.error(
        `Error ${matchedError.code} - ${matchedError.desc} - ${error.response?.data}`,
      );
      return Promise.resolve(error.response);
    }

    return Promise.reject(error);
  },
);

export default axiosConfig;

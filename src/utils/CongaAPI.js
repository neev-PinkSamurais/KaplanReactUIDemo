import axios from 'axios';


const BASE_URL = import.meta.env.VITE_SALESFORCE_BASE_URL;
const CLIENT_ID =  import.meta.env.VITE_SALESFORCE_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_SALESFORCE_CLIENT_SECRET;
const AUTH_URL = BASE_URL + '/services/oauth2/token';
const AUTH_TOKEN = '';

const getToken = async () => {
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });
  const response = await axios.post(AUTH_URL, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  const token = response.data.access_token;
  localStorage.setItem('conga_token', token);
  return token;
};


const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  let token = localStorage.getItem('conga_token');
  if (!token) token = await getToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Retry once on 401 with a fresh token
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const token = await getToken();
      error.config.headers.Authorization = `Bearer ${token}`;
      return apiClient.request(error.config);
    }
    return Promise.reject(error);
  }
);

let _bundleCache = null;

const getBundleProducts = async () => {
  if (!_bundleCache) {
    const res = await apiClient.get('/services/apexrest/products/bundle');
    _bundleCache = res.data;
  }
  return _bundleCache;
};

const ACCOMMODATION_KEYWORDS = ['stay', 'residence', 'home stay', 'extra night'];

export const getCourseTypeOptions = (options = []) =>
  options
    .filter(opt => !ACCOMMODATION_KEYWORDS.some(kw => opt.componentProductName.toLowerCase().includes(kw)))
    .map(opt => ({ id: opt.componentProductId, title: opt.componentProductName }));

export const fetchCourses = async () => {
  const data = await getBundleProducts();
  return data.map(item => ({
    id: item.id,
    icon: '📚',
    title: item.name,
    desc: item.listPrice ? `From £${item.listPrice}` : 'Flexible pricing',
    listPrice: item.listPrice,
    options: item.options ?? [],
    attributes: item.attributes ?? [],
  }));
};

export const fetchLanguages = async () => {
  const res =  ["English", "French", "German", "Spanish"];
  // await apiClient.get('/lookup-values', {
  //   params: { type: 'Language' },
  // });
  return res; //records(res).map((item) => item.name ?? item.label);
};

export const fetchDestinations = async () => {
  // const res = await apiClient.get('/territories');
  // return records(res).map((item) => ({
  //   id: item.id ?? item.code,
  //   flag: item.flag ?? '🌍',
  //   title: item.name,
  //   cities: item.cities ?? item.description ?? '',
  // }));

  return [
  { id: "uk", flag: "🇬🇧", title: "United Kingdom", cities: "London · Manchester · Bath" },
  { id: "us", flag: "🇺🇸", title: "United States", cities: "New York · Boston · San Francisco" },
  { id: "au", flag: "🇦🇺", title: "Australia", cities: "Sydney · Melbourne · Brisbane" },
  { id: "ca", flag: "🇨🇦", title: "Canada", cities: "Toronto · Vancouver · Montreal" },
  { id: "za", flag: "🇿🇦", title: "South Africa", cities: "Cape Town · Johannesburg" },
  { id: "nz", flag: "🇳🇿", title: "New Zealand", cities: "Auckland · Christchurch" },
];

};

export const fetchStartDates = async () => {

  return  ["July 2026", "Oct 2026", "Jan 2027", "April 2027"];

};

export const fetchDurations = async () => {
  // const res = await apiClient.get('/lookup-values', {
  //   params: { type: 'CourseDuration' },
  // });
  // return records(res).map((item) => item.name ?? item.label);

  return  ["2 weeks", "4 weeks", "8 weeks", "12 weeks", "24 weeks"];

};

export const fetchAccommodationTypes = async () => {
  const data = await getBundleProducts();
  const allOptions = data.flatMap(bundle => bundle.options ?? []);
  const accommodationOptions = allOptions.filter(opt =>
    ACCOMMODATION_KEYWORDS.some(kw => opt.componentProductName.toLowerCase().includes(kw))
  );
  return [
    ...accommodationOptions.map(opt => ({
      id: opt.componentProductId,
      icon: opt.componentProductName.toLowerCase().includes('home') ? '🏠' : '🏢',
      title: opt.componentProductName,
      desc: opt.listPrice ? `£${opt.listPrice}` : '',
    })),
    { id: 'none', icon: '✕', title: 'No thanks', desc: "I'll arrange my own accommodation." },
  ];
};

export const fetchProficiencyLevels = async () => {
  // const res = await apiClient.get('/lookup-values', {
  //   params: { type: 'ProficiencyLevel' },
  // });
  // return records(res).map((item) => item.name ?? item.label);

return ["Beginner", "Elementary", "Intermediate", "Upper Intermediate", "Advanced"];

};

export const fetchNationalities = async () => {
  // const res = await apiClient.get('/countries');
  // return records(res).map((item) => item.name ?? item.label);

  return ["Malaysia", "Saudi Arabia", "Brazil", "Japan", "Germany", "France", "Other"];
 
};

export const fetchPricing = async (courseId, destinationId) => {
  // const res = await apiClient.get('/price-list-items', {
  //   params: { productCategoryId: courseId, territoryId: destinationId },
  // });
  // return records(res).reduce((map, item) => {
  //   map[item.duration] = item.unitPrice;
  //   return map;
  // }, {});

   return { "2 weeks": 910, "4 weeks": 1820, "8 weeks": 3640, "12 weeks": 5460, "24 weeks": 10920 };
};

export const submitQuoteRequest = async (quoteData) => {
  const res = await apiClient.post('/services/apexrest/quote/create/', quoteData);
  return res.data;
};

export default apiClient;

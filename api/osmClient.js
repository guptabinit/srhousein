// external Libraries
import { create } from "apisauce";

const osmApi = create({
  baseURL: "https://nominatim.openstreetmap.org/",
  headers: {
    Accept: "application/json",
  },
  timeout: 30000,
});

export const reverseParams = (params) => {
  return {
    ...params,
    zoom: 10,
    addressdetails: 1,
    format: "json",
  };
};

export const searchParams = (query) => {
  return {
    q: query,
    limit: 5,
    addressdetails: 1,
    format: "json",
  };
};

export default osmApi;

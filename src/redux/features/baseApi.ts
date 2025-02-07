import { BaseQueryFn, FetchArgs, createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { config } from "../../utils/config";
import { logoutUser } from "../services/authSlice";
import { RootState } from "../store";

// Base query to handle token and headers
const baseQuery = fetchBaseQuery({
  baseUrl: config.baseUrl,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;

    console.log("Token from state:", token); // Debugging the token value

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

// Custom base query to handle authentication errors
const customBaseQuery: BaseQueryFn<FetchArgs, unknown, unknown> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    console.warn("Unauthorized! Redirecting to login...");
    api.dispatch(logoutUser());
    window.location.href = "/login"; // Redirect user to login page
  }

  return result;
};


// Base API configuration
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: customBaseQuery, 
  tagTypes: ["product", "sale", "user", "category", "brand", "seller", "purchases", "Expense","debit","credit","proforma"], 
  endpoints: () => ({}),
});

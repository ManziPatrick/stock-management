import { baseApi } from "../baseApi";

export const pettyCashApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPettyCash: builder.query({
      query: () => ({
        url: '/expenses/petty-cash',
        method: 'GET',
      }),
      providesTags: ['PettyCash'],
    }),
    
    initializePettyCash: builder.mutation({
      query: () => ({
        url: '/expenses/petty-cash/initialize',
        method: 'POST',
      }),
      invalidatesTags: ['PettyCash'],
    }),
    
    topUpPettyCash: builder.mutation({
      query: (body) => ({
        url: '/expenses/petty-cash/top-up',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PettyCash'],
    }),

    // New endpoint for getting all transactions
    getAllTransactions: builder.query({
      query: (params) => ({
        url: '/expenses/petty-cash/transactions',
        method: 'GET',
        params,
      }),
      providesTags: ['PettyCash'],
    }),
  }),
});

export const {
  useGetPettyCashQuery,
  useLazyGetPettyCashQuery,
  useInitializePettyCashMutation,
  useTopUpPettyCashMutation,
  useGetAllTransactionsQuery,
  useLazyGetAllTransactionsQuery,
} = pettyCashApi;
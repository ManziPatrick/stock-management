import { baseApi } from "../baseApi";

const saleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllSale: builder.query({
      query: (query) => ({
        url: '/sales',
        method: 'GET',
        params: query
      }),
      providesTags: ['sale']
    }),
    getAllSalecollection: builder.query({
      query: (query) => ({
        url: '/sales/collection',
        method: 'GET',
        params: query
      }),
      providesTags: ['sale']
    }),
    createSale: builder.mutation({
      query: (payload) => ({
        url: '/sales',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['sale', 'product']
    }),
    updateSaleStatus: builder.mutation({
      query: ({ saleId, status }) => ({
        url: `/sales/${saleId}/status`,
        method: 'PATCH',
        body: { status }
      }),
      invalidatesTags: ['sale']
    }),
    markProductsCollected: builder.mutation({
      query: ({ saleId, collected }) => ({
        url: `/sales/${saleId}/collection`,
        method: 'PATCH',
        body: { collected }
      }),
      invalidatesTags: ['sale']
    }),
    deleteSale: builder.mutation({
      query: (id) => ({
        url: `/sales/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['sale']
    }),
    // Existing endpoints...
    yearlySale: builder.query({
      query: () => ({
        url: `/sales/years`,
        method: 'GET'
      }),
      providesTags: ['sale']
    }),
    monthlySale: builder.query({
      query: () => ({
        url: `/sales/months`,
        method: 'GET'
      }),
      providesTags: ['sale']
    }),
    weeklySale: builder.query({
      query: () => ({
        url: `/sales/weeks`,
        method: 'GET'
      }),
      providesTags: ['sale']
    }),
    dailySale: builder.query({
      query: () => ({
        url: `/sales/days`,
        method: 'GET'
      }),
      providesTags: ['sale']
    }),
    getTotalCredit: builder.query({
      query: () => ({
        url: '/sales/credit',
        method: 'GET'
      }),
      providesTags: ['sale']
    }),
  })
});

export const {
  useGetAllSaleQuery,
  useCreateSaleMutation,
  useDeleteSaleMutation,
  useUpdateSaleStatusMutation,
  useMarkProductsCollectedMutation,
  useYearlySaleQuery,
  useGetAllSalecollectionQuery,
  useMonthlySaleQuery,
  useWeeklySaleQuery,
  useDailySaleQuery,
  useGetTotalCreditQuery
} = saleApi;
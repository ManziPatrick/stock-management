import { baseApi } from "../baseApi";

const creditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllCredits: builder.query({
      query: (query) => ({
        url: '/credits',
        method: 'GET',
        params: query
      }),
      providesTags: ['credit'],
    }),

    createCredit: builder.mutation({
      query: (payload) => ({
        url: '/credits',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['credit'],
    }),

    updateCredit: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/credits/${id}`,
        method: 'PATCH',
        body: payload
      }),
      invalidatesTags: ['credit'],
    }),

    deleteCredit: builder.mutation({
      query: (id) => ({
        url: `/credits/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['credit'],
    }),

    getCreditById: builder.query({
      query: (id) => ({
        url: `/credits/${id}`,
        method: 'GET',
      }),
      providesTags: ['credit'],
    }),
  }),
});

export const {
  useGetAllCreditsQuery,
  useCreateCreditMutation,
  useUpdateCreditMutation,
  useDeleteCreditMutation,
  useGetCreditByIdQuery,
} = creditApi;

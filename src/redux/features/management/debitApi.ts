import { baseApi } from "../baseApi";

const debitApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllDebits: builder.query({
      query: (query) => ({
        url: '/debits',
        method: 'GET',
        params: query
      }),
      providesTags: ['debit'],
    }),

    createDebit: builder.mutation({
      query: (payload) => ({
        url: '/debits',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['debit'],
    }),

    updateDebit: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/debits/${id}`,
        method: 'PATCH',
        body: payload
      }),
      invalidatesTags: ['debit'],
    }),

    deleteDebit: builder.mutation({
      query: (id) => ({
        url: `/debits/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['debit'],
    }),

    getDebitById: builder.query({
      query: (id) => ({
        url: `/debits/${id}`,
        method: 'GET',
      }),
      providesTags: ['debit'],
    }),
  }),
});

export const {
  useGetAllDebitsQuery,
  useCreateDebitMutation,
  useUpdateDebitMutation,
  useDeleteDebitMutation,
  useGetDebitByIdQuery,
} = debitApi;
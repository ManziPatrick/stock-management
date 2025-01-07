import { baseApi } from "../baseApi";

const expenseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllExpenses: builder.query({
      query: (query) => ({
        url: '/expenses',
        method: 'GET',
        params: query
      }),
      providesTags: ['Expense'],
    }),
    createExpense: builder.mutation({
      query: (payload) => ({
        url: '/expenses',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['Expense'],
    }),
    deleteExpense: builder.mutation({
      query: (id) => ({
        url: `/expenses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Expense'],
    }),
  }),
});

export const {
  useGetAllExpensesQuery,
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
} = expenseApi;

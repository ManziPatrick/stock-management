import { baseApi } from "../baseApi";

const ProformaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllproforma: builder.query({
      query: (query) => ({
        url: '/proforma',
        method: 'GET',
        params: query
      }),
      providesTags: ['proforma']
    }),

    createProforma: builder.mutation({
      query: (payload) => ({
        url: '/proforma',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['proforma']
    }),

    deleteProforma: builder.mutation({
      query: (id) => ({
        url: '/proforma/' + id,
        method: 'DELETE',
      }),
      invalidatesTags: ['proforma']
    }),
  })
})

export const { useGetAllproformaQuery, useCreateProformaMutation, useDeleteProformaMutation } = ProformaApi
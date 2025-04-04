// src/redux/features/management/deliveryNoteApi.ts

import { baseApi } from "../baseApi";

const deliveryNoteApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllDeliveryNotes: builder.query({
      query: (query) => ({
        url: '/delivery-notes',
        method: 'GET',
        params: query
      }),
      providesTags: ['deliveryNote'],
    }),

    createDeliveryNote: builder.mutation({
      query: (payload) => ({
        url: '/delivery-notes',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['deliveryNote'],
    }),

    updateDeliveryNote: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/delivery-notes/${id}`,
        method: 'PATCH',
        body: payload
      }),
      invalidatesTags: ['deliveryNote'],
    }),

    deleteDeliveryNote: builder.mutation({
      query: (id) => ({
        url: `/delivery-notes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['deliveryNote'],
    }),

    getDeliveryNoteById: builder.query({
      query: (id) => ({
        url: `/delivery-notes/${id}`,
        method: 'GET',
      }),
      providesTags: ['deliveryNote'],
    }),

    uploadProofOfDelivery: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/delivery-notes/${id}/proof`,
        method: 'POST',
        body: formData,
        formData: true, // Important for file uploads
      }),
      invalidatesTags: ['deliveryNote'],
    }),
  }),
});

export const {
  useGetAllDeliveryNotesQuery,
  useCreateDeliveryNoteMutation,
  useUpdateDeliveryNoteMutation,
  useDeleteDeliveryNoteMutation,
  useGetDeliveryNoteByIdQuery,
  useUploadProofOfDeliveryMutation,
} = deliveryNoteApi;
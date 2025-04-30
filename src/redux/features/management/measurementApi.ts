import { baseApi } from "../baseApi";
export const measurementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Measurement endpoints
    getAllMeasurements: builder.query({
      query: () => ({
        url: '/measurements',
        method: 'GET',
      }),
      providesTags: ['Measurements'],
    }),
    
    createMeasurement: builder.mutation({
      query: (data) => ({
        url: '/measurements',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Measurements'],
    }),
    
    getMeasurementById: builder.query({
      query: (id) => ({
        url: `/measurements/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Measurements', id }],
    }),
    
    updateMeasurement: builder.mutation({
      query: ({ id, data }) => ({
        url: `/measurements/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Measurements', id },
        'Measurements',
      ],
    }),
    
    deleteMeasurement: builder.mutation({
      query: (id) => ({
        url: `/measurements/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Measurements'],
    }),
    
    // Unit endpoints
    getUnitsByMeasurementId: builder.query({
      query: (measurementId) => ({
        url: `/measurements/${measurementId}/units`,
        method: 'GET',
      }),
      providesTags: (result, error, measurementId) => [
        { type: 'Measurements', id: measurementId },
      ],
    }),
    
    createUnit: builder.mutation({
      query: (data) => ({
        url: '/measurements/units',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { measurementId }) => [
        { type: 'Measurements', id: measurementId },
        { type: 'Units' },
      ],
    }),
    
    getUnitById: builder.query({
      query: (id) => ({
        url: `/measurements/units/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Units', id }],
    }),
    
    updateUnit: builder.mutation({
      query: ({ id, data }) => ({
        url: `/measurements/units/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Units', id },
        'Units',
      ],
    }),
    
    deleteUnit: builder.mutation({
      query: (id) => ({
        url: `/measurements/units/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Units'],
    }),
  }),
});

export const {
  useGetAllMeasurementsQuery,
  useCreateMeasurementMutation,
  useGetMeasurementByIdQuery,
  useUpdateMeasurementMutation,
  useDeleteMeasurementMutation,
  useGetUnitsByMeasurementIdQuery,
  useCreateUnitMutation,
  useGetUnitByIdQuery,
  useUpdateUnitMutation,
  useDeleteUnitMutation,
} = measurementApi;
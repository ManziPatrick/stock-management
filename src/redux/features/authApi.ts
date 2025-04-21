import { baseApi } from "./baseApi";

const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (payload) => ({
        url: '/users/login',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['product', 'sale', 'user']
    }),

    register: builder.mutation({
      query: (payload) => ({
        url: '/users/register',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['product', 'sale', 'user']
    }),

    getSelfProfile: builder.query({
      query: () => ({
        url: '/users/self',
        method: 'GET',
      }),
      providesTags: ['user']
    }),

    getAllUser: builder.query({
      query: (query) => ({
        url: '/users/all',
        method: 'GET',
        params: query
      }),
      providesTags: ['user']
    }),
    
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/users/user/${id}`, 
        method: 'DELETE',
      }),
      invalidatesTags: ['user'] 
    }),

    changePassword: builder.mutation({
      query: (payload) => ({
        url: '/users/change-password',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['user']
    }),

    updateProfile: builder.mutation({
      query: (payload) => ({
        url: '/users',
        method: 'PATCH',
        body: payload
      }),
      invalidatesTags: ['user']
    }),

    // New endpoints for admin user management
    adminUpdateUser: builder.mutation({
      query: ({ userId, data }) => ({
        url: `/users/admin/user/${userId}`,
        method: 'PATCH',
        body: data
      }),
      invalidatesTags: ['user']
    }),

    adminUpdatePassword: builder.mutation({
      query: ({ userId, password }) => ({
        url: `/users/admin/password/${userId}`,
        method: 'PATCH',
        body: { password }
      }),
      invalidatesTags: ['user']
    }),

    updateUserRole: builder.mutation({
      query: ({ userId, role }) => ({
        url: `/users/role/${userId}`,
        method: 'PATCH',
        body: { role }
      }),
      invalidatesTags: ['user']
    })
  })
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetSelfProfileQuery,
  useGetAllUserQuery,
  useDeleteUserMutation,
  useChangePasswordMutation,
  useUpdateProfileMutation,
  useAdminUpdateUserMutation,
  useAdminUpdatePasswordMutation,
  useUpdateUserRoleMutation
} = authApi
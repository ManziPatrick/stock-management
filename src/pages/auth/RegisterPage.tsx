import { useState } from 'react';
import { Button } from 'antd';
import { FieldValues, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useRegisterMutation } from '../../redux/features/authApi';
import { useAppDispatch } from '../../redux/hooks';
import { loginUser } from '../../redux/services/authSlice';
import { toast } from 'sonner';
import { CheckCircle } from "lucide-react";

// Interface for the API response
interface RegistrationResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
    _id: string;
  };
}

// Success Modal Component
const SuccessModal = ({ isOpen, onClose, userData }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center   overflow-hidden justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center justify-center space-y-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <h2 className="text-xl font-semibold text-center">
            Registration Successful!
          </h2>
        </div>
        
        <div className="flex flex-col items-center space-y-4 py-4">
          <p className="text-center text-gray-600">
            Welcome <span className="font-semibold">{userData.name}</span>!
          </p>
          <p className="text-center text-gray-600">
            Your account has been successfully created as a{' '}
            <span className="font-semibold">{userData.role}</span>.
          </p>
          <p className="text-sm text-gray-500">Account Status: {userData.status}</p>
          <p className="text-center text-sm text-gray-500">
            You will be redirected to the dashboard in a few seconds.
          </p>
        </div>
        
        <div className="flex justify-center mt-6">
          <Button 
            onClick={onClose}
            type="primary"
            className="px-8"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

const RegisterPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [userRegistration] = useRegisterMutation();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  const {
    handleSubmit,
    register,
    formState: { errors },
    watch,
  } = useForm();

  const role = watch('role');

  const onSubmit = async (data: FieldValues) => {
    const toastId = toast.loading('Registering new account!');
    try {
      if (data.password !== data.confirmPassword) {
        toast.error('Password and confirm password must be same!', { id: toastId });
        return;
      }

      const { confirmPassword, ...registrationData } = data;
      
      const response = await userRegistration(registrationData).unwrap() as RegistrationResponse;

      if (response.statusCode === 201 && response.success) {
        toast.success(response.message, { id: toastId });
        
        // Store the registered user data
        setRegisteredUser(response.data);
        setShowSuccessModal(true);

        // Redirect after a delay
        setTimeout(() => {
          setShowSuccessModal(false);
          navigate('/admin/');
        }, 3000);
      }
    } catch (error: any) {
      toast.error(error.data?.message || 'Registration failed', { id: toastId });
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Admin';
      case 'KEEPER':
        return 'Keeper';
      default:
        return 'User';
    }
  };

  return (
    <>
      <div className="register-container " style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div
          style={{
            width: '400px',
            padding: '3rem',
            border: '1px solid #164863',
            borderRadius: '.6rem',
          }}
        >
          <h1 style={{ marginBottom: '.7rem', textAlign: 'center', textTransform: 'uppercase' }}>
            Register {getRoleDisplay(role)}
          </h1>
          <form onSubmit={handleSubmit(onSubmit)}>
            <input
              type="text"
              {...register('name', { required: 'Name is required' })}
              placeholder="Your Name*"
              className={`input-field ${errors.name ? 'input-field-error' : ''}`}
            />

            <input
              type="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              placeholder="Your Email*"
              className={`input-field ${errors.email ? 'input-field-error' : ''}`}
            />

            <select 
              {...register('role', { required: 'Role is required' })}
              className={`input-field ${errors.role ? 'input-field-error' : ''}`}
              defaultValue=""
            >
              <option value="" disabled>Select Role*</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="KEEPER">Keeper</option>
            </select>

            {(role === 'ADMIN' || role === 'KEEPER') && (
              <>
                <input
                  type="text"
                  {...register('title')}
                  placeholder="Title (optional)"
                  className="input-field"
                />
                <textarea
                  {...register('description')}
                  placeholder="Description (optional)"
                  className="input-field"
                  style={{ minHeight: '100px' }}
                />
              </>
            )}

            <input
              type="password"
              {...register('password', { 
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
              placeholder="Your Password*"
              className={`input-field ${errors.password ? 'input-field-error' : ''}`}
            />

            <input
              type="password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === watch('password') || 'Passwords do not match',
              })}
              placeholder="Confirm Password*"
              className={`input-field ${errors.confirmPassword ? 'input-field-error' : ''}`}
            />

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Button
                htmlType="submit"
                type="primary"
                style={{ textTransform: 'uppercase', fontWeight: 'bold' }}
              >
                Register {getRoleDisplay(role)}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate('/');
        }}
        userData={registeredUser}
      />
    </>
  );
};

export default RegisterPage;
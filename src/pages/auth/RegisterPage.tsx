import { Button } from 'antd';
import { FieldValues, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toastMessage from '../../lib/toastMessage';
import { useRegisterMutation } from '../../redux/features/authApi';
import { useAppDispatch } from '../../redux/hooks';
import { loginUser } from '../../redux/services/authSlice';
import decodeToken from '../../utils/decodeToken';
import { toast } from 'sonner';

const RegisterPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [userRegistration] = useRegisterMutation();
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

      // Remove confirmPassword from data before sending to API
      const { confirmPassword, ...registrationData } = data;
      
      const res = await userRegistration(registrationData).unwrap();

      if (res.statusCode === 201) {
        const user = decodeToken(res.data.token);
        dispatch(loginUser({ token: res.data.token, user }));
        navigate('/');
        toast.success(res.message, { id: toastId });
      }
    } catch (error: any) {
      toast.error(error.data.message, { id: toastId });
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
    <div className="register-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
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
  );
};

export default RegisterPage;

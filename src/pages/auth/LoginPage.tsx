import { Button, Flex, Form, Input } from 'antd';
import { Controller, FieldValues, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import toastMessage from '../../lib/toastMessage';
import { useLoginMutation } from '../../redux/features/authApi';
import { useAppDispatch } from '../../redux/hooks';
import { loginUser } from '../../redux/services/authSlice';
import decodeToken from '../../utils/decodeToken';
import stock from '../../assets/loginstock.webp';

const LoginPage = () => {
  const [userLogin] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data: FieldValues) => {
    const toastId = toast.loading('Logging...');
    try {
      const res = await userLogin(data).unwrap();

      if (res.statusCode === 200) {
        const user = decodeToken(res.data.token);
        dispatch(loginUser({ token: res.data.token, user }));

        // Navigate based on the user's role
        if (user.role === 'ADMIN') {
          navigate('/admin'); // Admin dashboard route
        } else if (user.role === 'KEEPER') {
          navigate('/keeper/products'); // Keeper dashboard route
        } else if (user.role === 'USER') {
          navigate('/seller/products');
        } else {
          toastMessage({ icon: 'warning', text: 'No appropriate role found for this user.' });
        }

        toast.success('Successfully Logged In!', { id: toastId });
      }
    } catch (error: any) {
      toastMessage({ icon: 'error', text: error.data.message });
    }
  };

  return (
    <div className="w-3/4 flex justify-center items-center m-auto" style={{ height: '100vh' }}>
      <div className="bg-blue-950 flex justify-center flex-col md:flex-row items-center align-middle shadow-lg rounded-md w-full">
        <div className="w-full flex flex-col justify-center items-center" style={{ padding: '1rem', height: '440px' }}>
          <div className="w-full md:w-3/4">
            <h1
              className="font-bold md:font-extrabold text-teal-50 text-center p-2 md:p-5 text-sm md:text-xl"
              style={{ marginBottom: '.7rem', textTransform: 'uppercase' }}
            >
              Login to your account
            </h1>
            <p className="text-white p-5 font-extralight text-sm text-center">
              Login to your account, and if you do not have an account, contact your admin.
            </p>
            <Form onFinish={handleSubmit(onSubmit)} className="flex flex-col items-center gap-4">
              <Controller
                name="email"
                control={control}
                rules={{ required: 'Email is required' }}
                render={({ field }) => (
                  <Input
                    type="text"
                    {...field}
                    placeholder="Your Email*"
                    className={`input-field border-y-0 bg-transparent border-1 border-x-2 w-3/4 ${
                      errors.email ? 'input-field-error' : ''
                    }`}
                  />
                )}
              />
              {errors.email && <p className="text-red-500 text-sm">{String(errors.email.message)}</p>}

              <Controller
                name="password"
                control={control}
                rules={{ required: 'Password is required' }}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    placeholder="Your Password*"
                    className={`input-field w-3/4 border-y-0 bg-transparent ${
                      errors.password ? 'input-field-error' : ''
                    }`}
                  />
                )}
              />
              {errors.password && <p className="text-red-500 text-sm">{String(errors.password.message)}</p>}

              <div className="w-full flex justify-center items-center">
                <Button
                  htmlType="submit"
                  type="primary"
                  style={{ textTransform: 'uppercase', fontWeight: 'bold' }}
                  className="bg-gradient-to-br from-violet-800 to-blue-900 px-5 py-2 rounded-md w-1/2"
                >
                  Login
                </Button>
              </div>
            </Form>
          </div>
        </div>
        <div className="w-full md:block hidden">
          <img src={stock} alt="Login Stock" className="" />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

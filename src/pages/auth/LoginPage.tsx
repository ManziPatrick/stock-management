import { Button, Flex } from 'antd';
import { FieldValues, useForm } from 'react-hook-form';
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
    register,
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
    <div className=" w-3/4 flex justify-center items-center m-auto" style={{ height: '100vh' }}>
      <div className='bg-blue-950 flex justify-center flex-col md:flex-row items-center align-middle shadow-lg rounded-md  w-full ' >
      <div className='w-full  flex flex-col  justify-center items-center ' style={{ padding: '1rem' ,height:'440px'}} >
        <div className='w-full md:w-3/4'>
        <h1 className=' font-bold md:font-extrabold text-teal-50 text-center p-2 md:p5  text-sm md:text-xl' style={{ marginBottom: '.7rem',  textTransform: 'uppercase' }}>
          Login to your account
        </h1>
        <p className='text-white p-5 font-extralight text-sm text-center'> login in your account and if you do not have the account contact your admin </p>
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col items-center   gap-4'>
          <input
            type="text"
            {...register('email', { required: true })}
            placeholder="Your Email*"
            
            className={`input-field  border-y-0 bg-transparent  border-1 border-x-2 w-3/4 `}
          />
          <input
            type="password"
            placeholder="Your Password*"
            className={`input-field w-3/4  border-y-0 bg-transparent ${errors['password'] ?  'input-field-error' : ''}`}
            {...register('password', { required: true })}
          />
          <div className='w-full flex justify-center items-center'>
            <Button
              htmlType="submit"
              type="primary"
              style={{ textTransform: 'uppercase', fontWeight: 'bold' }}
              className='bg-gradient-to-br  from-violet-800 to-blue-900 px-5 py-2 rounded-md  w-1/2'
            >
              Login
            </Button>
          </div>
        </form>
        </div>
      </div>
      <div className='w-full md:block hidden '>
         <img src={stock} className=''/>
      </div>
     
      </div>
      
    </div>
  );
};

export default LoginPage;

//@ts-nocheck
import { useState } from 'react';
import { Form, Input, Select, Button, Modal, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, IdcardOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useRegisterMutation } from '../../redux/features/authApi';
import { useAppDispatch } from '../../redux/hooks';

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
const SuccessModal = ({ visible, onClose, userData }) => {
  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      footer={[
        <Button 
          key="continue" 
          type="primary" 
          onClick={onClose}
          className="w-32 h-10 bg-blue-600 hover:bg-blue-700 border-none"
        >
          Continue
        </Button>,
      ]}
      className="top-[20%]"
      width={480}
    >
      <div className="flex flex-col items-center py-6">
        <CheckCircleOutlined className="text-5xl text-green-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-4">Registration Successful!</h2>
        <div className="space-y-2 text-center">
          <p className="text-gray-700">
            Welcome <span className="font-semibold">{userData?.name}</span>!
          </p>
          <p className="text-gray-700">
            Your account has been created as a{' '}
            <span className="font-semibold">{userData?.role}</span>.
          </p>
          <p className="text-sm text-gray-500">Account Status: {userData?.status}</p>
          <p className="text-sm text-gray-500 mt-4">
            You will be redirected to the dashboard in a few seconds.
          </p>
        </div>
      </div>
    </Modal>
  );
};

const RegisterPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [userRegistration] = useRegisterMutation();
  
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);
  const [role, setRole] = useState('');

  const onFinish = async (values) => {
    setLoading(true);
    const toastId = message.loading('Registering new account...', 0);

    try {
      const { confirmPassword, ...registrationData } = values;
      const response = await userRegistration(registrationData).unwrap() as RegistrationResponse;

      if (response.statusCode === 201 && response.success) {
        message.success({
          content: response.message,
          key: toastId,
          duration: 2,
        });
        
        setRegisteredUser(response.data);
        setShowSuccessModal(true);

        setTimeout(() => {
          setShowSuccessModal(false);
          navigate('/admin/');
        }, 3000);
      }
    } catch (error: any) {
      message.error({
        content: error.data?.message || 'Registration failed',
        key: toastId,
        duration: 2,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-center text-gray-800">Create New Account</h2>
            <p className="text-center text-gray-500 text-sm mt-1">Register a new user in the system</p>
          </div>

          {/* Form */}
          <div className="p-8">
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              className="space-y-6"
            >
              {/* Name and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item
                  name="name"
                  rules={[{ required: true, message: 'Please input your name!' }]}
                >
                  <Input 
                    prefix={<UserOutlined className="text-gray-400" />}
                    placeholder="Full Name"
                    className="h-11 rounded-lg"
                  />
                </Form.Item>

                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: 'Please input your email!' },
                    { type: 'email', message: 'Please enter a valid email!' }
                  ]}
                >
                  <Input 
                    prefix={<MailOutlined className="text-gray-400" />}
                    placeholder="Email Address"
                    className="h-11 rounded-lg"
                  />
                </Form.Item>
              </div>

              {/* Role Selection */}
              <Form.Item
                name="role"
                rules={[{ required: true, message: 'Please select a role!' }]}
              >
                <Select
                  placeholder="Select Role"
                  className="h-11 rounded-lg"
                  onChange={(value) => setRole(value)}
                  options={[
                    { value: 'USER', label: 'User' },
                    { value: 'ADMIN', label: 'Admin' },
                    { value: 'KEEPER', label: 'Keeper' }
                  ]}
                />
              </Form.Item>

              {/* Conditional Fields */}
              {(role === 'ADMIN' || role === 'KEEPER') && (
                <div className="space-y-6">
                  <Form.Item name="title">
                    <Input 
                      prefix={<IdcardOutlined className="text-gray-400" />}
                      placeholder="Title (Optional)"
                      className="h-11 rounded-lg"
                    />
                  </Form.Item>

                  <Form.Item name="description">
                    <Input.TextArea 
                      placeholder="Description (Optional)"
                      className="rounded-lg py-2 px-3 min-h-[120px]"
                      rows={4}
                    />
                  </Form.Item>
                </div>
              )}

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: 'Please input your password!' },
                    { min: 6, message: 'Password must be at least 6 characters!' }
                  ]}
                >
                  <Input.Password 
                    prefix={<LockOutlined className="text-gray-400" />}
                    placeholder="Password"
                    className="h-11 rounded-lg"
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Please confirm your password!' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Passwords do not match!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password 
                    prefix={<LockOutlined className="text-gray-400" />}
                    placeholder="Confirm Password"
                    className="h-11 rounded-lg"
                  />
                </Form.Item>
              </div>

              {/* Submit Button */}
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold border-none"
                >
                  Register Account
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate('/admin/');
        }}
        userData={registeredUser}
      />
    </div>
  );
};

export default RegisterPage;
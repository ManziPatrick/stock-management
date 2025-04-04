//@ts-nocheck
import { useState } from 'react';
import { Form, Input, Select, Button, Modal, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, IdcardOutlined, CheckCircleOutlined, FileAddOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useRegisterMutation } from '../../redux/features/authApi';
import { useAppDispatch } from '../../redux/hooks';
import UserManagementPage from '../managements/UserManagement';

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
  const [isListView, setIsListView] = useState(false);
  
  const toggleView = () => {
    setIsListView(!isListView);
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { confirmPassword, ...registrationData } = values;
      const response = await userRegistration(registrationData).unwrap() as RegistrationResponse;

      if (response.statusCode === 201 && response.success) {
        message.success(response.message, 2);
        setRegisteredUser(response.data);
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          navigate('/admin/');
        }, 3000);
      }
    } catch (error) {
      message.error(error.data?.message || 'Registration failed', 2);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30 py-8 px-4">
      <Button 
        onClick={toggleView} 
        type="primary" 
        icon={isListView ? <FileAddOutlined /> : <UnorderedListOutlined />}
      >
        {isListView ? 'Register User' : 'View All Users'}
      </Button>
      {isListView ? (
        <UserManagementPage />
      ) : (
        <div className="max-w-2xl mx-auto items-center">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-center text-gray-800">Create New Account</h2>
            </div>
            <div className="p-8">
              <Form form={form} layout="vertical" onFinish={onFinish} className="space-y-6">
                <Form.Item name="name" rules={[{ required: true, message: 'Please input your name!' }]}> 
                  <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="Full Name" />
                </Form.Item>
                <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email!' }]}> 
                  <Input prefix={<MailOutlined className="text-gray-400" />} placeholder="Email Address" />
                </Form.Item>
                <Form.Item name="role" rules={[{ required: true, message: 'Please select a role!' }]}> 
                  <Select placeholder="Select Role" onChange={setRole} options={[
                    { value: 'USER', label: 'User' },
                    { value: 'ADMIN', label: 'Admin' },
                    { value: 'KEEPER', label: 'Keeper' },
                    { value: 'ACCOUNTANT', label: 'Accountant' },
                  ]} />
                </Form.Item>
                <Form.Item name="password" rules={[{ required: true, min: 6, message: 'Password must be at least 6 characters!' }]}> 
                  <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="Password" />
                </Form.Item>
                <Form.Item name="confirmPassword" dependencies={['password']} rules={[
                  { required: true, message: 'Please confirm your password!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) return Promise.resolve();
                      return Promise.reject(new Error('Passwords do not match!'));
                    },
                  }),
                ]}> 
                  <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="Confirm Password" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                    Register Account
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </div>
        </div>
      )}
      <SuccessModal visible={showSuccessModal} onClose={() => navigate('/admin/')} userData={registeredUser} />
    </div>
  );
};

export default RegisterPage;

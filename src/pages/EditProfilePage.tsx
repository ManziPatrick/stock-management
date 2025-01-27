import { UploadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row, message } from 'antd';
import userProPic from '../assets/User.png';
import CustomInput from '../components/CustomInput';
import { useForm } from 'react-hook-form';
import { profileInputFields } from '../constant/profile';
import { useGetSelfProfileQuery, useUpdateProfileMutation } from '../redux/features/authApi';
import Loader from '../components/Loader';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';
import { config } from '../utils/config';

const EditProfilePage = () => {
  const { data, isLoading } = useGetSelfProfileQuery(undefined);
  const [updateProfile] = useUpdateProfileMutation();
  const navigate = useNavigate();
  const location = useLocation();
  const newPath = location.pathname.replace('edit-profile', 'profile');

  if (isLoading) {
    return <Loader />;
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const toastId = toast.loading('Uploading Image...');
  
    try {
      const file = e.target.files?.[0];
      if (!file) {
        toast.error('Please select an image', { id: toastId });
        return;
      }
  
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload only JPG, PNG or WebP images', { id: toastId });
        return;
      }
  
      // Validate file size (5MB limit)
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        toast.error('File size should be less than 5MB', { id: toastId });
        return;
      }
  
      const formData = new FormData();
      formData.append('file', file);
      
      // These values should be in your config
      const uploadPreset = config.VITE_CLOUDINARY_UPLOAD_PRESET;
      const cloudName = config.VITE_CLOUDINARY_CLOUD_NAME;
      
      if (!uploadPreset || !cloudName) {
        toast.error('Missing Cloudinary configuration', { id: toastId });
        return;
      }

      formData.append('upload_preset', uploadPreset);
      formData.append('cloud_name', cloudName);
  
      // Upload to Cloudinary
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      
      const response = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload image');
      }
  
      const data = await response.json();
  
      if (!data.secure_url) {
        throw new Error('No secure URL received from Cloudinary');
      }
  
      // Update profile with new avatar
      const profileUpdateRes = await updateProfile({
        avatar: data.secure_url
      }).unwrap();
  
      if (profileUpdateRes.success) {
        toast.success('Profile picture updated successfully', { id: toastId });
      } else {
        throw new Error('Failed to update profile with new avatar');
      }
  
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image', { id: toastId });
    }
  };

  return (
    <Row>
      <Col xs={{ span: 24 }} lg={{ span: 8 }}>
        <Flex align="center" vertical style={{ margin: '1rem 0' }}>
          <Flex
            justify="center"
            style={{
              width: '250px',
              height: '250px',
              border: '2px solid gray',
              padding: '.5rem',
              borderRadius: '50%',
              overflow: 'hidden',
            }}
          >
            <img
              src={data?.data?.avatar || userProPic}
              alt="user"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          </Flex>
          <Flex style={{ padding: '1rem' }}>
            <input
              type="file"
              name="avatar"
              id="avatar"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <label
              htmlFor="avatar"
              style={{
                background: '#164863',
                color: '#fff',
                padding: '.5rem 1rem',
                display: 'flex',
                gap: '4px',
                alignItems: 'center',
                fontSize: '1rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              <UploadOutlined />
              Change Profile Picture
            </label>
          </Flex>
        </Flex>
      </Col>
      <Col xs={{ span: 24 }} lg={{ span: 16 }}>
        <Flex justify="end" style={{ margin: '1rem 0' }}>
          <Button type="default" onClick={() => navigate(newPath)}>
            <ArrowLeftOutlined /> Go Back
          </Button>
        </Flex>
        <EditProfileForm data={data?.data} />
      </Col>
    </Row>
  );
};

const EditProfileForm = ({ data }: { data: any }) => {
  const location = useLocation();
  const newPath = location.pathname.replace('edit-profile', 'profile');
  const navigate = useNavigate();
  const [updateProfile] = useUpdateProfileMutation();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: data });

  const onSubmit = async (formData: any) => {
    const cleanedData = { ...formData };
    // Remove unnecessary fields
    delete cleanedData._id;
    delete cleanedData.createdAt;
    delete cleanedData.updatedAt;
    delete cleanedData.__v;

    // Remove empty fields
    Object.keys(cleanedData).forEach(key => {
      if (!cleanedData[key]) {
        delete cleanedData[key];
      }
    });

    const toastId = toast.loading('Updating profile...');
    try {
      const res = await updateProfile(cleanedData).unwrap();

      if (res.success) {
        toast.success('Profile updated successfully', { id: toastId });
        navigate(newPath);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile', { id: toastId });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {profileInputFields.map((input) => (
        <CustomInput
          key={input.id}
          name={input.name}
          errors={errors}
          label={input.label}
          register={register}
          required={false}
        />
      ))}

      <Flex justify="center">
        <Button
          htmlType="submit"
          type="primary"
          style={{ textTransform: 'uppercase', fontWeight: 'bold' }}
        >
          Update Profile
        </Button>
      </Flex>
    </form>
  );
};

export default EditProfilePage;
import React, { useState } from 'react';
import { 
  Form,
  Input, 
  Button, 
  Upload,
  Select,
  Row, 
  Col,
  Card,
  Modal,
  Spin,
  Typography,
  InputNumber,
  Space,
  Divider,
  message 
} from 'antd';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import { useForm } from 'react-hook-form';
import type { RcFile, UploadProps } from 'antd/es/upload';
import type { UploadFile } from 'antd/es/upload/interface';
import { useCreateNewProductMutation } from '../redux/features/management/productApi';
import { useGetAllBrandsQuery } from '../redux/features/management/brandApi';
import { useGetAllCategoriesQuery } from '../redux/features/management/categoryApi';
import { useGetAllSellerQuery } from '../redux/features/management/sellerApi';
import { ICategory } from '../types/product.types';
import CreateSeller from '../components/product/CreateSeller';
import CreateCategory from '../components/product/CreateCategory';
import CreateBrand from '../components/product/CreateBrand';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Helper function to convert file to base64
const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const CreateProduct: React.FC = () => {
  // Redux queries and mutations
  const [createNewProduct] = useCreateNewProductMutation();
  const { data: categories } = useGetAllCategoriesQuery(undefined);
  const { data: sellers } = useGetAllSellerQuery(undefined);
  const { data: brands } = useGetAllBrandsQuery(undefined);

  // Form and state management
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  // Image preview handlers
  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }
    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
  };
  const formatPrice = (value: number | string | undefined): string => {
    if (value === undefined || value === '') return '';
    return `frw ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const parsePrice = (value: string | undefined): number => {
    if (!value) return 0;
    // Remove 'frw', spaces, and commas, then convert to number
    const numStr = value.replace(/frw\s?|(,*)/g, '');
    return numStr ? Number(numStr) : 0;
  };
  
  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  // Form submission handler
  const onFinish = async (values: any) => {
    if (fileList.length === 0) {
      message.error('Please upload at least one image');
      return;
    }

    if (fileList.length > 5) {
      message.error('Maximum 5 images allowed');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();

    // Append form fields
    Object.keys(values).forEach(key => {
      if (values[key] !== undefined && values[key] !== '') {
        formData.append(key, values[key]);
      }
    });

    // Handle measurement data
    if (values.unitType) {
      const measurement = {
        type: values.unitType,
        unit: values.unit,
        value: Number(values.quantity)
      };
      formData.append('measurement', JSON.stringify(measurement));
    }

    // Append images
    fileList.forEach((file) => {
      if (file.originFileObj) {
        formData.append('images', file.originFileObj);
      }
    });

    try {
      const res = await createNewProduct(formData).unwrap();
      if (res.statusCode === 201) {
        message.success(res.message);
        form.resetFields();
        setFileList([]);
      }
    } catch (error: any) {
      console.error(error);
      message.error(error.data?.message || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unit options based on measurement type
  const renderUnitOptions = () => {
    const unitTypes = {
      weight: [
        { value: 'g', label: 'Grams (g)' },
        { value: 'kg', label: 'Kilograms (kg)' },
        { value: 'lb', label: 'Pounds (lb)' }
      ],
      length: [
        { value: 'cm', label: 'Centimeters (cm)' },
        { value: 'm', label: 'Meters (m)' },
        { value: 'inch', label: 'Inches (in)' }
      ],
      volume: [
        { value: 'ml', label: 'Milliliters (ml)' },
        { value: 'l', label: 'Liters (l)' },
        { value: 'oz', label: 'Fluid Ounces (oz)' }
      ],
      pieces: [
        { value: 'pc', label: 'Piece' },
        { value: 'dozen', label: 'Dozen' },
        { value: 'set', label: 'Set' }
      ],
      size: [
        { value: 'EXTRA_SMALL', label: 'Extra Small (XS)' },
        { value: 'SMALL', label: 'Small (S)' },
        { value: 'MEDIUM', label: 'Medium (M)' },
        { value: 'LARGE', label: 'Large (L)' },
        { value: 'EXTRA_LARGE', label: 'Extra Large (XL)' },
        { value: 'XXL', label: 'XXL' },
        { value: 'XXXL', label: 'XXXL' },
        { value: 'EU_36', label: 'EU 36' },
        { value: 'EU_37', label: 'EU 37' },
        { value: 'EU_38', label: 'EU 38' },
        { value: 'EU_39', label: 'EU 39' },
        { value: 'EU_40', label: 'EU 40' },
        { value: 'EU_41', label: 'EU 41' },
        { value: 'EU_42', label: 'EU 42' },
        { value: 'EU_43', label: 'EU 43' },
        { value: 'EU_44', label: 'EU 44' },
        { value: 'EU_45', label: 'EU 45' },
        { value: 'EU_46', label: 'EU 46' },
        { value: 'EU_47', label: 'EU 47' },
        
      ]
    };

    return unitTypes[selectedUnit as keyof typeof unitTypes]?.map(unit => (
      <Option key={unit.value} value={unit.value}>
        {unit.label}
      </Option>
    ));
  };

  // Upload button component
  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  return (
    <div className="p-6">
      <Row gutter={[24, 24]}>
        {/* Main Form Section */}
        <Col xs={24} lg={16}>
          <Card 
            bordered={false} 
            className="shadow-md rounded-lg"
          >
            <Title level={2} className="text-center mb-6">
              Add New Product
            </Title>
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              className="space-y-4"
            >
              <Row gutter={[16, 16]}>
                {/* Product Name */}
                <Col xs={24}>
                  <Form.Item
                    label="Product Name"
                    name="name"
                    rules={[{ required: true, message: 'Please enter product name' }]}
                  >
                    <Input 
                      size="large" 
                      placeholder="Enter product name"
                      className="rounded-md" 
                    />
                  </Form.Item>
                </Col>

                {/* Price */}
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Price"
                    name="price"
                    rules={[{ required: true, message: 'Please enter price' }]}
                  >
                   <InputNumber
                      size="large"
                      className="w-full rounded-md"
                      min={0}
                      placeholder="Enter price"
                      formatter={formatPrice}
                      parser={parsePrice}
                      onFocus={(e) => e.target.select()}
                    />
                  </Form.Item>
                </Col>

                {/* Measurement Type */}
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Measurement Type"
                    name="unitType"
                  >
                    <Select
                      size="large"
                      placeholder="Select measurement type"
                      onChange={setSelectedUnit}
                      className="rounded-md"
                    >
                      <Option value="weight">Weight</Option>
                      <Option value="length">Length</Option>
                      <Option value="volume">Volume</Option>
                      <Option value="pieces">Pieces</Option>
                      <Option value="size">Size</Option>
                    </Select>
                  </Form.Item>
                </Col>

                {/* Quantity and Unit */}
                {selectedUnit && (
                  <>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Quantity"
                        name="quantity"
                        rules={[{ required: true, message: 'Please enter quantity' }]}
                      >
                        <InputNumber 
                          size="large" 
                          className="w-full rounded-md" 
                          min={0} 
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Unit"
                        name="unit"
                        rules={[{ required: true, message: 'Please select unit' }]}
                      >
                        <Select 
                          size="large" 
                          placeholder="Select unit"
                          className="rounded-md"
                        >
                          {renderUnitOptions()}
                        </Select>
                      </Form.Item>
                    </Col>
                  </>
                )}

                {/* Supplier */}
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Supplier"
                    name="seller"
                    rules={[{ required: true, message: 'Please select supplier' }]}
                  >
                    <Select
                      size="large"
                      placeholder="Select supplier"
                      className="rounded-md"
                    >
                      {sellers?.data.map((item: ICategory) => (
                        <Option key={item._id} value={item._id}>
                          {item.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                {/* Category */}
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Category"
                    name="category"
                    rules={[{ required: true, message: 'Please select category' }]}
                  >
                    <Select
                      size="large"
                      placeholder="Select category"
                      className="rounded-md"
                    >
                      {categories?.data.map((item: ICategory) => (
                        <Option key={item._id} value={item._id}>
                          {item.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                {/* Brand */}
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Brand"
                    name="brand"
                  >
                    <Select
                      size="large"
                      placeholder="Select brand"
                      className="rounded-md"
                    >
                      {brands?.data.map((item: ICategory) => (
                        <Option key={item._id} value={item._id}>
                          {item.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                {/* Description */}
                <Col xs={24}>
                  <Form.Item
                    label="Description"
                    name="description"
                  >
                    <TextArea
                      rows={4}
                      placeholder="Enter product description"
                      className="rounded-md"
                    />
                  </Form.Item>
                </Col>

                {/* Product Images */}
                <Col xs={24}>
                  <Form.Item
                    label="Product Images"
                    name="images"
                  >
                    <Upload
                      listType="picture-card"
                      fileList={fileList}
                      onPreview={handlePreview}
                      onChange={handleChange}
                      beforeUpload={() => false}
                      accept="image/*"
                      className="rounded-md"
                    >
                      {fileList.length >= 5 ? null : uploadButton}
                    </Upload>
                    <Text type="secondary">Upload 1-5 images. Supported formats: JPG, PNG</Text>
                  </Form.Item>
                </Col>

                {/* Submit Button */}
                <Col xs={24}>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      block
                      loading={isSubmitting}
                      className="h-12 font-semibold rounded-md"
                    >
                      {isSubmitting ? 'Creating...' : 'Add Product'}
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>

        {/* Sidebar Actions */}
        <Col xs={24} lg={8}>
          <Card 
            bordered={false} 
            className="shadow-md rounded-lg"
          >
            <Title level={3} className="mb-6">
              Quick Actions
            </Title>
            <Space 
              direction="vertical" 
              className="w-full" 
              size="large"
            >
              <CreateSeller />
              <Divider />
              <CreateCategory />
              <Divider />
              <CreateBrand />
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Image Preview Modal */}
      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        <img 
          alt="preview" 
          className="w-full" 
          src={previewImage} 
        />
      </Modal>
    </div>
  );
};

export default CreateProduct;
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
  Typography,
  InputNumber,
  Space,
  Divider,
  message,
  Checkbox,
  DatePicker
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { RcFile, UploadProps } from 'antd/es/upload';
import type { UploadFile } from 'antd/es/upload/interface';
import { useCreateNewProductMutation } from '../redux/features/management/productApi';
import { useCreateCreditMutation } from '../redux/features/management/creditApi';
import { useGetAllBrandsQuery } from '../redux/features/management/brandApi';
import { useGetAllCategoriesQuery } from '../redux/features/management/categoryApi';
import { useGetAllSellerQuery } from '../redux/features/management/sellerApi';
import { ICategory } from '../types/product.types';
import CreateSeller from '../components/product/CreateSeller';
import CreateCategory from '../components/product/CreateCategory';
import CreateBrand from '../components/product/CreateBrand';
import dayjs from 'dayjs';

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

// Price formatting helper functions
const formatPrice = (value: number | string): string => {
  if (!value) return '';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return `frw ${numValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const parsePrice = (value: string | number): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const numStr = value.replace(/[^\d.]/g, '');
  return parseFloat(numStr) || 0;
};

const CreateProduct: React.FC = () => {
  // Redux queries and mutations
  const [createNewProduct] = useCreateNewProductMutation();
  const [createCredit] = useCreateCreditMutation();
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
  const [isCredit, setIsCredit] = useState(false);

  // Handle image preview
  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
  };

  // Handle image change
  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  // Handle credit checkbox change
  const handleCreditChange = (e: any) => {
    setIsCredit(e.target.checked);
    if (!e.target.checked) {
      form.setFieldsValue({
        downPayment: undefined,
        paymentDueDate: undefined,
        creditAmount: undefined,
        customerName: undefined,
        customerPhone: undefined,
        customerEmail: undefined
      });
    }
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

    try {
      const productFormData = new FormData();

      // Handle price fields before appending to FormData
      const priceFields = ['price', 'downPayment', 'creditAmount'];
      const processedValues = { ...values };
      
      priceFields.forEach(field => {
        if (processedValues[field] !== undefined) {
          processedValues[field] = parsePrice(processedValues[field]);
        }
      });

      // Append basic product fields
      Object.keys(processedValues).forEach(key => {
        if (
          processedValues[key] !== undefined && 
          processedValues[key] !== '' && 
          !['downPayment', 'creditAmount', 'paymentDueDate', 'customerName', 'customerPhone', 'customerEmail'].includes(key)
        ) {
          productFormData.append(key, processedValues[key].toString());
        }
      });

      // Handle measurement data
      if (values.unitType) {
        const measurement = {
          type: values.unitType,
          unit: values.unit,
          value: Number(values.quantity)
        };
        productFormData.append('measurement', JSON.stringify(measurement));
      }

      // Append images
      fileList.forEach((file) => {
        if (file.originFileObj) {
          productFormData.append('images', file.originFileObj);
        }
      });

      // Create product
      const productRes = await createNewProduct(productFormData).unwrap();

      // If credit is enabled, create credit record
      if (isCredit && productRes.statusCode === 201) {
        const creditData = {
          productId: productRes.data._id,
          totalAmount: processedValues.price,
          downPayment: processedValues.downPayment,
          creditAmount: processedValues.creditAmount,
          paymentDueDate: values.paymentDueDate.format('YYYY-MM-DD'),
          customerDetails: {
            name: values.customerName,
            phone: values.customerPhone,
            email: values.customerEmail
          },
          status: 'PENDING'
        };

        const creditRes = await createCredit(creditData).unwrap();
        
        if (creditRes.statusCode === 201) {
          message.success('Product created and credit record established successfully');
        } else {
          message.warning('Product created but credit record creation failed');
        }
      } else {
        message.success(productRes.message);
      }

      // Reset form and state
      form.resetFields();
      setFileList([]);
      setIsCredit(false);
      
    } catch (error: any) {
      console.error(error);
      message.error(error.data?.message || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <Col xs={24} lg={16}>
          <Card bordered={false} className="shadow-md rounded-lg">
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
                {/* Basic Product Fields */}
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

                {/* Credit Checkbox */}
                <Col xs={24}>
                  <Form.Item name="isCredit" valuePropName="checked">
                    <Checkbox onChange={handleCreditChange}>
                      Sell on Credit
                    </Checkbox>
                  </Form.Item>
                </Col>

                {/* Credit Details Section */}
                {isCredit && (
                  <>
                    <Col xs={24}>
                      <Card className="bg-gray-50">
                        <Title level={4}>Credit Details</Title>
                        <Row gutter={[16, 16]}>
                          <Col xs={24} md={8}>
                            <Form.Item
                              label="Down Payment"
                              name="downPayment"
                              rules={[{ required: true, message: 'Please enter down payment' }]}
                            >
                              <InputNumber
                                size="large"
                                className="w-full rounded-md"
                                min={0}
                                placeholder="Enter down payment"
                                formatter={formatPrice}
                                parser={parsePrice}
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={8}>
                            <Form.Item
                              label="Credit Amount"
                              name="creditAmount"
                              rules={[{ required: true, message: 'Please enter credit amount' }]}
                            >
                              <InputNumber
                                size="large"
                                className="w-full rounded-md"
                                min={0}
                                placeholder="Enter credit amount"
                                formatter={formatPrice}
                                parser={parsePrice}
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={8}>
                            <Form.Item
                              label="Payment Due Date"
                              name="paymentDueDate"
                              rules={[{ required: true, message: 'Please select due date' }]}
                            >
                              <DatePicker
                                size="large"
                                className="w-full rounded-md"
                                disabledDate={(current) => current && current < dayjs().endOf('day')}
                              />
                            </Form.Item>
                          </Col>

                          {/* Customer Details */}
                          <Col xs={24} md={8}>
                            <Form.Item
                              label="Customer Name"
                              name="customerName"
                              rules={[{ required: true, message: 'Please enter customer name' }]}
                            >
                              <Input
                                size="large"
                                placeholder="Enter customer name"
                                className="rounded-md"
                              />
                              </Form.Item>
                              </Col>

                          <Col xs={24} md={8}>
                            <Form.Item
                              label="Customer Phone"
                              name="customerPhone"
                              rules={[{ required: true, message: 'Please enter customer phone' }]}
                            >
                              <Input
                                size="large"
                                placeholder="Enter customer phone"
                                className="rounded-md"
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={8}>
                            <Form.Item
                              label="Customer Email"
                              name="customerEmail"
                              rules={[
                                { type: 'email', message: 'Please enter valid email' },
                                { required: true, message: 'Please enter customer email' }
                              ]}
                            >
                              <Input
                                size="large"
                                placeholder="Enter customer email"
                                className="rounded-md"
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    </Col>
                  </>
                )}

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
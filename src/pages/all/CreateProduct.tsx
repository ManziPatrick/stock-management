import React, { useEffect, useState } from 'react';
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
import { useCreateNewProductMutation } from '../../redux/features/management/productApi';
import { useCreateCreditMutation } from '../../redux/features/management/creditApi';
import { useGetAllBrandsQuery } from '../../redux/features/management/brandApi';
import { useGetAllCategoriesQuery } from '../../redux/features/management/categoryApi';
import { useGetAllSellerQuery } from '../../redux/features/management/sellerApi';
import getUserFromPersistedAuth from '../../utils/GetUserId';
import { 
  useGetAllMeasurementsQuery,
  useCreateMeasurementMutation,
  useCreateUnitMutation,
  useGetUnitsByMeasurementIdQuery
} from '../../redux/features/management/measurementApi';
import { ICategory, ISeller, IMeasurement, IUnit } from '../../types/product.types';
import CreateSeller from '../../components/product/CreateSeller';
import CreateCategory from '../../components/product/CreateCategory';
import CreateBrand from '../../components/product/CreateBrand';
import dayjs from 'dayjs';
import getUserRoleFromPersistedAuth from '../../utils/GetRoles';

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

// User role type
type TUserRole = 'ADMIN' | 'SUPER_ADMIN' | 'USER' | 'SELLER';

// Component props interface
interface CreateProductProps {
  userRole?: TUserRole;
}

const CreateProduct: React.FC<CreateProductProps> = ({ userRole: propUserRole }) => {
  // Get user role from auth utils or use prop as fallback
  const [currentUserRole, setCurrentUserRole] = useState<TUserRole>('USER');

  // Initialize user role on component mount
  useEffect(() => {
    const roleFromAuth = getUserRoleFromPersistedAuth();
    console.log('User role from auth:', roleFromAuth);
    
    // Use the role from auth if available, otherwise use prop or default
    if (roleFromAuth) {
      setCurrentUserRole(roleFromAuth as TUserRole);
    } else if (propUserRole) {
      setCurrentUserRole(propUserRole);
    }
  }, [propUserRole]);

  // Redux queries and mutations
  const [createNewProduct] = useCreateNewProductMutation();
  const [createCredit] = useCreateCreditMutation();
  const [createMeasurement] = useCreateMeasurementMutation();
  const [createUnit] = useCreateUnitMutation();
  const { data: categories } = useGetAllCategoriesQuery(undefined);
  const { data: sellers } = useGetAllSellerQuery(undefined);
  const { data: brands } = useGetAllBrandsQuery(undefined);
  const { data: measurements, refetch: refetchMeasurements } = useGetAllMeasurementsQuery(undefined);

  // Form and state management
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState<string | null>(null);
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string | null>(null);
  const [isCredit, setIsCredit] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<ISeller | null>(null);
  const [initialPayment, setInitialPayment] = useState<number>(0);
  
  // Modal states for creating new measurements and units
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [newMeasurementName, setNewMeasurementName] = useState('');
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitSymbol, setNewUnitSymbol] = useState('');
  
  // Get units by selected measurement
  const { data: units, refetch: refetchUnits } = useGetUnitsByMeasurementIdQuery(
    selectedMeasurementId || '', 
    { skip: !selectedMeasurementId }
  );

  // Store measurement and unit mapping for easier lookup
  const [measurementMap, setMeasurementMap] = useState<Map<string, IMeasurement>>(new Map());
  const [unitMap, setUnitMap] = useState<Map<string, IUnit>>(new Map());

  // Check if user can set original price
  const canSetOriginalPrice = (role: TUserRole): boolean => {
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  };

  // Update measurement map when measurements data changes
  useEffect(() => {
    if (measurements?.data) {
      const map = new Map();
      measurements.data.forEach((measurement: IMeasurement) => {
        map.set(measurement.name, measurement);
      });
      setMeasurementMap(map);
    }
  }, [measurements]);

  // Update unit map when units data changes
  useEffect(() => {
    if (units?.data) {
      const map = new Map();
      units.data.forEach((unit: IUnit) => {
        map.set(unit.name, unit);
      });
      setUnitMap(map);
    }
  }, [units]);

  const calculateCreditDetails = (totalPrice: number, initial: number, dueDate: any, quantity: number = 1) => {
    if (!dueDate || !initial) return;

    // Use default_price for credit calculations instead of price
    const defaultPrice = form.getFieldValue('default_price') || totalPrice;
    const totalAmount = defaultPrice * quantity;
    const downPayment = initial;
    const creditAmount = totalAmount - downPayment;

    form.setFieldsValue({
      downPayment,
      creditAmount,
    });
  };

  const handleSupplierSelect = (supplierId: string) => {
    const supplier = sellers?.data.find((s: ISeller) => s._id === supplierId);
    if (supplier) {
      setSelectedSupplier(supplier);
      
      // Update credit details if credit is enabled
      if (isCredit) {
        const price = form.getFieldValue('default_price'); // Use default_price for credit
        const initialPayment = form.getFieldValue('initialPayment');
        const dueDate = form.getFieldValue('paymentDueDate');
        const quantity = form.getFieldValue('stock') || 1; // Use stock instead of quantity
        
        calculateCreditDetails(price, initialPayment, dueDate, quantity);
      }
    }
  };

  const handleMeasurementSelect = (measurementName: string) => {
    setSelectedMeasurement(measurementName);
    
    // Find the measurement ID based on the name
    const measurement = measurementMap.get(measurementName);
    if (measurement) {
      setSelectedMeasurementId(measurement._id);
    }
    
    form.setFieldsValue({ unit: undefined }); // Reset unit selection when measurement changes
  };

  useEffect(() => {
    if (isCredit) {
      const price = form.getFieldValue('default_price'); // Use default_price for credit
      const initialPayment = form.getFieldValue('initialPayment');
      const dueDate = form.getFieldValue('paymentDueDate');
      const quantity = form.getFieldValue('stock') || 1; // Use stock
      
      calculateCreditDetails(price, initialPayment, dueDate, quantity);
    }
  }, [form.getFieldValue('stock')]);

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

  // Handle creating a new measurement
  const handleCreateMeasurement = async () => {
    if (!newMeasurementName.trim()) {
      message.error('Measurement name cannot be empty');
      return;
    }
    
    try {
      const response = await createMeasurement({ name: newMeasurementName.trim() }).unwrap();
      if (response.statusCode === 201) {
        message.success('Measurement created successfully');
        refetchMeasurements();
        setNewMeasurementName('');
        setIsMeasurementModalOpen(false);
        
        // Select the newly created measurement
        if (response.data?.name) {
          setSelectedMeasurement(response.data.name);
          setSelectedMeasurementId(response.data._id);
          form.setFieldsValue({ measurement: response.data.name });
        }
      }
    } catch (error: any) {
      message.error(error.data?.message || 'Failed to create measurement');
    }
  };

  // Handle creating a new unit
  const handleCreateUnit = async () => {
    if (!newUnitName.trim() || !newUnitSymbol.trim() || !selectedMeasurementId) {
      message.error('Unit name, symbol, and measurement selection are required');
      return;
    }
    
    try {
      const unitData = {
        name: newUnitName.trim(),
        symbol: newUnitSymbol.trim(),
        measurementId: selectedMeasurementId
      };
      
      const response = await createUnit(unitData).unwrap();
      if (response.statusCode === 201) {
        message.success('Unit created successfully');
        refetchUnits();
        setNewUnitName('');
        setNewUnitSymbol('');
        setIsUnitModalOpen(false);
        
        // Select the newly created unit
        if (response.data?.name) {
          form.setFieldsValue({ unit: response.data.name });
        }
      }
    } catch (error: any) {
      message.error(error.data?.message || 'Failed to create unit');
    }
  };

  const onFinish = async (values: any) => {
    if (fileList.length === 0) {
      message.error('Please upload at least one image');
      return;
    }

    if (fileList.length > 5) {
      message.error('Maximum 5 images allowed');
      return;
    }

    // Validate supplier selection for credit sales
    if (isCredit && !values.seller) {
      message.error('Please select a supplier for credit sale');
      return;
    }

    setIsSubmitting(true);

    try {
      const productFormData = new FormData();

      // Handle price fields before appending to FormData
      const priceFields = ['price', 'default_price', 'initialPayment', 'downPayment', 'creditAmount'];
      const processedValues = { ...values };
      
      priceFields.forEach(field => {
        if (processedValues[field] !== undefined) {
          processedValues[field] = parsePrice(processedValues[field]);
        }
      });
      
      // Find measurement and unit IDs based on names
      const measurementObj = measurementMap.get(values.measurement);
      const unitObj = unitMap.get(values.unit);
      
      // Replace measurement and unit names with IDs for backend processing
      const backendValues = { ...processedValues };
      
      // Remove measurement and unit to handle them separately
      delete backendValues.measurement;
      delete backendValues.unit;

      // Append basic product fields
      Object.keys(backendValues).forEach(key => {
        if (
          backendValues[key] !== undefined && 
          backendValues[key] !== '' && 
          !['initialPayment', 'downPayment', 'creditAmount', 'paymentDueDate'].includes(key)
        ) {
          productFormData.append(key, backendValues[key].toString());
        }
      });

      // Handle measurement data - prepare the measurement object as required by the backend
      if (measurementObj && unitObj && values.stock) {
        const measurement = {
          type: measurementObj.name, // Use 'type' instead of 'measurement'
          unit: unitObj.name,
          value: Number(values.stock) // Use stock value
        };
        productFormData.append('measurement', JSON.stringify(measurement));
      }

      // Append isCredit field explicitly
      productFormData.append('isCredit', isCredit.toString());

      // Append images
      fileList.forEach((file) => {
        if (file.originFileObj) {
          productFormData.append('images', file.originFileObj);
        }
      });

      // Create product first
      const productRes = await createNewProduct(productFormData).unwrap();

      // If credit is enabled and product creation was successful, create credit record
      if (isCredit && productRes.data?._id) {
        const supplier = sellers?.data.find((s: ISeller) => s._id === values.seller);
        
        if (!supplier) {
          throw new Error('Supplier information not found');
        }

        const quantity = values.stock || 1;
        const totalAmount = parsePrice(values.default_price) * quantity; // Use default_price

        const creditData = {
          productId: productRes.data._id,
          totalAmount: totalAmount,
          downPayment: parsePrice(values.initialPayment),
          creditAmount: totalAmount - parsePrice(values.initialPayment),
          paymentDueDate: values.paymentDueDate.format('YYYY-MM-DD'),
          customerDetails: {
            name: supplier.name,
            phone: supplier.contactNo,
            email: supplier.email
          },
          status: 'PENDING'
        };

        try {
          const creditRes = await createCredit(creditData).unwrap();
          if (creditRes.statusCode === 201) {
            message.success('Product created and credit record established successfully');
          } else {
            message.warning('Product created but credit record creation failed');
          }
        } catch (creditError: any) {
          console.error('Credit creation error:', creditError);
          message.error('Product created but failed to create credit record: ' + 
            (creditError.data?.message || 'Unknown error'));
        }
      } else {
        message.success(productRes.message);
      }

      // Reset form and state
      form.resetFields();
      setFileList([]);
      setIsCredit(false);
      setSelectedSupplier(null);
      setInitialPayment(0);
      setSelectedMeasurement(null);
      setSelectedMeasurementId(null);
      
    } catch (error: any) {
      console.error('Product creation error:', error);
      message.error(error.data?.message || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
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
            
            {/* Debug info - Remove in production */}
            <div className="mb-4 p-2 bg-gray-100 rounded text-sm">
              Current User Role: <strong>{currentUserRole}</strong>
              {canSetOriginalPrice(currentUserRole) && (
                <span className="ml-2 text-green-600">(Can set original price)</span>
              )}
            </div>
            
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

                {/* Default Price - Always visible and required */}
                <Col xs={24} md={canSetOriginalPrice(currentUserRole) ? 12 : 24}>
                  <Form.Item
                    label="Default Price"
                    name="default_price"
                    rules={[{ required: true, message: 'Please enter default price' }]}
                    tooltip="This is the standard selling price for this product"
                  >
                    <InputNumber
                      size="large"
                      className="w-full rounded-md"
                      min={0}
                      placeholder="Enter default price"
                      formatter={formatPrice}
                      parser={parsePrice}
                      onFocus={(e) => e.target.select()}
                    />
                  </Form.Item>
                </Col>

                {/* Original Price - Only visible for ADMIN/SUPER_ADMIN */}
                {canSetOriginalPrice(currentUserRole) && (
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Original Price (Admin Only)"
                      name="price"
                      tooltip="Only administrators can set the original purchase price"
                    >
                      <InputNumber
                        size="large"
                        className="w-full rounded-md"
                        min={0}
                        placeholder="Enter original price"
                        formatter={formatPrice}
                        parser={parsePrice}
                        onFocus={(e) => e.target.select()}
                      />
                    </Form.Item>
                  </Col>
                )}

                {/* Product Description */}
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

                {/* Stock Quantity */}
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Stock Quantity"
                    name="stock"
                    rules={[{ required: true, message: 'Please enter stock quantity' }]}
                  >
                    <InputNumber 
                      size="large" 
                      className="w-full rounded-md" 
                      min={0} 
                      placeholder="Enter stock quantity"
                    />
                  </Form.Item>
                </Col>

                {/* Measurement Selection with Create Option */}
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Measurement Type"
                    name="measurement"
                    rules={[{ required: true, message: 'Please select or create a measurement type' }]}
                  >
                    <Select
                      size="large"
                      placeholder="Select measurement type"
                      onChange={handleMeasurementSelect}
                      className="rounded-md"
                      dropdownRender={(menu) => (
                        <>
                          {menu}
                          <Divider className="my-2" />
                          <Button 
                            type="text"
                            block
                            onClick={() => setIsMeasurementModalOpen(true)}
                            icon={<PlusOutlined />}
                          >
                            Create New Measurement
                          </Button>
                        </>
                      )}
                    >
                      {measurements?.data.map((measurement: IMeasurement) => (
                        <Option key={measurement._id} value={measurement.name}>
                          {measurement.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                {/* Unit Selection */}
                {selectedMeasurement && (
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
                        dropdownRender={(menu) => (
                          <>
                            {menu}
                            <Divider className="my-2" />
                            <Button 
                              type="text"
                              block
                              onClick={() => setIsUnitModalOpen(true)}
                              icon={<PlusOutlined />}
                            >
                              Create New Unit
                            </Button>
                          </>
                        )}
                      >
                        {units?.data.map((unit: IUnit) => (
                          <Option key={unit._id} value={unit.name}>
                            {unit.name} ({unit.symbol})
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                )}

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
                      onSelect={handleSupplierSelect}
                    >
                      {sellers?.data.map((item: ISeller) => (
                        <Option key={item._id} value={item._id}>
                          {item.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item name="isCredit" valuePropName="checked">
                    <Checkbox onChange={handleCreditChange}>
                      Sell on Credit
                    </Checkbox>
                  </Form.Item>
                </Col>

                {/* Credit Details */}
                {isCredit && (
                  <Col xs={24}>
                    <Card className="bg-gray-50">
                      <Title level={4}>Credit Details</Title>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                          <Form.Item
                            label="Initial Payment"
                            name="initialPayment"
                            rules={[{ required: true, message: 'Please enter initial payment' }]}
                          >
                            <InputNumber
                              size="large"
                              className="w-full rounded-md"
                              min={0}
                              placeholder="Enter initial payment"
                              formatter={formatPrice}
                              parser={parsePrice}
                              onChange={(value) => {
                                setInitialPayment(value || 0);
                                const quantity = form.getFieldValue('stock') || 1;
                                const dueDate = form.getFieldValue('paymentDueDate');
                                const price = form.getFieldValue('default_price');
                                calculateCreditDetails(price, value, dueDate, quantity);
                              }}
                            />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                          <Form.Item
                            label="Payment Due Date"
                            name="paymentDueDate"
                            rules={[{ required: true, message: 'Please select due date' }]}
                          >
                            <DatePicker
                              size="large"
                              className="w-full rounded-md"
                              disabledDate={(current) => current && current < dayjs().endOf('day')}
                              onChange={(date) => {
                                const price = form.getFieldValue('default_price');
                                const quantity = form.getFieldValue('stock') || 1;
                                calculateCreditDetails(price, initialPayment, date, quantity);
                              }}
                            />
                          </Form.Item>
                        </Col>

                        {/* Read-only calculated fields */}
                        <Col xs={24} md={12}>
                          <Form.Item
                            label="Down Payment"
                            name="downPayment"
                          >
                            <InputNumber
                              size="large"
                              className="w-full rounded-md"
                              disabled
                              formatter={formatPrice}
                              parser={parsePrice}
                            />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                          <Form.Item
                            label="Credit Amount"
                            name="creditAmount"
                          >
                            <InputNumber
                              size="large"
                              className="w-full rounded-md"
                              disabled
                              formatter={formatPrice}
                              parser={parsePrice}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                )}

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

      {/* Create Measurement Modal */}
      <Modal
        title="Create New Measurement"
        open={isMeasurementModalOpen}
        onOk={handleCreateMeasurement}
        onCancel={() => {
          setIsMeasurementModalOpen(false);
          setNewMeasurementName('');
        }}
        okText="Create"
        confirmLoading={isSubmitting}
      >
        <Form layout="vertical">
          <Form.Item 
            label="Measurement Name" 
            required
            rules={[{ required: true, message: 'Please enter measurement name' }]}
          >
            <Input 
              value={newMeasurementName}
              onChange={(e) => setNewMeasurementName(e.target.value)}
              placeholder="e.g., Weight, Length, Volume"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Unit Modal */}
      <Modal
        title="Create New Unit"
        open={isUnitModalOpen}
        onOk={handleCreateUnit}
        onCancel={() => {
          setIsUnitModalOpen(false);
          setNewUnitName('');
          setNewUnitSymbol('');
        }}
        okText="Create"
        confirmLoading={isSubmitting}
      >
        <Form layout="vertical">
          <Form.Item 
            label="Unit Name" 
            required
            rules={[{ required: true, message: 'Please enter unit name' }]}
          >
            <Input 
              value={newUnitName}
              onChange={(e) => setNewUnitName(e.target.value)}
              placeholder="e.g., Kilogram, Meter, Liter"
            />
          </Form.Item>
          <Form.Item 
            label="Unit Symbol" 
            required
            rules={[{ required: true, message: 'Please enter unit symbol' }]}
          >
            <Input 
              value={newUnitSymbol}
              onChange={(e) => setNewUnitSymbol(e.target.value)}
              placeholder="e.g., kg, m, L" 
            />
          </Form.Item>
          <Text type="secondary">
            This unit will be associated with the currently selected measurement type.
          </Text>
        </Form>
      </Modal>
    </div>
  );
};

export default CreateProduct;
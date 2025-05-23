import React, { useState, useRef } from 'react';
import {
  Modal,
  Button,
  Upload,
  Table,
  Space,
  message,
  Progress,
  Alert,
  Typography,
  Divider,
  Card,
  Row,
  Col,
  Tag,
  Steps,
  List,
  Tooltip
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  FileExcelOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

interface ProductRow {
  id: number;
  name?: string;
  price?: number;
  quantity?: number;
  measurement?: string;
  unit?: string;
  seller?: string;
  category?: string;
  brand?: string;
  description?: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

interface BulkUploadProductsProps {
  visible: boolean;
  onClose: () => void;
  onBulkCreate: (products: any[]) => Promise<void>;
  sellers: any[];
  categories: any[];
  brands: any[];
  measurements: any[];
  units: any[];
}

const BulkUploadProducts: React.FC<BulkUploadProductsProps> = ({
  visible,
  onClose,
  onBulkCreate,
  sellers,
  categories,
  brands,
  measurements,
  units
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<any>(null);

  // Template data for Excel download
  const templateData = [
    {
      name: 'Sample Product 1',
      price: 1000,
      quantity: 50,
      measurement: 'Weight',
      unit: 'kg',
      seller: 'Sample Seller',
      category: 'Electronics',
      brand: 'Sample Brand',
      description: 'Sample product description'
    },
    {
      name: 'Sample Product 2',
      price: 2500,
      quantity: 25,
      measurement: 'Volume',
      unit: 'L',
      seller: 'Another Seller',
      category: 'Home & Garden',
      brand: 'Brand X',
      description: 'Another sample description'
    }
  ];

  // Required columns mapping
  const requiredColumns = {
    name: 'Product Name',
    price: 'Price',
    quantity: 'Quantity',
    measurement: 'Measurement Type',
    unit: 'Unit',
    seller: 'Supplier/Seller',
    category: 'Category'
  };

  const optionalColumns = {
    brand: 'Brand',
    description: 'Description'
  };

  // Download Excel template
  const downloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    
    // Set column widths
    const colWidths = [
      { wch: 20 }, // name
      { wch: 10 }, // price
      { wch: 10 }, // quantity
      { wch: 15 }, // measurement
      { wch: 8 },  // unit
      { wch: 15 }, // seller
      { wch: 15 }, // category
      { wch: 15 }, // brand
      { wch: 30 }  // description
    ];
    worksheet['!cols'] = colWidths;
    
    XLSX.writeFile(workbook, 'product_upload_template.xlsx');
    message.success('Template downloaded successfully');
  };

  // Parse Excel file
  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          message.error('Excel file is empty');
          return;
        }

        // Convert and validate data
        const parsedProducts: ProductRow[] = jsonData.map((row: any, index) => ({
          id: index + 1,
          name: row.name || row.Name || row['Product Name'],
          price: parseFloat(row.price || row.Price) || 0,
          quantity: parseInt(row.quantity || row.Quantity) || 0,
          measurement: row.measurement || row.Measurement || row['Measurement Type'],
          unit: row.unit || row.Unit,
          seller: row.seller || row.Seller || row['Supplier/Seller'],
          category: row.category || row.Category,
          brand: row.brand || row.Brand,
          description: row.description || row.Description,
          status: 'pending'
        }));

        setProducts(parsedProducts);
        validateProducts(parsedProducts);
        setCurrentStep(1);
        message.success(`${parsedProducts.length} products loaded from Excel`);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        message.error('Error parsing Excel file. Please check the format.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Validate products
  const validateProducts = (productList: ProductRow[]) => {
    const errors: string[] = [];
    const sellerNames = sellers.map(s => s.name.toLowerCase());
    const categoryNames = categories.map(c => c.name.toLowerCase());
    const brandNames = brands.map(b => b.name.toLowerCase());
    const measurementNames = measurements.map(m => m.name.toLowerCase());

    productList.forEach((product, index) => {
      const rowNumber = index + 1;
      
      // Required field validation
      if (!product.name?.trim()) {
        errors.push(`Row ${rowNumber}: Product name is required`);
      }
      if (!product.price || product.price <= 0) {
        errors.push(`Row ${rowNumber}: Valid price is required`);
      }
      if (!product.quantity || product.quantity <= 0) {
        errors.push(`Row ${rowNumber}: Valid quantity is required`);
      }
      if (!product.measurement?.trim()) {
        errors.push(`Row ${rowNumber}: Measurement type is required`);
      }
      if (!product.unit?.trim()) {
        errors.push(`Row ${rowNumber}: Unit is required`);
      }
      if (!product.seller?.trim()) {
        errors.push(`Row ${rowNumber}: Seller is required`);
      }
      if (!product.category?.trim()) {
        errors.push(`Row ${rowNumber}: Category is required`);
      }

      // Reference validation
      if (product.seller && !sellerNames.includes(product.seller.toLowerCase())) {
        errors.push(`Row ${rowNumber}: Seller "${product.seller}" not found`);
      }
      if (product.category && !categoryNames.includes(product.category.toLowerCase())) {
        errors.push(`Row ${rowNumber}: Category "${product.category}" not found`);
      }
      if (product.brand && !brandNames.includes(product.brand.toLowerCase())) {
        errors.push(`Row ${rowNumber}: Brand "${product.brand}" not found`);
      }
      if (product.measurement && !measurementNames.includes(product.measurement.toLowerCase())) {
        errors.push(`Row ${rowNumber}: Measurement "${product.measurement}" not found`);
      }
    });

    setValidationErrors(errors);
  };

  // Handle file upload
  const handleFileUpload = (info: any) => {
    const { file } = info;
    if (file.status === 'done' || file.status === 'uploading') {
      parseExcelFile(file.originFileObj);
    }
  };

  // Upload products
  const handleBulkUpload = async () => {
    if (validationErrors.length > 0) {
      message.error('Please fix validation errors before uploading');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setCurrentStep(2);

    try {
      // Process products in batches
      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < products.length; i += batchSize) {
        batches.push(products.slice(i, i + batchSize));
      }

      let processedCount = 0;
      const updatedProducts = [...products];

      for (const batch of batches) {
        const processedBatch = await Promise.allSettled(
          batch.map(async (product) => {
            try {
              // Find reference IDs
              const seller = sellers.find(s => s.name.toLowerCase() === product.seller?.toLowerCase());
              const category = categories.find(c => c.name.toLowerCase() === product.category?.toLowerCase());
              const brand = brands.find(b => b.name.toLowerCase() === product.brand?.toLowerCase());
              const measurement = measurements.find(m => m.name.toLowerCase() === product.measurement?.toLowerCase());
              const unit = units.find(u => u.name.toLowerCase() === product.unit?.toLowerCase());

              const productData = {
                name: product.name,
                price: product.price,
                stock: product.quantity,
                seller: seller?._id,
                category: category?._id,
                brand: brand?._id,
                description: product.description,
                measurement: {
                  measurement: product.measurement,
                  unit: product.unit,
                  value: product.quantity
                }
              };

              // Call the bulk create function
              await onBulkCreate([productData]);
              
              return { ...product, status: 'success' as const };
            } catch (error: any) {
              return { 
                ...product, 
                status: 'error' as const, 
                error: error.message || 'Failed to create product'
              };
            }
          })
        );

        // Update product statuses
        processedBatch.forEach((result, index) => {
          const productIndex = updatedProducts.findIndex(p => p.id === batch[index].id);
          if (productIndex !== -1) {
            if (result.status === 'fulfilled') {
              updatedProducts[productIndex] = result.value;
            } else {
              updatedProducts[productIndex] = {
                ...batch[index],
                status: 'error',
                error: 'Failed to process'
              };
            }
          }
        });

        processedCount += batch.length;
        setUploadProgress((processedCount / products.length) * 100);
        setProducts([...updatedProducts]);

        // Small delay between batches to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const successCount = updatedProducts.filter(p => p.status === 'success').length;
      const errorCount = updatedProducts.filter(p => p.status === 'error').length;

      message.success(`Upload completed: ${successCount} successful, ${errorCount} failed`);
      setCurrentStep(3);

    } catch (error) {
      console.error('Bulk upload error:', error);
      message.error('Bulk upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Reset component
  const handleReset = () => {
    setCurrentStep(0);
    setProducts([]);
    setValidationErrors([]);
    setUploadProgress(0);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.fileList = [];
    }
  };

  // Table columns for product preview
  const columns = [
    {
      title: '#',
      dataIndex: 'id',
      width: 50,
    },
    {
      title: 'Product Name',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      render: (price: number) => `FRW ${price?.toLocaleString()}`,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
    },
    {
      title: 'Measurement',
      render: (record: ProductRow) => `${record.quantity} ${record.unit}`,
    },
    {
      title: 'Seller',
      dataIndex: 'seller',
      ellipsis: true,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: string, record: ProductRow) => {
        const statusConfig = {
          pending: { color: 'default', icon: <InfoCircleOutlined /> },
          success: { color: 'success', icon: <CheckCircleOutlined /> },
          error: { color: 'error', icon: <CloseCircleOutlined /> }
        };
        return (
          <Tooltip title={record.error}>
            <Tag color={statusConfig[status as keyof typeof statusConfig].color} icon={statusConfig[status as keyof typeof statusConfig].icon}>
              {status.toUpperCase()}
            </Tag>
          </Tooltip>
        );
      }
    }
  ];

  return (
    <Modal
      title="Bulk Upload Products"
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={null}
      destroyOnClose
    >
      <div className="space-y-6">
        {/* Steps */}
        <Steps current={currentStep} className="mb-8">
          <Step title="Upload File" icon={<UploadOutlined />} />
          <Step title="Review Data" icon={<ExclamationCircleOutlined />} />
          <Step title="Processing" icon={<FileExcelOutlined />} />
          <Step title="Complete" icon={<CheckCircleOutlined />} />
        </Steps>

        {/* Step 0: File Upload */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <Card>
              <Title level={4}>Upload Excel File</Title>
              <Paragraph>
                Upload an Excel file containing product data. Make sure your file follows the required format.
              </Paragraph>
              
              <Space direction="vertical" className="w-full" size="large">
                <Button 
                  icon={<DownloadOutlined />} 
                  onClick={downloadTemplate}
                  type="dashed"
                  block
                >
                  Download Template
                </Button>
                
                <Upload
                  ref={fileInputRef}
                  accept=".xlsx,.xls"
                  showUploadList={false}
                  customRequest={({ file, onSuccess }) => {
                    parseExcelFile(file as File);
                    onSuccess?.('ok');
                  }}
                >
                  <Button icon={<UploadOutlined />} size="large" block>
                    Select Excel File
                  </Button>
                </Upload>
              </Space>
            </Card>

            {/* Instructions */}
            <Card title="Required Columns">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Title level={5}>Required Fields:</Title>
                  <List
                    size="small"
                    dataSource={Object.entries(requiredColumns)}
                    renderItem={([key, label]) => (
                      <List.Item>
                        <Text strong>{label}</Text>
                      </List.Item>
                    )}
                  />
                </Col>
                <Col span={12}>
                  <Title level={5}>Optional Fields:</Title>
                  <List
                    size="small"
                    dataSource={Object.entries(optionalColumns)}
                    renderItem={([key, label]) => (
                      <List.Item>
                        <Text>{label}</Text>
                      </List.Item>
                    )}
                  />
                </Col>
              </Row>
            </Card>
          </div>
        )}

        {/* Step 1: Review Data */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Title level={4}>Review Products ({products.length})</Title>
              <Space>
                <Button onClick={handleReset}>Back to Upload</Button>
                <Button 
                  type="primary" 
                  onClick={handleBulkUpload}
                  disabled={validationErrors.length > 0}
                >
                  Start Upload
                </Button>
              </Space>
            </div>

            {validationErrors.length > 0 && (
              <Alert
                type="error"
                message="Validation Errors"
                description={
                  <div className="max-h-32 overflow-y-auto">
                    {validationErrors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </div>
                }
                showIcon
              />
            )}

            <Table
              columns={columns}
              dataSource={products}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
              size="small"
            />
          </div>
        )}

        {/* Step 2: Processing */}
        {currentStep === 2 && (
          <div className="space-y-6 text-center">
            <Title level={4}>Processing Products...</Title>
            <Progress 
              percent={Math.round(uploadProgress)} 
              status={isUploading ? "active" : "success"}
              strokeWidth={8}
            />
            <Text>Please wait while we create your products...</Text>
            
            {products.length > 0 && (
              <Table
                columns={columns}
                dataSource={products}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                size="small"
                scroll={{ x: 800 }}
              />
            )}
          </div>
        )}

        {/* Step 3: Complete */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircleOutlined className="text-green-500 text-6xl mb-4" />
              <Title level={3}>Upload Complete!</Title>
            </div>

            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card className="text-center">
                  <Title level={2} className="text-green-500">
                    {products.filter(p => p.status === 'success').length}
                  </Title>
                  <Text>Successful</Text>
                </Card>
              </Col>
              <Col span={8}>
                <Card className="text-center">
                  <Title level={2} className="text-red-500">
                    {products.filter(p => p.status === 'error').length}
                  </Title>
                  <Text>Failed</Text>
                </Card>
              </Col>
              <Col span={8}>
                <Card className="text-center">
                  <Title level={2} className="text-blue-500">
                    {products.length}
                  </Title>
                  <Text>Total</Text>
                </Card>
              </Col>
            </Row>

            {products.filter(p => p.status === 'error').length > 0 && (
              <Card title="Failed Products" type="inner">
                <Table
                  columns={columns}
                  dataSource={products.filter(p => p.status === 'error')}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  scroll={{ x: 800 }}
                />
              </Card>
            )}

            <div className="flex justify-center space-x-4">
              <Button onClick={handleReset}>Upload More</Button>
              <Button type="primary" onClick={onClose}>Close</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BulkUploadProducts;
import React, { useState, useRef } from 'react';

import { 
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  Space,
  Typography,
  Table,
  Divider,
  Select,
  message,
  Spin,
  Modal
} from 'antd';
import { DeleteOutlined, FileAddOutlined, PlusOutlined, PrinterOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useGetAllproformaQuery, useCreateProformaMutation } from '../../redux/features/management/ProformaApi';
import { useGetAllProductsQuery } from '../../redux/features/management/productApi';
import moment from 'moment';
import PrintableInvoice from '../../components/product/PrintableInvoice';
import ProformaInvoicesList from './ProformaInvoicesList';

const { Title } = Typography;
const { Option } = Select;

interface Item {
  key: number;
  productId: string;
  description: string;
  quantity: string;
  price: string;
  total: string;
}

const ProformaInvoice = () => {
  const [form] = Form.useForm();
  const printComponentRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Item[]>([
    { key: 0, productId: '', description: '', quantity: '', price: '', total: '0.00' }
  ]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentInvoiceData, setCurrentInvoiceData] = useState<any>(null);
  const [isListView, setIsListView] = useState(false);
  // API hooks
  const [createProforma, { isLoading: isCreating }] = useCreateProformaMutation();
  const { 
    data: productsResponse, 
    isLoading: isLoadingProducts,
    error: productsError
  } = useGetAllProductsQuery({});

  const products = productsResponse?.data || [];

  const calculateLineTotal = (quantity: string, price: string): string => {
    return (parseFloat(quantity || '0') * parseFloat(price || '0')).toFixed(2);
  };

  const calculateTotals = (items: Item[]) => {
    const subtotal = items.reduce((sum, item) => {
      return sum + parseFloat(calculateLineTotal(item.quantity, item.price));
    }, 0);
    
    const salesTax = (subtotal * 0.1).toFixed(2);
    const total = (parseFloat(subtotal.toFixed(2)) + parseFloat(salesTax)).toFixed(2);
    
    return {
      subtotal: subtotal.toFixed(2),
      salesTax,
      other: '0.00',
      total
    };
  };

  const toggleView = () => {
    setIsListView(!isListView);
  };

  const handleItemChange = (key: number, field: string, value: string) => {
    const newItems = items.map(item => {
      if (item.key === key) {
        const updatedItem = { ...item, [field]: value };
        
        if (field === 'productId' && products.length > 0) {
          const selectedProduct = products.find(p => p._id === value);
          if (selectedProduct) {
            updatedItem.description = selectedProduct.name;
            updatedItem.price = selectedProduct.price.toString();
            updatedItem.total = calculateLineTotal(updatedItem.quantity, selectedProduct.price);
          }
        }
        
        if (field === 'quantity' || field === 'price') {
          updatedItem.total = calculateLineTotal(updatedItem.quantity, updatedItem.price);
        }
        
        return updatedItem;
      }
      return item;
    });
    setItems(newItems);
    form.setFieldsValue({ totals: calculateTotals(newItems) });
  };

  const addItem = () => {
    const newKey = Math.max(...items.map(item => item.key)) + 1;
    setItems([...items, { 
      key: newKey, 
      productId: '', 
      description: '', 
      quantity: '', 
      price: '', 
      total: '0.00' 
    }]);
  };

  const removeItem = (key: number) => {
    const newItems = items.filter(item => item.key !== key);
    setItems(newItems);
    form.setFieldsValue({ totals: calculateTotals(newItems) });
  };

  const handlePrint = () => {
    if (printComponentRef.current) {
      const printContents = printComponentRef.current;
      const originalTitle = document.title;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Proforma Invoice</title>
              <style>
                body { font-family: Arial, sans-serif; }
                @media print {
                  body * { visibility: hidden; }
                  #printSection, #printSection * { visibility: visible; }
                  #printSection { 
                    position: absolute; 
                    left: 0; 
                    top: 0; 
                  }
                }
              </style>
            </head>
            <body>
              <div id="printSection">
                ${printContents.innerHTML}
              </div>
            </body>
          </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
        
        document.title = originalTitle;
        
        setIsModalVisible(false);
        form.resetFields();
        setItems([{ key: 0, productId: '', description: '', quantity: '', price: '', total: '0.00' }]);
      }
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const formattedItems = items.map(item => ({
        product: item.productId,
        description: item.description,
        quantity: parseFloat(item.quantity),
        price: parseFloat(item.price),
        total: parseFloat(item.total)
      }));

      const payload = {
        ...values,
        items: formattedItems,
        date: values.invoiceDetails.invoiceDate.toISOString(),
        dueDate: values.invoiceDetails.dueDate.toISOString(),
        totals: calculateTotals(items)
      };

      const response = await createProforma(payload).unwrap();
      message.success('Proforma invoice created successfully');
      setCurrentInvoiceData({
        ...values,
        invoiceDetails: {
          ...values.invoiceDetails,
          invoiceNo: response.invoiceNo 
        }
      });
      setIsModalVisible(true);
    } catch (error) {
      message.error('Failed to create proforma invoice');
      console.error('Error creating proforma:', error);
    }
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: 'productId',
      key: 'productId',
      width: 200,
      render: (text: string, record: Item) => (
        <Select
          value={text}
          onChange={value => handleItemChange(record.key, 'productId', value)}
          loading={isLoadingProducts}
          style={{ width: '100%' }}
        >
          {Array.isArray(products) && products.map(product => (
            <Option key={product._id} value={product._id}>
              {product.name} ({product.stock} in stock)
            </Option>
          ))}
        </Select>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string, record: Item) => (
        <Input
          value={text}
          onChange={e => handleItemChange(record.key, 'description', e.target.value)}
        />
      )
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (text: string, record: Item) => (
        <Input
          type="number"
          value={text}
          onChange={e => handleItemChange(record.key, 'quantity', e.target.value)}
        />
      )
    },
    {
      title: 'Price (frw)',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (text: string, record: Item) => (
        <Input
          type="number"
          value={text}
          onChange={e => handleItemChange(record.key, 'price', e.target.value)}
        />
      )
    },
    {
      title: 'Total (frw)',
      dataIndex: 'total',
      key: 'total',
      width: 120
    },
    {
      title: 'Action',
      key: 'action',
      width: 60,
      render: (_: any, record: Item) => (
        <Button
          type="text"
          icon={<DeleteOutlined />}
          onClick={() => removeItem(record.key)}
          disabled={items.length === 1}
        />
      )
    }
  ];

  if (isLoadingProducts) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Loading products...</p>
      </div>
    );
  }

  if (productsError) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
        <p>Error loading products. Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <>
      <Card>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '16px' 
        }}>
          <Title level={2} style={{ margin: 0 }}>
            {isListView ? 'Proforma Invoices List' : 'Create Proforma Invoice'}
          </Title>
          <Button 
            onClick={toggleView} 
            type="primary" 
            icon={isListView ? <FileAddOutlined /> : <UnorderedListOutlined />}
          >
            {isListView ? 'Create New Invoice' : 'View Invoices List'}
          </Button>
        </div>

        {isListView ? (
          <ProformaInvoicesList />
        ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            terms: { paymentDays: 30, lateFeePercentage: 5 }
          }}
        >
          <Title level={2} style={{ textAlign: 'center' }}>PROFORMA INVOICE</Title>
          
          {/* Bill From/To Section */}
          <div style={{ display: 'flex', gap: '32px', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
              <Title level={5}>Bill From</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Form.Item name={['billFrom', 'name']} label="Name" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name={['billFrom', 'companyName']} label="Company Name">
                  <Input />
                </Form.Item>
                <Form.Item name={['billFrom', 'streetAddress']} label="Street Address" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name={['billFrom', 'cityStateZip']} label="City, ST ZIP Code" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name={['billFrom', 'phone']} label="Phone">
                  <Input />
                </Form.Item>
              </Space>
            </div>

            <div style={{ flex: 1 }}>
              <Title level={5}>Bill To</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Form.Item name={['billTo', 'name']} label="Name" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name={['billTo', 'companyName']} label="Company Name">
                  <Input />
                </Form.Item>
                <Form.Item name={['billTo', 'streetAddress']} label="Street Address" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name={['billTo', 'cityStateZip']} label="City, ST ZIP Code" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name={['billTo', 'phone']} label="Phone">
                  <Input />
                </Form.Item>
              </Space>
            </div>
          </div>

          {/* Invoice Details */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}> <Form.Item name={['invoiceDetails', 'invoiceNo']} label="Invoice No." rules={[{ required: true }]}>
              <Input />
            </Form.Item> 
            <Form.Item name={['invoiceDetails', 'invoiceDate']} label="Invoice Date" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name={['invoiceDetails', 'dueDate']} label="Due Date" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>

          {/* Items Table */}
          <Table
            dataSource={items}
            columns={columns}
            pagination={false}
            bordered
            footer={() => (
              <Button type="dashed" onClick={addItem} block icon={<PlusOutlined />}>
                Add Item
              </Button>
            )}
          />

          {/* Totals Section */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <div style={{ width: '300px' }}>
              <Form.Item label="Subtotal" name={['totals', 'subtotal']}>
                <Input prefix="frw" readOnly />
              </Form.Item>
              <Form.Item label="Sales Tax (10%)" name={['totals', 'salesTax']}>
                <Input prefix="frw" readOnly />
              </Form.Item>
              <Form.Item label="Other" name={['totals', 'other']}>
                <Input prefix="frw" />
              </Form.Item>
              <Form.Item label="Total" name={['totals', 'total']}>
                <Input prefix="frw" readOnly />
              </Form.Item>
            </div>
          </div>

          <Divider />

          {/* Terms Section */}
          <div style={{ marginBottom: '24px' }}>
            <Title level={5}>Terms and Conditions</Title>
            <Space>
              <span>Thank you for your business. Please send payment within</span>
              <Form.Item name={['terms', 'paymentDays']} noStyle>
                <Input style={{ width: '60px' }} />
              </Form.Item>
              <span>days of receiving this invoice. There will be a</span>
              <Form.Item name={['terms', 'lateFeePercentage']} noStyle>
                <Input style={{ width: '60px' }} />
              </Form.Item>
              <span>% fee per month on late invoices.</span>
            </Space>
          </div>

          {/* Action Buttons */}
          <Space style={{ width: '100%', justifyContent: 'end' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isCreating}
            >
              Create and Save
            </Button>
          </Space>
        </Form>
        )}
      </Card>

      {/* Invoice Modal */}
      <Modal
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            Print Invoice
          </Button>,
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
        title="Proforma Invoice"
        centered
      >
        <div ref={printComponentRef}>
          <PrintableInvoice
            data={{
              ...currentInvoiceData,
              totals: calculateTotals(items)
            }}
            items={items.map(item => ({
              description: item.description,
              quantity: parseFloat(item.quantity),
              price: parseFloat(item.price),
              total: parseFloat(item.total)
            }))}
          />
        </div>
      </Modal>
    </>
  );
};

export default ProformaInvoice;
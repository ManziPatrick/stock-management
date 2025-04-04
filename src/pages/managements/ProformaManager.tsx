import React, { useState, useRef } from 'react';

import { 
  Card,
  Form,
  Input,
  Button,
  Space,
  Typography,
  Table,
  Divider,
  Select,
  message,
  Spin,
  Modal
} from 'antd';
import { DeleteOutlined, FileAddOutlined, PlusOutlined, PrinterOutlined, SaveOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useGetAllproformaQuery, useCreateProformaMutation } from '../../redux/features/management/ProformaApi';
import { useGetAllProductsQuery } from '../../redux/features/management/productApi';
import PrintableInvoice from '../../components/product/PrintableInvoice';
import ProformaInvoicesList from './ProformaInvoicesList';
import malublog from '../../assets/Marube_log.png';
import addresslog from '../../assets/MARUBE.png';

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
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
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
    
    return {
      subtotal: subtotal.toFixed(2),
      total: subtotal.toFixed(2)
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

  // Enhanced print function with better CSS for printing
  const handlePrint = () => {
    setIsPrinting(true);
    
    setTimeout(() => {
      if (printComponentRef.current) {
        const printContents = printComponentRef.current;
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Proforma Invoice - ${currentInvoiceData?.invoiceNo || ''}</title>
                <style>
                  @page {
                    size: A4;
                    margin: 10mm;
                  }
                  body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                  }
                  * {
                    box-sizing: border-box;
                  }
                  img {
                    max-width: 100%;
                    height: auto !important;
                  }
                  table {
                    width: 100%;
                    border-collapse: collapse;
                  }
                  table td, table th {
                    border: 1px solid #ddd;
                    padding: 8px;
                  }
                  table tr:nth-child(even) {
                    background-color: #f2f2f2;
                  }
                  table th {
                    padding-top: 12px;
                    padding-bottom: 12px;
                    text-align: left;
                    background-color: #f0f0f0;
                  }
                  .print-section {
                    width: 100%;
                    padding: 20px;
                    background-color: white;
                  }
                  @media print {
                    .print-section {
                      width: 100%;
                      padding: 0;
                    }
                    body * {
                      visibility: visible;
                    }
                  }
                </style>
              </head>
              <body>
                <div class="print-section">
                  ${printContents.innerHTML}
                </div>
                <script>
                  // Auto print once loaded
                  window.onload = function() {
                    window.print();
                    setTimeout(function() {
                      window.close();
                    }, 500);
                  };
                </script>
              </body>
            </html>
          `);
          
          printWindow.document.close();
          
          // If auto print doesn't work, we'll have a fallback
          setTimeout(() => {
            setIsPrinting(false);
          }, 3000);
        } else {
          message.error('Unable to open print window');
          setIsPrinting(false);
        }
      } else {
        message.error('Print reference not found');
        setIsPrinting(false);
      }
    }, 500); // Small delay to ensure components are rendered
  };

  // Function to save as PDF
  const handleSaveAsPDF = () => {
    // We're using the print function to save as PDF
    // Most browsers allow saving as PDF from the print dialog
    handlePrint();
    message.info('Use the browser print dialog to save as PDF');
  };

  const handleSubmit = async (values: any) => {
    try {
      const formattedItems = items.map(item => ({
        product: item.productId,
        description: item.description,
        quantity: parseFloat(item.quantity || '0'),
        price: parseFloat(item.price || '0'),
        total: parseFloat(item.total || '0')
      }));

      // Validate items
      const invalidItems = formattedItems.filter(
        item => !item.description || isNaN(item.quantity) || isNaN(item.price)
      );
      
      if (invalidItems.length > 0) {
        message.error('Please fill in all item details correctly');
        return;
      }

      const payload = {
        clientName: values.clientName,
        items: formattedItems,
        totals: calculateTotals(items)
      };

      const response = await createProforma(payload).unwrap();
      message.success('Proforma invoice created successfully');
      setCurrentInvoiceData({
        clientName: values.clientName,
        invoiceNo: response.invoiceNo || response.data?.invoiceNo || `INV-${Date.now()}`
      });
      setIsSaved(true);
      setIsModalVisible(true);
    } catch (error) {
      message.error('Failed to create proforma invoice');
      console.error('Error creating proforma:', error);
    }
  };

  const resetForm = () => {
    form.resetFields();
    setItems([{ key: 0, productId: '', description: '', quantity: '', price: '', total: '0.00' }]);
    setCurrentInvoiceData(null);
    setIsSaved(false);
    setIsModalVisible(false);
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
          min="0"
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
          min="0"
          step="0.01"
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
          <div className='font-semibold mt-4'>
            {isListView ? 'Proforma Invoices List' : 'Create Proforma Invoice'}
          </div>
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
        >
          <div className=''>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <img src={malublog} alt="Company Logo" className="h-20" />
              <img src={addresslog} alt="Address Logo" className="h-20" />
            </div>
            <div className="flex justify-between items-center mb-4">   
              <div className='w-1/2'>
                <span className='flex-nowrap w-full'>Dealers in:</span>
                <p>
                  Interior Designs, Gypsum works, Aluminium, Stainless steel, Glass & MDF elements, Paint Works, Electrical/ Electronical works, Branding/ Signages, Air Conditioning and Solar installation.
                </p>
              </div>

              <div className=''>
                <div className='text-start flex flex-col mb-6'></div>
                <div className='text-start mt-6 flex flex-col'>
                  <span>MARUBE TRADERS LTD</span> 
                  <address>Plot No . 203 nyabugogo-Gatuna Roads</address> 
                  <span>TEL : 0786530669</span> 
                  <span>EMAIL : oyileb.ob@gmail.com</span>
                  <span>TIN: 106949150</span> 
                  <data value="">2025</data> 
                </div>
              </div>
            </div> 
          </div>
       
          <div>
            <Title level={5}>Client :</Title>
            <Form.Item name="clientName" rules={[{ required: true, message: 'Please enter client name' }]}>
              <Input placeholder="Client name" />
            </Form.Item>
          </div>

          {/* Items Table */}
          <Table
            dataSource={items}
            columns={columns}
            pagination={false}
            bordered
            className="border rounded-lg"
            scroll={{ x: true }}
            footer={() => (
              <Button type="dashed" onClick={addItem} block icon={<PlusOutlined />}>
                Add Item
              </Button>
            )}
          />

          {/* Totals Section */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <div style={{ width: '300px' }}>
              <Form.Item label="Total" name={['totals', 'subtotal']}>
                <Input prefix="frw" readOnly value={calculateTotals(items).subtotal} />
              </Form.Item>
            </div>
          </div>

          <Divider />

          {/* Account Details Section */}
          <div className="flex flex-col mb-4">
            <span>Account details</span>
            <span>BPR/KCB BANK ACCOUNT MARUBE TRADERS :4490897650 – KCB/BPR</span>
          </div>

          {/* Action Buttons */}
          <Space style={{ width: '100%', justifyContent: 'end' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isCreating}
              icon={<SaveOutlined />}
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
          <Button 
            key="save" 
            type="default" 
            icon={<SaveOutlined />} 
            onClick={handleSaveAsPDF}
            loading={isPrinting}
          >
            Save as PDF
          </Button>,
          // <Button 
          //   key="print" 
          //   type="primary" 
          //   icon={<PrinterOutlined />} 
          //   onClick={handlePrint}
          //   loading={isPrinting}
          // >
          //   Print Invoice
          // </Button>,
          <Button key="new" type="default" onClick={resetForm}>
            Create New Invoice
          </Button>,
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
        title={`Proforma Invoice - ${currentInvoiceData?.invoiceNo || ''}`}
        centered
      >
        <div ref={printComponentRef} className="print-container">
          <PrintableInvoice
            data={{
              ...currentInvoiceData,
              totals: calculateTotals(items)
            }}
            items={items.map(item => ({
              description: item.description,
              quantity: parseFloat(item.quantity || '0'),
              price: parseFloat(item.price || '0'),
              total: parseFloat(item.total || '0')
            }))}
          />
        </div>
      </Modal>
    </>
  );
};

export default ProformaInvoice;
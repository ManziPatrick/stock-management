//@ts-nocheck
import React, { useState, useEffect } from 'react';
import { 
  Tabs, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  DatePicker, 
  Upload, 
  message, 
  Select 
} from 'antd';
import { 
  UploadOutlined, 
  PrinterOutlined, 
  SaveOutlined, 
  PlusOutlined, 
  DeleteOutlined 
} from '@ant-design/icons';
import moment from 'moment';
import { useGetAllProductsQuery } from '../../redux/features/management/productApi';
import { 
  useGetAllDeliveryNotesQuery,
  useCreateDeliveryNoteMutation,
  useGetDeliveryNoteByIdQuery,
  useUploadProofOfDeliveryMutation
} from '../../redux/features/management/deliveryNoteApi';
import malublog from '../../assets/Marube_log.png';
import addresslog from '../../assets/MARUBE.png';
import stampImg from '../../assets/stamp.png'; 

const { TabPane } = Tabs;
const { Option } = Select;

const DeliveryNoteSystem = () => {
  const [activeTab, setActiveTab] = useState('1');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [itemsList, setItemsList] = useState([{ key: 0, sr: 1, productId: '', particulars: '', quantity: 0 }]);
  const [nextItemId, setNextItemId] = useState(1);
  const [viewingNoteId, setViewingNoteId] = useState(null);

  // RTK Query hooks
  const { 
    data: productsResponse, 
    isLoading: isLoadingProducts 
  } = useGetAllProductsQuery({});
  
  const { 
    data: deliveryNotesResponse, 
    isLoading: isLoadingDeliveryNotes,
    refetch: refetchDeliveryNotes
  } = useGetAllDeliveryNotesQuery({});
  
  const [createDeliveryNote, { isLoading: isCreating }] = useCreateDeliveryNoteMutation();
  
  const { 
    data: viewNoteData,
    isLoading: isLoadingNoteDetails,
    refetch: refetchNoteDetails
  } = useGetDeliveryNoteByIdQuery(viewingNoteId, { skip: !viewingNoteId });
  
  const [uploadProofOfDelivery, { isLoading: isUploading }] = useUploadProofOfDeliveryMutation();

  // Extract data from responses
  const products = productsResponse?.data || [];
  const deliveryNotes = deliveryNotesResponse?.data || [];

  // Load note details when viewingNoteId changes
  useEffect(() => {
    if (viewingNoteId && viewNoteData) {
      form.setFieldsValue({
        id: viewNoteData.id,
        date: moment(viewNoteData.date),
        customerName: viewNoteData.customerName,
        deliveredBy: viewNoteData.deliveredBy,
        receivedBy: viewNoteData.receivedBy
      });
      
      // Add null check before mapping
      if (viewNoteData.items && Array.isArray(viewNoteData.items)) {
        setItemsList(viewNoteData.items.map((item, index) => ({
          ...item,
          key: index,
          sr: index + 1
        })));
      } else {
        // Provide default empty array if items is undefined
        setItemsList([{ key: 0, sr: 1, productId: '', particulars: '', quantity: 0 }]);
      }
    }
  }, [viewNoteData, viewingNoteId, form]);

  // Handle product selection
  const handleProductChange = (key, productId) => {
    const newItems = itemsList.map(item => {
      if (item.key === key) {
        const selectedProduct = products.find(p => p._id === productId);
        return { 
          ...item, 
          productId, 
          particulars: selectedProduct ? selectedProduct.name : ''
        };
      }
      return item;
    });
    setItemsList(newItems);
  };

  // Update item field
  const updateItem = (index, field, value) => {
    const newItems = [...itemsList];
    newItems[index][field] = value;
    setItemsList(newItems);
  };

  // Add a new item row
  const addItem = () => {
    const newSr = itemsList.length + 1; // Calculate next serial number
    setItemsList([...itemsList, { key: nextItemId, sr: newSr, productId: '', particulars: '', quantity: 0 }]);
    setNextItemId(nextItemId + 1);
  };

  // Remove an item row
  const removeItem = (key) => {
    if (itemsList.length === 1) {
      return; // Don't remove the last item
    }
    
    // Remove the item and reorder serial numbers
    const filteredItems = itemsList.filter(item => item.key !== key);
    const reorderedItems = filteredItems.map((item, index) => ({
      ...item,
      sr: index + 1
    }));
    
    setItemsList(reorderedItems);
  };

  const viewProof = (proofUrl) => {
    window.open(proofUrl, '_blank');
  };

  const printDeliveryNote = (id) => {
    const printWindow = window.open('', '_blank');
    
    // Get the HTML content of the delivery note
    const noteToprint = deliveryNotes.find(note => note.id === id);
    if (!noteToprint) return;
    
    // Create the print content
    let printContent = `
      <html>
        <head>
          <title>Delivery Note #${noteToprint.id}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .iheader { text-align: center; margin-bottom: 20px; }
            .logo-container { display: flex; align-items: center; }
            .logo { width: 80px; height: 80px; margin-right: 20px; }
            .company-info { margin-bottom: 10px; }
            .note-details { text-align: right; border: 1px solid #ddd; padding: 10px; }
            .customer-info { margin-bottom: 20px;}
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
            .signature-line { margin-top: 40px; border-top: 1px solid #000; width: 200px; }
            .stamp-area { position: relative; width: 120px; height: 120px; }
            .stamp-img { position: absolute; width: 180px; height: 180px; opacity: 1.5; top: -100px; left: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-container">
             
              <img src="${(document.querySelector('img[src*="Marube_log"]')?.src || "")}" class="logo" alt="Company Logo">
              <div>
                <h2>MarubeTraders Ltd</h2>
                <p>Phone: 0788308463</p>
                <p>Tin: 106949150</p>
                <h3>MarubeInteriors & Exteriors</h3>
                <p>E-mail: oyileb.ob@gmail.com</p>
              </div>
            </div>
            <div class="note-details">
              <p><strong>N0:</strong> ${noteToprint.id}</p>
              <p><strong>Date:</strong> ${moment(noteToprint.date).format('DD/MM/YYYY')}</p>
              
            </div>
            
          </div>
          <div class="iheader">
          <h3>DELIVERY NOTE</h3>
          </div>
          <div class="customer-info">
            <p><strong>Customer Name:</strong> ${noteToprint.customerName}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Sr.</th>
                <th>Particulars</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${noteToprint.items && Array.isArray(noteToprint.items) ? noteToprint.items.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.particulars}</td>
                  <td>${item.quantity}</td>
                </tr>
              `).join('') : '<tr><td colspan="3">No items available</td></tr>'}
            </tbody>
          </table>
          
          <p><strong>Goods once sold will not be returned back.</strong></p>
          
          <div class="signatures">
            <div style="position: relative;">
              <p><strong>Delivered By:</strong> ${noteToprint.deliveredBy || '________________'}</p>
              <div class="signature-line"></div>
              <p><strong>Signature</strong></p>
              <div class="stamp-area">
                <img src="${(document.querySelector(`img[src*="${stampImg}"]`)?.src || stampImg)}" class="stamp-img" alt="Stamp">
              </div>
            </div>
            <div>
              <p><strong>Received By:</strong> ${noteToprint.receivedBy || '________________'}</p>
              <div class="signature-line"></div>
              <p><strong>Signature</strong></p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for images to load before printing
    printWindow.onload = function() {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  };

  const viewDeliveryNote = (id) => {
    setViewingNoteId(id);
    setIsModalVisible(true);
    // Ensure we refetch the note details when viewing
    if (refetchNoteDetails) {
      refetchNoteDetails();
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // Prepare data for API
      const deliveryNoteData = {
        customerName: values.customerName,
        date: values.date.format('YYYY-MM-DD'),
        items: itemsList.map(({ productId, particulars, quantity }) => ({ 
          productId, 
          particulars, 
          quantity 
        })),
        deliveredBy: values.deliveredBy || null,
        receivedBy: values.receivedBy || null
      };
      
      // Use the createDeliveryNote mutation from RTK Query
      await createDeliveryNote(deliveryNoteData).unwrap();
      
      message.success('Delivery note saved successfully');
      form.resetFields();
      setItemsList([{ key: 0, sr: 1, productId: '', particulars: '', quantity: 0 }]);
      setNextItemId(1);
      setActiveTab('2'); // Switch to the view tab
      if (refetchDeliveryNotes) {
        refetchDeliveryNotes();
      }
    } catch (error) {
      //@ts-ignore
      message.error('Failed to save delivery note: ' + (error.data?.message || 'Unknown error'));
    }
  };

  const uploadProof = async (file, id) => {
    try {
      const formData = new FormData();
      formData.append('proof', file);
      
      // Use the uploadProofOfDelivery mutation from RTK Query
      await uploadProofOfDelivery({ id, formData }).unwrap();
      
      message.success('Proof uploaded successfully');
      // Refresh delivery notes list after upload
      if (refetchDeliveryNotes) {
        refetchDeliveryNotes();
      }
    } catch (error) {
       //@ts-ignore
      message.error('Failed to upload proof: ' + (error.data?.message || 'Unknown error'));
    }
    
    return false; // Prevent automatic upload
  };

  // Columns for the items in the delivery note form
  const itemColumns = [
    {
      title: 'Sr.',
      dataIndex: 'sr',
      key: 'sr',
      width: '10%',
    },
    {
      title: 'Particulars',
      dataIndex: 'productId',
      key: 'productId',
      width: '50%',
      render: (text, record, index) => (
        <Select
          value={text}
          onChange={(value) => handleProductChange(record.key, value)}
          placeholder="Select product"
          loading={isLoadingProducts}
          style={{ width: '100%' }}
        >
          {Array.isArray(products) && products.map(product => (
            <Option key={product._id} value={product._id}>
              {product.name} ({product.stock} in stock)
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: '20%',
      render: (text, record, index) => (
        <Input 
          type="number" 
          value={text} 
          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)} 
          placeholder="0"
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: '10%',
      render: (_, record) => (
        <Button 
          type="text" 
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(record.key)}
          disabled={itemsList.length === 1}
        />
      ),
    },
  ];

  // Columns for the delivery notes table in view tab
  const deliveryNoteColumns = [
    {
      title: 'Delivery Note #',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => moment(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Proof of Delivery',
      key: 'proof',
      render: (_, record) => (
        record.proofOfDeliveryUrl ? 
        <Button type="link" onClick={() => viewProof(record.proofOfDeliveryUrl)}>View</Button> : 
        <Upload 
          beforeUpload={(file) => uploadProof(file, record.id)}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />} loading={isUploading}>Upload</Button>
        </Upload>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="flex space-x-2">
          <Button 
            type="primary" 
            icon={<PrinterOutlined />}
            onClick={() => printDeliveryNote(record.id)}
            style={{ marginRight: '8px' }}
          >
            Print
          </Button>
          <Button 
            onClick={() => viewDeliveryNote(record.id)}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  // Columns for the modal view display (read-only)
  const viewItemColumns = [
    {
      title: 'Sr.',
      dataIndex: 'sr',
      key: 'sr',
      width: '10%',
    },
    {
      title: 'Particulars',
      dataIndex: 'particulars',
      key: 'particulars',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
  ];

  return (
    <div className="p-4">
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Create Delivery Note" key="1">
          <div className="bg-white p-6 shadow-md rounded-lg">
            <Form form={form} layout="vertical">
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                  <div className="flex items-center mb-2">
                    <div className="w-16 h-16 flex items-center justify-center rounded overflow-hidden">
                      <img 
                        src={malublog} 
                        alt="MarubeTraders Logo" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="ml-4">
                      <h2 className="text-lg font-bold">MarubeTraders Ltd</h2>
                      <p className="text-sm">Phone: 0788308463</p>
                      <p className="text-sm">Tin: 106949150</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <h3 className="font-semibold">MarubeInteriors & Exteriors</h3>
                    <p className="text-sm">E-mail: oyileb.ob@gmail.com</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="border border-gray-300 rounded px-4 py-2">
                    <p className="font-bold">N0: <span className="font-normal">Auto-generated</span></p>
                    <Form.Item 
                      name="date" 
                      initialValue={moment()}
                      noStyle
                    >
                      <DatePicker 
                        style={{ width: '100%', marginTop: '8px' }} 
                        format="DD/MM/YYYY"
                      />
                    </Form.Item>
                  </div>
                  <h1 className="text-xl font-bold mt-4">DELIVERY NOTE</h1>
                </div>
              </div>

              <div className="mb-6">
                <Form.Item 
                  name="customerName"
                  label="Customer Name"
                  initialValue="AEA INFRASTRUCTURE LTD"
                  rules={[{ required: true, message: 'Please enter customer name' }]}
                >
                  <Input placeholder="Enter customer name" />
                </Form.Item>
              </div>

              <Table 
                dataSource={itemsList} 
                columns={itemColumns}
                pagination={false}
                rowKey="key"
                className="mb-4"
              />
              
              <Button 
                type="dashed" 
                onClick={addItem} 
                className="mb-6" 
                icon={<PlusOutlined />}
              >
                Add Item
              </Button>

              <div className="mt-4 mb-6">
                <p className="font-medium">Goods once sold will not be returned back.</p>
              </div>

              <div className="flex justify-between">
                <div className="relative">
                  <Form.Item 
                    name="deliveredBy" 
                    label="Delivered By"
                  >
                    <Input placeholder="Enter name" />
                  </Form.Item>
                  <p className="font-semibold mt-4">Signature: _________________</p>
                  {/* Stamp preview for form */}
                  <div style={{ position: 'absolute', right: 0, bottom: 0, width: '100px', height: '100px', opacity: 0.7 }}>
                    <img 
                      src={stampImg} // Placeholder for stamp preview
                      alt="Stamp" 
                      className="w-full h-full object-contain"
                      style={{ transform: 'rotate(-15deg)' }}
                    />
                  </div>
                </div>
                <div>
                  <Form.Item 
                    name="receivedBy" 
                    label="Received By"
                  >
                    <Input placeholder="Enter name" />
                  </Form.Item>
                  <p className="font-semibold mt-4">Signature: _________________</p>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <Button icon={<PrinterOutlined />} className="mr-2">Print Preview</Button>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  onClick={handleSave}
                  loading={isCreating}
                >
                  Save
                </Button>
              </div>
            </Form>
          </div>
        </TabPane>
        <TabPane tab="View Delivery Notes" key="2">
          <div className="bg-white p-6 shadow-md rounded-lg">
            <h2 className="text-xl font-bold mb-4">All Delivery Notes</h2>
            <Table 
              dataSource={deliveryNotes} 
              columns={deliveryNoteColumns}
              rowKey="id"
              loading={isLoadingDeliveryNotes}
            />
          </div>
        </TabPane>
      </Tabs>

      <Modal 
        title="Delivery Note Details" 
        visible={isModalVisible} 
        onOk={() => setIsModalVisible(false)} 
        onCancel={() => {
          setIsModalVisible(false);
          setViewingNoteId(null);
        }}
        width={800}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={() => printDeliveryNote(viewingNoteId)}>
            Print
          </Button>,
          <Button key="close" type="primary" onClick={() => {
            setIsModalVisible(false);
            setViewingNoteId(null);
          }}>
            Close
          </Button>
        ]}
      >
        <div className="p-4">
          {isLoadingNoteDetails ? (
            <div className="text-center py-8">Loading...</div>
          ) : viewNoteData ? (
            <>
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                  <div className="flex items-center mb-2">
                    <div className="w-16 h-16 flex items-center justify-center rounded overflow-hidden">
                      <img 
                        src={malublog} 
                        alt="MarubeTraders Logo" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="ml-4">
                      <h2 className="text-lg font-bold">MarubeTraders Ltd</h2>
                      <p className="text-sm">Phone: 0788308463</p>
                      <p className="text-sm">Tin: 106949150</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <h3 className="font-semibold">MarubeInteriors & Exteriors</h3>
                    <p className="text-sm">E-mail: oyileb.ob@gmail.com</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="border border-gray-300 rounded px-4 py-2">
                    <p className="font-bold">N0: <span className="font-normal">{viewNoteData?.id}</span></p>
                    <p className="font-bold">Date: <span className="font-normal">{moment(viewNoteData?.date).format('DD/MM/YYYY')}</span></p>
                  </div>
                  <h1 className="text-xl font-bold mt-4">DELIVERY NOTE</h1>
                </div>
              </div>

              <div className="mb-6">
                <p className="font-semibold">Customer Name: <span className="font-normal">{viewNoteData?.customerName}</span></p>
              </div>

              <Table 
                dataSource={itemsList || []} 
                columns={viewItemColumns}
                pagination={false}
                rowKey="key"
                className="mb-6"
              />

              <div className="mt-4 mb-6">
                <p className="font-medium">Goods once sold will not be returned back.</p>
              </div>

              <div className="flex justify-between">
                <div className="relative">
                  <p className="font-semibold">Delivered By: <span className="font-normal">{viewNoteData?.deliveredBy || '_________________'}</span></p>
                  <p className="font-semibold mt-4">Signature: _________________</p>
                  {/* Stamp in modal view */}
                  <div style={{ position: 'absolute', right: 0, bottom: 0, width: '160px', height: '160px', opacity: 0.9 }}>
                    <img 
                      src="stampImg" 
                      alt={stampImg} 
                      className="w-full h-full object-contain"
                      style={{ transform: 'rotate(-15deg)' }}
                    />
                  </div>
                </div>
                <div>
                  <p className="font-semibold">Received By: <span className="font-normal">{viewNoteData?.receivedBy || '_________________'}</span></p>
                  <p className="font-semibold mt-4">Signature: _________________</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">No data available</div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default DeliveryNoteSystem;
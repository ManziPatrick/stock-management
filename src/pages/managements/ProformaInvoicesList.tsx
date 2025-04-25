//@ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Space, Button, Modal, message, Input, Row, Col, Select, DatePicker } from 'antd';
import { EyeOutlined, PrinterOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useGetAllproformaQuery, useDeleteProformaMutation } from '../../redux/features/management/ProformaApi';
import PrintableInvoice from '../../components/product/PrintableInvoice';
import moment from 'moment';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ProformaInvoicesList = () => {
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  
  // Search states
  const [searchText, setSearchText] = useState('');
  const [searchField, setSearchField] = useState('clientName');
  const [dateRange, setDateRange] = useState(null);
  const [filteredData, setFilteredData] = useState([]);

  const { data: proformaResponse, isLoading, error, refetch } = useGetAllproformaQuery({});
  const [deleteProforma, { isLoading: isDeleting }] = useDeleteProformaMutation();

  // Update filtered data when the original data or search parameters change
  useEffect(() => {
    if (proformaResponse?.data) {
      filterData();
    }
  }, [proformaResponse?.data, searchText, searchField, dateRange]);

  const filterData = () => {
    if (!proformaResponse?.data) return;
    
    let filtered = [...proformaResponse.data];
    
    // Text search
    if (searchText) {
      filtered = filtered.filter(invoice => {
        if (searchField === 'clientName') {
          return invoice.clientName?.toLowerCase().includes(searchText.toLowerCase());
        } else if (searchField === 'invoiceNo') {
          return invoice.invoiceDetails?.invoiceNo?.toLowerCase().includes(searchText.toLowerCase());
        } else if (searchField === 'total') {
          return invoice.totals?.total?.toString().includes(searchText);
        }
        return true;
      });
    }
    
    // Date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');
      
      filtered = filtered.filter(invoice => {
        const invoiceDate = moment(invoice.invoiceDetails?.invoiceDate);
        return invoiceDate.isBetween(startDate, endDate, null, '[]');
      });
    }
    
    setFilteredData(filtered);
  };

  const handleViewInvoice = (record) => {
    setCurrentInvoice(record);
    setIsViewModalVisible(true);
  };

  const handlePrintInvoice = (record) => {
    setCurrentInvoice(record);
    setIsPrintModalVisible(true);
    
    // Give a small delay to allow the modal content to render before printing
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleDeleteInvoice = async (id) => {
    try {
      await deleteProforma(id).unwrap();
      message.success('Proforma invoice deleted successfully');
    } catch (error) {
      message.error('Failed to delete proforma invoice');
      console.error('Delete error:', error);
    }
  };

  const handleReset = () => {
    setSearchText('');
    setSearchField('clientName');
    setDateRange(null);
    refetch();
  };

  const columns = [
    {
      title: 'Invoice No',
      dataIndex: ['invoiceDetails', 'invoiceNo'],
      key: 'invoiceNo',
    },
    {
      title: 'Client Name',
      dataIndex: 'clientName',
      key: 'clientName',
    },
    {
      title: 'Invoice Date',
      dataIndex: ['invoiceDetails', 'invoiceDate'],
      key: 'invoiceDate',
      render: (date) => moment(date).format('YYYY-MM-DD')
    },
    {
      title: 'Due Date',
      dataIndex: ['invoiceDetails', 'dueDate'],
      key: 'dueDate',
      render: (date) => moment(date).format('YYYY-MM-DD')
    },
    {
      title: 'Total Amount',
      dataIndex: 'totals',
      key: 'total',
      render: (totals) => `frw ${totals?.total || '0.00'}`
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => handleViewInvoice(record)}
            type="text"
            title="View Invoice"
          />
          <Button 
            icon={<PrinterOutlined />} 
            onClick={() => handlePrintInvoice(record)}
            type="text"
            title="Print Invoice"
          />
          <Button 
            icon={<DeleteOutlined />} 
            onClick={() => handleDeleteInvoice(record._id)}
            type="text"
            title="Delete Invoice"
            danger
            loading={isDeleting}
          />
        </Space>
      )
    }
  ];

  const formattedInvoiceData = (invoice) => ({
    ...invoice,
    invoiceNo: invoice.invoiceNumber, 
    name: invoice.clientName,
    invoiceDate: moment(invoice.invoiceDetails?.invoiceDate),
    dueDate: invoice.invoiceDetails?.dueDate ? moment(invoice.invoiceDetails.dueDate) : null,
    items: invoice.items.map(item => ({
      description: item.description,
      quantity: parseFloat(item.quantity),
      price: parseFloat(item.price),
      total: parseFloat(item.total)
    }))
  });

  // Add print styles to hide UI elements except invoice content
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        .printable-invoice,
        .printable-invoice * {
          visibility: visible;
        }
        .printable-invoice {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 20px;
        }
        .ant-modal-mask,
        .ant-modal-wrap,
        .ant-modal,
        .ant-modal-content {
          position: static;
          background: none;
          box-shadow: none;
          width: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        .ant-modal-header,
        .ant-modal-footer,
        .ant-modal-close,
        .no-print {
          display: none !important;
        }
        .ant-modal-body {
          padding: 0 !important;
          margin: 0 !important;
        }
        @page {
          size: auto;
          margin: 10mm;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          Loading Proforma Invoices...
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
          Error loading proforma invoices. Please try again.
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-4">
        <Title level={4}>Search Proforma Invoices</Title>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={6}>
            <Select
              style={{ width: '100%' }}
              value={searchField}
              onChange={setSearchField}
              placeholder="Search by"
            >
              <Option value="clientName">Client Name</Option>
              <Option value="invoiceNo">Invoice Number</Option>
              <Option value="total">Total Amount</Option>
            </Select>
          </Col>
          <Col xs={24} md={8}>
            <Input
              placeholder={`Search by ${searchField}...`}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={24} md={8}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={setDateRange}
              format="YYYY-MM-DD"
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
          <Col xs={24} md={2}>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
              type="primary"
              ghost
              block
            >
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      <Table 
        columns={columns}
        dataSource={filteredData.length > 0 || searchText || dateRange ? filteredData : proformaResponse?.data || []}
        rowKey="_id"
        className="rounded-lg"
        scroll={{ x: true }}
        pagination={{ 
          pageSize: 10, 
          showSizeChanger: true 
        }}
      />

      {/* Regular view modal */}
      <Modal
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={null}
        width={800}
        title="Proforma Invoice Details"
      >
        {currentInvoice && (
          <PrintableInvoice 
            data={formattedInvoiceData(currentInvoice)} 
            items={currentInvoice.items}
          />
        )}
      </Modal>

      {/* Print modal with custom styling */}
      <Modal
        open={isPrintModalVisible}
        onCancel={() => setIsPrintModalVisible(false)}
        footer={null}
        width={800}
        title="Print Proforma Invoice"
        className="print-modal"
        maskClosable={true}
        mask={true}
        style={{ top: 20 }}
        bodyStyle={{ padding: 0 }}
      >
        {currentInvoice && (
          <div className="print-container">
            <PrintableInvoice 
              data={formattedInvoiceData(currentInvoice)}
              items={currentInvoice.items}
              isPrint={true}
            />
            <div className="no-print" style={{ 
              textAlign: 'center', 
              padding: '20px', 
              backgroundColor: '#f0f2f5', 
              marginTop: '20px' 
            }}>
              <Button 
                type="primary" 
                onClick={() => window.print()}
                icon={<PrinterOutlined />}
                style={{ marginRight: '10px' }}
              >
                Print Now
              </Button>
              <Button onClick={() => setIsPrintModalVisible(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ProformaInvoicesList;
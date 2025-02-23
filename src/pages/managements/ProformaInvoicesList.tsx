import React, { useState } from 'react';
import { Card, Table, Typography, Space, Button, Modal, message } from 'antd';
import { EyeOutlined, PrinterOutlined, DeleteOutlined } from '@ant-design/icons';
import { useGetAllproformaQuery, useDeleteProformaMutation } from '../../redux/features/management/ProformaApi';
import PrintableInvoice from '../../components/product/PrintableInvoice';
import moment from 'moment';

const { Title } = Typography;

const ProformaInvoicesList = () => {
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);

  const { data: proformaResponse, isLoading, error } = useGetAllproformaQuery({});
  const [deleteProforma, { isLoading: isDeleting }] = useDeleteProformaMutation();

  const handleViewInvoice = (record) => {
    setCurrentInvoice(record);
    setIsViewModalVisible(true);
  };

  const handlePrintInvoice = (record) => {
    setCurrentInvoice(record);
    setIsPrintModalVisible(true);
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

  const handlePrint = () => {
    window.print();
  };

  const columns = [
    {
      title: 'Invoice No',
      dataIndex: ['invoiceDetails', 'invoiceNo'],
      key: 'invoiceNo',
    },
    {
      title: 'Bill To',
      dataIndex: ['billTo', 'name'],
      key: 'billToName',
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
    invoiceDetails: {
      ...invoice.invoiceDetails,
      invoiceDate: moment(invoice.invoiceDetails.invoiceDate),
      dueDate: moment(invoice.invoiceDetails.dueDate)
    },
    items: invoice.items.map(item => ({
      description: item.description,
      quantity: parseFloat(item.quantity),
      price: parseFloat(item.price),
      total: parseFloat(item.total)
    }))
  });

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
    
       
        <Table 
          columns={columns}
          dataSource={proformaResponse?.data || []}
          rowKey="_id"
          className=" rounded-lg"
          scroll={{ x: true }}
          pagination={{ 
            pageSize: 10, 
            showSizeChanger: true 
          }}
        />
     

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

      <Modal
        open={isPrintModalVisible}
        onCancel={() => setIsPrintModalVisible(false)}
        footer={[
          <Button 
            key="print" 
            type="primary" 
            icon={<PrinterOutlined />}
            onClick={handlePrint}
          >
            Print Invoice
          </Button>
        ]}
        width={800}
        title="Print Proforma Invoice"
      >
        {currentInvoice && (
          <PrintableInvoice 
            data={formattedInvoiceData(currentInvoice)}
            items={currentInvoice.items}
            //@ts-ignore
            isPrint={true}
          />
        )}
      </Modal>
    </>
  );
};

export default ProformaInvoicesList;
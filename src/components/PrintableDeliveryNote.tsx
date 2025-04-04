import React from 'react';
import { Table, Typography } from 'antd';
import malublog from '../../assets/Marube_log.png';
import addresslog from '../../assets/MARUBE.png';
import { DeliveryNote } from '../types/interfaces';

const { Title, Text } = Typography;

interface PrintableDeliveryNoteProps {
  data: DeliveryNote;
}

const PrintableDeliveryNote: React.FC<PrintableDeliveryNoteProps> = ({ data }) => {
  const columns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
    },
    {
      title: 'Unit Price (frw)',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 120,
      render: (price: number) => price.toFixed(2),
    },
    {
      title: 'Total (frw)',
      dataIndex: 'total',
      key: 'total',
      width: 120,
      render: (total: number) => total.toFixed(2),
    },
  ];

  const dataSource = data.items.map((item, index) => ({
    ...item,
    key: index,
  }));

  // Format date as DD/MM/YYYY
  const formatDateToDMY = (dateStr: string) => {
    const parts = dateStr.split('/');
    if (parts.length === 3) return dateStr; // Already formatted
    
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Add print styles to component
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        /* Hide browser UI elements */
        @page {
          size: A4;
          margin: 0;
        }
        
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        
        /* Hide all UI elements except the content */
        body > *:not(.ant-modal),
        .ant-modal-header,
        .ant-modal-footer,
        .ant-modal-close,
        .print-button-container {
          display: none !important;
        }
        
        /* Style the modal for print */
        .ant-modal {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          max-width: none !important;
        }
        
        .ant-modal-content {
          border-radius: 0 !important;
          box-shadow: none !important;
          height: 100% !important;
        }
        
        .ant-modal-body {
          padding: 15mm !important;
          height: 100% !important;
          overflow: visible !important;
        }
        
        /* Remove borders */
        .printable-note-container {
          border: none !important;
          box-shadow: none !important;
        }
        
        /* Ensure the table prints properly */
        .ant-table {
          font-size: 12px;
        }
        
        /* Make background white for all elements */
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
          background-color: transparent !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="printable-note-container" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="printable-note" style={{ padding: '20px' }}>
        {/* Logo and Address Header */}
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <img src={malublog} alt="Company Logo" className="h-20" />
          <img src={addresslog} alt="Address Logo" className="h-20" />
        </div>

        {/* Sub-header with company description and contact info */}
        <div className="flex justify-between items-start mb-4">   
          <div className="w-1/2">
            <span className="flex-nowrap w-full font-bold">Dealers in:</span>
            <p>
              Interior Designs, Gypsum works, Aluminium, Stainless steel, Glass & MDF elements, Paint Works, Electrical/ Electronical works, Branding/ Signages, Air Conditioning and Solar installation.
            </p>
          </div>

          <div>
            <div className="text-start flex flex-col mb-6"></div>
            <div className="text-start mt-6 flex flex-col">
              <span className="font-bold">MARUBE TRADERS LTD</span> 
              <address>Plot No . 203 nyabugogo-Gatuna Roads</address> 
              <span>TEL : 0786530669</span> 
              <span>EMAIL : oyileb.ob@gmail.com</span>
              <span>TIN: 106949150</span> 
              <span>{new Date().getFullYear()}</span> 
            </div>
          </div>
        </div>

        {/* Delivery Note Title and Details */}
        <div className="text-center mb-4">
          <Title level={3} style={{ margin: 0 }}>DELIVERY NOTE</Title>
          <div className="flex justify-between mt-2">
            <div>
              <Text strong>Note No: </Text>
              <Text>{data.id}</Text>
            </div>
            <div>
              <Text strong>Date: </Text>
              <Text>{formatDateToDMY(data.date)}</Text>
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="mb-4">
          <Text strong>CLIENT: </Text>
          <Text>{data.customerName}</Text>
        </div>

        {/* Items Table */}
        <Table
          dataSource={dataSource}
          columns={columns}
          pagination={false}
          bordered
          className="mb-4"
          size="middle"
        />

        {/* Notice */}
        <div className="my-6">
          <Text>Goods once sold will not be returned back.</Text>
        </div>

        {/* Signature Section */}
        <div className="flex justify-between mt-10">
          <div>
            <div className="mb-4">
              <Text strong>Delivered By: </Text>
              <span className="border-b border-black inline-block w-32"></span>
            </div>
            <div>
              <Text strong>Signature: </Text>
              <span className="border-b border-black inline-block w-32"></span>
            </div>
          </div>
          <div>
            <div className="mb-4">
              <Text strong>Received By: </Text>
              <span className="border-b border-black inline-block w-32"></span>
            </div>
            <div>
              <Text strong>Signature: </Text>
              <span className="border-b border-black inline-block w-32"></span>
            </div>
          </div>
        </div>

        {/* Print Button - will be hidden when printing */}
        <div className="mt-8 text-center print-button-container">
          <button 
            onClick={() => window.print()} 
            style={{
              padding: '8px 16px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Print Delivery Note
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintableDeliveryNote;
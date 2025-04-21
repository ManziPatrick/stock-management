import React from 'react';
import { Table, Typography } from 'antd';
import malublog from '../../assets/Marube_log.png';
import addresslog from '../../assets/MARUBE.png';
import { DeliveryNote } from '../types/interfaces';
// Import stamp and signature images
import companyStamp from '../../assets/stamp.png';
import directorSignature from '../../assets/signature.png';

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
        
        /* Stamp and signature styles */
        .company-stamp {
          height: 160px !important; /* Approximately 42mm at standard resolution */
          width: 160px !important;  /* Maintaining square ratio for 42x42mm */
          object-fit: contain !important;
          opacity: 0.9 !important;
        }
        
        .director-signature {
          height: 70px !important;
          width: auto !important;
          max-width: 150px !important;
          object-fit: contain !important;
        }
        
        .signature-area {
          position: relative !important;
          min-height: 120px !important;
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e8e8e8', paddingBottom: '8px' }}>
          <img src={malublog} alt="Company Logo" style={{ height: '80px' }} />
          <img src={addresslog} alt="Address Logo" style={{ height: '80px' }} />
        </div>

        {/* Sub-header with company description and contact info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>   
          <div style={{ width: '50%' }}>
            <span style={{ fontWeight: 'bold', display: 'block' }}>Dealers in:</span>
            <p>
              Interior Designs, Gypsum works, Aluminium, Stainless steel, Glass & MDF elements, Paint Works, Electrical/ Electronical works, Branding/ Signages, Air Conditioning and Solar installation.
            </p>
          </div>

          <div>
            <div style={{ marginBottom: '24px' }}></div>
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 'bold' }}>MARUBE TRADERS LTD</span> 
              <address>Plot No . 203 nyabugogo-Gatuna Roads</address> 
              <span>TEL : 0786530669</span> 
              <span>EMAIL : oyileb.ob@gmail.com</span>
              <span>TIN: 106949150</span> 
              <span>{new Date().getFullYear()}</span> 
            </div>
          </div>
        </div>

        {/* Delivery Note Title and Details */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <Title level={3} style={{ margin: 0 }}>DELIVERY NOTE</Title>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
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
        <div style={{ marginBottom: '16px' }}>
          <Text strong>CLIENT: </Text>
          <Text>{data.customerName}</Text>
        </div>

        {/* Items Table */}
        <Table
          dataSource={dataSource}
          columns={columns}
          pagination={false}
          bordered
          style={{ marginBottom: '16px' }}
          size="middle"
        />

        {/* Notice */}
        <div style={{ marginTop: '24px', marginBottom: '24px' }}>
          <Text>Goods once sold will not be returned back.</Text>
        </div>

        {/* Signature Section with Company Stamp */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '40px'
        }}>
          {/* Left side - Delivered By with Stamp and Signature */}
          <div style={{ width: '45%', position: 'relative' }}>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Delivered By: </Text>
              <span style={{ borderBottom: '1px solid black', display: 'inline-block', width: '120px' }}></span>
            </div>
            
            {/* Signature area with stamp overlay */}
            <div className="signature-area" style={{ 
              position: 'relative', 
              minHeight: '120px',
              marginBottom: '10px'
            }}>
              <Text strong style={{ position: 'absolute', top: 0, left: 0 }}>Signature: </Text>
              
              {/* Director signature */}
              <img 
                src={directorSignature} 
                alt="Director Signature" 
                className="director-signature"
                style={{
                  position: 'absolute',
                  top: '0px',
                  left: '80px',
                  height: '70px',
                  width: 'auto',
                  maxWidth: '150px',
                  objectFit: 'contain',
                  zIndex: 2
                }}
              />
              
              {/* Company stamp overlapping signature */}
              <img 
                src={companyStamp} 
                alt="Company Stamp" 
                className="company-stamp"
                style={{
                  position: 'absolute',
                  top: '-30px',
                  left: '100px',
                  height: '160px',
                  width: '160px',
                  objectFit: 'contain',
                  opacity: 0.9,
                  zIndex: 1
                }}
              />
            </div>
            
            <div style={{ marginTop: '80px', paddingTop: '4px', borderTop: '1px solid black', width: '230px', textAlign: 'center' }}>
              Company Signature & Stamp
            </div>
          </div>

          {/* Right side - Received By */}
          <div style={{ width: '45%' }}>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Received By: </Text>
              <span style={{ borderBottom: '1px solid black', display: 'inline-block', width: '120px' }}></span>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Signature: </Text>
              <span style={{ borderBottom: '1px solid black', display: 'inline-block', width: '120px' }}></span>
            </div>
            <div style={{ marginTop: '80px', paddingTop: '4px', borderTop: '1px solid black', width: '230px', textAlign: 'center' }}>
              Client Signature
            </div>
          </div>
        </div>

        {/* Print Button - will be hidden when printing */}
        <div style={{ marginTop: '32px', textAlign: 'center' }} className="print-button-container">
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
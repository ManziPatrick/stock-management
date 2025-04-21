//@ts-nocheck
import React from 'react';
import { Table, Typography } from 'antd';
import malublog from '../../assets/Marube_log.png';
import addresslog from '../../assets/MARUBE.png';
// Import stamp and signature images
import companyStamp from '../../assets/stamp.png';
import directorSignature from '../../assets/signature.png';

const { Title, Text } = Typography;

interface PrintableInvoiceProps {
  data: {
    clientName: string;
    invoiceNo?: string;
    date?: string;
    totals: {
      subtotal: string;
      total: string;
    };
  };
  items: Array<{
    description: string;
    quantity: number;
    price: number;
    total: number;
  }>;
}

const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ data, items }) => {
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
      title: 'Price (frw)',
      dataIndex: 'price',
      key: 'price',
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

  const dataSource = items.map((item, index) => ({
    ...item,
    key: index,
  }));

  // Format date as DD/MM/YYYY
  const formatDateToDMY = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const currentDate = formatDateToDMY(new Date());

  // Add print styles to component
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body, html {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
        }
        .printable-invoice {
          width: 100%;
          height: 100%;
          page-break-after: always;
        }
        .no-print {
          display: none !important;
        }
        .ant-table {
          font-size: 12px;
        }
        @page {
          size: auto;
          margin: 10mm;
        }
        .signature-stamp-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 60px;
        }
        .signature-container img {
          height: 100px;
          width: auto;
          object-fit: contain;
        }
        .stamp-container img {
          height: 180px; /* Increased stamp size */
          width: 180px;
          object-fit: contain;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="printable-invoice" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
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
            <span>{formatDateToDMY(new Date()).split('/')[2]}</span> 
          </div>
        </div>
      </div>

      {/* Invoice Title and Details */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <Title level={3} style={{ margin: 0 }}>PROFORMA INVOICE</Title>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <div>
            <Text strong>Invoice No: </Text>
            <Text>{data.invoiceNo || 'N/A'}</Text>
          </div>
          <div>
            <Text strong>Date: </Text>
            <Text>{data.date ? formatDateToDMY(new Date(data.date)) : currentDate}</Text>
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div style={{ marginBottom: '16px' }}>
        <Text strong>CLIENT: </Text>
        <Text>{data.clientName}</Text>
      </div>

      {/* Items Table */}
      <Table
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        bordered
        style={{ marginBottom: '16px' }}
        size="middle"
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={3}>
                <div style={{ textAlign: 'right' }}>
                  <Text strong>Total:</Text>
                </div>
              </Table.Summary.Cell>
                <Table.Summary.Cell index={1} style={{ textAlign: 'right' }}>
                <Text strong>frw {data.totals.total}</Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />

      {/* Account Details */}
      <div style={{ marginTop: '24px', marginBottom: '16px' }}>
        <Text strong>Account details:</Text>
        <div>BPR/KCB BANK ACCOUNT MARUBE TRADERS :4490897650 – KCB/BPR</div>
      </div>

      {/* Signature Section with Standardized Stamp and Signature */}
      <div className="signature-stamp-container" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end',
        marginTop: '60px'
      }}>
        <div className="signature-container" style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid black', width: '130px', paddingTop: '4px' }}>Client Signature</div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            position: 'relative',
            height: '120px',  // Increased height to accommodate larger stamp
            width: '230px'    // Increased width
          }}>
            {/* Director signature positioned first */}
            <img 
              src={directorSignature} 
              alt="Director Signature" 
              style={{
                position: 'absolute',
                height: '70px',
                width: 'auto',
                maxWidth: '150px',
                objectFit: 'contain',
                zIndex: 2,
                left: '10px'
              }}
            />
            
            {/* Company stamp with standard 42x42mm size (converted to approximate pixels) */}
            <img 
              src={companyStamp} 
              alt="Company Stamp" 
              style={{
                position: 'absolute',
                height: '160px',       // Approximately 42mm at standard screen resolution
                width: '160px',        // Maintaining square aspect ratio for 42x42mm
                objectFit: 'contain',
                zIndex: 1,
                right: '10px',
                opacity: 0.9
              }}
            />
          </div>
          <div style={{ borderTop: '1px solid black', width: '230px', paddingTop: '4px', textAlign: 'center' }}>
            Company Signature & Stamp
          </div>
        </div>
      </div>

      {/* Print Button - will be hidden when printing */}
      <div style={{ marginTop: '32px', textAlign: 'center' }} className="no-print">
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
          Print Invoice
        </button>
      </div>
    </div>
  );
};

export default PrintableInvoice;
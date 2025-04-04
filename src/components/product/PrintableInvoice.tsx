import React from 'react';
import { Table, Typography } from 'antd';
import malublog from '../../assets/Marube_log.png';
import addresslog from '../../assets/MARUBE.png';

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
            <span>{formatDateToDMY(new Date()).split('/')[2]}</span> 
          </div>
        </div>
      </div>

      {/* Invoice Title and Details */}
      <div className="text-center mb-4">
        <Title level={3} style={{ margin: 0 }}>PROFORMA INVOICE</Title>
        <div className="flex justify-between mt-2">
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
      <div className="mb-4">
        <Text strong>CLIENT: </Text>
        <Text>{data.clientName}</Text>
      </div>

      {/* Items Table */}
      <Table
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        bordered
        className="mb-4"
        size="middle"
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={3} className="text-right">
                <Text strong>Total:</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>
                <Text strong>frw {data.totals.total}</Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />

      {/* Account Details */}
      <div className="mt-6 mb-4">
        <Text strong>Account details:</Text>
        <div>BPR/KCB BANK ACCOUNT MARUBE TRADERS :4490897650 – KCB/BPR</div>
      </div>

      {/* Signature Section */}
      <div className="flex justify-between mt-10">
        <div>
          <div className="border-t border-black w-32 pt-1">Client Signature</div>
        </div>
        <div>
          <div className="border-t border-black w-32 pt-1">Company Signature & Stamp</div>
        </div>
      </div>

      {/* Print Button - will be hidden when printing */}
      <div className="mt-8 text-center no-print">
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
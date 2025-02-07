import React from 'react';
import moment from 'moment';
import { CSSProperties } from 'react';

interface BillDetails {
  name: string;
  companyName?: string;
  streetAddress: string;
  cityStateZip: string;
  phone?: string;
}

interface InvoiceDetails {
  invoiceNo: string;
  invoiceDate: moment.Moment;
  dueDate: moment.Moment;
}

interface Totals {
  subtotal: number;
  salesTax: number;
  other: number;
  total: number;
}

interface Terms {
  paymentDays: number;
  lateFeePercentage: number;
}

interface Data {
  billFrom: BillDetails;
  billTo: BillDetails;
  invoiceDetails: InvoiceDetails;
  totals: Totals;
  terms: Terms;
}

interface Item {
  description: string;
  quantity: number;
  price: number;
  total: number;
}

interface PrintableInvoiceProps {
  data: Data;
  items: Item[];
}

const tableHeaderStyle: CSSProperties = {
  border: '1px solid #e2e8f0',
  padding: '0.5rem',
  textAlign: 'left',
  backgroundColor: '#f7fafc'
};

const tableCellStyle: CSSProperties = {
  border: '1px solid #e2e8f0',
  padding: '0.5rem',
  textAlign: 'left'
};

const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ data, items }) => {
    const formatNumber = (num?: number | string) => {
        const parsedNum = typeof num === 'string' ? parseFloat(num) : num;
        return typeof parsedNum === 'number' && !isNaN(parsedNum) ? parsedNum.toFixed(2) : '0.00';
      };

  return (
    <div 
      className="p-8 max-w-4xl mx-auto bg-white font-sans"
      style={{
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        lineHeight: '1.5',
        color: '#000',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem'
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          marginBottom: '1rem'
        }}>
          PROFORMA INVOICE
        </h1>
      </div>

      {/* Bill From/To Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ width: '48%' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Bill From
          </h2>
          <div>
            <p style={{ margin: '0.25rem 0' }}>{data?.billFrom?.name}</p>
            {data?.billFrom?.companyName && <p style={{ margin: '0.25rem 0' }}>{data?.billFrom?.companyName}</p>}
            <p style={{ margin: '0.25rem 0' }}>{data?.billFrom?.streetAddress}</p>
            <p style={{ margin: '0.25rem 0' }}>{data?.billFrom?.cityStateZip}</p>
            {data?.billFrom?.phone && <p style={{ margin: '0.25rem 0' }}>{data?.billFrom?.phone}</p>}
          </div>
        </div>
        <div style={{ width: '48%' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Bill To
          </h2>
          <div>
            <p style={{ margin: '0.25rem 0' }}>{data?.billTo?.name}</p>
            {data?.billTo?.companyName && <p style={{ margin: '0.25rem 0' }}>{data?.billTo?.companyName}</p>}
            <p style={{ margin: '0.25rem 0' }}>{data?.billTo?.streetAddress}</p>
            <p style={{ margin: '0.25rem 0' }}>{data?.billTo?.cityStateZip}</p>
            {data?.billTo?.phone && <p style={{ margin: '0.25rem 0' }}>{data?.billTo?.phone}</p>}
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ margin: '0.5rem 0' }}>
          <strong>Invoice No:</strong> {data?.invoiceDetails?.invoiceNo}
        </p>
        <p style={{ margin: '0.5rem 0' }}>
          <strong>Invoice Date:</strong> {data?.invoiceDetails?.invoiceDate?.format('YYYY-MM-DD')}
        </p>
        <p style={{ margin: '0.5rem 0' }}>
          <strong>Due Date:</strong> {data?.invoiceDetails?.dueDate?.format('YYYY-MM-DD')}
        </p>
      </div>

      {/* Items Table */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '2rem'
      }}>
        <thead>
          <tr>
            <th style={tableHeaderStyle}>Description</th>
            <th style={tableHeaderStyle}>Quantity</th>
            <th style={tableHeaderStyle}>Price (frw)</th>
            <th style={tableHeaderStyle}>Total (frw)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td style={tableCellStyle}>{item.description}</td>
              <td style={tableCellStyle}>{item.quantity}</td>
              <td style={tableCellStyle}>{item.price.toFixed(2)}</td>
              <td style={tableCellStyle}>{item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: '250px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Subtotal:</span>
            <span>{formatNumber(data?.totals?.subtotal)} frw</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Sales Tax (10%):</span>
            <span>{formatNumber(data?.totals?.salesTax)} frw</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Other:</span>
            <span>{formatNumber(data?.totals?.other)} frw</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>Total:</span>
            <span>{formatNumber(data?.totals?.total)} frw</span>
          </div>
        </div>
        </div>

      {/* Terms */}
      <div style={{
        marginTop: '2rem',
        paddingTop: '1rem',
        borderTop: '1px solid #e2e8f0'
      }}>
        <h2 style={{ 
          fontSize: '16px', 
          fontWeight: 'bold', 
          marginBottom: '0.5rem' 
        }}>
          Terms and Conditions
        </h2>
        <p>
          Thank you for your business. Please send payment within {data?.terms?.paymentDays} days 
          of receiving this invoice. There will be a {data?.terms?.lateFeePercentage}% fee per 
          month on late invoices.
        </p>
      </div>
    </div>
  );
};

export default PrintableInvoice;
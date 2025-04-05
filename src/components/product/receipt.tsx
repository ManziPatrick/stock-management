import React, { useRef } from 'react';
import { Printer } from 'lucide-react';

interface Product {
  _id: string;
  productName: string;
  productPrice: number;
  SellingPrice: number;
  quantity: number;
}

interface SaleData {
  _id: string;
  productName?: string;  // For backwards compatibility
  SellingPrice?: number; // For backwards compatibility
  quantity?: number;     // For backwards compatibility
  products?: Product[];
  buyerName: string;
  date: string;
  paymentMode?: string;
  totalAmount?: number;
}

interface ReceiptProps {
  saleData: SaleData;
}

const Receipt = ({ saleData }: ReceiptProps) => {
  const receiptRef = useRef<HTMLDivElement | null>(null);

  const handlePrint = () => {
    if (!receiptRef.current) {
      console.error("Receipt content not found");
      return;
    }

    const printContent = receiptRef.current.innerHTML;

    const inlineStyles = `
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
        }
        .max-w-md {
          margin: auto;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .text-center {
          text-align: center;
        }
        .text-right {
          text-align: right;
        }
        .text-gray-800 {
          color: #2d3748;
        }
        .text-gray-600 {
          color: #718096;
        }
        .text-gray-500 {
          color: #a0aec0;
        }
        .font-bold {
          font-weight: bold;
        }
        .font-semibold {
          font-weight: 600;
        }
        .border-t {
          border-top: 1px solid #e2e8f0;
        }
        .border-b {
          border-bottom: 1px solid #e2e8f0;
        }
        .mb-6 {
          margin-bottom: 1.5rem;
        }
        .pt-4 {
          padding-top: 1rem;
        }
        @media print {
          .print-hidden {
            display: none !important;
          }
        }
      </style>
    `;

    const printWindow = document.createElement("iframe");
    printWindow.style.position = "absolute";
    printWindow.style.top = "-1000px";
    document.body.appendChild(printWindow);

    const printDoc = printWindow.contentDocument || printWindow.contentWindow?.document;
    if (!printDoc) {
      console.error("Failed to access print document");
      return;
    }

    printDoc.open();
    printDoc.write(`
      <html>
        <head>
          <title>Print Receipt</title>
          ${inlineStyles}
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printDoc.close();

    printWindow.contentWindow?.focus();
    printWindow.contentWindow?.print();

    setTimeout(() => document.body.removeChild(printWindow), 1000);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined || isNaN(amount)) {
      return '0.00 frw';
    }
    return `${amount.toFixed(2)} frw`;
  };

  const calculateSubtotal = (price: number | undefined, quantity: number | undefined): number => {
    if (!price || !quantity) return 0;
    return price * quantity;
  };

  // Handle both legacy single product and new multiple products format
  const products = saleData.products || (saleData.productName ? [{
    _id: saleData._id,
    productName: saleData.productName,
    productPrice: 0, // Legacy format doesn't include this
    SellingPrice: saleData.SellingPrice || 0,
    quantity: saleData.quantity || 0
  }] : []);

  const totalAmount = saleData.totalAmount || calculateSubtotal(saleData.SellingPrice, saleData.quantity);

  return (
    <div ref={receiptRef} className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">SALES RECEIPT</h1>
        <p className="text-gray-500 text-sm mt-1">Receipt #: {saleData._id}</p>
      </div>
 
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-gray-700">MARUBE TRADERS LTD</h2>
        <p className="text-sm text-gray-500">Plot No . 203 nyabugogo-Gatuna Roads</p>
        <p className="text-sm text-gray-500">TEL : 0786530669</p>
        <p className="text-sm text-gray-500">EMAIL : oyileb.ob@gmail.com</p>
      </div>

      <div className="border-t border-b border-gray-200 py-4 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-sm text-gray-600">Date:</div>
          <div className="text-sm text-gray-800 text-right">{formatDate(saleData.date)}</div>

          <div className="text-sm text-gray-600">Buyer Name:</div>
          <div className="text-sm text-gray-800 text-right">{saleData.buyerName}</div>
          
          {saleData.paymentMode && (
            <>
              <div className="text-sm text-gray-600">Payment Method:</div>
              <div className="text-sm text-gray-800 text-right">{saleData.paymentMode}</div>
            </>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-12 gap-2 mb-2 text-sm font-semibold text-gray-700">
          <div className="col-span-5">Item</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-3 text-right">Subtotal</div>
        </div>

        {products.map((product) => (
          <div key={product._id} className="grid grid-cols-12 gap-2 text-sm py-1">
            <div className="col-span-5 text-gray-800">{product.productName}</div>
            <div className="col-span-2 text-right text-gray-600">
              {formatCurrency(product.SellingPrice)}
            </div>
            <div className="col-span-2 text-right text-gray-600">{product.quantity}</div>
            <div className="col-span-3 text-right text-gray-800">
              {formatCurrency(calculateSubtotal(product.SellingPrice, product.quantity))}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-base font-bold text-gray-800">Total Amount:</div>
          <div className="text-base font-bold text-gray-800 text-right">
            {formatCurrency(totalAmount)}
          </div>
        </div>
      </div>

      <div className="text-center text-gray-500 text-sm mb-4">
        <p>Thank you for your purchase!</p>
        <p>Please keep this receipt for your records.</p>
      </div>

      <div className="flex justify-center print-hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          <Printer className="w-5 h-5" />
          Print Receipt
        </button>
      </div>
    </div>
  );
};

export default Receipt;
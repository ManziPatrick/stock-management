import React, { useRef } from 'react';
import { Printer } from 'lucide-react';

interface SaleData {
  _id: string;
  product: string;
  productName: string;
  productPrice: number;
  SellingPrice: any;
  quantity: number;
  buyerName: string;
  date: string;
  totalPrice: number;
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

    // Clean up the iframe after printing
    setTimeout(() => document.body.removeChild(printWindow), 1000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };





  return (
    <div ref={receiptRef} className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">SALES RECEIPT</h1>
        <p className="text-gray-500 text-sm mt-1">Receipt #: {saleData._id}</p>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-gray-700">Your Store Name</h2>
        <p className="text-sm text-gray-500">123 Business Street</p>
        <p className="text-sm text-gray-500">City, State 12345</p>
      </div>

      <div className="border-t border-b border-gray-200 py-4 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-sm text-gray-600">Date:</div>
          <div className="text-sm text-gray-800 text-right">{formatDate(saleData.date)}</div>

          <div className="text-sm text-gray-600">Buyer Name:</div>
          <div className="text-sm text-gray-800 text-right">{saleData.buyerName}</div>
        </div>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-4 gap-2 mb-2 text-sm font-semibold text-gray-700">
          <div className="col-span-2">Item</div>
          <div className="text-right">Qty</div>
          <div className="text-right">Price</div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="col-span-2 text-gray-800">{saleData.productName}</div>
          <div className="text-right text-gray-600">{saleData.quantity}</div>
          <div className="text-right text-gray-800">
            {saleData.SellingPrice.toFixed(2)}frw
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-sm text-gray-600">Price Per Unit:</div>
          <div className="text-sm text-gray-800 text-right">
            {saleData.SellingPrice.toFixed(2)}frw
          </div>

          <div className="text-sm text-gray-600">Quantity:</div>
          <div className="text-sm text-gray-800 text-right">{saleData.quantity}</div>

          <div className="text-base font-bold text-gray-800">Total Amount:</div>
          <div className="text-base font-bold text-gray-800 text-right">
            {(saleData.SellingPrice.toFixed(2) * saleData.quantity)} frw
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
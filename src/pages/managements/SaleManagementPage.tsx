// @ts-nocheck

import { PrinterOutlined } from '@ant-design/icons';
import type { PaginationProps, TableColumnsType } from 'antd';
import { Button, Flex, Modal, Pagination, Table, Typography } from 'antd';
import { useState } from 'react';
import Receipt from '../../components/product/receipt';
import SearchInput from '../../components/SearchInput';
import { useGetAllSaleQuery } from '../../redux/features/management/saleApi';

// Define proper types
interface ISaleData {
  _id: string;
  productName: string;
  productPrice: number;
  SellingPrice: number;
  buyerName: string;
  quantity: number;
  date: string;
}

interface ITableSaleData {
  key: string;
  productName: string;
  productPrice: number;
  buyerName: string;
  quantity: number;
  totalPrice: number;
  sellingPrice: number;
  profit: number;
  date: string;
}

const SaleManagementPage = () => {
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: '',
  });

  const [selectedSale, setSelectedSale] = useState<ISaleData | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const { data, isFetching } = useGetAllSaleQuery(query);

  // Format currency helper
  const formatCurrency = (value: number): string => {
    return `${value?.toFixed(0) || '0.00'} frw`;
  };

  const formatDate = (date: string): string => {
    // Format date to 'YYYY-MM-DD'
    return new Date(date).toISOString().split('T')[0];
  };

  const showReceiptModal = (sale: ITableSaleData) => {
    const receiptData = {
      _id: sale.key,
      product: sale.key,
      productName: sale.productName,
      productPrice: sale.productPrice,
      SellingPrice: sale.totalPrice,
      quantity: sale.quantity,
      buyerName: sale.buyerName,
      date: formatDate(sale.date), // Use formatted date here
      totalPrice: sale.sellingPrice,
    };
    
    setSelectedSale(receiptData);
    setIsReceiptModalOpen(true);
  };

  const handleModalClose = () => {
    setIsReceiptModalOpen(false);
    setSelectedSale(null);
  };

  const onChange: PaginationProps['onChange'] = (page) => {
    setQuery((prev) => ({ ...prev, page }));
  };

  const totalMarginProfit = data?.data.meta?.totalSales.stats.totalMarginProfit || 0; 
const totalSellingPrice = data?.data.meta?.totalSales.stats.totalSellingPrice|| 0;

  const tableData: ITableSaleData[] = data?.data?.data?.map((sale: any) => ({
    key: sale._id,
    productName: sale.productName,
    productPrice: Number(sale.productPrice) || 0,
    buyerName: sale.buyerName,
    paymentMode:sale.paymentMode,
    quantity: Number(sale.quantity) || 0,
    totalPrice: Number(sale.SellingPrice) || 0,
    sellingPrice: (Number(sale.SellingPrice) || 0) * (Number(sale.quantity) || 0),
    profit: ((Number(sale.SellingPrice) || 0) - (Number(sale.productPrice) || 0)) * (Number(sale.quantity) || 0),
    date: formatDate(sale.date), // Format date before displaying in table
  })) || [];

  const totalProfit = totalMarginProfit || 0;

  const columns: TableColumnsType<ITableSaleData> = [
    {
      title: 'Product Name',
      key: 'productName',
      dataIndex: 'productName',
    },
    {
      title: 'Purchases Price',
      key: 'productPrice',
      dataIndex: 'productPrice',
      align: 'center',
      render: (price: number) => formatCurrency(price),
    },
    {
      title: 'Buyer Name',
      key: 'buyerName',
      dataIndex: 'buyerName',
      align: 'center',
    },
    {
      title: 'Quantity',
      key: 'quantity',
      dataIndex: 'quantity',
      align: 'center',
    },
    {
      title: 'Selling Price',
      key: 'totalPrice',
      dataIndex: 'totalPrice',
      align: 'center',
      render: (price: number) => formatCurrency(price),
    },
    {
      title: 'Total Selling Price',
      key: 'sellingPrice',
      dataIndex: 'sellingPrice',
      align: 'center',
      render: (price: number) => formatCurrency(price),
    },
    {
      title: 'paymentMode',
      key: 'paymentMode',
      dataIndex: 'paymentMode',
      align: 'center',
      
    },
    {
      title: 'Margin',
      key: 'profit',
      dataIndex: 'profit',
      align: 'center',
      render: (profit: number) => (
        <span style={{ color: profit >= 0 ? 'green' : 'red' }}>
          {formatCurrency(profit)}
        </span>
      ),
    },
    {
      title: 'Selling Date',
      key: 'date',
      dataIndex: 'date',
      align: 'center',
    },
    {
      title: 'Action',
      key: 'x',
      align: 'center',
      render: (_, record) => (
        <div className="flex gap-2 justify-center">
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => showReceiptModal(record)}
            className="flex items-center"
          >
            Print
          </Button>
        </div>
      ),
      width: '1%',
    },
  ];

  return (
    <div className='p-6 bg-white rounded-lg shadow h-[90vh]'>
      <Flex justify="end" className="m-1 gap-1">
        <SearchInput setQuery={setQuery} placeholder="Search Sold Products..." />
      </Flex>
      
      <Table
        size="small"
        loading={isFetching}
        columns={columns}
        className='rounded-lg border'
        dataSource={tableData}
        pagination={false}
      />
      
      <Flex justify="center" className="mt-4">
        <Pagination
          current={query.page}
          onChange={onChange}
          defaultPageSize={query.limit}
          total={data?.data?.totalCount}
        />
      </Flex>
     <div className=' grid grid-cols-2 gap-4 mt-4 justify-center place-content-center   items-center'>
      <div className='flex justify-end items-right gap-2'>
        <span>Total sales:</span>
       <span className="text-green-600">{formatCurrency(totalSellingPrice)}</span>
      </div>
      <div className='flex justify-center items-center gap-2'>
        <span>Total Margin Profit:  </span>  <span className="text-green-600">{formatCurrency(totalProfit)}</span>
        </div>
          
          </div>

      <Modal 
        open={isReceiptModalOpen}
        onCancel={handleModalClose}
        footer={null}
        width={600}
        centered
      >
        {selectedSale && (
          <Receipt saleData={selectedSale} />
        )}
      </Modal>
    </div>
  );
};

export default SaleManagementPage;

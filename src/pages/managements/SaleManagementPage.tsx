import { PrinterOutlined } from '@ant-design/icons';
import type { PaginationProps, TableColumnsType } from 'antd';
import { Button, Flex, Modal, Pagination, Table, Typography, Select } from 'antd';
import { useState } from 'react';
import Receipt from '../../components/product/receipt';
import SearchInput from '../../components/SearchInput';
import { useGetAllSaleQuery } from '../../redux/features/management/saleApi';

interface ISaleData {
  _id: string;
  productName: string;
  productPrice: number;
  SellingPrice: number;
  buyerName: string;
  quantity: number;
  date: string;
  paymentMode: 'cash' | 'momo' | 'cheque' | 'transfer';
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
  paymentMode: string;
}

const { Text } = Typography;

const SaleManagementPage = () => {
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    filterBy: 'daily' 
  });

  const [selectedSale, setSelectedSale] = useState<ISaleData | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const { data, isFetching } = useGetAllSaleQuery(query);
console.log("hfjefcirdsjfcnc",data)
  const formatCurrency = (value: number): string => {
    return `${value?.toFixed(0) || '0.00'} frw`;
  };

  const formatDate = (date: string): string => {
    return new Date(date).toISOString().split('T')[0];
  };

  const showReceiptModal = (sale: ITableSaleData) => {
    const receiptData = {
      _id: sale.key,
      productName: sale.productName,
      productPrice: sale.productPrice,
      SellingPrice: sale.totalPrice,
      quantity: sale.quantity,
      buyerName: sale.buyerName,
      date: formatDate(sale.date),
      totalPrice: sale.sellingPrice,
      paymentMode: sale.paymentMode
    };
    //@ts-ignore
    setSelectedSale(receiptData);
    setIsReceiptModalOpen(true);
  };

  const handleModalClose = () => {
    setIsReceiptModalOpen(false);
    setSelectedSale(null);
  };

  const onChange: PaginationProps['onChange'] = (page, pageSize) => {
    setQuery((prev) => ({ ...prev, page, limit: pageSize }));
  };

  const handleFilterChange = (value: string) => {
    setQuery((prev) => ({ ...prev, filterBy: value, page: 1 }));
  };

  const tableData: ITableSaleData[] = data?.data?.map((sale: any) => ({
    key: sale._id,
    productName: sale.productName,
    productPrice: Number(sale.productPrice) || 0,
    buyerName: sale.buyerName,
    paymentMode: sale.paymentMode,
    quantity: Number(sale.quantity) || 0,
    totalPrice: Number(sale.SellingPrice) || 0,
    sellingPrice: (Number(sale.SellingPrice) || 0) * (Number(sale.quantity) || 0),
    profit: ((Number(sale.SellingPrice) || 0) - (Number(sale.productPrice) || 0)) * (Number(sale.quantity) || 0),
    date: formatDate(sale.createdAt),
  })) || [];

  const columns: TableColumnsType<ITableSaleData> = [
    {
      title: 'Product Name',
      key: 'productName',
      dataIndex: 'productName',
    },
    {
      title: 'Purchase Price',
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
      title: 'Unit Price',
      key: 'totalPrice',
      dataIndex: 'totalPrice',
      align: 'center',
      render: (price: number) => formatCurrency(price),
    },
    {
      title: 'Total Amount',
      key: 'sellingPrice',
      dataIndex: 'sellingPrice',
      align: 'center',
      render: (price: number) => formatCurrency(price),
    },
    {
      title: 'Payment Mode',
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
      title: 'Sale Date',
      key: 'date',
      dataIndex: 'date',
      align: 'center',
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<PrinterOutlined />}
          onClick={() => showReceiptModal(record)}
          className="flex items-center"
        >
          Print
        </Button>
      ),
      width: '1%',
    },
  ];

  const stats = data?.meta?.totalSales.stats || {
    totalMarginProfit: 0,
    totalSellingPrice: 0
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow min-h-[90vh] flex flex-col">
      <Flex justify="space-between" className="mb-4">
        <SearchInput 
          //@ts-ignore
          setQuery={setQuery} 
          placeholder="Search sales..." 
        />
        <Select
          defaultValue="daily"
          style={{ width: 200 }}
          onChange={handleFilterChange}
          options={[
            { value: 'daily', label: 'Daily Sales' },
            { value: 'monthly', label: 'Monthly Sales' },
            { value: 'yearly', label: 'Yearly Sales' },
          ]}
        />
      </Flex>
      
      <div className="flex-grow">
        <Table
          size="small"
          loading={isFetching}
          columns={columns}
          dataSource={tableData}
          pagination={false}
          className="rounded-lg border"
        />
      </div>
      
      <div className="mt-4 border-t pt-4">
        <Flex justify="space-between" align="center" className="mb-4">
          <div className="flex gap-8">
            <div>
              <Text className="text-gray-600">Total Profit:</Text>
              <Text strong className="ml-2 text-green-600">
                {formatCurrency(stats.totalMarginProfit)}
              </Text>
            </div>
            <div>
              <Text className="text-gray-600">Total Sales:</Text>
              <Text strong className="ml-2">
                {formatCurrency(stats.totalSellingPrice)}
              </Text>
            </div>
          </div>
          <Pagination
            current={query.page}
            onChange={onChange}
            pageSize={query.limit}
            total={data?.meta?.total || 0}
            showSizeChanger={true}
            showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
          />
        </Flex>
      </div>

      <Modal open={isReceiptModalOpen} onCancel={handleModalClose} footer={null} width={600} centered>
        {selectedSale && <Receipt 
        //@ts-ignore
        saleData={selectedSale} />}
      </Modal>
    </div>
  );
};

export default SaleManagementPage;

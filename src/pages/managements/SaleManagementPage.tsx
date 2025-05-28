import { PrinterOutlined } from '@ant-design/icons';
import type { PaginationProps, TableColumnsType } from 'antd';
import { Button, Flex, Modal, Pagination, Table, Typography, Select } from 'antd';
import { useState } from 'react';
import Receipt from '../../components/product/receipt';
import SearchInput from '../../components/SearchInput';
import { useGetAllSaleQuery } from '../../redux/features/management/saleApi';

interface IProduct {
  product: string;
  productName: string;
  productPrice: number;
  SellingPrice: number;
  quantity: number;
  _id: string;
}

interface ISaleData {
  _id: string;
  buyerName: string;
  date: string;
  paymentMode: 'cash' | 'momo' | 'cheque' | 'transfer';
  products: IProduct[];
  totalAmount: number;
  createdAt: string;
}

interface ITableSaleData {
  key: string;
  products: IProduct[];
  buyerName: string;
  totalQuantity: number;
  totalAmount: number;
  totalProfit: number;
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
    filterBy: 'daily',
  });

  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const { data, isFetching } = useGetAllSaleQuery(query);

  const formatCurrency = (value: number): string => {
    return `${value?.toFixed(0) || '0.00'} frw`;
  };

  const formatDate = (date: string): string => {
    return new Date(date).toISOString().split('T')[0];
  };

  const calculateSaleStats = (products: IProduct[]) => {
    return products.reduce(
      (acc, product) => {
        const quantity = Number(product.quantity) || 0;
        const sellingPrice = Number(product.SellingPrice) || 0;
        const purchasePrice = Number(product.productPrice) || 0;
        
        acc.totalQuantity += quantity;
        acc.totalAmount += sellingPrice * quantity;
        acc.totalProfit += (sellingPrice - purchasePrice) * quantity;
        
        return acc;
      },
      { totalQuantity: 0, totalAmount: 0, totalProfit: 0 }
    );
  };

  const showReceiptModal = (sale: ITableSaleData) => {
    setSelectedSale({
      _id: sale.key,
      products: sale.products,
      buyerName: sale.buyerName,
      date: sale.date,
      totalAmount: sale.totalAmount,
      paymentMode: sale.paymentMode,
    });
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

  const tableData: ITableSaleData[] = data?.data?.map((sale: ISaleData) => {
    const stats = calculateSaleStats(sale.products);
    
    return {
      key: sale._id,
      products: sale.products,
      buyerName: sale.buyerName,
      paymentMode: sale.paymentMode,
      totalQuantity: stats.totalQuantity,
      totalAmount: stats.totalAmount,
      totalProfit: stats.totalProfit,
      date: formatDate(sale.createdAt),
    };
  }) || [];

  // Calculate overall stats
  const overallStats = tableData.reduce(
    (acc, sale) => {
      acc.totalRevenue += sale.totalAmount;
      acc.totalProfit += sale.totalProfit;
      return acc;
    },
    { totalRevenue: 0, totalProfit: 0 }
  );

  const expandedRowRender = (record: ITableSaleData) => {
    const columns: TableColumnsType<IProduct> = [
      { title: 'Product', dataIndex: 'productName' },
      { 
        title: 'Purchase Price', 
        dataIndex: 'productPrice',
        render: (price: number) => formatCurrency(price),
      },
      { 
        title: 'Selling Price', 
        dataIndex: 'SellingPrice',
        render: (price: number) => formatCurrency(price),
      },
      { title: 'Quantity', dataIndex: 'quantity' },
      {
        title: 'Subtotal',
        render: (_, record) => formatCurrency(record.SellingPrice * record.quantity),
      },
      
    ];

    return <Table 
      columns={columns} 
      dataSource={record.products} 
      pagination={false} 
      size="small"
    />;
  };

  const columns: TableColumnsType<ITableSaleData> = [
    {
      title: 'Date',
      key: 'date',
      dataIndex: 'date',
      width: '120px',
    },
    {
      title: 'Buyer',
      key: 'buyerName',
      dataIndex: 'buyerName',
    },
    {
      title: 'Total Items',
      key: 'totalQuantity',
      dataIndex: 'totalQuantity',
      align: 'right',
    },
    {
      title: 'Total Amount',
      key: 'totalAmount',
      dataIndex: 'totalAmount',
      align: 'right',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: 'Payment',
      key: 'paymentMode',
      dataIndex: 'paymentMode',
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
      width: '100px',
    },
  ];

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
          expandable={{
            expandedRowRender,
            expandRowByClick: true,
          }}
          pagination={false}
          className="rounded-lg border"
        />
      </div>

      <div className="mt-4 border-t pt-4">
        <Flex justify="space-between" align="center" className="mb-4">
          <div className="flex gap-8">
         </div>
          <Pagination
            current={query.page}
            onChange={onChange}
            pageSize={query.limit}
            total={data?.meta?.total || 0}
            showSizeChanger={true}
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} of ${total} items`
            }
          />
        </Flex>
      </div>

      <Modal
        open={isReceiptModalOpen}
        onCancel={handleModalClose}
        footer={null}
        width={600}
        centered
      >
        {selectedSale && <Receipt saleData={selectedSale} />}
      </Modal>
    </div>
  );
};

export default SaleManagementPage;
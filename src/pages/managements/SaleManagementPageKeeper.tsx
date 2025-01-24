
import type { PaginationProps, TableColumnsType } from 'antd';
import {Flex,Pagination, Table} from 'antd';
import { useState } from 'react';

import SearchInput from '../../components/SearchInput';
import { useGetAllSaleQuery } from '../../redux/features/management/saleApi';

// Define proper types
// interface ISaleData {
//   _id: string;
//   productName: string;
//   productPrice: number;
//   SellingPrice: number;
//   buyerName: string;
//   quantity: number;
//   date: string;
// }

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

const SaleManagementPageKepper = () => {
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: '',
  });

  const { data, isFetching } = useGetAllSaleQuery(query);

  // Format currency helper
  const formatCurrency = (value: number): string => {
    return `${value?.toFixed(2) || '0.00'} frw`;
  };

  const formatDate = (date: string): string => {
    // Format date to 'YYYY-MM-DD'
    return new Date(date).toISOString().split('T')[0];
  };

 const onChange: PaginationProps['onChange'] = (page) => {
    setQuery((prev) => ({ ...prev, page }));
  };

  const tableData: ITableSaleData[] = data?.data?.data?.map((sale: any) => ({
    key: sale._id,
    productName: sale.productName,
    productPrice: Number(sale.productPrice) || 0,
    buyerName: sale.buyerName,
    quantity: Number(sale.quantity) || 0,
    totalPrice: Number(sale.SellingPrice) || 0,
    sellingPrice: (Number(sale.SellingPrice) || 0) * (Number(sale.quantity) || 0),
    profit: ((Number(sale.SellingPrice) || 0) - (Number(sale.productPrice) || 0)) * (Number(sale.quantity) || 0),
    date: formatDate(sale.date), // Format date before displaying in table
  })) || [];


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
      title: 'Selling Date',
      key: 'date',
      dataIndex: 'date',
      align: 'center',
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
        className='rounded-lg border'
        columns={columns}
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
      
      

      
    </div>
  );
};

export default SaleManagementPageKepper;

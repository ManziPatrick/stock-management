
import type { PaginationProps, TableColumnsType } from 'antd';
import { Button, Col, Flex, Modal, Pagination, Row, Table, Tag } from 'antd';
import { useEffect, useState } from 'react';


import {

  useGetAllProductsQuery,
 
} from '../../redux/features/management/productApi';

import {IProduct } from '../../types/product.types';
import ProductManagementFilter from '../../components/query-filters/ProductManagementFilter';

interface IQuery {
  name: string;
  category: string;
  brand: string;
  limit: number;
}

interface ISeller {
  name: string;
  _id: string;
}

interface ITableData extends Omit<IProduct, 'seller'> {
  key: string;
  categoryName: string;
  seller?: ISeller;
  sellerName: string;
}

interface ISaleData {
  _id:any;
  product: string;
  productName: string;
  productPrice: number;
  SellingPrice: number;
  quantity: number;
  buyerName: string;
  date: string;
  totalPrice: number;
}

interface IProfitLoss {
  perUnit: number;
  total: number;
  isProfit: boolean;
}

const ProductManagePageKeeper = () => {
  const [current, setCurrent] = useState(1);
  const [query, setQuery] = useState<IQuery>({
    name: '',
    category: '',
    brand: '',
    limit: 10,
  });

  const { data: products, isFetching } = useGetAllProductsQuery(query);

  const onChange: PaginationProps['onChange'] = (page) => {
    setCurrent(page);
  };

  const tableData = products?.data?.map((product: IProduct) => ({
    key: product._id,
    name: product.name,
    category: product.category,
    categoryName: product.category.name,
    price: product.price,
    stock: product.stock,
    seller: product?.seller,
    sellerName: product?.seller?.name || 'DELETED SELLER',
    brand: product.brand,
    measurementInfo: product.measurement 
      ? `${product.measurement.unit}`
      : 'N/A',
    measurement: product.measurement,
    description: product.description,
    totalValue: product.price * product.stock,
  }));
  
  
  const columns: TableColumnsType<ITableData> = [
    {
      title: 'Product Name',
      key: 'name',
      dataIndex: 'name',
    },
    {
      title: 'Category',
      key: 'categoryName',
      dataIndex: 'categoryName',
      align: 'center',
    },
    {
      title: 'Price',
      key: 'price',
      dataIndex: 'price',
      align: 'center',
      render: (price: number) => `${price.toFixed(0)} frw`,
    },
    {
      title: 'Stock',
      key: 'stock',
      dataIndex: 'stock',
      align: 'center',
    },
    {
      title: 'total Value',
      key: 'totalValue',
      dataIndex: 'totalValue',
      align: 'center',
    },
    {
      title: 'unit',
      key: 'measurementInfo',
      dataIndex: 'measurementInfo',
      align: 'center',
    },
    {
      title: 'Purchase From',
      key: 'sellerName',
      dataIndex: 'sellerName',
      align: 'center',
      render: (sellerName: string) => {
        if (sellerName === 'DELETED SELLER') return <Tag color='red'>{sellerName}</Tag>;
        return <Tag color='green'>{sellerName}</Tag>;
      },
    },
    
  ];

  return (
    <>
      <ProductManagementFilter query={query} setQuery={setQuery} />
      <Table
        size='small'
        loading={isFetching}
        columns={columns}
        dataSource={tableData}
        pagination={false}
      />
      <Flex justify='center' style={{ marginTop: '1rem' }}>
        <Pagination
          current={current}
          onChange={onChange}
          defaultPageSize={query.limit}
          total={products?.meta?.total}
        />
      </Flex>
    </>
  );
};



export default ProductManagePageKeeper;
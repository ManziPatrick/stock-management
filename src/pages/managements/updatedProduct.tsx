import React, { useState, useEffect } from 'react';
import { Table, Button, Flex, Pagination, Modal, Typography } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import formatDate from '../../utils/formatDate';
import { useGetUpdatedProductsQuery } from '../../redux/features/management/productApi';

const ProductDiscrepancyTable = () => {
  const [query, setQuery] = useState({ page: 1, limit: 10 });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  const { data, isFetching } = useGetUpdatedProductsQuery(query);

  const onChange = (page) => setQuery((prev) => ({ ...prev, page }));
  
  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setIsViewModalOpen(true);
  };

  const tableData = data?.data?.map((product) => ({
    key: product.productId,
    name: product.productName,
    measurement: `${product.productMeasurement.value} ${product.productMeasurement.unit}`,
    price: product.productPrice,
    discrepancies: product.totalDiscrepancies,
    purchases: product.discrepantPurchases.map(p => `(${p.purchaseMeasurement.value} ${p.purchaseMeasurement.unit}) - ${formatDate(p.purchaseDate)}`).join('; ')
  })) || [];
//@ts-ignore
  const columns: ColumnsType<any> = [
    { title: 'Product Name', dataIndex: 'name', key: 'name' },
    { title: 'Measurement', dataIndex: 'measurement', key: 'measurement' },
    { title: 'Price', dataIndex: 'price', key: 'price', align: 'center' },
    { title: 'Discrepancies', dataIndex: 'discrepancies', key: 'discrepancies', align: 'center' },
    { title: 'Purchase Details', dataIndex: 'purchases', key: 'purchases' },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Button type="primary" onClick={() => handleViewProduct(record)}>
          <EyeOutlined />
        </Button>
      ),
    },
  ];

  return (
    <div className='p-6 bg-white rounded-lg shadow-md h-[90vh]'>
      <Table
        size='small'
        loading={isFetching}
        columns={columns}
        className='rounded-lg border'
        dataSource={tableData}
        pagination={false}
      />

      <Flex justify='center' style={{ marginTop: '1rem' }}>
        <Pagination current={query.page} onChange={onChange} defaultPageSize={query.limit} total={data?.meta?.total || 0} />
      </Flex>

      <Modal title='Product Details' open={isViewModalOpen} onCancel={() => setIsViewModalOpen(false)} footer={null}>
        {selectedProduct && (
          <div>
            <Typography.Title level={4}>Product Information</Typography.Title>
            {Object.entries(selectedProduct).map(([key, value]) => (
              <p key={key}><strong>{key}:</strong> {String(value)}</p>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductDiscrepancyTable;

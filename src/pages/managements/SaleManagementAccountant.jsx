import { Button, Flex, Modal, Pagination, Table, Typography, Select } from 'antd';
import { useState } from 'react';
import Receipt from '../../components/product/receipt';
import SearchInput from '../../components/SearchInput';
import { useGetAllSaleQuery, useUpdateSaleStatusMutation } from '../../redux/features/management/saleApi';

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

  const [selectedSale, setSelectedSale] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const { data, isFetching } = useGetAllSaleQuery(query);
  const [updateSaleStatus] = useUpdateSaleStatusMutation();

  const formatCurrency = (value) => `${value?.toFixed(0) || '0.00'} frw`;
  const formatDate = (date) => new Date(date).toISOString().split('T')[0];

  const handleApproval = async (saleId, status) => {
    if (!saleId) {
      console.error("Sale ID is undefined!");
      return;
    }
  
    try {
      await updateSaleStatus({ saleId, status }).unwrap();
    } catch (error) {
      console.error("Error updating sale status:", error);
    }
  };
  
  const columns = [
    { title: 'Date', dataIndex: 'date', key: 'date', width: '120px' },
    { title: 'Buyer', dataIndex: 'buyerName', key: 'buyerName' },
    { title: 'Total Amount', dataIndex: 'totalAmount', key: 'totalAmount', align: 'right', render: formatCurrency },
    { title: 'Payment', dataIndex: 'paymentMode', key: 'paymentMode', align: 'center' },
    { title: 'Status', dataIndex: 'status', key: 'status', align: 'center', render: (status) => <Text type={status === 'approved' ? 'success' : 'warning'}>{status}</Text> },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Flex gap={8}>
          <Button type="primary" onClick={() => handleApproval(record.key, 'approved')}>Approve</Button>
          <Button type="default" danger onClick={() => handleApproval(record.key, 'rejected')}>Reject</Button>
          <Button type="dashed" onClick={() => handleApproval(record.key, 'credit')}>Credit</Button>
        </Flex>
      ),
    },
  ];

  const tableData = data?.data?.map((sale) => ({
    key: sale._id,
    buyerName: sale.buyerName,
    totalAmount: sale.totalAmount,
    paymentMode: sale.paymentMode,
    date: formatDate(sale.createdAt),
    status: sale.status || 'pending',
  })) || [];

  return (
    <div className="p-6 bg-white rounded-lg shadow min-h-[90vh] flex flex-col">
      <Flex justify="space-between" className="mb-4">
        <SearchInput setQuery={setQuery} placeholder="Search sales..." />
        <Select defaultValue="daily" style={{ width: 200 }} onChange={(value) => setQuery((prev) => ({ ...prev, filterBy: value, page: 1 }))} options={[{ value: 'daily', label: 'Daily Sales' }, { value: 'monthly', label: 'Monthly Sales' }, { value: 'yearly', label: 'Yearly Sales' }]} />
      </Flex>

      <div className="flex-grow">
        <Table size="small" loading={isFetching} columns={columns} dataSource={tableData} pagination={false} className="rounded-lg border" />
      </div>

      <Pagination current={query.page} onChange={(page, pageSize) => setQuery((prev) => ({ ...prev, page, limit: pageSize }))} pageSize={query.limit} total={data?.meta?.total || 0} showSizeChanger showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`} className="mt-4 border-t pt-4" />

      <Modal open={isReceiptModalOpen} onCancel={() => setIsReceiptModalOpen(false)} footer={null} width={600} centered>{selectedSale && <Receipt saleData={selectedSale} />}</Modal>
    </div>
  );
};

export default SaleManagementPage;

// @ts-nocheck

import { DeleteFilled, EditFilled } from '@ant-design/icons';
import type { PaginationProps, TableColumnsType } from 'antd';
import { Button, Checkbox, Col, Flex, Modal, Pagination, Row, Table, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import { useGetAllDebitsQuery, useCreateDebitMutation } from '../../redux/features/management/debitApi';
import {

  useGetAllProductsQuery,
 
} from '../../redux/features/management/productApi';
import SaleReceipt from '../../components/product/receipt';
import { ICategory, IProduct } from '../../types/product.types';
import ProductManagementFilter from '../../components/query-filters/ProductManagementFilter';
import CustomInput from '../../components/CustomInput';
import toastMessage from '../../lib/toastMessage';
import { useCreateSaleMutation } from '../../redux/features/management/saleApi';

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
  totalvalue: number;
}

interface IProfitLoss {
  perUnit: number;
  total: number;
  isProfit: boolean;
}

const ProductManagePageuser = () => {
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
      ? `${product.measurement.value} ${product.measurement.unit}`
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
      render: (price: number) => `${price.toFixed(2)}`,
    },
    {
      title: 'Stock',
      key: 'stock',
      dataIndex: 'stock',
      align: 'center',
    }, {
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
      title: 'Purchase From',
      key: 'sellerName',
      dataIndex: 'sellerName',
      align: 'center',
      render: (sellerName: string) => {
        if (sellerName === 'DELETED SELLER') return <Tag color='red'>{sellerName}</Tag>;
        return <Tag color='green'>{sellerName}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'x',
      align: 'center',
      render: (item: ITableData) => {
        return (
          <div style={{ display: 'flex' }}>
            <SellProductModal product={item} />
          </div>
        );
      },
      width: '1%',
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

const SellProductModal = ({ product }: { product: IProduct & { key: string } }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [saleData, setSaleData] = useState<SaleDataType | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDebit, setIsDebit] = useState(false);
  const [debitData, setDebitData] = useState<any>(null);

  const [profitLoss, setProfitLoss] = useState({
    perUnit: 0,
    total: 0,
    isProfit: true
  });

  const {
    handleSubmit,
    register,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      quantity: 1,
      pricePerUnit: product.price,
      buyerName: '',
      date: new Date().toISOString().split('T')[0],
      isDebit: false,
      amountPaid: 0,
      dueDate: '',
      description: ''
    }
  });

  const [saleProduct] = useCreateSaleMutation();
  const [createDebit] = useCreateDebitMutation();
  const today = new Date().toISOString().split('T')[0];

  const watchQuantity = watch("quantity");
  const watchPricePerUnit = watch("pricePerUnit");
  const watchAmountPaid = watch("amountPaid");

  const totalAmount = watchQuantity * watchPricePerUnit;
  const remainingAmount = isDebit ? totalAmount - (watchAmountPaid || 0) : 0;

  useEffect(() => {
    if (watchQuantity && watchPricePerUnit) {
      const originalPricePerUnit = product.price;
      const currentPricePerUnit = Number(watchPricePerUnit);
      const currentQuantity = Number(watchQuantity);
      
      const profitPerUnit = currentPricePerUnit - originalPricePerUnit;
      const totalProfitLoss = profitPerUnit * currentQuantity;
      
      setProfitLoss({
        perUnit: Math.abs(profitPerUnit),
        total: Math.abs(totalProfitLoss),
        isProfit: profitPerUnit >= 0
      });
    }
  }, [watchQuantity, watchPricePerUnit, product.price]);

  const onSubmit = async (data: FieldValues) => {
    try {
      setLoading(true);

      const salePayload = {
        product: product.key,
        productName: product.name,
        SellingPrice: Number(data.pricePerUnit),
        productPrice: product.price,
        quantity: Number(data.quantity),
        buyerName: data.buyerName,
        date: data.date,
        originalPrice: product.price,
        profitLoss: {
          perUnit: profitLoss.perUnit,
          total: profitLoss.total,
          isProfit: profitLoss.isProfit
        },
        totalPrice: totalAmount
      };

      const saleResponse = await saleProduct(salePayload).unwrap();

      if (saleResponse.success) {
        if (isDebit) {
          const debitPayload = {
            productName: product.name,
            totalAmount: totalAmount,
            paidAmount: Number(data.amountPaid) || 0,
            remainingAmount: remainingAmount,
            dueDate: data.dueDate,
            buyerName: data.buyerName,
            saleId: saleResponse.data.sale._id,
            status: 'PENDING',
            description: data.description || `Debit for ${product.name} - Quantity: ${data.quantity}`
          };

          const debitResponse = await createDebit(debitPayload).unwrap();
          if (debitResponse.status === 'success') {
            setDebitData(debitResponse.data);
            toastMessage({ 
              icon: 'success', 
              text: 'Sale and debit record created successfully'
            });
          }
        } else {
          toastMessage({ 
            icon: 'success', 
            text: 'Sale created successfully'
          });
        }
        
        setSaleData({
          ...salePayload,
          _id: saleResponse.data.sale._id 
        });

        setShowReceipt(true);
      }
      
    } catch (error: any) {
      console.error('Sale/Debit error:', error);
      toastMessage({ 
        icon: 'error', 
        text: error.data?.message || error.message || 'An error occurred while processing the sale'
      });
    } finally {
      setLoading(false);
    }
  };

  const showModal = () => {
    setIsModalOpen(true);
    setShowReceipt(false);
    setSaleData(null);
    setDebitData(null);
    setIsDebit(false);
    reset({
      quantity: 1,
      pricePerUnit: product.price,
      buyerName: '',
      date: today,
      isDebit: false,
      amountPaid: 0,
      dueDate: '',
      description: ''
    });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setShowReceipt(false);
    setSaleData(null);
    setDebitData(null);
    setIsDebit(false);
    setProfitLoss({ perUnit: 0, total: 0, isProfit: true });
    reset();
  };

  const validateQuantity = (value: number) => {
    return value > 0 && value <= product.stock;
  };

  return (
    <>
      <Button
        onClick={showModal}
        type='primary'
        className='table-btn'
        style={{ backgroundColor: 'royalblue' }}
      >
        Sell
      </Button>
      <Modal 
        title={showReceipt ? 'Sale Receipt' : 'Sell Product'}
        open={isModalOpen} 
        onCancel={handleCancel} 
        footer={null}
        width={showReceipt ? 600 : 400}
        maskClosable={false}
      >
        {showReceipt && saleData ? (
          <div>
            <SaleReceipt saleData={saleData} debitData={debitData} />
            <Flex justify='center' style={{ marginTop: '1rem' }}>
              <Button onClick={handleCancel} type='primary'>
                Close
              </Button>
            </Flex>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: '1rem' }}>
            <CustomInput
              name='buyerName'
              label='Buyer Name'
              errors={errors}
              required={true}
              register={register}
              type='text'
              rules={{
                required: 'Buyer name is required',
                minLength: { value: 2, message: 'Buyer name must be at least 2 characters' }
              }}
            />

            <CustomInput
              name='date'
              label='Selling date'
              errors={errors}
              required={true}
              register={register}
              max={today}
              min={today}
              defaultValue={today}
              type='date'
              rules={{ required: 'Date is required' }}
            />
            
            <CustomInput
              name='pricePerUnit'
              label='Selling Price Per Unit'
              errors={errors}
              required={true}
              register={register}
              type='number'
              defaultValue={product.price}
              rules={{
                required: 'Price is required',
                min: { value: 0.01, message: 'Price must be greater than 0' }
              }}
            />

            <CustomInput
              name='quantity'
              label={`Quantity (Available: ${product.stock})`}
              errors={errors}
              required={true}
              register={register}
              type='number'
              rules={{
                required: 'Quantity is required',
                validate: {
                  positive: (value) => value > 0 || 'Quantity must be greater than 0',
                  inStock: (value) => value <= product.stock || 'Not enough stock available',
                }
              }}
            />

            <div className="mt-4 mb-2">
              <Checkbox 
                checked={isDebit}
                onChange={(e) => setIsDebit(e.target.checked)}
              >
                Create as Debit Sale
              </Checkbox>
            </div>

            {isDebit && (
              <div className="border p-4 rounded-md bg-gray-50 mb-4">
                <Typography.Text strong>Total Amount: {totalAmount} frw</Typography.Text>
                
                <CustomInput
                  name='amountPaid'
                  label='Amount Paid'
                  errors={errors}
                  required={true}
                  register={register}
                  type='number'
                  rules={{
                    required: 'Initial payment amount is required',
                    min: { value: 0, message: 'Amount must be 0 or greater' },
                    validate: {
                      lessThanTotal: (value) => 
                        value < totalAmount || 
                        'For debit sales, initial payment must be less than total amount',
                      positiveRemaining: (value) => {
                        const remaining = totalAmount - value;
                        return remaining > 0 || 
                          'Remaining amount must be greater than 0 for debit sales';
                      }
                    }
                  }}
                />

                <CustomInput
                  name='dueDate'
                  label='Payment Due Date'
                  errors={errors}
                  required={true}
                  register={register}
                  type='date'
                  min={today}
                  rules={{
                    required: 'Due date is required',
                    validate: (value) => 
                      new Date(value) > new Date(today) || 
                      'Due date must be in the future'
                  }}
                />

                <CustomInput
                  name='description'
                  label='Description (Optional)'
                  errors={errors}
                  required={false}
                  register={register}
                  type='textarea'
                />

                <div className="mt-2">
                  <Typography.Text type={remainingAmount > 0 ? "warning" : "error"}>
                    Remaining Amount: {remainingAmount} frw
                  </Typography.Text>
                </div>

                {remainingAmount <= 0 && (
                  <div className="mt-2">
                    <Typography.Text type="error">
                      For debit sales, there must be a remaining amount to pay
                    </Typography.Text>
                  </div>
                )}
              </div>
            )}
            
            <div style={{ margin: '1rem 0', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <h4>Calculation Summary:</h4>
              <p>Original Price: {product.price}frw /unit</p>
              <p>Selling Price: {watchPricePerUnit || product.price}frw /unit</p>
              <p style={{ color: profitLoss.isProfit ? 'green' : 'red' }}>
                {profitLoss.isProfit ? 'Profit' : 'Loss'}: {profitLoss.perUnit}frw /unit
              </p>
              <p style={{ color: profitLoss.isProfit ? 'green' : 'red' }}>
                Total {profitLoss.isProfit ? 'Profit' : 'Loss'}: {profitLoss.total} frw
              </p>
            </div>

            <Flex justify='center' style={{ marginTop: '1rem' }} gap="small">
              <Button onClick={handleCancel} type='default'>
                Cancel
              </Button>
              <Button 
                htmlType='submit' 
                type='primary'
                loading={loading}
                disabled={loading || !validateQuantity(watchQuantity) || (isDebit && remainingAmount <= 0)}
              >
                {loading ? 'Processing...' : 'Sell Product'}
              </Button>
            </Flex>
          </form>
        )}
      </Modal>
    </>
  );
};

export default ProductManagePageuser;
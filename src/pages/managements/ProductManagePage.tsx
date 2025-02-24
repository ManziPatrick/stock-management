// @ts-nocheck

import { DeleteFilled, EditFilled } from '@ant-design/icons';
import type { PaginationProps, TableColumnsType } from 'antd';
import { Button, Col, Flex, Modal, Pagination, Row, Spin, Table, Tag, Checkbox, Image, Input, Radio, Space } from 'antd';
import { useEffect, useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import { useGetAllDebitsQuery, useCreateDebitMutation } from '../../redux/features/management/debitApi';
import {
  useAddStockMutation,
  useDeleteProductMutation,
  useGetAllProductsQuery,
  useUpdateProductMutation,
} from '../../redux/features/management/productApi';
import SaleReceipt from '../../components/product/receipt';
import { ICategory, IProduct } from '../../types/product.types';
import ProductManagementFilter from '../../components/query-filters/ProductManagementFilter';
import CustomInput from '../../components/CustomInput';
import toastMessage from '../../lib/toastMessage';
import { useGetAllCategoriesQuery } from '../../redux/features/management/categoryApi';
import { useGetAllSellerQuery } from '../../redux/features/management/sellerApi';
import { useGetAllBrandsQuery } from '../../redux/features/management/brandApi';
import { useCreateSaleMutation } from '../../redux/features/management/saleApi';
import Typography from 'antd/es/typography/Typography';

interface SaleDataType {
  _id: string;
  product: string;
  productName: string;
  productPrice: number;
  SellingPrice: number;
  quantity: number;
  buyerName: string;
  date: string;
  originalPrice: number;
  paymentMode: string;
  profitLoss: {
    perUnit: number;
    total: number;
    isProfit: boolean;
  };
  totalPrice: number;
}

const ProductManagePage = () => {
  const [current, setCurrent] = useState(1);
  const [query, setQuery] = useState({
    name: '',
    category: '',
    brand: '',
    limit: 10,
    page: 1,
  });

  const { data: products, isFetching } = useGetAllProductsQuery(query);
  const [pageSize, setPageSize] = useState(10);
  const handlePageChange: PaginationProps['onChange'] = (page, pageSize) => {
    setCurrent(page);
    setPageSize(pageSize);
    setQuery(prevQuery => ({
      ...prevQuery,
      page,
      limit: pageSize
    }));
  };
  const totaltotalValue = products?.meta?.summary?.totalValue || 0;

  const tableData = products?.data?.map((product: IProduct,index: number) => ({
    key: product._id,
    serialNumber: (query.page - 1) * query.limit + index + 1,
    name: product.name,
    category: product.category,
    categoryName: product.category.name,
    price: product.price,
    stock: product.stock,
    seller: product?.seller,
    sellerName: product?.seller?.name || 'DELETED SELLER',
    brand: product.brand,
    size: product.measurement?.value || product.size || '',
    unit: product.measurement?.unit || '',
    description: product.description,
    totalValue: product.price * product.stock,
    images: product.images || [],
  }));

  const columns: TableColumnsType<IProduct> = [
     {
    title: '#',
    key: 'serialNumber',
    dataIndex: 'serialNumber',
    align: 'center',
    width: '50px',
  },
    {
      title: 'Image',
      key: 'image',
      dataIndex: 'images',
      align: 'center',
      width: '80px',
      render: (images: string[]) => (
        <Image
          src={images[0] || '/placeholder-image.png'}
          alt="Product"
          style={{ width: 50, height: 50, objectFit: 'contain'}}
          fallback="/placeholder-image.png"
          preview={images.length > 0}
        />
      ),
    },
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
      title: 'price',
      key: 'price',
      dataIndex: 'price',
      align: 'center',
    },
    {
      title: 'stock',
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
      key: 'unit',
      dataIndex: 'unit',
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
      render: (item) => {
        return (
          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
            <SellProductModal product={item} />
            {/* <AddStockModal product={item} /> */}
            <UpdateProductModal product={item} />
            <DeleteProductModal id={item.key} />
          </div>
        );
      },
      width: '1%',
    },
  ];

  return (
    <div className='p-6 bg-white rounded-lg shadow h-[90vh]'>
      <ProductManagementFilter query={query} setQuery={setQuery} />
      <Table
        size='small'
        loading={isFetching}
        columns={columns}
        dataSource={tableData}
        pagination={false}
        rowKey="_id"
        className="border rounded-lg"
        scroll={{ x: true }}
      />
      <Flex justify='center' style={{ marginTop: '1rem' }}>
      <Pagination
  current={current}
  pageSize={pageSize}
  onChange={handlePageChange}
  onShowSizeChange={handlePageChange}
  total={products?.meta?.total}
  showSizeChanger
  showQuickJumper
  showTotal={(total) => `Total ${total} items`}
/>
      </Flex>
      <Flex justify="end" className="mt-4 pr-4">
        <Typography.Title level={4}>
          Total Stock Value: <span className="text-green-600">{totaltotalValue} frw</span>
        </Typography.Title>
      </Flex>
    </div>
  );
};

const SellProductModal = ({ product }: { product: IProduct & { key: string } }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [saleData, setSaleData] = useState<SaleDataType | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDebit, setIsDebit] = useState(false);
  const [debitData, setDebitData] = useState<any>(null);
  const [paymentMode, setPaymentMode] = useState('cash');

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
      description: '',
      momoNumber: '',
      chequeNumber: '',
      bankName: '',
      accountNumber: ''
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
        paymentMode: paymentMode,
        paymentDetails: {
          mode: paymentMode,
          ...(paymentMode === 'momo' && { momoNumber: data.momoNumber }),
          ...(paymentMode === 'cheque' && { chequeNumber: data.chequeNumber }),
          ...(paymentMode === 'transfer' && { 
            bankName: data.bankName,
            accountNumber: data.accountNumber 
          }),
        },
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
    setPaymentMode('cash');
    reset({
      quantity: 1,
      pricePerUnit: product.price,
      buyerName: '',
      date: today,
      isDebit: false,
      amountPaid: 0,
      dueDate: '',
      description: '',
      momoNumber: '',
      chequeNumber: '',
      bankName: '',
      accountNumber: ''
    });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setShowReceipt(false);
    setSaleData(null);
    setDebitData(null);
    setIsDebit(false);
    setPaymentMode('cash');
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
            <div className="mb-4">
              <Image
                src={product.images?.[0] || '/placeholder-image.png'}
                alt={product.name}
                style={{ width: '100%', height: 200, objectFit: 'contain' }}
                fallback="/placeholder-image.png"
              />
            </div>
            
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
<div className="mt-4">
  <Typography.Text strong className="block mb-2">Payment Method</Typography.Text>
  <Radio.Group 
    value={paymentMode} 
    onChange={(e) => setPaymentMode(e.target.value)}
    className="w-full"
  >
    <Space direction="vertical" className="w-full">
      <Radio value="cash" className="w-full h-10 flex items-center pl-4">
        Cash Payment
      </Radio>
      <Radio value="momo" className="w-full h-10 flex items-center pl-4">
        Mobile Money
      </Radio>
      <Radio value="cheque" className="w-full h-10 flex items-center pl-4">
        Cheque
      </Radio>
      <Radio value="transfer" className="w-full h-10 flex items-center pl-4">
        Bank Transfer
      </Radio>
    </Space>
  </Radio.Group>
</div>

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
/**
 * Add Stock Modal
 */
const AddStockModal = ({ product }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addToStock] = useAddStockMutation();
  
  const { handleSubmit, register, reset, formState: { errors }, watch } = useForm({
    defaultValues: {
      stock: 1,
      seller: product?.seller?._id || ''  // Initialize seller field
    }
  });

  const watchStock = watch('stock');

  const onSubmit = async (data) => {
    setLoading(true);

    if (!data.seller) {
      toastMessage({ 
        icon: 'error', 
        text: 'Seller information is required' 
      });
      setLoading(false);
      return;
    }

    const payload = {
      stock: Number(data.stock),
      seller: data.seller,
      product:product.key
    };

    try {
      const response = await addToStock({ 
        id: product.key,
        payload 
      }).unwrap();

      if (response.success) {
        toastMessage({ 
          icon: 'success', 
          text: 'Stock added successfully!' 
        });
        handleCancel();
      } else {
        throw new Error(response.message || 'Failed to add stock');
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      const errorMessage = error.data?.message || error.message || 'Failed to add stock';
      toastMessage({ icon: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const showModal = () => {
    setIsModalOpen(true);
    reset({ 
      stock: 1,
      seller: product?.seller?._id || ''
    });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    reset();
  };

  // Hide the modal if there's no seller
  if (!product?.seller?._id) {
    return (
      <Button
        type="primary"
        className="table-btn"
        style={{ backgroundColor: 'blue', opacity: 0.5 }}
        disabled
        title="Cannot add stock - No seller associated with this product"
      >
        Add Stock
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={showModal}
        type="primary"
        className="table-btn"
        style={{ backgroundColor: 'blue' }}
      >
        Add Stock
      </Button>
      
      <Modal 
        title="Add Product to Stock" 
        open={isModalOpen} 
        onCancel={handleCancel} 
        footer={null}
        maskClosable={false}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="p-4">
          <div className="mb-4 space-y-2">
            <Typography.Text className="block">
              Current Stock: {product.stock}
            </Typography.Text>
            <Typography.Text className="block">
              Price per unit: {product.price.toFixed(0)} frw
            </Typography.Text>
            {watchStock && (
              <Typography.Text className="block">
                Total Purchase Value: {(Number(watchStock) * product.price).toFixed(0)} frw
              </Typography.Text>
            )}
          </div>

          {/* Hidden seller field */}
          <input 
            type="hidden" 
            {...register('seller', { 
              required: 'Seller is required'
            })} 
          />

          <CustomInput 
            name="stock" 
            label="Add Stock Quantity" 
            register={register} 
            type="number"
            rules={{
              required: 'Stock quantity is required',
              min: { value: 1, message: 'Stock must be at least 1' },
              validate: {
                positive: (value) => Number(value) > 0 || 'Stock must be greater than 0',
              }
            }}
            errors={errors}
          />

          <div className="mt-4">
            <Typography.Text type="secondary" className="block mb-2">
              Product ID: {product.key}
            </Typography.Text>
            <Typography.Text type="secondary" className="block">
              Seller: {product.seller?.name || 'Unknown'}
            </Typography.Text>
          </div>

          <Flex justify="center" className="mt-6" gap="small">
            <Button onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              htmlType="submit" 
              type="primary"
              loading={loading}
              disabled={loading || !watchStock || Number(watchStock) <= 0}
            >
              {loading ? 'Adding Stock...' : 'Add Stock'}
            </Button>
          </Flex>
        </form>
      </Modal>
    </>
  );
};

/**
 * Update Product Modal
 */
const UpdateProductModal = ({ product }: { product: IProduct & { key: string } }) => {
  const [updateProduct] = useUpdateProductMutation();
  const { data: categories } = useGetAllCategoriesQuery(undefined);
  const { data: sellers, isLoading: isSellerLoading } = useGetAllSellerQuery(undefined);
  const { data: brands } = useGetAllBrandsQuery(undefined);

  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      name: product.name,
      price: product.price,
      seller: product?.seller?._id,
      category: product.category._id,
      brand: product.brand?._id,
      description: product.description,
      unitType: product.measurement?.type || '',
      unit: product.measurement?.unit || '',
      quantity: product.measurement?.value || product.stock || 0,
    },
  });

  const selectedUnit = watch('unitType');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: FieldValues) => {
    setIsSubmitting(true);
    
    const payload = { ...data };
    payload.price = Number(data.price);
    
    if (data.unitType) {
      payload.measurement = {
        type: data.unitType,
        unit: data.unit,
        value: Number(data.quantity)
      };
      payload.stock = Number(data.quantity);

      delete payload.unitType;
      delete payload.unit;
      delete payload.quantity;
    }

    try {
      const res = await updateProduct({ id: product.key, payload }).unwrap();
      if (res.statusCode === 200) {
        toastMessage({ icon: 'success', text: res.message });
        reset();
        handleCancel();
      }
    } catch (error: any) {
      toastMessage({ icon: 'error', text: error.data.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderUnitOptions = () => {
    switch (selectedUnit) {
      case 'weight':
        return (
          <>
            <option value="g">Grams (g)</option>
            <option value="kg">Kilograms (kg)</option>
            <option value="lb">Pounds (lb)</option>
          </>
        );
      case 'length':
        return (
          <>
            <option value="cm">Centimeters (cm)</option>
            <option value="m">Meters (m)</option>
            <option value="inch">Inches (in)</option>
          </>
        );
      case 'volume':
        return (
          <>
            <option value="ml">Milliliters (ml)</option>
            <option value="l">Liters (l)</option>
            <option value="oz">Fluid Ounces (oz)</option>
          </>
        );
      case 'pieces':
        return (
          <>
            <option value="pc">Piece</option>
            <option value="dozen">Dozen</option>
            <option value="set">Set</option>
          </>
        );
      case 'size':
        return (
          <>
            <option value="EXTRA_SMALL">Extra Small (XS)</option>
            <option value="SMALL">Small (S)</option>
            <option value="MEDIUM">Medium (M)</option>
            <option value="LARGE">Large (L)</option>
            <option value="EXTRA_LARGE">Extra Large (XL)</option>
            <option value="XXL">XXL</option>
            <option value="XXXL">XXXL</option>
            <option value="EU_36">EU 36</option>
            <option value="EU_37">EU 37</option>
            <option value="EU_38">EU 38</option>
            <option value="EU_39">EU 39</option>
            <option value="EU_40">EU 40</option>
            <option value="EU_41">EU 41</option>
            <option value="EU_42">EU 42</option>
            <option value="EU_43">EU 43</option>
            <option value="EU_44">EU 44</option>
            <option value="EU_45">EU 45</option>
            <option value="EU_46">EU 46</option>
            <option value="EU_47">EU 47</option>
          </>
        );
      default:
        return null;
    }
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        onClick={showModal}
        type='primary'
        className='table-btn-small'
        style={{ backgroundColor: 'green' }}
      >
        <EditFilled />
      </Button>
      <Modal 
        title='Update Product Info' 
        open={isModalOpen} 
        onCancel={handleCancel} 
        footer={null}
        closable={!isSubmitting}
        maskClosable={!isSubmitting}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <CustomInput
            name='name'
            errors={errors}
            label='Name'
            register={register}
            required={true}
            disabled={isSubmitting}
          />
          <CustomInput
            errors={errors}
            label='Price'
            type='number'
            name='price'
            register={register}
            required={true}
            disabled={isSubmitting}
          />
          
          <Row>
            <Col xs={{ span: 23 }} lg={{ span: 6 }}>
              <label htmlFor="unitType" className="text-sm">
                Measurement Type
              </label>
            </Col>
            <Col xs={{ span: 23 }} lg={{ span: 18 }}>
              <select
                {...register('unitType')}
                className=" p-2.5 bg-transparent"
                required={true}
                disabled={isSubmitting}
                
              >
                <option value="">Select Measurement Type</option>
                <option value="weight">Weight</option>
                <option value="length">Length</option>
                <option value="volume">Volume</option>
                <option value="pieces">Pieces</option>
                <option value="size">Size</option>
              </select>
            </Col>
          </Row>

          <Row>
            <Col xs={{ span: 23 }} lg={{ span: 6 }}>
              <label htmlFor="quantity" className="label">
                Quantity
              </label>
            </Col>
            <Col xs={{ span: 23 }} lg={{ span: 18 }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <CustomInput
                    errors={errors}
                    type="number"
                    label=''
                    name="quantity"
                    register={register}
                    required={true}
                    disabled={isSubmitting}
                  />
                </div>
                {selectedUnit && (
                  <div style={{ flex: 1 }}>
                    <select
                      {...register('unit')}
                      className="p-2.5 bg-transparent"
                      required={true}
                      disabled={isSubmitting}
                    >
                      <option value="">Select Unit</option>
                      {renderUnitOptions()}
                    </select>
                  </div>
                )}
              </div>
            </Col>
          </Row>

          <Row>
            <Col xs={{ span: 23 }} lg={{ span: 6 }}>
              <label htmlFor='Size' className='label'>
                suppliers 
              </label>
            </Col>
            <Col xs={{ span: 23 }} lg={{ span: 18 }}>
              <select
                disabled={isSellerLoading || isSubmitting}
                {...register('seller', { required: true })}
                className={`input-field ${errors['seller'] ? 'input-field-error' : ''}`}
              >
                <option value=''>Select supplier*</option>
                {sellers?.data.map((item: ICategory) => (
                  <option value={item._id} key={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Col>
          </Row>

          <Row>
            <Col xs={{ span: 23 }} lg={{ span: 6 }}>
              <label htmlFor='Size' className='label'>
                Category
              </label>
            </Col>
            <Col xs={{ span: 23 }} lg={{ span: 18 }}>
              <select
                {...register('category', { required: true })}
                className={`input-field ${errors['category'] ? 'input-field-error' : ''}`}
                disabled={isSubmitting}
              >
                <option value=''>Select Category*</option>
                {categories?.data.map((item: ICategory) => (
                  <option value={item._id} key={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Col>
          </Row>

          <Row>
            <Col xs={{ span: 23 }} lg={{ span: 6 }}>
              <label htmlFor='Size' className='label'>
                Brand
              </label>
            </Col>
            <Col xs={{ span: 23 }} lg={{ span: 18 }}>
              <select
                {...register('brand')}
                className={`input-field ${errors['brand'] ? 'input-field-error' : ''}`}
                disabled={isSubmitting}
              >
                <option value=''>Select brand</option>
                {brands?.data.map((item: ICategory) => (
                  <option value={item._id} key={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Col>
          </Row>

          <CustomInput 
            label='Description' 
            name='description' 
            register={register}
            disabled={isSubmitting} 
          />

          <Flex justify='center' style={{ marginTop: '20px' }}>
            <Button
              htmlType="submit"
              type="primary"
              disabled={isSubmitting}
              style={{
                textTransform: 'uppercase',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '120px',
              }}
            >
              {isSubmitting ? (
                <>
                  <Spin size="small" style={{ marginRight: '8px' }} />
                  Updating...
                </>
              ) : (
                'Update'
              )}
            </Button>
          </Flex>
        </form>
      </Modal>
    </>
  );
};   


/**
 * Delete Product Modal
 */
const DeleteProductModal = ({ id }: { id: string }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteProduct] = useDeleteProductMutation();

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteProduct(id).unwrap();
      if (res.statusCode === 200) {
        toastMessage({ icon: 'success', text: res.message });
        handleCancel();
      }
    } catch (error: any) {
      handleCancel();
      toastMessage({ icon: 'error', text: error.data.message });
    }
  };

  return (
    <>
      <Button
        onClick={showModal}
        type='primary'
        className='table-btn-small'
        style={{ backgroundColor: 'red' }}
      >
        <DeleteFilled />
      </Button>
      <Modal title='Delete Product' open={isModalOpen} onCancel={handleCancel} footer={null}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Are you want to delete this product?</h2>
          <h4>You won't be able to revert it.</h4>
          <div
            style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}
          >
            <Button
              onClick={handleCancel}
              type='primary'
              style={{ backgroundColor: 'lightseagreen' }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleDelete(id)}
              type='primary'
              style={{ backgroundColor: 'red' }}
            >
              Yes! Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ProductManagePage;

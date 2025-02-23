// @ts-nocheck

import { DeleteFilled, EditFilled } from '@ant-design/icons';
import type { PaginationProps, TableColumnsType } from 'antd';
import { Button, Col, Flex, Modal, Pagination, Row, Spin, Table,Select,Empty, Tag, Checkbox, Image, Input, Radio, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import {useUpdatePurchaseMutation} from '../../redux/features/management/purchaseApi'
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
  const [saleData, setSaleData] = useState<SaleDataType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDebit, setIsDebit] = useState(false);
  const [debitData, setDebitData] = useState<any>(null);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [selectedProducts, setSelectedProducts] = useState<(IProduct & { key: string, selectedQuantity: number, sellingPrice: number })[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalProfitLoss, setTotalProfitLoss] = useState({ amount: 0, isProfit: true });
  
  const { data: allProducts } = useGetAllProductsQuery({ limit: 100 });
  
  const {
    handleSubmit,
    register,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
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

  const watchAmountPaid = watch("amountPaid");
  const remainingAmount = isDebit ? totalAmount - (watchAmountPaid || 0) : 0;

  // Initialize with the initially provided product
  useEffect(() => {
    if (product && isModalOpen) {
      addProduct(product);
    }
  }, [isModalOpen]);

  // Update total amount and profit/loss calculations
  useEffect(() => {
    let calculatedTotal = 0;
    let calculatedProfit = 0;
    
    selectedProducts.forEach(prod => {
      const itemTotal = prod.selectedQuantity * prod.sellingPrice;
      calculatedTotal += itemTotal;
      
      const itemProfit = (prod.sellingPrice - prod.price) * prod.selectedQuantity;
      calculatedProfit += itemProfit;
    });
    
    setTotalAmount(calculatedTotal);
    setTotalProfitLoss({
      amount: Math.abs(calculatedProfit),
      isProfit: calculatedProfit >= 0
    });
  }, [selectedProducts]);

  const addProduct = (product: IProduct & { key: string }) => {
    // Check if product already exists in selected products
    const existingProductIndex = selectedProducts.findIndex(p => p.key === product.key);
    
    if (existingProductIndex >= 0) {
      // Product already exists, update the quantity
      const updatedProducts = [...selectedProducts];
      updatedProducts[existingProductIndex].selectedQuantity += 1;
      setSelectedProducts(updatedProducts);
    } else {
      // Add new product
      setSelectedProducts(prevProducts => [
        ...prevProducts,
        {
          ...product,
          selectedQuantity: 1,
          sellingPrice: product.price
        }
      ]);
    }
  };

  const removeProduct = (productKey: string) => {
    setSelectedProducts(prevProducts => prevProducts.filter(p => p.key !== productKey));
  };

  const updateProductQuantity = (productKey: string, quantity: number) => {
    setSelectedProducts(prevProducts => 
      prevProducts.map(p => {
        if (p.key === productKey) {
          return { ...p, selectedQuantity: quantity };
        }
        return p;
      })
    );
  };

  const updateProductPrice = (productKey: string, price: number) => {
    setSelectedProducts(prevProducts => 
      prevProducts.map(p => {
        if (p.key === productKey) {
          return { ...p, sellingPrice: price };
        }
        return p;
      })
    );
  };

  const onSubmit = async (data: FieldValues) => {
    try {
      setLoading(true);
  
      // Check if any products are selected
      if (selectedProducts.length === 0) {
        toastMessage({ 
          icon: 'error', 
          text: 'Please select at least one product to sell'
        });
        return;
      }
  
      // Check if any product has invalid quantity
      const invalidProduct = selectedProducts.find(p => 
        p.selectedQuantity <= 0 || p.selectedQuantity > p.stock
      );
      
      if (invalidProduct) {
        toastMessage({ 
          icon: 'error', 
          text: `Invalid quantity for product: ${invalidProduct.name}`
        });
        return;
      }
  
      // Create common sale details object
      const saleDetails = {
        buyerName: data.buyerName,
        date: data.date,
        paymentMode: paymentMode,
        paymentDetails: {
          mode: paymentMode,
          ...(paymentMode === 'momo' && { momoNumber: data.momoNumber }),
          ...(paymentMode === 'cheque' && { chequeNumber: data.chequeNumber }),
          ...(paymentMode === 'transfer' && { 
            bankName: data.bankName,
            accountNumber: data.accountNumber 
          }),
        }
      };
  
      // Create products array with only product-specific information
      const productsPayload = selectedProducts.map(prod => {
        const profitPerUnit = prod.sellingPrice - prod.price;
        const totalProductProfit = profitPerUnit * prod.selectedQuantity;
        
        return {
          product: prod.key,
          productName: prod.name,
          SellingPrice: prod.sellingPrice,
          productPrice: prod.price,
          quantity: prod.selectedQuantity,
          originalPrice: prod.price,
          profitLoss: {
            perUnit: Math.abs(profitPerUnit),
            total: Math.abs(totalProductProfit),
            isProfit: profitPerUnit >= 0
          },
          totalPrice: prod.selectedQuantity * prod.sellingPrice
        };
      });
  
      // Combine into final payload
      const salesPayload = {
        ...saleDetails,
        products: productsPayload
      };
  
      // Send the combined payload in a single API call
      const saleResponse = await saleProduct(salesPayload).unwrap();
      
      // Check if sale was successful
      if (saleResponse.success) {
        if (isDebit) {
          // Create debit record
          const debitPayload = {
            productName: `Multiple Products (${selectedProducts.length})`,
            totalAmount: totalAmount,
            paidAmount: Number(data.amountPaid) || 0,
            remainingAmount: remainingAmount,
            buyerEmail: data.email,
            buyerPhoneNumber: data.phoneNumber,
            dueDate: data.dueDate,
            buyerName: data.buyerName,
            saleId: saleResponse.data.sales[0]._id,
            status: 'PENDING',
            description: data.description || `Debit for multiple products - Total items: ${selectedProducts.reduce((sum, p) => sum + p.selectedQuantity, 0)}`
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
            text: `Successfully sold ${selectedProducts.length} products`
          });
        }
        
        // Prepare sale data for receipt
        const processedSaleData = saleResponse.data.sales.map((sale: any, index: number) => {
          const prod = selectedProducts[index];
          const profitPerUnit = prod.sellingPrice - prod.price;
          const totalProductProfit = profitPerUnit * prod.selectedQuantity;
          
          return {
            _id: sale._id,
            product: prod.key,
            productName: prod.name,
            productPrice: prod.price,
            SellingPrice: prod.sellingPrice,
            quantity: prod.selectedQuantity,
            buyerName: data.buyerName,
            date: data.date,
            originalPrice: prod.price,
            paymentMode: paymentMode,
            profitLoss: {
              perUnit: Math.abs(profitPerUnit),
              total: Math.abs(totalProductProfit),
              isProfit: profitPerUnit >= 0
            },
            totalPrice: prod.selectedQuantity * prod.sellingPrice
          };
        });
        
        setSaleData(processedSaleData);
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
    setSaleData([]);
    setDebitData(null);
    setIsDebit(false);
    setPaymentMode('cash');
    setSelectedProducts([]);
    reset({
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
    setSaleData([]);
    setDebitData(null);
    setIsDebit(false);
    setPaymentMode('cash');
    setSelectedProducts([]);
    reset();
  };

  // Filter out already selected products from the dropdown options
  const availableProducts = allProducts?.data?.filter(p => 
    !selectedProducts.some(sp => sp.key === p._id)
  ) || [];

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
        title={showReceipt ? 'Sale Receipt' : 'Sell Products'}
        open={isModalOpen} 
        onCancel={handleCancel} 
        footer={null}
        width={showReceipt ? 600 : 700}
        maskClosable={false}
      >
        {showReceipt && saleData.length > 0 ? (
          <div>
            <SaleReceipt 
              saleData={saleData.length === 1 ? saleData[0] : {
                _id: 'multiple',
                productName: `Multiple Products (${saleData.length})`,
                buyerName: saleData[0].buyerName,
                date: saleData[0].date,
                paymentMode: saleData[0].paymentMode,
                totalPrice: totalAmount,
                profitLoss: {
                  total: totalProfitLoss.amount,
                  isProfit: totalProfitLoss.isProfit
                }
              }} 
              debitData={debitData}
              multipleProducts={saleData.length > 1 ? saleData : undefined}
            />
            <Flex justify='center' style={{ marginTop: '1rem' }}>
              <Button onClick={handleCancel} type='primary'>
                Close
              </Button>
            </Flex>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: '1rem' }}>
            {/* Form content remains the same */}
            {/* Product Selection Section */}
            <div className="mb-4 border p-4 rounded-md bg-gray-50">
              <Typography.Title level={5}>Select Products</Typography.Title>
              
              {/* Product Dropdown */}
              <div className="mb-4">
                <Select
                  showSearch
                  style={{ width: '100%' }}
                  placeholder="Search and select products"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label?.toString().toLowerCase() || '').includes(input.toLowerCase())
                  }
                  onChange={(value) => {
                    const selectedProduct = allProducts?.data?.find(p => p._id === value);
                    if (selectedProduct) {
                      addProduct({
                        ...selectedProduct,
                        key: selectedProduct._id
                      });
                    }
                  }}
                  value={undefined}
                  options={availableProducts.map(p => ({
                    value: p._id,
                    label: `${p.name} - ${p.stock} in stock - ${p.price} frw`
                  }))}
                />
              </div>
              
              {/* Rest of the form remains the same */}
              {/* Selected Products Table */}
              {selectedProducts.length > 0 && (
                <Table
                  size="small"
                  dataSource={selectedProducts}
                  pagination={false}
                  rowKey="key"
                  className="mb-4"
                >
                  <Table.Column 
                    title="Product" 
                    dataIndex="name" 
                    key="name"
                    render={(text, record: any) => (
                      <Flex align="center" gap="small">
                        <Image
                          src={record.images?.[0] || '/placeholder-image.png'}
                          alt={record.name}
                          style={{ width: 40, height: 40, objectFit: 'contain' }}
                          fallback="/placeholder-image.png"
                        />
                        <span>{text}</span>
                      </Flex>
                    )}
                  />
                  <Table.Column 
                    title="Original Price" 
                    dataIndex="price" 
                    key="price"
                    render={(price) => `${price} frw`}
                  />
                  <Table.Column 
                    title="Selling Price" 
                    key="sellingPrice"
                    render={(record: any) => (
                      <Input
                        type="number"
                        value={record.sellingPrice}
                        onChange={(e) => updateProductPrice(record.key, Number(e.target.value))}
                        style={{ width: 100 }}
                      />
                    )}
                  />
                  <Table.Column 
                    title={`Quantity`} 
                    key="quantity"
                    render={(record: any) => (
                      <Input
                        type="number"
                        min={1}
                        max={record.stock}
                        value={record.selectedQuantity}
                        onChange={(e) => updateProductQuantity(record.key, Number(e.target.value))}
                        style={{ width: 80 }}
                        suffix={<span>/ {record.stock}</span>}
                      />
                    )}
                  />
                  <Table.Column 
                    title="Subtotal" 
                    key="subtotal"
                    render={(record: any) => `${(record.selectedQuantity * record.sellingPrice).toFixed(2)} frw`}
                  />
                  <Table.Column 
                    title="Action" 
                    key="action"
                    render={(record: any) => (
                      <Button 
                        danger 
                        type="text" 
                        icon={<DeleteFilled />} 
                        onClick={() => removeProduct(record.key)}
                      />
                    )}
                  />
                </Table>
              )}
              
              {selectedProducts.length === 0 && (
                <Empty description="No products selected" />
              )}
              
              {selectedProducts.length > 0 && (
                <div className="mb-4 mt-2 text-right">
                  <Typography.Text strong className="text-lg">
                    Total: {totalAmount.toFixed(2)} frw
                  </Typography.Text>
                  <br />
                  <Typography.Text 
                    className="text-md"
                    type={totalProfitLoss.isProfit ? "success" : "danger"}
                  >
                    {totalProfitLoss.isProfit ? "Profit" : "Loss"}: {totalProfitLoss.amount.toFixed(2)} frw
                  </Typography.Text>
                </div>
              )}
            </div>
            
            {/* Customer Information Section */}
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
                <Typography.Text strong>Total Amount: {totalAmount.toFixed(2)} frw</Typography.Text>
                
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
                  name='phoneNumber'
                  label='Phone Number'
                  errors={errors}
                  required={true}
                  register={register}
                  type='tel'
                  rules={{
                    required: 'Phone number is required',
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Enter a valid 10-digit phone number'
                    }
                  }}
                />

                <CustomInput
                  name='email'
                  label='Email Address'
                  errors={errors}
                  required={true}
                  register={register}
                  type='email'
                  rules={{
                    required: 'Email address is required',
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: 'Enter a valid email address'
                    }
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
                    Remaining Amount: {remainingAmount.toFixed(2)} frw
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

            <Flex justify='center' style={{ marginTop: '1rem' }} gap="small">
              <Button onClick={handleCancel} type='default'>
                Cancel
              </Button>
              <Button 
                htmlType='submit' 
                type='primary'
                loading={loading}
                disabled={
                  loading || 
                  selectedProducts.length === 0 ||
                  selectedProducts.some(p => p.selectedQuantity <= 0 || p.selectedQuantity > p.stock) ||
                  (isDebit && remainingAmount <= 0)
                }
              >
                {loading ? 'Processing...' : 'Complete Sale'}
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
      seller: product?.seller?._id || ''
    }
  });

  const watchStock = watch('stock');

  const onSubmit = async (data) => {
    setLoading(true);

    if (!data.seller) {
      toastMessage({ icon: 'error', text: 'Seller information is required' });
      setLoading(false);
      return;
    }

    const payload = {
      stock: Number(data.stock),
      seller: data.seller,
      product: product.key,
      unitPrice: product.price, // Add unit price for purchase record
      totalPrice: Number(data.stock) * product.price // Calculate total price
    };

    try {
      const response = await addToStock({ 
        id: product.key,
        payload 
      }).unwrap();

      if (response.success) {
        toastMessage({ icon: 'success', text: 'Stock added successfully!' });
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
const UpdateProductModal = ({ product }) => {
  const [updateProduct] = useUpdateProductMutation();
  const [updatePurchase] = useUpdatePurchaseMutation();
  const { data: categories } = useGetAllCategoriesQuery(undefined);
  const { data: sellers, isLoading: isSellerLoading } = useGetAllSellerQuery(undefined);
  const { data: brands } = useGetAllBrandsQuery(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldUpdatePurchases, setShouldUpdatePurchases] = useState(true);

  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: React.useMemo(() => ({
      name: product.name,
      unitPrice: product.price,
      seller: product?.seller?._id,
      category: product.category._id,
      brand: product.brand?._id,
      description: product.description,
      unitType: product.measurement?.type || '',
      unit: product.measurement?.unit || '',
      quantity: product.measurement?.value || product.stock || 0,
    }), [product])
  });

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);

      // Step 1: Prepare product update payload
      const productPayload = {
        name: data.name,
        price: Number(data.unitPrice),
        seller: data.seller,
        category: data.category,
        brand: data.brand,
        description: data.description,
        measurement: data.unitType ? {
          type: data.unitType,
          unit: data.unit,
          value: Number(data.quantity)
        } : undefined,
        stock: Number(data.quantity)
      };

      // Step 2: Update product first
      const productRes = await updateProduct({
        id: product.key,
        payload: productPayload
      }).unwrap();

      // Step 3: If shouldUpdatePurchases is true and product update was successful,
      // update the associated purchase
      if (shouldUpdatePurchases && productRes.statusCode === 200) {
        const purchasePayload = {
          unitPrice: Number(data.unitPrice),
          quantity: Number(data.quantity),
          measurement: data.unitType ? {
            type: data.unitType,
            unit: data.unit,
            value: Number(data.quantity)
          } : undefined
        };
        await updatePurchase({
          id: product.key,
          payload: purchasePayload
        }).unwrap();
      
      }

      toastMessage({
        icon: 'success',
        text: shouldUpdatePurchases 
          ? 'Product and associated purchase updated successfully'
          : 'Product updated successfully'
      });
      
      handleCancel();
    } catch (error) {
      console.error('Update failed:', error);
      toastMessage({
        icon: 'error',
        text: error.data?.message || 'Update failed'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderUnitOptions = () => {
    const unitOptions = {
      weight: [
        { value: 'g', label: 'Grams (g)' },
        { value: 'kg', label: 'Kilograms (kg)' },
        { value: 'lb', label: 'Pounds (lb)' }
      ],
      length: [
        { value: 'cm', label: 'Centimeters (cm)' },
        { value: 'm', label: 'Meters (m)' },
        { value: 'inch', label: 'Inches (in)' }
      ],
      volume: [
        { value: 'ml', label: 'Milliliters (ml)' },
        { value: 'l', label: 'Liters (l)' },
        { value: 'oz', label: 'Fluid Ounces (oz)' }
      ],
      pieces: [
        { value: 'pc', label: 'Piece' },
        { value: 'dozen', label: 'Dozen' },
        { value: 'set', label: 'Set' }
      ],
      size: [
        { value: 'EXTRA_SMALL', label: 'Extra Small (XS)' },
        { value: 'SMALL', label: 'Small (S)' },
        { value: 'MEDIUM', label: 'Medium (M)' },
        { value: 'LARGE', label: 'Large (L)' },
        { value: 'EXTRA_LARGE', label: 'Extra Large (XL)' },
        { value: 'XXL', label: 'XXL' },
        { value: 'XXXL', label: 'XXXL' },
        ...Array.from({ length: 12 }, (_, i) => ({
          value: `EU_${i + 36}`,
          label: `EU ${i + 36}`
        }))
      ]
    };

    const selectedType = watch('unitType');
    const options = unitOptions[selectedType] || [];

    return options.map(({ value, label }) => (
      <option key={value} value={value}>{label}</option>
    ));
  };

  const showModal = () => {
    reset({
      name: product.name,
      unitPrice: product.price,
      seller: product?.seller?._id,
      category: product.category._id,
      brand: product.brand?._id,
      description: product.description,
      unitType: product.measurement?.type || '',
      unit: product.measurement?.unit || '',
      quantity: product.measurement?.value || product.stock || 0,
    });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    reset();
  };

  return (
    <>
      <Button
        onClick={showModal}
        type="primary"
        className="table-btn-small"
        style={{ backgroundColor: 'green' }}
      >
        <EditFilled />
      </Button>

      <Modal
        title="Update Product Info"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        closable={!isSubmitting}
        maskClosable={!isSubmitting}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Row className="mt-4">
            <Col xs={{ span: 23 }} lg={{ span: 24 }}>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={shouldUpdatePurchases}
                  onChange={(e) => setShouldUpdatePurchases(e.target.checked)}
                  className="mr-2"
                />
                <span>Update associated purchase records with new price/measurement</span>
              </label>
            </Col>
          </Row>

          <CustomInput
            name="name"
            errors={errors}
            label="Name"
            register={register}
            required={true}
            disabled={isSubmitting}
          />

          <CustomInput
            errors={errors}
            label="Unit Price"
            type="number"
            name="unitPrice"
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
                className="p-2.5 bg-transparent w-full"
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

          <Row className="mt-4">
            <Col xs={{ span: 23 }} lg={{ span: 6 }}>
              <label htmlFor="quantity" className="label">
                Quantity
              </label>
            </Col>
            <Col xs={{ span: 23 }} lg={{ span: 18 }}>
              <div className="flex gap-4">
                <div className="flex-1">
                  <CustomInput
                    errors={errors}
                    type="number"
                    label=""
                    name="quantity"
                    register={register}
                    required={true}
                    disabled={isSubmitting}
                  />
                </div>
                {watch('unitType') && (
                  <div className="flex-1">
                    <select
                      {...register('unit')}
                      className="p-2.5 bg-transparent w-full"
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

          <Row className="mt-4">
            <Col xs={{ span: 23 }} lg={{ span: 6 }}>
              <label htmlFor="seller" className="label">
                Suppliers
              </label>
            </Col>
            <Col xs={{ span: 23 }} lg={{ span: 18 }}>
              <select
                disabled={isSellerLoading || isSubmitting}
                {...register('seller', { required: true })}
                className={`w-full p-2.5 ${errors['seller'] ? 'border-red-500' : ''}`}
              >
                <option value="">Select supplier</option>
                {sellers?.data.map((item) => (
                  <option value={item._id} key={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Col>
          </Row>

          <Row className="mt-4">
            <Col xs={{ span: 23 }} lg={{ span: 6 }}>
              <label htmlFor="category" className="label">
                Category
              </label>
            </Col>
            <Col xs={{ span: 23 }} lg={{ span: 18 }}>
              <select
                {...register('category', { required: true })}
                className={`w-full p-2.5 ${errors['category'] ? 'border-red-500' : ''}`}
                disabled={isSubmitting}
              >
                <option value="">Select Category*</option>
                {categories?.data.map((item) => (
                  <option value={item._id} key={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Col>
          </Row>

          <Row className="mt-4">
            <Col xs={{ span: 23 }} lg={{ span: 6 }}>
              <label htmlFor="brand" className="label">
                Brand
              </label>
            </Col>
            <Col xs={{ span: 23 }} lg={{ span: 18 }}>
              <select
                {...register('brand')}
                className={`w-full p-2.5 ${errors['brand'] ? 'border-red-500' : ''}`}
                disabled={isSubmitting}
              >
                <option value="">Select brand</option>
                {brands?.data.map((item) => (
                  <option value={item._id} key={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Col>
          </Row>

          <CustomInput
            label="Description"
            name="description"
            register={register}
            disabled={isSubmitting}
          />

          <Flex justify="center" className="mt-6">
            <Button
              htmlType="submit"
              type="primary"
              disabled={isSubmitting}
              className="uppercase font-bold min-w-[120px] flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Spin size="small" className="mr-2" />
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

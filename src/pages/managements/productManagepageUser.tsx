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

const ProductManagePageuser = () => {
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
            {/* <UpdateProductModal product={item} />
            <DeleteProductModal id={item.key} /> */}
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
      phoneNumber: '',
      email: '',
    }
  });

  const [saleProduct] = useCreateSaleMutation();
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
  
      // Create payment details based on selected payment mode
      const paymentDetails = {
        mode: paymentMode,
        ...(paymentMode === 'momo' && { momoNumber: data.momoNumber }),
        ...(paymentMode === 'cheque' && { chequeNumber: data.chequeNumber }),
        ...(paymentMode === 'transfer' && { bankDetails: data.bankDetails }),
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
  
      // Construct the payload matching backend expectations
      const salesPayload = {
        buyerName: data.buyerName,
        date: data.date,
        paymentMode: paymentMode,
        paymentDetails: paymentDetails,
        products: productsPayload,
        status: isDebit ? 'credit' : 'pending'
      };

      // Add debit details if this is a credit sale
      if (isDebit) {
        salesPayload.debitDetails = {
          paidAmount: Number(data.amountPaid) || 0,
          dueDate: data.dueDate,
          buyerPhoneNumber: data.phoneNumber,
          buyerEmail: data.email,
          description: data.description || `Credit sale for multiple products - Total items: ${selectedProducts.reduce((sum, p) => sum + p.selectedQuantity, 0)}`
        };
      }
  
      // Send the combined payload in a single API call
      const saleResponse = await saleProduct(salesPayload).unwrap();
      
      // Check if sale was successful
      if (saleResponse.success) {
        if (isDebit) {
          toastMessage({ 
            icon: 'success', 
            text: 'Sale and credit record created successfully'
          });
          // Store debit data for receipt
          setDebitData({
            totalAmount: totalAmount,
            paidAmount: Number(data.amountPaid) || 0,
            remainingAmount: remainingAmount,
            dueDate: data.dueDate,
            buyerName: data.buyerName,
            buyerPhoneNumber: data.phoneNumber,
            buyerEmail: data.email
          });
        } else {
          toastMessage({ 
            icon: 'success', 
            text: `Successfully sold ${selectedProducts.length} products`
          });
        }
        
        const processedSaleData = {
          _id: saleResponse.data.transaction._id,
          products: saleResponse.data.transaction.products.map((product: any) => ({
            _id: product._id,
            productName: product.productName,
            productPrice: product.productPrice,
            SellingPrice: product.SellingPrice,
            quantity: product.quantity,
            profitLoss: {
              perUnit: Math.abs(product.SellingPrice - product.productPrice),
              total: Math.abs((product.SellingPrice - product.productPrice) * product.quantity),
              isProfit: product.SellingPrice > product.productPrice
            }
          })),
          buyerName: saleResponse.data.transaction.buyerName,
          date: saleResponse.data.transaction.date,
          paymentMode: saleResponse.data.transaction.paymentMode,
          totalAmount: saleResponse.data.transaction.totalAmount,
          profitLoss: {
            total: totalProfitLoss.amount,
            isProfit: totalProfitLoss.isProfit
          }
        };
        
        setSaleData([processedSaleData]);
        setShowReceipt(true);
      }
      
    } catch (error: any) {
      console.error('Sale/Credit error:', error);
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
      phoneNumber: '',
      email: '',
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
            saleData={{
              _id: saleData[0]._id,
              products: saleData[0].products,
              buyerName: saleData[0].buyerName,
              date: saleData[0].date,
              paymentMode: saleData[0].paymentMode,
              totalAmount: saleData[0].totalAmount,
              profitLoss: {
                total: totalProfitLoss.amount,
                isProfit: totalProfitLoss.isProfit
              }
            }}
            debitData={debitData}
            multipleProducts={saleData[0].products && saleData[0].products.length > 1}
          />
          <Flex justify='center' style={{ marginTop: '1rem' }}>
            <Button onClick={handleCancel} type='primary'>
              Close
            </Button>
          </Flex>
        </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: '1rem' }}>
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
                    title="Quantity" 
                    key="quantity"
                    render={(record: any) => (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={1}
                          max={record.stock}
                          value={record.selectedQuantity}
                          onChange={(e) => updateProductQuantity(record.key, Number(e.target.value))}
                          className="w-[80px] text-right"
                          style={{ fontWeight: 500 }}
                        />
                        <span className="text-[10px] text-gray-500">/ {record.stock}</span>
                      </div>
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

            {/* Conditionally render fields based on payment mode */}
            {paymentMode === 'momo' && (
              <CustomInput
                name='momoNumber'
                label='Mobile Money Number'
                errors={errors}
                required={true}
                register={register}
                type='tel'
                rules={{
                  required: 'Mobile money number is required',
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: 'Enter a valid 10-digit phone number'
                  }
                }}
              />
            )}

            {paymentMode === 'cheque' && (
              <CustomInput
                name='chequeNumber'
                label='Cheque Number'
                errors={errors}
                required={true}
                register={register}
                type='text'
                rules={{
                  required: 'Cheque number is required'
                }}
              />
            )}

            {paymentMode === 'transfer' && (
              <CustomInput
                name='bankDetails'
                label='Bank Details'
                errors={errors}
                required={true}
                register={register}
                type='text'
                rules={{
                  required: 'Bank details are required'
                }}
              />
            )}

            <div className="mt-4 mb-2">
              <Checkbox 
                checked={isDebit}
                onChange={(e) => setIsDebit(e.target.checked)}
              >
                Create as Credit Sale
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
                        'For credit sales, initial payment must be less than total amount',
                      positiveRemaining: (value) => {
                        const remaining = totalAmount - value;
                        return remaining > 0 || 
                          'Remaining amount must be greater than 0 for credit sales';
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
                  type='datetime-local'
                  rules={{ 
                    required: 'Due date is required', 
                    validate: (value) => {
                      const selectedDateTime = new Date(value);
                      const now = new Date();
                      return selectedDateTime > now || 'Due date and time must be in the future';
                    }
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
                      For credit sales, there must be a remaining amount to pay
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

export default ProductManagePageuser;
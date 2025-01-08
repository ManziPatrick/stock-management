// @ts-nocheck

import { DeleteFilled, EditFilled } from '@ant-design/icons';
import type { PaginationProps, TableColumnsType } from 'antd';
import { Button, Col, Flex, Modal, Pagination, Row, Table, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';

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
  });

  const { data: products, isFetching } = useGetAllProductsQuery(query);

  const onChange: PaginationProps['onChange'] = (page) => {
    setCurrent(page);
  };
  const totaltotalValue = products?.meta?.summary?.totalValue || 0;
 
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
    size: product.measurement?.value || product.size || '',
    unit: product.measurement?.unit || '',
    description: product.description,
    totalValue: product.price * product.stock,
  }));

  const columns: TableColumnsType<any> = [
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
      <Flex justify="end" className="mt-4 pr-4">
        <Typography.Title level={4}>
          Total Margin Profit: <span className="text-green-600">{totaltotalValue}</span>
        </Typography.Title>
      </Flex>
    </>
  );
};

const SellProductModal = ({ product }: { product: IProduct & { key: string } }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [saleData, setSaleData] = useState<SaleDataType | null>(null);
  const [loading, setLoading] = useState(false);

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
      date: new Date().toISOString().split('T')[0]
    }
  });

  const [saleProduct] = useCreateSaleMutation();
  const today = new Date().toISOString().split('T')[0];

  const watchQuantity = watch("quantity");
  const watchPricePerUnit = watch("pricePerUnit");

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
// @ts-ignore
      const payload: SaleDataType = {
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
        }
      };

      const response = await saleProduct(payload).unwrap();

      // Check for success in the response
      if (response.success) {
        toastMessage({ icon: 'success', text: 'Sale completed successfully' });
        setSaleData(payload);
        setShowReceipt(true);
      } else {
        throw new Error('Failed to create sale');
      }
    } catch (error: any) {
      console.error('Sale error:', error);
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
    reset({
      quantity: 1,
      pricePerUnit: product.price,
      buyerName: '',
      date: today
    });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setShowReceipt(false);
    setSaleData(null);
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
            <SaleReceipt saleData={saleData} />
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
                disabled={loading || !validateQuantity(watchQuantity)}
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
const AddStockModal = ({ product }: { product: IProduct }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { handleSubmit, register, reset, formState: { errors }, watch } = useForm({
    defaultValues: {
      stock: 1
    }
  });
  const [addToStock] = useAddStockMutation();
  const watchStock = watch('stock');

  const onSubmit = async (data: FieldValues) => {
    setLoading(true);
    const stockValue = Number(data.stock);

    // Ensure positive stock value
    if (stockValue <= 0) {
      toastMessage({ icon: 'error', text: 'Stock quantity must be greater than 0' });
      setLoading(false);
      return;
    }

    const payload = {
      stock: stockValue,
      seller: product.seller._id, // Send only the seller ID
    };

    try {
      const res = await addToStock({ 
        id: product._id, 
        payload 
      }).unwrap();

      if (res.success) {
        toastMessage({ icon: 'success', text: 'Product stock added successfully!' });
        reset();
        handleCancel();
      } else {
        throw new Error(res.message || 'Failed to add stock');
      }
    } catch (error: any) {
      const errorMessage = error.data?.message || error.message || 'Failed to add stock';
      toastMessage({ icon: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const showModal = () => {
    setIsModalOpen(true);
    reset({ stock: 1 });
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
        <form onSubmit={handleSubmit(onSubmit)} style={{ margin: '2rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <p>Current Stock: {product.stock}</p>
            <p>Price per unit: {product.price.toFixed(0)} frw </p>
            {watchStock && (
              <p>Total Purchase Value: {(Number(watchStock) * product.price).toFixed(0)} frw</p>
            )}
          </div>

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

          <Flex justify="center" style={{ marginTop: '1rem' }} gap="small">
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

  const onSubmit = async (data: FieldValues) => {
    
    const payload = { ...data };
    payload.price = Number(data.price);
    
    // Handle measurement data
    if (data.unitType) {
      payload.measurement = {
        type: data.unitType,
        unit: data.unit,
        value: Number(data.quantity)
      };
      payload.stock = Number(data.quantity); // Update stock to match new quantity

      // Remove the individual fields
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
      handleCancel();
      toastMessage({ icon: 'error', text: error.data.message });
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
      <Modal title='Update Product Info' open={isModalOpen} onCancel={handleCancel} footer={null}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CustomInput
            name='name'
            errors={errors}
            label='Name'
            register={register}
            required={true}
          />
          <CustomInput
            errors={errors}
            label='Price'
            type='number'
            name='price'
            register={register}
            required={true}
          />
          
          {/* Unit Type Selection */}
          <Row>
            <Col xs={{ span: 23 }} lg={{ span: 6 }}>
              <label htmlFor="unitType" className="label">
                Measurement Type
              </label>
            </Col>
            <Col xs={{ span: 23 }} lg={{ span: 18 }}>
              <select
                {...register('unitType')}
                className="input-field"
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

          {/* Quantity and Unit Selection */}
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
                    label='number'
                    name="quantity"
                    register={register}
                    required={true}
                  />
                </div>
                {selectedUnit && (
                  <div style={{ flex: 1 }}>
                    <select
                      {...register('unit')}
                      className="input-field"
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
                disabled={isSellerLoading}
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

          <CustomInput label='Description' name='description' register={register} />

          <Flex justify='center'>
            <Button
              htmlType='submit'
              type='primary'
              style={{ textTransform: 'uppercase', fontWeight: 'bold' }}
            >
              Update
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

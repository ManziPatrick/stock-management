import { DeleteFilled, EditFilled } from '@ant-design/icons';
import type { PaginationProps, TableColumnsType } from 'antd';
import { Button, Col, Flex, Modal, Pagination, Row, Table, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';

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
      render: (price: number) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Stock',
      key: 'stock',
      dataIndex: 'stock',
      align: 'center',
    },
    {
      title: 'Measurement',
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

const SellProductModal = ({ product }: { product: ITableData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [saleData, setSaleData] = useState<ISaleData | null>(null);
  const [profitLoss, setProfitLoss] = useState<IProfitLoss>({ 
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
      pricePerUnit: product.price
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
    if (Number(data.quantity) > product.stock) {
      toastMessage({ 
        icon: 'error', 
        text: `Only ${product.stock} items available in stock` 
      });
      return;
    }

    const totalPrice = Number(data.pricePerUnit) * Number(data.quantity);
    
    const payload = {
      product: product.key,
      productName: product.name,
      SellingPrice: Number(data.pricePerUnit),
      productPrice: product.price,
      size: product.measurement?.value || product.size || '', // Ensures size fallback
      unit: product.measurement?.unit || '', 
      quantity: Number(data.quantity),
      buyerName: data.buyerName,
      date: data.date,
      totalPrice
    };

    try {
      const res = await saleProduct(payload).unwrap();
      if (res.success) {
        toastMessage({ icon: 'success', text: 'Sale completed successfully' });
        setSaleData(res.data.sale);
        setShowReceipt(true);
        reset();
      }
    } catch (error: any) {
      handleCancel();
      toastMessage({ icon: 'error', text: error.data?.message || 'Sale failed' });
    }
  };

  const showModal = () => {
    setIsModalOpen(true);
    setShowReceipt(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setShowReceipt(false);
    setSaleData(null);
    setProfitLoss({ perUnit: 0, total: 0, isProfit: true });
    reset();
  };

  return (
    <>
      <Button
        onClick={showModal}
        type='primary'
        className='table-btn'
        style={{ backgroundColor: 'royalblue' }}
        disabled={product.stock === 0}
      >
        Sell
      </Button>
      <Modal 
        title={showReceipt ? '' : 'Sell Product'} 
        open={isModalOpen} 
        onCancel={handleCancel} 
        footer={null}
        width={showReceipt ? 600 : 400}
      >
        {!showReceipt ? (
          <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: '1rem' }}>
            <CustomInput
              name='buyerName'
              label='Buyer Name'
              errors={errors}
              required={true}
              register={register}
              type='text'
              validation={{
                required: 'Buyer name is required',
                minLength: {
                  value: 2,
                  message: 'Buyer name must be at least 2 characters'
                }
              }}
            />
<CustomInput
        name="date"
        label="Selling Date"
        errors={errors}
        register={register}
        type="date"
        defaultValue={today}
        min={today}
        max={today}
        validation={{
          required: 'Date is required',
        }}
      />
            <CustomInput
              name='pricePerUnit'
              label='Selling Price Per Unit'
              errors={errors}
              required={true}
              register={register}
              type='number'
              defaultValue={product.price}
              validation={{
                required: 'Price is required',
                min: {
                  value: 0,
                  message: 'Price cannot be negative'
                }
              }}
            />
            <CustomInput
              name='quantity'
              label='Quantity'
              errors={errors}
              required={true}
              register={register}
              type='number'
              validation={{
                required: 'Quantity is required',
                min: {
                  value: 1,
                  message: 'Quantity must be at least 1'
                },
                max: {
                  value: product.stock,
                  message: `Maximum available quantity is ${product.stock}`
                }
              }}
            />
            
            <div style={{ margin: '0', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Calculation Summary:</h4>
              <p>Original Price: ${product.price}/unit</p>
              <p>Selling Price: ${watchPricePerUnit || product.price}/unit</p>
              <p style={{ color: profitLoss.isProfit ? 'green' : 'red' }}>
                {profitLoss.isProfit ? 'Profit' : 'Loss'}: ${profitLoss.perUnit}/unit
              </p>
              <p style={{ color: profitLoss.isProfit ? 'green' : 'red' }}>
                Total {profitLoss.isProfit ? 'Profit' : 'Loss'}: ${profitLoss.total}
              </p>
              <p style={{ fontWeight: 'bold' }}>
                Available Stock: {product.stock} units
              </p>
            </div>

            <Flex justify='center' style={{ marginTop: '1rem' }}>
              <Button 
                htmlType='submit' 
                type='primary'
                disabled={product.stock === 0}
              >
                Sell Product
              </Button>
            </Flex>
          </form>
        ) : (
          saleData && <SaleReceipt saleData={saleData} />
        )}
      </Modal>
    </>
  );
};

export default ProductManagePageuser;
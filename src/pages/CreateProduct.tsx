import { Button, Col, Flex, Row } from 'antd';
import { FieldValues, useForm } from 'react-hook-form';
import CustomInput from '../components/CustomInput';
import toastMessage from '../lib/toastMessage';
import { useGetAllBrandsQuery } from '../redux/features/management/brandApi';
import { useGetAllCategoriesQuery } from '../redux/features/management/categoryApi';
import { useCreateNewProductMutation } from '../redux/features/management/productApi';
import { useGetAllSellerQuery } from '../redux/features/management/sellerApi';
import { ICategory } from '../types/product.types';
import CreateSeller from '../components/product/CreateSeller';
import CreateCategory from '../components/product/CreateCategory';
import CreateBrand from '../components/product/CreateBrand';

const CreateProduct = () => {
  const [createNewProduct] = useCreateNewProductMutation();
  const { data: categories } = useGetAllCategoriesQuery(undefined);
  const { data: sellers } = useGetAllSellerQuery(undefined);
  const { data: brands } = useGetAllBrandsQuery(undefined);

  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
    watch,
  } = useForm();

  const selectedUnit = watch('unitType');

  const onSubmit = async (data: FieldValues) => {
    const payload = { ...data };
    payload.price = Number(data.price);
    payload.quantity = Number(data.quantity);
    payload.stock = Number(data.quantity);
    // Handle measurement data
    if (data.unitType) {
      payload.measurement = {
        type: data.unitType,
        unit: data.unit,
        value: Number(data.quantity)
      };

      delete payload.unitType;
      delete payload.unit;
      delete payload.quantity;
    }

    try {
      const res = await createNewProduct(payload).unwrap();
      if (res.statusCode === 201) {
        toastMessage({ icon: 'success', text: res.message });
        reset();
      }
    } catch (error: any) {
      console.error(error);
      toastMessage({ icon: 'error', text: error.data?.message || 'Failed to create product' });
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

  return (
    <>
      <Row
        gutter={30}
        style={{
          height: 'calc(100vh - 6rem)',
          overflow: 'auto',
        }}
      >
        <Col
          xs={{ span: 24 }}
          lg={{ span: 14 }}
          style={{
            display: 'flex',
          }}
        >
          <Flex
            vertical
            style={{
              width: '100%',
              padding: '1rem 2rem',
              border: '1px solid #164863',
              borderRadius: '.6rem',
            }}
          >
            <h1
              style={{
                marginBottom: '.8rem',
                fontWeight: '900',
                textAlign: 'center',
                textTransform: 'uppercase',
              }}
            >
              Add New Product
            </h1>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CustomInput
                name="name"
                errors={errors}
                label="Name"
                register={register}
                required={true}
              />
              <CustomInput
                errors={errors}
                label="Price"
                type="number"
                name="price"
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

              {/* Single Quantity Input with Unit Selection */}
              <Row>
                <Col xs={{ span: 23 }} lg={{ span: 6 }}>
                <label htmlFor="quantity" className="label">
                    Quantity
                  </label>
                </Col>
                <Col xs={{ span: 23 }} lg={{ span: 18 }}>
                 
                    
                      <CustomInput
                        errors={errors}
                        label=''
                        type="number"
                        name="quantity"
                        register={register}
                        required={true}
                      />
                   
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
                 
                </Col>
              </Row>

              {/* Supplier Selection */}
              <Row>
                <Col xs={{ span: 23 }} lg={{ span: 6 }}>
                  <label htmlFor="seller" className="label">
                    Supplier
                  </label>
                </Col>
                <Col xs={{ span: 23 }} lg={{ span: 18 }}>
                  <select
                    {...register('seller', { required: true })}
                    className={`input-field ${errors['seller'] ? 'input-field-error' : ''}`}
                  >
                    <option value="">Select supplier*</option>
                    {sellers?.data.map((item: ICategory) => (
                      <option key={item._id} value={item._id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </Col>
              </Row>

              {/* Category Selection */}
              <Row>
                <Col xs={{ span: 23 }} lg={{ span: 6 }}>
                  <label htmlFor="category" className="label">
                    Category
                  </label>
                </Col>
                <Col xs={{ span: 23 }} lg={{ span: 18 }}>
                  <select
                    {...register('category', { required: true })}
                    className={`input-field ${errors['category'] ? 'input-field-error' : ''}`}
                  >
                    <option value="">Select Category*</option>
                    {categories?.data.map((item: ICategory) => (
                      <option key={item._id} value={item._id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </Col>
              </Row>

              {/* Brand Selection */}
              <Row>
                <Col xs={{ span: 23 }} lg={{ span: 6 }}>
                  <label htmlFor="brand" className="label">
                    Brand
                  </label>
                </Col>
                <Col xs={{ span: 23 }} lg={{ span: 18 }}>
                  <select
                    {...register('brand')}
                    className={`input-field ${errors['brand'] ? 'input-field-error' : ''}`}
                  >
                    <option value="">Select brand</option>
                    {brands?.data.map((item: ICategory) => (
                      <option key={item._id} value={item._id}>
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
              />

              <Flex justify="center">
                <Button
                  htmlType="submit"
                  type="primary"
                  style={{ textTransform: 'uppercase', fontWeight: 'bold' }}
                >
                  Add Product
                </Button>
              </Flex>
            </form>
          </Flex>
        </Col>
        <Col xs={{ span: 24 }} lg={{ span: 10 }}>
          <Flex
            vertical
            style={{
              width: '100%',
              height: '100%',
              padding: '1rem 2rem',
              border: '1px solid #164863',
              borderRadius: '.6rem',
              justifyContent: 'space-around',
            }}
          >
            <CreateSeller />
            <CreateCategory />
            <CreateBrand />
          </Flex>
        </Col>
      </Row>
    </>
  );
};

export default CreateProduct;
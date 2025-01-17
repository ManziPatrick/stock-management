import { Button, Col, Flex, Row, Spin, Upload, Modal } from 'antd';
import { FieldValues, useForm } from 'react-hook-form';
import { PlusOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { RcFile, UploadProps } from 'antd/es/upload';
import type { UploadFile } from 'antd/es/upload/interface';
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

const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const CreateProduct = () => {
  const [createNewProduct] = useCreateNewProductMutation();
  const { data: categories } = useGetAllCategoriesQuery(undefined);
  const { data: sellers } = useGetAllSellerQuery(undefined);
  const { data: brands } = useGetAllBrandsQuery(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
    watch,
  } = useForm();

  const selectedUnit = watch('unitType');

  const handleCancel = () => setPreviewOpen(false);

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
  };

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  const onSubmit = async (data: FieldValues) => {
    if (fileList.length === 0) {
      toastMessage({ icon: 'error', text: 'Please upload at least one image' });
      return;
    }

    if (fileList.length > 5) {
      toastMessage({ icon: 'error', text: 'Maximum 5 images allowed' });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();

    // Append all form fields
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== '') {
        formData.append(key, data[key]);
      }
    });

    // Handle measurement data
    if (data.unitType) {
      const measurement = {
        type: data.unitType,
        unit: data.unit,
        value: Number(data.quantity)
      };
      formData.append('measurement', JSON.stringify(measurement));
    }

    // Append images
    fileList.forEach((file) => {
      if (file.originFileObj) {
        formData.append('images', file.originFileObj);
      }
    });

    try {
      const res = await createNewProduct(formData).unwrap();
      if (res.statusCode === 201) {
        toastMessage({ icon: 'success', text: res.message });
        reset();
        setFileList([]);
      }
    } catch (error: any) {
      console.error(error);
      toastMessage({ icon: 'error', text: error.data?.message || 'Failed to create product' });
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

  return (
    <>
      <Row
        gutter={30}
        style={{
          height: 'calc(100vh - 6rem)',
          overflow: 'auto',
        }}
      >
        <Col xs={{ span: 24 }} lg={{ span: 14 }}>
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
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={selectedUnit ? 12 : 24}>
                      <CustomInput
                        errors={errors}
                        label=""
                        type="number"
                        name="quantity"
                        register={register}
                        required={true}
                      />
                    </Col>
                    
                    {selectedUnit && (
                      <Col xs={24} sm={12}>
                        <select
                          {...register('unit')}
                          className="input-field"
                          disabled={isSubmitting}
                          style={{ width: '100%', height: '100%' }}
                        >
                          <option value="">Select Unit</option>
                          {renderUnitOptions()}
                        </select>
                      </Col>
                    )}
                  </Row>
                </Col>
              </Row>

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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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

              <Row style={{ marginBottom: '20px' }}>
                <Col xs={{ span: 23 }} lg={{ span: 6 }}>
                  <label className="label">Product Images</label>
                </Col>
                <Col xs={{ span: 23 }} lg={{ span: 18 }}>
                  <Upload
                    listType="picture-card"
                    fileList={fileList}
                    onPreview={handlePreview}
                    onChange={handleChange}
                    beforeUpload={() => false}
                    accept="image/*"
                  >
                    {fileList.length >= 5 ? null : uploadButton}
                  </Upload>
                  <div style={{ color: '#666', fontSize: '12px' }}>
                    Upload 1-5 images. Supported formats: JPG, PNG
                  </div>
                </Col>
              </Row>

              <Flex justify="center" style={{ marginTop: '20px' }}>
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
                    minWidth: '150px'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Spin size="small" style={{ marginRight: '8px' }} />
                      Creating...
                    </>
                  ) : (
                    'Add Product'
                  )}
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

      <Modal open={previewOpen} title={previewTitle} footer={null} onCancel={handleCancel}>
        <img alt="example" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </>
  );
};

export default CreateProduct;
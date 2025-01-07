import {Button, Col, Flex, Row} from 'antd';
import {FieldValues, useForm} from 'react-hook-form';
import CustomInput from '../../components/CustomInput';
import toastMessage from '../../lib/toastMessage';

import {useCreateNewProductMutation} from '../../redux/features/management/productApi';
import {useGetAllSellerQuery} from '../../redux/features/management/sellerApi';
import {ICategory} from '../../types/product.types';

import CreateCategory from '../../components/product/CreateCategory';


const CreateProduct = () => {
  const [createNewProduct] = useCreateNewProductMutation();

  const {data: sellers} = useGetAllSellerQuery(undefined);


  const {
    handleSubmit,
    register,
    formState: {errors},
    reset,
  } = useForm();

  const onSubmit = async (data: FieldValues) => {
    const payload = {...data};
    payload.price = Number(data.price);
    payload.stock = Number(data.stock);

    if (payload.size === '') {
      delete payload.size;
    }

    try {
      const res = await createNewProduct(payload).unwrap();
      if (res.statusCode === 201) {
        toastMessage({icon: 'success', text: res.message});
        reset();
      }
    } catch (error: any) {
      console.log(error);
      toastMessage({icon: 'error', text: error.data.message});
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
          xs={{span: 24}}
          lg={{span: 14}}
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
              Add New Expense
            </h1>
            <form onSubmit={handleSubmit(onSubmit)}>
              
              <Row>
                <Col xs={{span: 23}} lg={{span: 6}}>
                  <label htmlFor='Size' className='label'>
                  Expenses
                  </label>
                </Col>
                <Col xs={{span: 23}} lg={{span: 18}}>
                  <select
                    {...register('seller', {required: true})}
                    className={`input-field ${errors['seller'] ? 'input-field-error' : ''}`}
                  >
                    <option value=''>Select Expense*</option>
                    {sellers?.data.map((item: ICategory) => (
                      <option value={item._id}>{item.name}</option>
                    ))}
                  </select>
                </Col>
              </Row>
              <CustomInput
                errors={errors}
                label='Price'
                type='number'
                name='price'
                register={register}
                required={true}
              />
            
              

             
             
              <CustomInput label='Description' name='description' register={register} />

              
              <Flex justify='center'>
                <Button
                  htmlType='submit'
                  type='primary'
                  style={{textTransform: 'uppercase', fontWeight: 'bold'}}
                >
                  Add Expense
                </Button>
              </Flex>
            </form>
          </Flex>
        </Col>
        <Col xs={{span: 24}} lg={{span: 10}}>
          
        </Col>
      </Row>
    </>
  );
};

export default CreateProduct;

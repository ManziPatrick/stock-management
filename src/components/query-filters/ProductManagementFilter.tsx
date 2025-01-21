import { Col, Flex, Row, Slider, Select, Input } from 'antd';
import React from 'react';
import { useGetAllCategoriesQuery } from '../../redux/features/management/categoryApi';
import { useGetAllBrandsQuery } from '../../redux/features/management/brandApi';

interface ProductManagementFilterProps {
  query: {
    name: string;
    category: string;
    brand: string;
    limit: number;
    minPrice?: number;
    maxPrice?: number;
  };
  setQuery: React.Dispatch<
    React.SetStateAction<{
      name: string;
      category: string;
      brand: string;
      limit: number;
      minPrice?: number;
      maxPrice?: number;
    }>
  >;
}

const ProductManagementFilter: React.FC<ProductManagementFilterProps> = ({
  query,
  setQuery,
}) => {
  const { data: categories } = useGetAllCategoriesQuery(undefined);
  const { data: brands } = useGetAllBrandsQuery(undefined);

  return (
    <div className="border-2 shadow-md p-5 bg-gradient-to-tr from-cyan-700 to-cyan-500 rounded-lg">
      <Row gutter={[16, 16]} className="w-full">
        <Col xs={24} md={8}>
          <div className="space-y-2">
            <label className="font-bold text-white">Price Range</label>
            <Slider
              range
              step={100}
              max={20000}
              defaultValue={[1000, 5000]}
              onChange={(value: number[]) => {
                setQuery((prev) => ({
                  ...prev,
                  minPrice: value[0],
                  maxPrice: value[1],
                }));
              }}
              className="mt-2"
              tooltip={{
                formatter: (value) => `৳${value}`,
              }}
            />
          </div>
        </Col>

        <Col xs={24} md={8}>
          <Input
            placeholder="Search by Product Name"
            value={query.name}
            onChange={(e) => setQuery((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full h-10 text-black"
            allowClear
          />
        </Col>

        <Col xs={24} md={4}>
          <Select
            placeholder="Filter by Category"
            className="w-full"
            value={query.category || undefined}
            onChange={(value) => setQuery((prev) => ({ ...prev, category: value }))}
            allowClear
            options={[
              { value: '', label: 'All Categories' },
              ...(categories?.data?.map((category: { _id: string; name: string }) => ({
                value: category._id,
                label: category.name,
              })) || []),
            ]}
          />
        </Col>

        <Col xs={24} md={4}>
          <Select
            placeholder="Filter by Brand"
            className="w-full"
            value={query.brand || undefined}
            onChange={(value) => setQuery((prev) => ({ ...prev, brand: value }))}
            allowClear
            options={[
              { value: '', label: 'All Brands' },
              ...(brands?.data?.map((brand: { _id: string; name: string }) => ({
                value: brand._id,
                label: brand.name,
              })) || []),
            ]}
          />
        </Col>
      </Row>
    </div>
  );
};

export default ProductManagementFilter;
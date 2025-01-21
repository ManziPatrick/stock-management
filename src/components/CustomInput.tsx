// @ts-nocheck

import React from 'react';
import { Col, Input, Row } from 'antd';

interface Props {
  name: string;
  errors?: any;
  label: string;
  type?: string;
  register: any;
  required?: boolean;
  defaultValue?: any;
  max?: string;
  min?: string;
  rules?: object; // Added rules to handle custom validations
}

const CustomInput: React.FC<Props> = ({
  name,
  errors = {},
  required = false,
  label,
  register,
  type = 'text',
  defaultValue,
  min,
  max,
  rules = {}, // Default to an empty object
}) => {
  return (
    <Row>
      <Col xs={{ span: 23 }} lg={{ span: 6 }}>
        <label htmlFor={name} className=" text-sm">
          {label}
        </label>
      </Col>
      <Col xs={{ span: 23 }} lg={{ span: 18 }}>
        <Input
          id={name}
          type={type}
          placeholder={label}
          defaultValue={defaultValue}
          min={min}
          max={max}
          {...register(name, { required, ...rules })} 
          className={`input-field  bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-transparent dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500 ${errors[name] ? 'input-field-error' : ''}`}
        />
        {errors[name] && (
          <p className="error-text">{errors[name]?.message || `${label} is required`}</p>
        )}
      </Col>
    </Row>
  );
};

export default CustomInput;

// @ts-nocheck

import React from 'react';
import { Col, Row } from 'antd';

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
        <label htmlFor={name} className="label">
          {label}
        </label>
      </Col>
      <Col xs={{ span: 23 }} lg={{ span: 18 }}>
        <input
          id={name}
          type={type}
          placeholder={label}
          defaultValue={defaultValue}
          min={min}
          max={max}
          {...register(name, { required, ...rules })} // Spread the rules into the register function
          className={`input-field ${errors[name] ? 'input-field-error' : ''}`}
        />
        {errors[name] && (
          <p className="error-text">{errors[name]?.message || `${label} is required`}</p>
        )}
      </Col>
    </Row>
  );
};

export default CustomInput;

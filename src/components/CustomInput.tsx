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
          validation={validation}
          max={max}
          {...register(name, { required })}
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

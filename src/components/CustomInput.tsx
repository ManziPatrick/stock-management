// @ts-nocheck 
import React, { useEffect, useState } from 'react'; 
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
  rules?: object;
  includeTime?: boolean;
  locale?: string; // Add locale for internationalization
  timeZone?: string; // Add timeZone for global date handling
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
  rules = {},
  includeTime = false,
  locale = navigator.language, // Default to browser locale
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone, // Default to user's timezone
}) => {
  // For date-time inputs
  const [currentDateTime, setCurrentDateTime] = useState('');
  
  useEffect(() => {
    if (includeTime && type === 'datetime-local') {
      // Get current date time in user's timezone
      const now = new Date();
      
      // Format for datetime-local input (YYYY-MM-DDThh:mm)
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      
      const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
      setCurrentDateTime(formattedDateTime);
    }
  }, [includeTime, type]);

  // Format date for display according to locale
  const formatDateForDisplay = (date) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: includeTime ? 'numeric' : undefined,
        minute: includeTime ? 'numeric' : undefined,
        timeZone: timeZone
      });
    } catch (e) {
      return date;
    }
  };

  return ( 
    <Row className="mb-4"> 
      <Col xs={{ span: 23 }} lg={{ span: 6 }}> 
        <label htmlFor={name} className="text-sm font-medium"> 
          {label} {required && <span className="text-red-500">*</span>}
        </label> 
      </Col> 
      <Col xs={{ span: 23 }} lg={{ span: 18 }}> 
        <input 
          id={name} 
          type={includeTime ? 'datetime-local' : type} 
          placeholder={label} 
          defaultValue={defaultValue} 
          min={includeTime ? currentDateTime : min} 
          max={max} 
          {...register(name, { 
            required: required ? (typeof required === 'string' ? required : `${label} is required`) : false,
            ...rules,
            validate: rules.validate || (includeTime ? 
              (value) => {
                const selectedDate = new Date(value);
                const now = new Date();
                return selectedDate > now || 'Selected date and time must be in the future';
              } : undefined)
          })} 
          className={`input-field bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-transparent dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500 ${errors[name] ? 'border-red-500' : ''}`} 
        /> 
        {errors[name] && ( 
          <p className="text-red-500 text-xs mt-1">{errors[name]?.message || `${label} is required`}</p> 
        )}
        
        {/* Optional helper text showing the formatted date according to locale */}
        {type === 'date' || type === 'datetime-local' ? (
          <p className="text-xs text-gray-500 mt-1">
            {defaultValue && `Format: ${formatDateForDisplay(defaultValue)}`}
          </p>
        ) : null}
      </Col> 
    </Row> 
  ); 
}; 
 
export default CustomInput;
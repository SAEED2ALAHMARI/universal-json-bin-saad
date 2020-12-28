/* eslint-disable no-mixed-operators */
/* eslint-disable no-tabs */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-nested-ternary */
import valuesToOptions from './values-to-options';

// Context
import { EventContext } from '../../Form';

const toNumber = (v, options = false) => {
  if (v === '' || v === undefined) return v;
  if (options && options.useLocaleString) return v.replace(/[^\d,.]/g, '');
  const n = Number(v);
  return (!Number.isNaN(n) ? n : v);
};

const stringify = (val, depth, replacer, space, onGetObjID) => {
  depth = isNaN(+depth) ? 1 : depth;
  const recursMap = new WeakMap();
  function _build(val, depth, o, a, r) {
    return !val || typeof val !== 'object' ? val
      : (r = recursMap.has(val),
      recursMap.set(val, true),
      a = Array.isArray(val),
      r ? (o = onGetObjID && onGetObjID(val) || null) : JSON.stringify(val, (k, v) => {
        if (a || depth > 0) {
          if (replacer) v = replacer(k, v); if (!k) return (a = Array.isArray(v), val = v); !o && (o = a ? [] : {}); o[k] = _build(v, a ? depth : depth - 1); 
        } 
      }),
      o === void 0 ? {} : o);
  }
  const stageVal = _build(val, depth);
  const finalVal = (JSON.stringify(stageVal) === '{}') ? null : stageVal;
  return finalVal && JSON.stringify(finalVal, null, space) || '';
};

const coerceValue = (type, value, options = false) => {
  switch (type) {
    case 'string':
      return (typeof value === 'string' ? value : String(value));
    case 'number':
    case 'integer':
    case 'double':
    case 'float':
    case 'decimal':
      return toNumber(value, options);
    default:
      return value;
  }
};

const onChangeHandler = (onChange, type, widget, options, isCustomComponent) => (e) => {
  const value = (widget === 'material-multiselect' || widget === 'material-select' || widget === 'creatable-select')  
    ? coerceValue(type, stringify(e))
    : coerceValue(type, e.target.value, options);
  if (value !== undefined) onChange(value);
};

export default ({
  schema = {},
  uiSchema = {},
  isCustomComponent,
  inputValue,
  onChange,
  onKeyDown,
  creatableSelectValue,
  onCreatableSelectChange,
  onInputChange,
  htmlid,
  data,
  objectData,
}) => {
  const widget = uiSchema['ui:widget'];
  const options = uiSchema['ui:options'] || uiSchema['ui:props'] || {};
  const { type } = schema;
  const rv = isCustomComponent
    ? {
      onKeyDown,
      ...isCustomComponent({ onChange }).props,
      ...options,
    }
    : {
      onChange,
      onKeyDown,
      uiSchema,
      schema,
      options,
      widget,
      type,
      EventContext,
    };

  if (
    isCustomComponent
		&& isCustomComponent({ onChange })
		&& isCustomComponent({ onChange }).props
		&& isCustomComponent({ onChange }).props.onChange
  ) {
    rv.onChange = isCustomComponent({ onChange }).props.onChange;
  }
  else {
    if (schema.enum && widget !== 'radio') {
      rv.nullOption = 'Please select...';
      rv.label = schema.title || '';
      if (widget === 'material-select' || widget === 'material-multiselect') {
        rv.multiSelect = widget === 'material-multiselect';
        rv.isClearable = uiSchema['ui:isClearable'] || false;
        rv.placeholder = uiSchema['ui:placeholder'] || '';
      }

      if (widget === 'creatable-select') {
        rv.optionsOnly = true;
      }

      rv.options = valuesToOptions(schema.enum);
    }

    if (options.disabled) {
      if (typeof options.disabled === 'boolean') {
        rv.disabled = options.disabled;
      }
      else if (typeof options.disabled === 'function') {
        rv.disabled = options.disabled.call(null, data, objectData);
      }
    }
  }

  rv.htmlid = htmlid;

  return rv;
};

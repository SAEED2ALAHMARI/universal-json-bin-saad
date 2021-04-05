const _ = require('lodash');
const namor = require('namor');

const generateTestFile = ({
  schema,
  hashName,
  pageName,
  template,
  shelljs,
  generatedLocation,
  formData,
  hasOnLoadData,
  hasOnSubmitData,
  tabName,
  stepName,
  folderName,
  refrencePointer,
}) => {
  const finalString = template({
    schema,
    pageName: hashName,
    formData,
    hasOnLoadData,
    hasOnSubmitData,
    folderName,
    refrencePointer,
    tabName,
    stepName,
  });
  const shellFileString = new shelljs.ShellString(finalString);

  console.log(`Generating Integration Tests for ${pageName}`);

  shellFileString.to(`${generatedLocation}/${pageName}.feature`);

  console.log(`${pageName} tests generated successfully`);
};

const generateUISchemaType = ({
  schema,
  uiSchema,
  formData
}) => {
  /**
   * Todo: do something with uiSchema validations here
   * maxLength
   * minLength
   * pattern
   * minimum
   * maximum
   */
  Object.keys(schema.properties).forEach((schemaProp) => {
    let data =
      schema.properties[schemaProp].type === 'number' ||
      schema.properties[schemaProp].type === 'integer'
        ? namor.generate({
            words: 0,
            numbers: 5,
            saltLength: 0,
          })
        : namor.generate({
            words: 3,
            saltLength: 0,
          });

    if (
      schema.properties[schemaProp] &&
      !schema.properties[schemaProp].title &&
      schema.properties[schemaProp].items &&
      schema.properties[schemaProp].items.title
    ) {
      schema.properties[schemaProp].title =
        schema.properties[schemaProp].items.title;
    }

    if (uiSchema && uiSchema[schemaProp] && uiSchema[schemaProp]['ui:widget']) {
      schema.properties[schemaProp]['widget'] =
        (
          uiSchema[schemaProp] &&
          uiSchema[schemaProp]['ui:options'] &&
          uiSchema[schemaProp]['ui:options'] === 'rich-text-editor'
        ) ? 'rich-text-editor'
          : uiSchema[schemaProp]['ui:widget'];

        if (uiSchema[schemaProp]['ui:widget'] === 'material-date') {
          data = '31-01-2021';
        }

        if (uiSchema[schemaProp]['ui:widget'] === 'upload') {
          data = 'checkbox.md';
        }
    } else if (
      uiSchema &&
      uiSchema[schemaProp] &&
      uiSchema[schemaProp]['ui:component']
    ) {
      schema.properties[schemaProp]['widget'] = uiSchema[schemaProp]['ui:component'];
    } else {
      const isArray =
        schema.properties[schemaProp].type === 'array'
          ? 'material-multiselect-native'
          : 'material-input';
      const isBoolean =
        schema.properties[schemaProp].type === 'boolean'
          ? 'material-checkbox'
          : isArray;
      schema.properties[schemaProp]['widget'] = schema.properties[schemaProp]
        .enum
        ? 'material-native-select'
        : isBoolean;
    }

    if (
      uiSchema &&
      uiSchema[schemaProp] &&
      uiSchema[schemaProp]['ui:options'] &&
      uiSchema[schemaProp]['ui:options']['useLocaleString']
    ) {
      schema.properties[schemaProp].uiData = Number(data).toLocaleString(
        uiSchema[schemaProp]['ui:options']['useLocaleString']
      );
    }

    const getEnumValue = (givenEnumData, formData) => {
      const enumData = givenEnumData.filter((d) => !d.disabled);
      const enumVal = typeof enumData[0] === 'object'
        ? enumData[0].value || enumData[0].title
        : enumData[0];
        return formData && formData.includes(enumVal)
          ? typeof enumData[1] === 'object'
            ? enumData[1].value || enumData[1].title
            : enumData[1]
          : enumVal; 
    }
      
    const isEnumData =
      schema.properties[schemaProp].enum ||
      schema.properties[schemaProp].anyOf ||
      (schema.properties[schemaProp].items &&
        (schema.properties[schemaProp].items.enum ||
          schema.properties[schemaProp].items.anyOf));
    schema.properties[schemaProp].data = isEnumData
      ? getEnumValue(isEnumData, formData && formData[schemaProp])
      : data;
  });
  return schema;
}

const e2eTestsGenerator = (
  pageName,
  hashName,
  shelljs,
  ejs,
  generatedLocation,
  testsGeneratedFolder
) => {
  const templateFile = require('./templates/example-form-e2e.template.js');
  const template = ejs.compile(templateFile, {});
  let xhrSchema = {};
  let uiSchema = {};
  const getDefinitionSchemaFromRef = require('../src/helpers/get-definition-schema');
  const schema = require(`../src/demo/examples/${pageName}/schema.json`);
  try {
    uiSchema = require(`../src/demo/examples/${pageName}/ui-schema.json`);
  } catch (err) {}
  try {
    xhrSchema = require(`../src/demo/examples/${pageName}/xhr-schema.json`);
  } catch (err) {}
  const formData = require(`../src/demo/examples/${pageName}/form-data.json`);
  try {
    const testSchema = require(`../src/demo/examples/${pageName}/tests-schema.json`);
    const subTestsFolder = `${testsGeneratedFolder}/${pageName}`;
    shelljs.rm('-rf', subTestsFolder);
    shelljs.mkdir(subTestsFolder);
    const shellTestFileString = new shelljs.ShellString(
      JSON.stringify(testSchema, null, 2)
    );
    shellTestFileString.to(`${subTestsFolder}/tests-schema.json`);
    console.log(`${pageName} custom schema tests generated successfully`);
  } catch (err) {}
  const kebabize = (str) => {
    return str
      .split('')
      .map((letter, idx) => {
        return letter.toUpperCase() === letter
          ? `${idx !== 0 ? '-' : ''}${letter.toLowerCase()}`
          : letter;
      })
      .join('');
  };

  if (!schema.properties) {
    schema.properties = {
      single: schema,
    };
  }

  // This logic should be refactored to include nested field support
  if (_.has(uiSchema, 'ui:page.ui:layout')) {
    Object.keys(schema.properties).forEach((schemaProp) => {
      const finalSchema = schema.properties[schemaProp].$ref
        ? getDefinitionSchemaFromRef(
            schema.definitions,
            schema.properties[schemaProp],
            formData[schemaProp]
          )
        : schema.properties[schemaProp];

      const newSchema = generateUISchemaType({
        schema: finalSchema,
        uiSchema: uiSchema[schemaProp],
        formData: formData[schemaProp],
      });
      const uiLayout = _.get(uiSchema, 'ui:page.ui:layout');
      generateTestFile({
        schema: newSchema,
        hashName,
        pageName: `${pageName}-${kebabize(schemaProp)}`,
        template,
        shelljs,
        generatedLocation,
        folderName: pageName,
        refrencePointer: schemaProp,
        formData: formData[schemaProp],
        xhrSchema: xhrSchema[schemaProp],
        hasOnLoadData: _.has(xhrSchema, 'ui:page.onload'),
        tabName: (uiLayout === 'tabs' && newSchema.title) || false,
        hasOnSubmitData: _.has(xhrSchema, 'ui:page.onsubmit'),
        stepName: (uiLayout === 'steps' && newSchema.title) || false,
      });
    });
  } else {
    const finalSchema = generateUISchemaType({ schema, uiSchema });
    generateTestFile({
      schema: finalSchema,
      hashName,
      pageName,
      folderName: pageName,
      refrencePointer: pageName,
      template,
      shelljs,
      tabName: false,
      stepName: false,
      generatedLocation,
      formData,
      xhrSchema,
      hasOnLoadData: _.has(xhrSchema, 'ui:page.onload'),
      hasOnSubmitData: _.has(xhrSchema, 'ui:page.onsubmit'),
    });
  }
};

module.exports = e2eTestsGenerator;

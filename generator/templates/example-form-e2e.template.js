const exampleFormE2ETemplate = `Feature: <%= pageName %> Feature
    Scenario Outline: <%= pageName %> Form scenario
        Given I have a form for page <%= pageName %> with following "<fieldRef>" "<shouldReload>" "<tabName>" "<stepName>" "<hasXHRSchema>"

        When I test the field "<fieldRef>" based on following attributes
            | fieldName           | fieldType | uiSchemaType      | fieldFormValue | fieldUIValue  | fieldRef   | shouldSkip |
            <% Object.keys(schema.properties).forEach((schemaProp) => { %>
            | <%= schema.properties[schemaProp].title %>          | <%= schema.properties[schemaProp].type %>    | <%= schema.properties[schemaProp].widget %> | <%= formData && formData[schemaProp] %>  | <%= formData && formData[schemaProp] %> | <%= schemaProp %> | <%= hasOnLoadData %> |
            <% }); %>

        Then I expect the field "<fieldRef>" to have following values
            | fieldResultOnChange | fieldUIResultOnChange | fieldRef          |
            <% Object.keys(schema.properties).forEach((schemaProp) => { %>
            | <%= schema.properties[schemaProp].data %>           | <%= schema.properties[schemaProp].uiData || schema.properties[schemaProp].data %>              | <%= schemaProp %> |
            <% }); %>
        Examples:
            | fieldRef   | tabName | stepName | shouldReload | hasXHRSchema |
            <% Object.keys(schema.properties).forEach((schemaProp, schemaIn) => { %>
            | <%= schemaProp %> | <%= tabName %>   | <%= stepName %>     | <%= schemaIn === 0 %> | <%= hasOnSubmitData %> |
            <% }); %>

`;

module.exports = exampleFormE2ETemplate;

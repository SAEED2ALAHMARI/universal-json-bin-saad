// Library
import React from 'react';

// Helpers
import getDefinitionSchemaFromRef from '../../../../get-definition-schema';
import Utils from '../../../../utils';

// State Helpers
import isFormSchemaStateValid from '../../../helpers/is-form-schema-state-valid';
  
// config
import { FORM_STATE_CONFIG } from '../form-state.config';

// Stepper Actions
import useStepperActions from '../../stepper/hooks/stepper.actions.hooks';

// Types
import { StateMachineInstance } from '../../../types/form-state-machine.type';

interface ExecuteFormActions {
  state: StateMachineInstance;
  stateMachineService: any;
}

/**
 * @description
 * This function acts more like a mini rules engine currenly only 2 rules.
 * 1. To Execute updates when state changes are seen.
 * 2. To Disable submit button when state detects invalid fields.
 * 3. To Enable submit button when state detects all valid fields.
 * 4. To Propagate onChange event on formProps when update is done.
 * @param param0 
 * @returns 
 */
const useFormActions = ({
  isStepperUI,
}) => {
  const [buttonDisabled, setButtonDisabled] = React.useState(false);
  const { 
    executeStepperActions,
    getValidStepperActionToExecute,
  } = useStepperActions(buttonDisabled);
  const { 
    FORM_ACTIONS: actions, 
    FORM_STATE_EVENTS, 
    FORM_STATE_ARRAY_EVENTS, 
    FORM_STATE_ERROR_EVENTS,
  } = FORM_STATE_CONFIG;

  const getValidActionToExecute = (
    state: StateMachineInstance,
  ) => {
    const executable = [];
    const {
      uiSchema: currentUISchema,
    } = state.context;
    const formValidCondition = isStepperUI(currentUISchema) ? Object.values(
      state.value[Object.keys(state.value)[0]],
    ).includes(FORM_STATE_ERROR_EVENTS.INVALID) 
      : Object.values(state.value).includes(FORM_STATE_ERROR_EVENTS.INVALID);

    const PROPAGATE_ON_CHANGE_CONDITION = {
      condition: Object.values({
        ...FORM_STATE_EVENTS,
        ...FORM_STATE_ARRAY_EVENTS,
      }).includes(state.event.type) && typeof state.context.effects.onChange === 'function',
      equals: true,
      callback: () => executable.push(actions.PROPOGATE_ONCHANGE_EVENT),
    };

    const ENABLE_FORM_CONDITION = {
      condition: (
        formValidCondition
      ),
      equals: false,
      callback: () => executable.push(actions.ENABLE_FORM_SUBMIT),
    };

    const DISABLE_FORM_CONDITION = {
      condition: (
        formValidCondition
      ),
      equals: true,
      callback: () => executable.push(actions.DISABLE_FORM_SUBMIT),
    };

    Utils.executeConditions([
      { ...PROPAGATE_ON_CHANGE_CONDITION },
      { ...ENABLE_FORM_CONDITION },
      { ...DISABLE_FORM_CONDITION },
    ]);

    return executable;
  };

  /**
   * @description
   * Gets Schema and form data to render/parse for current view.
   * 
   * @param { currentSchema, currentData, activeStep } 
   * @returns { Schema, data }
   */
  const getSchemaAndFormData = ({
    currentSchema: givenSchema,
    currentData: givenData,
    currentUISchema,
    activeStep,
  }) => {
    const currentSchema = JSON.parse(JSON.stringify(givenSchema));
    const currentData = JSON.parse(JSON.stringify(givenData));
    if (currentSchema.properties) {
      const stepName = Object.keys(currentSchema.properties)[activeStep];
      const translatedSchema = getDefinitionSchemaFromRef(
        currentSchema.definitions, 
        currentSchema.properties[stepName], 
        currentData[stepName],
      );
      const schema = isStepperUI(currentUISchema) 
        ? {
          ...translatedSchema,
        }
        : currentSchema;
      const data = isStepperUI(currentUISchema) ? currentData[stepName] : currentData;
      return {
        schema,
        data,
      };
    }

    return {
      schema: currentSchema,
      data: currentData,
    };
  };

  const executeAction = {
    [actions.DISABLE_FORM_SUBMIT]: () => setButtonDisabled(true),
    [actions.ENABLE_FORM_SUBMIT]: () => setButtonDisabled(false),
    [actions.PROPOGATE_ONCHANGE_EVENT]: ({
      stateMachineService,
      state,
    }) => {
      const {
        formSchema: currentSchema, 
        formData: currentData, 
        uiData: currentUIData, 
        uiSchema: currentUISchema,
        validation,
        activeStep,
      } = state.context;
      const { schema, data } = getSchemaAndFormData({
        currentData,
        currentSchema,
        currentUISchema,
        activeStep,
      });
      const { schemaErrors, transformedSchema } = isFormSchemaStateValid({
        stateMachineService,
        schema,
        uiSchema: currentUISchema,
        validation,
        data,
        onError: state.context.effects.onError,
        buttonDisabled,
      });
      state.context.effects.onChange({
        schema: currentSchema,
        formData: currentData, 
        uiData: currentUIData,
        uiSchema: currentUISchema, 
        schemaErrors,
        validSchema: transformedSchema,
      });
    },
    ...executeStepperActions,
  };

  const executeFormActionsByState = ({
    state,
    stateMachineService,
  }: ExecuteFormActions) => [
    ...getValidStepperActionToExecute(state),
    ...getValidActionToExecute(state),
  ].forEach((action) => executeAction[action]({
    state,
    stateMachineService,
  }));

  return {
    executeFormActionsByState,
    buttonDisabled,
  };
};

export default useFormActions;

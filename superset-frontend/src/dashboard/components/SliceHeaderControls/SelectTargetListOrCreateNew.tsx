import { css, QueryFormData, styled, t, useTheme } from '@superset-ui/core';
import { AntdForm, Button, Col, Row, Typography } from 'src/components';
import { Form, FormItem } from 'src/components/Form';
import { Input } from 'src/components/Input';
import { StyledSelect } from 'src/components/Select/styles';
import { useEffect, useState } from 'react';
import { ControlFormItem } from 'src/explore/components/controls/ColumnConfigControl/ControlForm';
import {
  ExportListPayload,
  exportListToHubspot,
  getHubspotLists,
} from 'src/dashboard/components/SliceHeaderControls/_requests';
import { useToasts } from 'src/components/MessageToasts/withToasts';

type SelectTargetListOrCreateNewProps = {
  queryFormData: QueryFormData;
};
 
type FormValues = {
  targetList: string;
  newList: string;
};

type ActiveField = 'existing' | 'new' | 'both';

export const StyledControlFormItem = styled(ControlFormItem)`
  ${({ theme }) => css`
    border-radius: ${theme.borderRadius}px;
  `}
`;

const SelectTargetListOrCreateNew = ({
  queryFormData,
}: SelectTargetListOrCreateNewProps) => {
  const theme = useTheme();

  const descStyle = {
    whiteSpace: 'pre-wrap',
    fontFamily: theme.typography.families.sansSerif,
    fontSize: theme.typography.sizes.s,
    color: theme.colors.grayscale.base,
  };


  const [values, setValues] = useState<FormValues>({
    targetList: 'select',
    newList: '',
  });
  const [activeField, setActiveField] = useState<ActiveField>('both');
  const [tabValue, setTabValue] = useState('TARGET_LIST');
  const [form] = AntdForm.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [listsLoading, setListsLoading] = useState(false);
  const [hubspotLists, setHubspotLists] = useState<any[]>([]);
  const { addDangerToast, addSuccessToast } = useToasts();

  useEffect(() => {
    if (
      (values.targetList === '' || values.targetList === 'select') &&
      values.newList === ''
    ) {
      setActiveField('both');
    } else if (values.targetList !== '' && values.targetList !== 'select') {
      setActiveField('existing');
    } else if (values.newList !== '') {
      setActiveField('new');
    }
  }, [values]);

  const onTargetListChange = (newValue: any) => {
    setTabValue(newValue);
    if (newValue === 'TARGET_LIST') {
      setValues(prev => ({ ...prev, targetList: 'select', newList: '' }));
    } else if (newValue === 'NEW_LIST') {
      setValues(prev => ({ ...prev, targetList: '', newList: '' }));
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    if (activeField !== 'existing' && activeField !== 'new') {
      console.error('Please select a valid option.');
      return;
    }

    let payload: ExportListPayload = {
      chartId: queryFormData.chart_id.toString(),
      list_name: values.newList,
      list_id: values.targetList,
      object: 'contacts',
      filters: [],
    };

    if (activeField === 'existing') {
      payload.list_id = values.targetList;
      delete payload.list_name;
    }

    if (activeField === 'new') {
      payload.list_name = values.newList;
      delete payload.list_id;
    }

    if (
      queryFormData.extra_form_data &&
      queryFormData.extra_form_data.filters &&
      queryFormData.extra_form_data.filters.length > 0
    ) {
      payload.filters = queryFormData.extra_form_data.filters;
    } else {
      delete payload.filters;
    }

    console.log('PAYLOAD TO HUBSPOT:', payload);

    try {
      const response = await exportListToHubspot(payload);
      console.log('RESPONSE FROM HUBSPOT:', response);
      addSuccessToast(t('Contacts successfully added to the list in Hubspot.'));
    } catch (error) {
      console.error('Error exporting list to Hubspot:', error);
      addDangerToast(
        t('Sorry, something went wrong. Please try again.'),
        error,
      );
    } finally {
      // Set loading state to false and reset values
      setIsLoading(false);

      // Reset values to initial state
      setValues({ targetList: 'select', newList: '' });

      // Reset form fields
      form.resetFields();
      setTabValue('TARGET_LIST');
      setActiveField('both');
    }
  };

  const fetchHubspotLists = async () => {
    setListsLoading(true);
    const lists = await getHubspotLists();
    const preparedLists = lists?.data?.map((list: any) => ({
      value: list.listId,
      label: list.name,
    }));
    setHubspotLists(preparedLists || []);
    setListsLoading(false);
  };

  useEffect(() => {
    fetchHubspotLists();
  }, []);

  return (
    <div>
      <Row className="mb-4">
        <Col>
          <Typography.Paragraph className="mb-2" style={descStyle}>
            <p>
              If you would like to add the contacts from this chart to a target
              list in Hubspot, you can either select an existing list or create
              a new one.
            </p>
            <p>
              The contacts will be added to the list you choose or created in
              your Hubspot instance.
            </p>
            <p>
              <strong>Add contacts to existing list:</strong> Select an existing
              list from the dropdown to add the contacts from this chart to that
              list.
            </p>
            <p>
              <strong>Create a new list:</strong> Select new list and enter a
              name for the new list in the input field to create a new list and
              add the contacts from this chart to that list.
            </p>
            <p>
              <strong>Note:</strong> The list will be created in the Hubspot
              instance associated with your Insentric account.
            </p>
          </Typography.Paragraph>
        </Col>
      </Row>
      <Row>
        <div>
          <StyledControlFormItem
            controlType="RadioButtonControl"
            label=""
            description=""
            name="mode"
            options={[
              ['TARGET_LIST', t('Target List')],
              ['NEW_LIST', t('New List')],
            ]}
            value={tabValue ? tabValue : undefined}
            onChange={onTargetListChange}
          />
        </div>
      </Row>
      <Form>
        {tabValue === 'TARGET_LIST' && (
          <>
            <Row>
              <Col xs={16} md={12}>
                <Typography.Title level={5}>
                  {t('Select target list')}
                </Typography.Title>
              </Col>
            </Row>
            <Row gutter={16} className="mb-4">
              <Col xs={16} md={12}>
                {listsLoading ? (
                  <div
                    style={{
                      display: 'flex',
                      marginBottom: '15px'
                    }}
                  >
                    <img
                      style={{ height: '16px' }}
                      alt="Loading..."
                      src="/static/assets/images/loading.gif"
                      role="status"
                      aria-live="polite"
                      aria-label="Loading"
                      data-test="loading-indicator"
                    />
                    <span style={{ marginLeft: '8px' }}>
                      {t('Loading lists...')}
                    </span>
                  </div>
                ) : <FormItem
                  name="targetList"
                  extra={t(
                    "Select an existing list to add this chart's records to.",
                  )}
                >
                  <StyledSelect
                    id="select-target-list"
                    value={form.getFieldValue('targetList')}
                    onChange={(value: string) =>
                      setValues((prev: any) => ({
                        ...prev,
                        targetList: value as string,
                      }))
                    }
                    options={
                      hubspotLists.length > 0
                        ? hubspotLists
                        : [{ value: 'select', label: t('No existing list') }]
                    }
                    placeholder={t('Select a target list')}
                    style={{ width: '100%' }}
                    disabled={isLoading || activeField === 'new'}
                  />
                </FormItem>}
              </Col>
            </Row>
          </>
        )}
        {tabValue === 'NEW_LIST' && (
          <>
            <Row>
              <Col xs={16} md={12}>
                <Typography.Title level={5}>
                  {t('Create a new list')}
                </Typography.Title>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={16} md={12}>
                <FormItem
                  name="newList"
                  extra={t(
                    "Enter a name for the new list to add this chart's records to.",
                  )}
                >
                  <Input
                    type="text"
                    disabled={activeField === 'existing'}
                    placeholder="Add the name of the new list..."
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setValues((prev: any) => ({
                        ...prev,
                        newList: e.target.value,
                      }))
                    }
                    value={values.newList}
                  />
                </FormItem>
              </Col>
            </Row>
          </>
        )}
      </Form>
      <Row>
        <Col xs={16} md={12}>
          <Button
            buttonStyle="primary"
            buttonSize="small"
            onClick={handleSubmit}
            disabled={
              (values.targetList === 'select' && values.newList === '') ||
              (values.targetList === '' && values.newList === '') ||
              isLoading
            }
          >
            {isLoading ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  style={{ height: '16px' }}
                  alt="Loading..."
                  src="/static/assets/images/loading.gif"
                  role="status"
                  aria-live="polite"
                  aria-label="Loading"
                  data-test="loading-indicator"
                />
                <span style={{ marginLeft: '8px' }}>
                  {t('Adding records...')}
                </span>
              </div>
            ) : (
              <>{t('Add contacts to list')}</>
            )}
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default SelectTargetListOrCreateNew;

import React, { PureComponent } from 'react';
import { chain } from 'lodash';
import { AppEvents, PanelData, SelectableValue } from '@grafana/data';
import { Button, CodeEditor, Field, Select } from '@grafana/ui';
import AutoSizer from 'react-virtualized-auto-sizer';
import { selectors } from '@grafana/e2e-selectors';
import { appEvents } from 'app/core/core';
import { DashboardModel, PanelModel } from '../../state';
import { getPanelInspectorStyles } from './styles';
import { Translation } from 'react-i18next';
import i18n from 'app/core/i18n/i18n';

enum ShowContent {
  PanelJSON = 'panel',
  PanelData = 'data',
  DataStructure = 'structure',
}

const options: Array<SelectableValue<ShowContent>> = [
  {
    label: i18n.t('Panel JSON'),
    description: i18n.t('The model saved in the dashboard JSON that configures how everything works.'),
    value: ShowContent.PanelJSON,
  },
  {
    label: i18n.t('Panel data'),
    description: i18n.t('The raw model passed to the panel visualization'),
    value: ShowContent.PanelData,
  },
  {
    label: i18n.t('DataFrame structure'),
    description: i18n.t('Response info without any values'),
    value: ShowContent.DataStructure,
  },
];

interface Props {
  dashboard: DashboardModel;
  panel: PanelModel;
  data?: PanelData;
  onClose: () => void;
}

interface State {
  show: ShowContent;
  text: string;
}

export class InspectJSONTab extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      show: ShowContent.PanelJSON,
      text: getPrettyJSON(props.panel.getSaveModel()),
    };
  }

  onSelectChanged = (item: SelectableValue<ShowContent>) => {
    const show = this.getJSONObject(item.value!);
    const text = getPrettyJSON(show);
    this.setState({ text, show: item.value! });
  };

  // Called onBlur
  onTextChanged = (text: string) => {
    this.setState({ text });
  };

  getJSONObject(show: ShowContent) {
    if (show === ShowContent.PanelData) {
      return this.props.data;
    }

    if (show === ShowContent.DataStructure) {
      const series = this.props.data?.series;
      if (!series) {
        return { note: i18n.t('Missing Response Data') };
      }
      return this.props.data!.series.map(frame => {
        const { table, fields, ...rest } = frame as any; // remove 'table' from arrow response
        return {
          ...rest,
          fields: frame.fields.map(field => {
            return chain(field)
              .omit('values')
              .omit('state')
              .omit('display')
              .value();
          }),
        };
      });
    }

    if (show === ShowContent.PanelJSON) {
      return this.props.panel.getSaveModel();
    }

    return { note: i18n.t('Unknown Object') + `: ${show}` };
  }

  onApplyPanelModel = () => {
    const { panel, dashboard, onClose } = this.props;

    try {
      if (!dashboard.meta.canEdit) {
        appEvents.emit(AppEvents.alertError, ['Unable to apply']);
      } else {
        const updates = JSON.parse(this.state.text);
        panel.restoreModel(updates);
        panel.refresh();
        appEvents.emit(AppEvents.alertSuccess, ['Panel model updated']);
      }
    } catch (err) {
      console.error('Error applying updates', err);
      appEvents.emit(AppEvents.alertError, ['Invalid JSON text']);
    }

    onClose();
  };

  render() {
    const { dashboard } = this.props;
    const { show, text } = this.state;
    const selected = options.find(v => v.value === show);
    const isPanelJSON = show === ShowContent.PanelJSON;
    const canEdit = dashboard.meta.canEdit;
    const styles = getPanelInspectorStyles();

    return (
      <>
        <div className={styles.toolbar} aria-label={selectors.components.PanelInspector.Json.content}>
          <Translation>
            {t => (
              <Field label={t('Select source')} className="flex-grow-1">
                <Select options={options} value={selected} onChange={this.onSelectChanged} />
              </Field>
            )}
          </Translation>
          {isPanelJSON && canEdit && (
            <Button className={styles.toolbarItem} onClick={this.onApplyPanelModel}>
              Apply
            </Button>
          )}
        </div>
        <div className={styles.content}>
          <AutoSizer disableWidth>
            {({ height }) => (
              <CodeEditor
                width="100%"
                height={height}
                language="json"
                showLineNumbers={true}
                showMiniMap={(text && text.length) > 100}
                value={text || ''}
                readOnly={!isPanelJSON}
                onBlur={this.onTextChanged}
              />
            )}
          </AutoSizer>
        </div>
      </>
    );
  }
}

function getPrettyJSON(obj: any): string {
  return JSON.stringify(obj, null, 2);
}

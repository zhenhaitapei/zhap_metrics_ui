import { PanelData, QueryResultMetaStat, TimeZone } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { InspectStatsTable } from './InspectStatsTable';
import React from 'react';
import { Translation } from 'react-i18next';
import i18n from 'app/core/i18n/i18n';

interface InspectStatsTabProps {
  data: PanelData;
  timeZone: TimeZone;
}

export const InspectStatsTab: React.FC<InspectStatsTabProps> = ({ data, timeZone }) => {
  if (!data.request) {
    return null;
  }

  let stats: QueryResultMetaStat[] = [];

  const requestTime = data.request.endTime ? data.request.endTime - data.request.startTime : -1;
  const processingTime = data.timings?.dataProcessingTime || -1;
  let dataRows = 0;

  for (const frame of data.series) {
    dataRows += frame.length;
  }

  if (requestTime > 0) {
    stats.push({ displayName: i18n.t('Total request time'), value: requestTime, unit: 'ms' });
  }
  if (processingTime > 0) {
    stats.push({ displayName: i18n.t('Data processing time'), value: processingTime, unit: 'ms' });
  }
  stats.push({ displayName: i18n.t('Number of queries'), value: data.request.targets.length });
  stats.push({ displayName: i18n.t('Total number rows'), value: dataRows });

  let dataStats: QueryResultMetaStat[] = [];

  for (const series of data.series) {
    if (series.meta && series.meta.stats) {
      dataStats = dataStats.concat(series.meta.stats);
    }
  }

  return (
    <Translation>
      {t => (
        <div aria-label={selectors.components.PanelInspector.Stats.content}>
          <InspectStatsTable timeZone={timeZone} name={t('Stats')} stats={stats} />
          <InspectStatsTable timeZone={timeZone} name={t('Data source stats')} stats={dataStats} />
        </div>
      )}
    </Translation>
  );
};

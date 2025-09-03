/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { makeSingleton } from '../utils';
import TimeFormatterRegistry from './TimeFormatterRegistry';
import TimeFormatter from './TimeFormatter';
import TimeFormatsForGranularity from './TimeFormatsForGranularity';
import { LOCAL_PREFIX } from './TimeFormats';
import { TimeGranularity } from './types';
import createTimeRangeFromGranularity from './utils/createTimeRangeFromGranularity';
import TimeRangeFormatter from './TimeRangeFormatter';
import { FISCAL_YEAR_ID } from './formatters/fiscalYear';
import { FISCAL_QUARTER_ID } from './formatters/fiscalQuarter';
import { FISCAL_MONTH_ID } from './formatters/fiscalMonth';
import { WEEK_IN_YEAR_ID } from './formatters/weekInYear';
// import { WEEK_IN_MONTH_ID } from './formatters/weekInMonth';
import { DAY_IN_YEAR_ID } from './formatters/dayInYear';
import { DAY_IN_MONTH_ID } from './formatters/dayInMonth';
import { DAY_IN_WEEK_ID } from './formatters/dayInWeek';
import { DATE_ONLY_ID } from './formatters/dateOnly';
import { HOUR_IN_DAY_ID } from './formatters/hourInDay';

const getInstance = makeSingleton(TimeFormatterRegistry);

export default getInstance;

export function getTimeRangeFormatter(formatId?: string) {
  return new TimeRangeFormatter({
    id: formatId || 'undefined',
    formatFunc: (range: (Date | number | null | undefined)[]) => {
      const format = getInstance().get(formatId);
      const [start, end] = range.map(value => format(value));
      return start === end ? start : [start, end].join(' — ');
    },
    useLocalTime: formatId?.startsWith(LOCAL_PREFIX),
  });
}

export function formatTimeRange(
  formatId: string | undefined,
  range: (Date | null | undefined)[],
) {
  return getTimeRangeFormatter(formatId)(range);
}

export function getTimeFormatter(
  formatId?: string,
  granularity?: TimeGranularity,
) {
  // Skip range formatting for fiscal granularities
  if (granularity === TimeGranularity.FISCAL_YEAR) {
    return getInstance().get(FISCAL_YEAR_ID);
  }
  if (granularity === TimeGranularity.FISCAL_QUARTER) {
    return getInstance().get(FISCAL_QUARTER_ID);
  }

  if (granularity === TimeGranularity.FISCAL_MONTH) {
    return getInstance().get(FISCAL_MONTH_ID);
  }

  if (granularity === TimeGranularity.WEEK_IN_YEAR) {
    return getInstance().get(WEEK_IN_YEAR_ID);
  }

  // if (granularity === TimeGranularity.WEEK_IN_MONTH) {
  //   return getInstance().get(WEEK_IN_MONTH_ID);
  // }

  if (granularity === TimeGranularity.DAY_IN_YEAR) {
    return getInstance().get(DAY_IN_YEAR_ID);
  }

  if (granularity === TimeGranularity.DAY_IN_MONTH) {
    return getInstance().get(DAY_IN_MONTH_ID);
  }

  if (granularity === TimeGranularity.DAY_IN_WEEK) {
    return getInstance().get(DAY_IN_WEEK_ID);
  }

  if (granularity === TimeGranularity.DATE_ONLY) {
    return getInstance().get(DATE_ONLY_ID);
  }

  if (granularity === TimeGranularity.HOUR_IN_DAY) {
    return getInstance().get(HOUR_IN_DAY_ID);
  }

  if (granularity) {
    const formatString = formatId || TimeFormatsForGranularity[granularity];
    const timeRangeFormatter = getTimeRangeFormatter(formatString);

    return new TimeFormatter({
      id: [formatString, granularity].join('/'),
      formatFunc: (value: Date) =>
        timeRangeFormatter.format(
          createTimeRangeFromGranularity(
            value,
            granularity,
            timeRangeFormatter.useLocalTime,
          ),
        ),
      useLocalTime: timeRangeFormatter.useLocalTime,
    });
  }

  return getInstance().get(formatId);
}
/**
 * Syntactic sugar for backward compatibility
 * TODO: will be deprecated in a future version
 * @param granularity
 */
export function getTimeFormatterForGranularity(granularity?: TimeGranularity) {
  return getTimeFormatter(undefined, granularity);
}

export function formatTime(
  formatId: string | undefined,
  value: Date | number | null | undefined,
  granularity?: TimeGranularity,
) {
  return getTimeFormatter(formatId, granularity)(value);
}

/* eslint-disable no-case-declarations */
/*
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
// eslint-disable-next-line import/no-unresolved
import getBootstrapData from 'src/utils/getBootstrapData';
import { TimeGranularity } from '../types';
import createTime from './createTime';

const MS_IN_SECOND = 1000;
const MS_IN_MINUTE = 60 * MS_IN_SECOND;
const MS_IN_HOUR = 60 * MS_IN_MINUTE;

function deductOneMs(time: Date) {
  return new Date(time.getTime() - 1);
}

function computeEndTimeFromGranularity(
  time: Date,
  granularity: TimeGranularity,
  useLocalTime: boolean,
) {
  const config = getBootstrapData().common.conf;
  const { FISCAL_START } = config;

  const date = useLocalTime ? time.getDate() : time.getUTCDate();
  const month = useLocalTime ? time.getMonth() : time.getUTCMonth();
  const year = useLocalTime ? time.getFullYear() : time.getUTCFullYear();
  const mode = useLocalTime ? 'local' : 'utc';

  switch (granularity) {
    case TimeGranularity.SECOND:
      return new Date(time.getTime() + MS_IN_SECOND - 1);
    case TimeGranularity.MINUTE:
      return new Date(time.getTime() + MS_IN_MINUTE - 1);
    case TimeGranularity.FIVE_MINUTES:
      return new Date(time.getTime() + MS_IN_MINUTE * 5 - 1);
    case TimeGranularity.TEN_MINUTES:
      return new Date(time.getTime() + MS_IN_MINUTE * 10 - 1);
    case TimeGranularity.FIFTEEN_MINUTES:
      return new Date(time.getTime() + MS_IN_MINUTE * 15 - 1);
    case TimeGranularity.THIRTY_MINUTES:
      return new Date(time.getTime() + MS_IN_MINUTE * 30 - 1);
    case TimeGranularity.HOUR:
      return new Date(time.getTime() + MS_IN_HOUR - 1);
    // For the day granularity and above, using Date overflow is better than adding timestamp
    // because it will also handle daylight saving.
    case TimeGranularity.WEEK:
    case TimeGranularity.WEEK_STARTING_SUNDAY:
    case TimeGranularity.WEEK_STARTING_MONDAY:
      return deductOneMs(createTime(mode, year, month, date + 7));
    case TimeGranularity.MONTH:
      return deductOneMs(createTime(mode, year, month + 1));
    case TimeGranularity.QUARTER:
      return deductOneMs(
        createTime(mode, year, (Math.floor(month / 3) + 1) * 3),
      );
    case TimeGranularity.YEAR:
      return deductOneMs(createTime(mode, year + 1));
    case TimeGranularity.FISCAL_YEAR:
      // If we're past fiscal start month, end is next calendar year's fiscal start - 1 day
      // If we're before fiscal start month, end is current calendar year's fiscal start - 1 day
      const fiscalEndYear = month >= FISCAL_START - 1 ? year + 1 : year;
      return deductOneMs(createTime(mode, fiscalEndYear, FISCAL_START - 1, 1));

    case TimeGranularity.FISCAL_QUARTER:
      // Calculate current fiscal quarter (0-3)
      const fiscalMonth = (month - (FISCAL_START - 1) + 12) % 12;
      const currentFiscalQuarter = Math.floor(fiscalMonth / 3);

      // Calculate end month of current fiscal quarter
      const quarterEndFiscalMonth = (currentFiscalQuarter + 1) * 3;
      const quarterEndCalendarMonth =
        (quarterEndFiscalMonth + (FISCAL_START - 1)) % 12;

      // Determine year for quarter end
      const quarterEndYear =
        quarterEndCalendarMonth < FISCAL_START - 1 ? year + 1 : year;

      return deductOneMs(
        createTime(mode, quarterEndYear, quarterEndCalendarMonth, 1),
      );

    case TimeGranularity.FISCAL_MONTH:
      // Calculate current fiscal month (0-11)
      const currentFiscalMonth = (month - (FISCAL_START - 1) + 12) % 12;
      const fiscalMonthEndCalendarMonth =
        (currentFiscalMonth + (FISCAL_START - 1) + 1) % 12;
      const fiscalMonthEndYear =
        fiscalMonthEndCalendarMonth < FISCAL_START - 1 ? year + 1 : year;
      return deductOneMs(
        createTime(mode, fiscalMonthEndYear, fiscalMonthEndCalendarMonth, 1),
      );
    case TimeGranularity.WEEK_IN_YEAR:
    // case TimeGranularity.WEEK_IN_MONTH:
    //   return deductOneMs(createTime(mode, year, month, date + 7));
    case TimeGranularity.DAY_IN_YEAR:
    case TimeGranularity.DAY_IN_MONTH:
    case TimeGranularity.DAY_IN_WEEK:
    case TimeGranularity.DATE_ONLY:
      return deductOneMs(createTime(mode, year, month, date + 1));
    case TimeGranularity.HOUR_IN_DAY:
      return new Date(time.getTime() + MS_IN_HOUR - 1);
    // For the WEEK_ENDING_XXX cases,
    // currently assume "time" returned from database is supposed to be the end time
    // (in contrast to all other granularities that the returned time is start time).
    // However, the returned "time" is at 00:00:00.000, so have to add 23:59:59.999.
    case TimeGranularity.WEEK_ENDING_SATURDAY:
    case TimeGranularity.WEEK_ENDING_SUNDAY:
    case TimeGranularity.DATE:
    case TimeGranularity.DAY:
    default:
      return deductOneMs(createTime(mode, year, month, date + 1));
  }
}

export default function createTimeRangeFromGranularity(
  time: Date,
  granularity: TimeGranularity,
  useLocalTime = false,
) {
  const endTime = computeEndTimeFromGranularity(
    time,
    granularity,
    useLocalTime,
  );

  if (
    granularity === TimeGranularity.WEEK_ENDING_SATURDAY ||
    granularity === TimeGranularity.WEEK_ENDING_SUNDAY
  ) {
    const date = useLocalTime ? time.getDate() : time.getUTCDate();
    const month = useLocalTime ? time.getMonth() : time.getUTCMonth();
    const year = useLocalTime ? time.getFullYear() : time.getUTCFullYear();
    const startTime = createTime(
      useLocalTime ? 'local' : 'utc',
      year,
      month,
      date - 6,
    );
    return [startTime, endTime];
  }

  return [time, endTime];
}
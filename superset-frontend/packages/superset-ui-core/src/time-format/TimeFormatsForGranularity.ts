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

import { FISCAL_QUARTER_ID } from './formatters/fiscalQuarter';
import { FISCAL_YEAR_ID } from './formatters/fiscalYear';
import { FISCAL_MONTH_ID } from './formatters/fiscalMonth';

import TimeFormats from './TimeFormats';
import { TimeGranularity } from './types';
import { WEEK_IN_YEAR_ID } from './formatters/weekInYear';
// import { WEEK_IN_MONTH_ID } from './formatters/weekInMonth';
import { DAY_IN_YEAR_ID } from './formatters/dayInYear';
import { DAY_IN_MONTH_ID } from './formatters/dayInMonth';
import { DAY_IN_WEEK_ID } from './formatters/dayInWeek';
import { DATE_ONLY_ID } from './formatters/dateOnly';
import { HOUR_IN_DAY_ID } from './formatters/hourInDay';

const { DATABASE_DATE, DATABASE_DATETIME } = TimeFormats;
const MINUTE = '%Y-%m-%d %H:%M';

/**
 * Map time granularity to d3-format string
 */
const TimeFormatsForGranularity: Record<TimeGranularity, string> = {
  [TimeGranularity.DATE]: DATABASE_DATE,
  [TimeGranularity.SECOND]: DATABASE_DATETIME,
  [TimeGranularity.MINUTE]: MINUTE,
  [TimeGranularity.FIVE_MINUTES]: MINUTE,
  [TimeGranularity.TEN_MINUTES]: MINUTE,
  [TimeGranularity.FIFTEEN_MINUTES]: MINUTE,
  [TimeGranularity.THIRTY_MINUTES]: MINUTE,
  [TimeGranularity.HOUR]: '%Y-%m-%d %H:00',
  [TimeGranularity.DAY]: DATABASE_DATE,
  [TimeGranularity.WEEK]: DATABASE_DATE,
  [TimeGranularity.MONTH]: '%b %Y',
  [TimeGranularity.QUARTER]: '%Y Q%q',
  [TimeGranularity.YEAR]: '%Y',
  [TimeGranularity.WEEK_STARTING_SUNDAY]: DATABASE_DATE,
  [TimeGranularity.WEEK_STARTING_MONDAY]: DATABASE_DATE,
  [TimeGranularity.WEEK_ENDING_SATURDAY]: DATABASE_DATE,
  [TimeGranularity.WEEK_ENDING_SUNDAY]: DATABASE_DATE,
  [TimeGranularity.FISCAL_YEAR]: FISCAL_YEAR_ID,
  [TimeGranularity.FISCAL_QUARTER]: FISCAL_QUARTER_ID,
  [TimeGranularity.FISCAL_MONTH]: FISCAL_MONTH_ID,
  [TimeGranularity.WEEK_IN_YEAR]: WEEK_IN_YEAR_ID,
  // [TimeGranularity.WEEK_IN_MONTH]: WEEK_IN_MONTH_ID,
  [TimeGranularity.DAY_IN_YEAR]: DAY_IN_YEAR_ID,
  [TimeGranularity.DAY_IN_MONTH]: DAY_IN_MONTH_ID,
  [TimeGranularity.DAY_IN_WEEK]: DAY_IN_WEEK_ID,
  [TimeGranularity.DATE_ONLY]: DATE_ONLY_ID,
  [TimeGranularity.HOUR_IN_DAY]: HOUR_IN_DAY_ID
};

export default TimeFormatsForGranularity;

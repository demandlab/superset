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
import TimeFormatter from '../TimeFormatter';

export const FISCAL_MONTH_ID = 'FISCAL_MONTH';

export function createFiscalMonthFormatter() {
  const bootstrapData = getBootstrapData();
  const config = bootstrapData.common.conf;

  const { FISCAL_START } = config;

  return new TimeFormatter({
    id: FISCAL_MONTH_ID,
    formatFunc: (d: Date) => {
      const fiscalYear =
        d.getFullYear() + (d.getMonth() + 1 >= FISCAL_START ? 1 : 0);
      const fiscalMonth = String(Math.floor((d.getMonth() - (FISCAL_START - 1) + 12) % 12) + 1).padStart(2, '0');
      return `FY ${fiscalYear}-M${fiscalMonth}`;
    },
  });
}

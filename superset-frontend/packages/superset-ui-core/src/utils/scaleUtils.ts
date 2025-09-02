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

/**
 * Simple linear scale utility - replacement for d3-scale's scaleLinear
 * Creates a linear interpolation function between domain and range values
 */
export const createLinearScale = () => {
  let domain = [0, 1];
  let range = [0, 1];

  const scale = (value: number): number => {
    const [d0, d1] = domain;
    const [r0, r1] = range;
    return r0 + ((value - d0) * (r1 - r0)) / (d1 - d0);
  };

  scale.domain = (newDomain?: number[]) => {
    if (newDomain === undefined) return domain;
    domain = newDomain;
    return scale;
  };

  scale.range = (newRange?: number[]) => {
    if (newRange === undefined) return range;
    range = newRange;
    return scale;
  };

  return scale;
};

/**
 * Simple threshold scale utility - replacement for d3-scale's scaleThreshold
 * Maps values to discrete ranges based on threshold points
 */
export const createThresholdScale = <T>() => {
  let domain: number[] = [];
  let range: T[] = [];

  const scale = (value: number): T => {
    for (let i = 0; i < domain.length; i += 1) {
      if (value <= domain[i]) return range[i];
    }
    return range[range.length - 1];
  };

  scale.domain = (newDomain?: number[]) => {
    if (newDomain === undefined) return domain;
    domain = newDomain;
    return scale;
  };

  scale.range = (newRange?: T[]) => {
    if (newRange === undefined) return range;
    range = newRange;
    return scale;
  };

  return scale;
};

// Type definitions for compatibility with d3-scale patterns
export interface ScaleLinear<T, U> {
  (value: T): U;
  domain(): T[];
  domain(newDomain: T[]): ScaleLinear<T, U>;
  range(): U[];
  range(newRange: U[]): ScaleLinear<T, U>;
}

export interface ScaleThreshold<T, U> {
  (value: T): U;
  domain(): T[];
  domain(newDomain: T[]): ScaleThreshold<T, U>;
  range(): U[];
  range(newRange: U[]): ScaleThreshold<T, U>;
}

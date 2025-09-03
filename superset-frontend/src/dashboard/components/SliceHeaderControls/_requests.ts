export type ExportListPayload = {
  chartId: string;
  list_name?: string;
  list_id?: string;
  object: string;
  filters?: any[];
};

/**
 * @function exportListToHubspot
 *
 * @description Exports a list to Hubspot by sending a POST request with the provided payload.
 *
 * @param {ExportListPayload} payload - The payload containing chart ID, list name, list ID, object type, and filters.
 * @returns {Promise<any>} - The response from the Hubspot API.
 */
export const exportListToHubspot = async (payload: ExportListPayload) => {
  const response = await fetch(
    `https://${window.location.host.split('.report')[0]}.admin.insentric.net/api/superset/export_list_hubspot`,
    {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    },
  )
    .then(response => response.json())
    .catch(error => {
      console.error('Error calling backend:', error);
    });

  return response;
};

// GET Hubspot list of list
export type HubspotListResponse = {
  data: Array<{ listId: string; name: string }>;
};

/**
 * @function getHubspotLists
 *
 * @description Fetches the list of Hubspot lists by sending a GET request.
 *
 * @returns {Promise<HubspotListResponse | undefined>} - The response containing the list of Hubspot lists.
 */
export const getHubspotLists = async (): Promise<
  HubspotListResponse | undefined
> => {
  const response = await fetch(`https://${window.location.host.split('.report')[0]}.admin.insentric.net/api/hubspot/api/lists`, {
    method: 'GET',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  })
    .then(response => response.json())
    .catch(error => {
      console.error('Error calling backend:', error);
    });

  return response;
};

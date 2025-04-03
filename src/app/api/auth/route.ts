import { NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.SF_CLIENT_ID;
    const clientSecret = process.env.SF_CLIENT_SECRET;
    const username = process.env.SF_USERNAME;
    const password = process.env.SF_PASSWORD;
    const securityToken = process.env.SF_SECURITY_TOKEN;

    if (!clientId || !clientSecret || !username || !password || !securityToken) {
      console.error('Missing Salesforce credentials');
      return NextResponse.json({ error: 'Missing Salesforce credentials' }, { status: 400 });
    }

    // Authenticate
    const authResponse = await fetch('https://login.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: clientId,
        client_secret: clientSecret,
        username: username,
        password: password + securityToken
      })
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('Authentication failed:', errorText);
      return NextResponse.json({ error: 'Authentication failed', details: errorText }, { status: 401 });
    }

    const authData = await authResponse.json();

    // Fetch Leads with Company and Address fields
    const query = encodeURIComponent("SELECT Id, Name, Email, Phone, Company, Street, City, State, PostalCode, Country FROM Lead  WHERE Company LIKE '%Pentacloud%' ORDER BY Name ASC");
    const leadsResponse = await fetch(`${authData.instance_url}/services/data/v59.0/query/?q=${query}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authData.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!leadsResponse.ok) {
      const errorText = await leadsResponse.text();
      console.error('Failed to fetch leads:', errorText);
      return NextResponse.json({ error: 'Failed to fetch leads', details: errorText }, { status: 500 });
    }

    const leads = await leadsResponse.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json(leads.records.map((lead: any) => ({
      Id: lead.Id,
      Name: lead.Name || 'N/A',
      Email: lead.Email || 'N/A',
      Phone: lead.Phone || 'N/A',
      Company: lead.Company || 'N/A',
      Address: formatAddress(lead)
    })));

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// Helper function to format address from individual fields
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatAddress(lead: any): string {
  const addressParts = [];
  
  if (lead.Street) addressParts.push(lead.Street);
  
  const cityStateZip = [
    lead.City,
    lead.State,
    lead.PostalCode
  ].filter(Boolean).join(', ');
  
  if (cityStateZip) addressParts.push(cityStateZip);
  if (lead.Country) addressParts.push(lead.Country);
  
  return addressParts.length > 0 ? addressParts.join(', ') : 'N/A';
}
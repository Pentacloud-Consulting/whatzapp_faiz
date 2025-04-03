'use client';

import React, { useState, useEffect } from 'react';

interface Lead {
  Id: string;
  Name: string;
  Phone: string;
  Email?: string;
  Company: string;
  Address: string;
}

interface Message {
  sender: 'user' | 'customer';
  text: string;
  timestamp: string;
}

export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState<'CRM' | 'WhatsApp'>('CRM');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search filters
  const [nameFilter, setNameFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'recent'>('all');

  const fetchLeads = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth');
      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }
      const data = await response.json();
      setLeads(data);
      
      // Initially show only first 15 leads
      setFilteredLeads(data.slice(0, 15));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'CRM') {
      fetchLeads();
    }
  }, [activeTab]);

  const handlePhoneClick = (lead: Lead) => {
    setSelectedLead(lead);
    setActiveTab('WhatsApp');
    setMessages([]); // Reset messages when switching leads
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedLead) return;

    const newMessage: Message = {
      sender: 'user',
      text: messageInput,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessageInput('');

    try {
      await fetch('/api/sendMessages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: selectedLead.Phone, message: messageInput }),
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSearch = () => {
    let filtered = leads.filter((lead) => {
      const nameMatch = nameFilter ? lead.Name.toLowerCase().includes(nameFilter.toLowerCase()) : true;
      const phoneMatch = phoneFilter ? lead.Phone.includes(phoneFilter) : true;
      const companyMatch = companyFilter ? lead.Company.toLowerCase().includes(companyFilter.toLowerCase()) : true;
      const emailMatch = emailFilter ? 
        (lead.Email ? lead.Email.toLowerCase().includes(emailFilter.toLowerCase()) : false) : 
        true;
      
      return nameMatch && phoneMatch && companyMatch && emailMatch;
    });
    
    // Apply recent filter if active
    if (viewMode === 'recent') {
      filtered = filtered.slice(0, 15);
    } else {
      // For 'all' mode, still limit to first 15 for UI performance
      filtered = filtered.slice(0, 15);
    }
    
    setFilteredLeads(filtered);
  };

  const clearFilters = () => {
    setNameFilter('');
    setPhoneFilter('');
    setCompanyFilter('');
    setEmailFilter('');
    
    // Reset to first 15 leads
    setFilteredLeads(leads.slice(0, 15));
  };

  const toggleViewMode = (mode: 'all' | 'recent') => {
    setViewMode(mode);
    if (mode === 'recent') {
      // Show only most recent 15 leads
      setFilteredLeads(leads.slice(0, 15));
    } else {
      // For 'all' mode, still limit to first 15 for UI performance
      setFilteredLeads(leads.slice(0, 15));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="w-full bg-white shadow-md rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-pink-500 text-white text-center p-4">
          <h1 className="text-xl font-bold">Whatzapp</h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`w-1/2 p-4 text-center ${activeTab === 'CRM' ? 'bg-blue-200 font-bold text-black' : 'bg-white text-black'}`}
            onClick={() => setActiveTab('CRM')}
          >
            CRM
          </button>
          <button
            className={`w-1/2 p-4 text-center ${activeTab === 'WhatsApp' ? 'bg-green-200 font-bold text-black' : 'bg-white text-black'}`}
            onClick={() => setActiveTab('WhatsApp')}
          >
            WhatsApp
          </button>
        </div>

        {/* CRM Leads List */}
        {activeTab === 'CRM' && (
          <div className="p-4">
            {/* View Toggle Buttons */}
            <div className="flex justify-center mb-4">
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                    viewMode === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => toggleViewMode('all')}
                >
                  All Leads
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                    viewMode === 'recent' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => toggleViewMode('recent')}
                >
                  Recent Leads
                </button>
              </div>
            </div>
            
            {/* Search Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex-1 min-w-fit">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md text-black"
                  placeholder="Search by name..."
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-fit">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md text-black"
                  placeholder="Search by email..."
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-fit">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md text-black"
                  placeholder="Search by phone..."
                  value={phoneFilter}
                  onChange={(e) => setPhoneFilter(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-fit">
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md text-black"
                  placeholder="Search by company..."
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                />
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={handleSearch}
                  className="p-2 bg-blue-500 text-white rounded-md h-10"
                >
                  Search
                </button>
                <button
                  onClick={clearFilters}
                  className="p-2 bg-gray-300 text-black rounded-md h-10"
                >
                  Clear
                </button>
              </div>
            </div>

            {isLoading ? (
              <p className="p-4 text-center text-gray-500">Loading leads...</p>
            ) : error ? (
              <p className="p-4 text-red-500">{error}</p>
            ) : filteredLeads.length === 0 ? (
              <p className="p-4 text-center text-gray-500">No leads found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-black">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="p-4 text-left">Name</th>
                      <th className="p-4 text-left">Email</th>
                      <th className="p-4 text-left">Phone</th>
                      <th className="p-4 text-left">Company</th>
                      <th className="p-4 text-left">Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr key={lead.Id} className="border-b hover:bg-gray-50">
                        <td className="p-4">{lead.Name}</td>
                        <td className="p-4">{lead.Email || 'N/A'}</td>
                        <td className="p-4">
                          <button
                            onClick={() => handlePhoneClick(lead)}
                            className="text-blue-600 hover:underline"
                          >
                            {lead.Phone}
                          </button>
                        </td>
                        <td className="p-4">{lead.Company}</td>
                        <td className="p-4">{lead.Address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-2 text-center text-sm text-gray-500">
                  Showing {filteredLeads.length} out of {leads.length} leads
                </div>
              </div>
            )}
          </div>
        )}

        {/* WhatsApp Chat UI - Split into two columns */}
        {activeTab === 'WhatsApp' && (
          <div className="flex flex-col md:flex-row  h-full">
            {/* Lead Details Column - 1/3 width */}
            <div className="md:w-1/3 p-4 border-r">
              {selectedLead ? (
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h2 className="text-xl font-bold mb-4 text-black">Lead Details</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Name</label>
                      <div className="text-black">{selectedLead.Name}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Email</label>
                      <div className="text-black">{selectedLead.Email || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Phone</label>
                      <div className="text-black">{selectedLead.Phone}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Company</label>
                      <div className="text-black">{selectedLead.Company}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Address</label>
                      <div className="text-black">{selectedLead.Address}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-center text-gray-500">Select a lead to view details</p>
                </div>
              )}
            </div>
            
            {/* Chat Column - 2/3 width */}
            <div className="md:w-2/3 p-4">
              {selectedLead ? (
                <>
                  {/* Header */}
                  <div className="flex items-center bg-gray-200 p-3 rounded-t-lg text-black">
                    <span className="text-lg font-bold">{selectedLead.Name}</span>
                    <span className="ml-auto text-gray-600">{selectedLead.Phone}</span>
                  </div>

                  {/* Messages */}
                  <div className="h-96 bg-gray-50 p-3 overflow-y-auto border-l border-r">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-center text-gray-500">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`p-2 my-1 rounded-lg max-w-xs ${msg.sender === 'user' ? 'bg-green-500 text-white' : 'bg-gray-200 text-black'}`}>
                            <p className="text-sm">{msg.text}</p>
                            <span className="text-xs text-right block">{msg.timestamp}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="flex mt-0 p-3 bg-gray-100 rounded-b-lg border-l border-r border-b">
                    <input
                      type="text"
                      className="w-full p-2 border rounded-l-md text-black"
                      placeholder="Type your message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button
                      className="bg-green-500 text-white px-4 py-2 rounded-r-md"
                      onClick={handleSendMessage}
                    >
                      Send
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border p-8">
                  <p className="text-center text-gray-500">Select a lead from the CRM tab to start chatting</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
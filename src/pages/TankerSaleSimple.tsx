import React from 'react';

export default function TankerSaleSimple() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4">
        <nav className="text-sm text-white" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <span className="text-blue-200">Dashboard</span>
            </li>
            <li className="flex items-center">
              <span className="mx-2 text-blue-300">&gt;</span>
              <span className="text-white font-medium">Add Tanker Details</span>
            </li>
          </ol>
        </nav>
        
        <div className="mt-2">
          <button className="bg-blue-800 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
            Tanker Details
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Form Section */}
        <div className="bg-blue-900 p-6 rounded-lg mb-6">
          <div className="grid grid-cols-5 gap-4 mb-4">
            {/* First Row */}
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Date</label>
              <input
                type="date"
                className="w-full p-2 bg-blue-50 border border-blue-200 rounded focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-2 block">End Date/Time</label>
              <input
                type="datetime-local"
                className="w-full p-2 bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Invoice No</label>
              <input
                type="text"
                className="w-full p-2 bg-blue-50 border border-blue-200 rounded focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Vehicle No</label>
              <input
                type="text"
                className="w-full p-2 bg-blue-50 border border-blue-200 rounded focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Mobile No</label>
              <input
                type="text"
                className="w-full p-2 bg-blue-50 border border-blue-200 rounded focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-6 gap-4">
            {/* Second Row */}
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Tank</label>
              <select className="w-full p-2 bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none">
                <option>- Select Tank-</option>
                <option>TANK-1</option>
                <option>TANK-2</option>
                <option>TANK-3</option>
              </select>
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Before Dip</label>
              <input
                type="number"
                className="w-full p-2 bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Before Stock</label>
              <input
                type="number"
                className="w-full p-2 bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Receipt</label>
              <input
                type="number"
                className="w-full p-2 bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Gross Stock</label>
              <input
                type="number"
                className="w-full p-2 bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <label className="text-white text-sm font-medium mb-2 block">Total Sale (Lts.)</label>
                  <input
                    type="number"
                    className="w-full p-2 bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-center mt-6">
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-12 py-3 text-lg font-medium rounded-lg">
              SAVE
            </button>
          </div>
        </div>

        {/* Data Table Section */}
        <div className="bg-white border rounded-lg">
          {/* Tabs */}
          <div className="flex border-b">
            {['TANK-1', 'TANK-2', 'TANK-3'].map((tab) => (
              <button
                key={tab}
                className={`px-6 py-3 font-medium ${
                  tab === 'TANK-1'
                    ? 'bg-blue-900 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Table Controls */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Show</span>
                  <select className="border border-gray-300 rounded px-3 py-1 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>All entries</option>
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                    <option>100</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Search:</label>
                <input
                  type="text"
                  placeholder="Search records..."
                  className="border border-gray-300 rounded px-3 py-1 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="border border-gray-300 rounded px-3 py-1 hover:bg-gray-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-1">
                      S.No
                      <div className="flex flex-col">
                        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-1">
                      Dump Date
                      <div className="flex flex-col">
                        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-1">
                      Tank
                      <div className="flex flex-col">
                        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-1">
                      Before Dip
                      <div className="flex flex-col">
                        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-1">
                      Before Stock
                      <div className="flex flex-col">
                        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-1">
                      Receipt
                      <div className="flex flex-col">
                        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-1">
                      Gross Stock
                      <div className="flex flex-col">
                        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-1">
                      Tanker Sale
                      <div className="flex flex-col">
                        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-1">
                      Variation
                      <div className="flex flex-col">
                        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-1">
                      View
                      <div className="flex flex-col">
                        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-1">
                      Balance
                      <div className="flex flex-col">
                        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-1">
                      Details
                      <div className="flex flex-col">
                        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                    No data available in table
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t bg-gray-50">
            <div className="text-sm text-gray-700">
              Showing 0 to 0 of 0 entries
            </div>
            <div className="flex items-center gap-2">
              <button className="border border-gray-300 rounded px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50" disabled>
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              
              <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">1</button>
              
              <button className="border border-gray-300 rounded px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50" disabled>
                Next
                <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

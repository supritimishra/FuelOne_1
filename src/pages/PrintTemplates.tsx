export default function PrintTemplates() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="text-center space-y-6 p-12">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 mb-4">
          <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-800">Print Templates</h1>
        <p className="text-xl text-gray-600 max-w-md mx-auto">
          Custom print template management coming soon
        </p>
        <div className="pt-4">
          <span className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg shadow-lg">
            Coming Soon
          </span>
        </div>
        <p className="text-sm text-gray-500 pt-4">
          This feature will allow you to create and manage custom print templates for invoices, receipts, and reports.
        </p>
      </div>
    </div>
  );
}

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Food Establishment Permit Application
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Chelan-Douglas Health District
          </p>
          <p className="text-lg text-gray-500">
            Voice-Driven Application System - Proof of Concept
          </p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Web Form Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-blue-500">
            <div className="mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Apply via Web Form
              </h2>
              <p className="text-gray-600 mb-6">
                Fill out the permit application using our simple web form. Perfect if you prefer typing over speaking.
              </p>
            </div>
            <ul className="space-y-2 mb-6 text-sm text-gray-600">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Type at your own pace
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save and continue later
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Works on any device
              </li>
            </ul>
            <Link
              href="/apply"
              className="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Start Application →
            </Link>
          </div>

          {/* Voice Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-purple-500">
            <div className="mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Apply by Voice Call
              </h2>
              <p className="text-gray-600 mb-6">
                Call us and complete your application by voice while watching it fill out in real-time on your phone!
              </p>
            </div>
            <ul className="space-y-2 mb-6 text-sm text-gray-600">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Just speak your answers
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                See form update live
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                No typing required
              </li>
            </ul>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800 font-medium mb-2">
                Coming in Phase 3!
              </p>
              <p className="text-xs text-purple-600">
                Voice integration with real-time mobile sync is currently in development.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            How the Voice System Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Call the Number</h3>
              <p className="text-sm text-gray-600">
                Dial (509) 555-1234 from any phone
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Speak Your Answers</h3>
              <p className="text-sm text-gray-600">
                Our AI agent asks questions, you speak your answers
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Watch It Fill Out</h3>
              <p className="text-sm text-gray-600">
                See the form populate in real-time on your mobile device
              </p>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">About This System</h3>
          <p className="text-sm text-gray-600 mb-4">
            This is a proof-of-concept system demonstrating voice-driven form completion with real-time mobile UI synchronization. The goal is to make permit applications more accessible to users who prefer voice interaction or have accessibility needs.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700 mb-1">Phase 1 (Current)</p>
              <p className="text-gray-600">Basic web form working ✓</p>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">Phase 2</p>
              <p className="text-gray-600">Real-time mobile sync</p>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">Phase 3</p>
              <p className="text-gray-600">Voice integration</p>
            </div>
          </div>
        </div>

        {/* Admin Link */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-800 mb-3">
            <strong>Health District Staff:</strong> View all submitted applications
          </p>
          <Link
            href="/admin"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            🔐 Admin Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}

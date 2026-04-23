import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createTicket } from '../api/apiClient';
import { CheckCircle2, Loader2, AlertCircle, Send, Phone, Building, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';
import logoUrl from '../assets/logo.png';

const CustomerPortal = () => {
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('SOFTWARE');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    
    if (!user && (!name.trim() || !email.trim())) {
      setError("Please provide your name and email.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await createTicket({
        title: `[${category}] ${title}`,
        description: `Contact Phone: ${phone || 'N/A'}\nCompany: ${company || 'N/A'}\n\n${description}`,
        priority: 'MEDIUM', // Default priority, agent can update later
        ...(user ? {} : { reporterName: name, reporterEmail: email })
      });
      setIsSuccess(true);
      setTitle('');
      setDescription('');
      setCategory('SOFTWARE');
      setName('');
      setEmail('');
      setPhone('');
      setCompany('');
    } catch (err: any) {
      console.error("Failed to create ticket:", err);
      setError(err.response?.data?.message || "An error occurred while submitting your request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col justify-between bg-slate-50">
        <div className="max-w-3xl mx-auto w-full px-4 py-24">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-12 text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-4xl font-bold text-slate-800 mb-4">Request Received!</h2>
            <p className="text-lg text-slate-600 mb-10 max-w-lg mx-auto">
              Thank you for reaching out. Your support ticket has been created successfully. Our team will review it and get back to you shortly.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => setIsSuccess(false)}
                className="px-8 py-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Submit Another Request
              </button>
              {user && (
                <Link 
                  to={user.role === 'CUSTOMER' ? "/my-tickets" : "/staff/dashboard"}
                  className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
                >
                  Track My Ticket
                </Link>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col justify-between bg-slate-50">
      
      {/* Hero Section */}
      <div className="bg-slate-900 pt-16 pb-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-[-10%] w-[50%] h-[100%] bg-blue-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-30"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[100%] bg-purple-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-30"></div>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            How can we help you today?
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
            Submit a detailed request below. Our expert support team is ready to assist you and ensure your operations run smoothly.
          </p>
        </div>
      </div>

      {/* Main Form Section */}
      <div className="max-w-4xl mx-auto px-4 w-full -mt-20 relative z-20 mb-24">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>
          <form onSubmit={handleSubmit} className="p-6 md:p-12">
            
            {!user && (
              <div className="mb-10 p-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-4 shadow-sm">
                <div className="text-blue-500 mt-1"><AlertCircle size={24} /></div>
                <div>
                  <h3 className="font-bold text-blue-900 text-lg">Submit as Guest</h3>
                  <p className="text-blue-700 mt-1 leading-relaxed">
                    You are currently not logged in. Please provide accurate contact details so our agents can reach you. For automatic tracking, consider <Link to="/login" className="font-bold underline hover:text-blue-900">logging into your account</Link>.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-10 p-5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 shadow-sm">
                <AlertCircle size={20} className="text-red-500 mt-0.5 shrink-0" />
                <p className="font-medium text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              
              <div className="col-span-1 md:col-span-2 pb-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-2">1. Request Details</h3>
                <p className="text-slate-500 text-sm">Tell us what you need help with.</p>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Issue Summary <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cannot connect to corporate VPN"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-800 placeholder:text-slate-400 font-medium"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <LayoutGrid size={18} />
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-800 font-medium appearance-none cursor-pointer"
                  >
                    <option value="SOFTWARE">Software & Applications</option>
                    <option value="HARDWARE">Hardware & Devices</option>
                    <option value="NETWORK">Network & Connectivity</option>
                    <option value="ACCESS">Access & Authentication</option>
                    <option value="OTHER">Other Request</option>
                  </select>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe the issue in as much detail as possible. Steps to reproduce, error messages, etc."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-800 placeholder:text-slate-400 resize-none font-medium leading-relaxed"
                ></textarea>
              </div>

              {!user && (
                <>
                  <div className="col-span-1 md:col-span-2 pb-6 pt-4 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">2. Contact Information</h3>
                    <p className="text-slate-500 text-sm">How can we reach you regarding this ticket?</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-800 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@company.com"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-800 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Phone size={18} />
                      </div>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-800 font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Company / Organization (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Building size={18} />
                      </div>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Acme Corp"
                        className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-800 font-medium"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              <p className="text-sm text-slate-500">
                By submitting this request, you agree to our Terms of Service and Privacy Policy.
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 bg-slate-900 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-70 disabled:pointer-events-none w-full sm:w-auto shrink-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    <span>Submit Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

// Footer Component
const Footer = () => (
  <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="md:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold text-slate-900">ServiceDesk</span>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Enterprise-grade IT service management and customer support platform powered by AI.
          </p>
        </div>
        
        <div>
          <h4 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-xs">Resources</h4>
          <ul className="space-y-3">
            <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors">Documentation</a></li>
            <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors">Knowledge Base</a></li>
            <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors">API Reference</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-xs">Company</h4>
          <ul className="space-y-3">
            <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors">About Us</a></li>
            <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors">Contact</a></li>
            <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors">Careers</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-xs">Legal</h4>
          <ul className="space-y-3">
            <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors">Terms of Service</a></li>
            <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors">Security</a></li>
          </ul>
        </div>
      </div>
      
      <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-slate-400 text-sm font-medium">
          © {new Date().getFullYear()} ServiceDesk Inc. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors">Twitter</a>
          <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors">LinkedIn</a>
          <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors">GitHub</a>
        </div>
      </div>
    </div>
  </footer>
);

export default CustomerPortal;

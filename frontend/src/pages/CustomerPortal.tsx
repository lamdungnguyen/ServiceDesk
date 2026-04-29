import { useState, useRef } from 'react';
import { useAuth } from '../context/auth';
import { createTicket, getErrorMessage } from '../api/apiClient';
import { CheckCircle2, Loader2, AlertCircle, Send, Phone, Building, LayoutGrid, Paperclip, X, Image as ImageIcon, FileVideo } from 'lucide-react';
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
  
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

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
      // Create ticket payload
      let finalDescription = description;
      if (files.length > 0) {
        finalDescription += `\n\n[Attachments: ${files.map(f => f.name).join(', ')}] (Saved locally)`;
      }
      if (phone || company) {
        finalDescription = `Contact Phone: ${phone || 'N/A'}\nCompany: ${company || 'N/A'}\n\n` + finalDescription;
      }

      await createTicket({
        title: `[${category}] ${title}`,
        description: finalDescription,
        priority: 'MEDIUM', // Default priority
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
      setFiles([]);
    } catch (err: unknown) {
      console.error("Failed to create ticket:", err);
      setError(getErrorMessage(err, "An error occurred while submitting your request."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col justify-between bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="max-w-3xl mx-auto w-full px-4 py-24">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700/50 p-12 text-center animate-in zoom-in-95 duration-500 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
            <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-emerald-100 dark:border-emerald-500/20">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-4xl font-bold text-slate-800 dark:text-white mb-4">Request Received!</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-lg mx-auto">
              Thank you for reaching out. Your support ticket has been created successfully. Our team will review it and get back to you shortly.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => setIsSuccess(false)}
                className="px-8 py-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors focus:ring-4 focus:ring-slate-200 dark:focus:ring-slate-700"
              >
                Submit Another Request
              </button>
              {user && (
                <Link 
                  to={user.role === 'CUSTOMER' ? "/my-tickets" : "/staff/dashboard"}
                  className="px-8 py-4 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl font-bold hover:from-primary-700 hover:to-indigo-700 transition-all shadow-lg shadow-primary-500/30 active:scale-95 transform"
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
    <div className="min-h-[calc(100vh-64px)] flex flex-col justify-between bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* Hero Section */}
      <div className="bg-slate-50 dark:bg-slate-950 pt-20 pb-40 px-4 relative overflow-hidden transition-colors duration-300">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[120%] bg-primary-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[150px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[120%] bg-indigo-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6 leading-tight drop-shadow-sm transition-colors duration-300">
            How can we <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400 drop-shadow-sm">help you</span> today?
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-light leading-relaxed transition-colors duration-300">
            Submit a detailed request below. Our expert support team is ready to assist you and ensure your operations run smoothly.
          </p>
        </div>
      </div>

      {/* Main Form Section */}
      <div className="max-w-4xl mx-auto px-4 w-full -mt-28 relative z-20 mb-24">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-700/50 overflow-hidden backdrop-blur-xl">
          <div className="h-2 w-full bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-500"></div>
          
          <form onSubmit={handleSubmit} className="p-8 md:p-14">
            
            {!user && (
              <div className="mb-10 p-6 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl flex items-start gap-4 shadow-sm backdrop-blur-sm">
                <div className="text-indigo-500 dark:text-indigo-400 mt-1"><AlertCircle size={24} /></div>
                <div>
                  <h3 className="font-bold text-indigo-900 dark:text-indigo-300 text-lg">Submit as Guest</h3>
                  <p className="text-indigo-700 dark:text-indigo-400 mt-1 leading-relaxed text-sm">
                    You are currently not logged in. Please provide accurate contact details so our agents can reach you. For automatic tracking and a better experience, consider <Link to="/login" className="font-bold underline hover:text-indigo-900 dark:hover:text-indigo-200 transition-colors">logging into your account</Link>.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-10 p-5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-2xl flex items-start gap-3 shadow-sm">
                <AlertCircle size={20} className="text-red-500 mt-0.5 shrink-0" />
                <p className="font-medium text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              
              {/* Section 1: Request Details */}
              <div className="col-span-1 md:col-span-2 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm">1</div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Request Details</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm ml-11">Tell us what you need help with.</p>
              </div>

              <div className="col-span-1 md:col-span-2 group">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400 transition-colors">
                  Issue Summary <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cannot connect to corporate VPN"
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-400 font-medium shadow-sm"
                />
              </div>

              <div className="col-span-1 md:col-span-2 group">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400 transition-colors">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
                    <LayoutGrid size={18} />
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-slate-800 dark:text-slate-200 font-medium appearance-none cursor-pointer shadow-sm"
                  >
                    <option value="SOFTWARE">Software & Applications</option>
                    <option value="HARDWARE">Hardware & Devices</option>
                    <option value="NETWORK">Network & Connectivity</option>
                    <option value="ACCESS">Access & Authentication</option>
                    <option value="OTHER">Other Request</option>
                  </select>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 group">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400 transition-colors">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe the issue in as much detail as possible. Steps to reproduce, error messages, etc."
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-400 resize-none font-medium leading-relaxed shadow-sm"
                ></textarea>
              </div>

              {/* Section 2: Attachments */}
              <div className="col-span-1 md:col-span-2 pb-4 pt-6 border-b border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm">2</div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Attachments</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm ml-11">Upload images or videos to help us understand the issue better.</p>
              </div>

              <div className="col-span-1 md:col-span-2">
                <div 
                  className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Paperclip size={28} className="text-slate-400 dark:text-slate-500 group-hover:text-primary-500 transition-colors" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Click to upload or drag and drop</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">SVG, PNG, JPG, GIF or MP4 (max. 10MB)</p>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*,video/*"
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </div>

                {files.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {files.map((file, index) => {
                      const isImage = file.type.startsWith('image/');
                      return (
                        <div key={index} className="flex items-center p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm group animate-in slide-in-from-bottom-2">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isImage ? 'bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400' : 'bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400'}`}>
                            {isImage ? <ImageIcon size={20} /> : <FileVideo size={20} />}
                          </div>
                          <div className="ml-3 flex-1 overflow-hidden">
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{file.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors ml-2"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 3: Contact Information */}
              {!user && (
                <>
                  <div className="col-span-1 md:col-span-2 pb-4 pt-6 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm">3</div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">Contact Information</h3>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm ml-11">How can we reach you regarding this ticket?</p>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400 transition-colors">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-slate-800 dark:text-slate-200 font-medium shadow-sm"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400 transition-colors">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@company.com"
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-slate-800 dark:text-slate-200 font-medium shadow-sm"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400 transition-colors">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
                        <Phone size={18} />
                      </div>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-slate-800 dark:text-slate-200 font-medium shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400 transition-colors">
                      Company / Organization (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
                        <Building size={18} />
                      </div>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Acme Corp"
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-slate-800 dark:text-slate-200 font-medium shadow-sm"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="pt-10 border-t border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                By submitting this request, you agree to our Terms of Service and Privacy Policy.
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-3 bg-gradient-to-r from-primary-600 to-indigo-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:from-primary-700 hover:to-indigo-700 transition-all shadow-[0_10px_20px_-10px_rgba(79,70,229,0.5)] active:scale-95 disabled:opacity-70 disabled:pointer-events-none w-full sm:w-auto shrink-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={22} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Send size={22} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
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
  <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8 transition-colors duration-300">
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="md:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold text-slate-900 dark:text-white">ServiceDesk</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
            Enterprise-grade IT service management and customer support platform powered by AI.
          </p>
        </div>
        
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider text-xs">Resources</h4>
          <ul className="space-y-3">
            <li><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm font-medium transition-colors">Documentation</a></li>
            <li><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm font-medium transition-colors">Knowledge Base</a></li>
            <li><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm font-medium transition-colors">API Reference</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider text-xs">Company</h4>
          <ul className="space-y-3">
            <li><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm font-medium transition-colors">About Us</a></li>
            <li><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm font-medium transition-colors">Contact</a></li>
            <li><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm font-medium transition-colors">Careers</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider text-xs">Legal</h4>
          <ul className="space-y-3">
            <li><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm font-medium transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm font-medium transition-colors">Terms of Service</a></li>
            <li><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm font-medium transition-colors">Security</a></li>
          </ul>
        </div>
      </div>
      
      <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-slate-400 text-sm font-medium">
          © {new Date().getFullYear()} ServiceDesk Inc. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <a href="#" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Twitter</a>
          <a href="#" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">LinkedIn</a>
          <a href="#" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">GitHub</a>
        </div>
      </div>
    </div>
  </footer>
);

export default CustomerPortal;

import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { UserPlus, Check, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

// SA Council Regions
const SA_COUNCIL_REGIONS = [
  'Adelaide City Council',
  'Adelaide Hills Council',
  'Alexandrina Council',
  'Barossa Council',
  'Barunga West Council',
  'Berri Barmera Council',
  'Campbelltown City Council',
  'Cedar Valley Council',
  'Charles Sturt City Council',
  'Clare and Gilbert Valleys Council',
  'Cleve District Council',
  'Coober Pedy District Council',
  'Coorong District Council',
  'Copper Coast Council',
  'Elliston District Council',
  'Flinders Ranges Council',
  'Franklin Harbour Council',
  'Gawler Town Council',
  'Goyder Regional Council',
  'Grant District Council',
  'Holdfast Bay City Council',
  'Kangaroo Island Council',
  'Karoonda East Murray Council',
  'Kimba District Council',
  'Kingston District Council',
  'Light Regional Council',
  'Lower Eyre Peninsula Council',
  'Loxton Waikerie Council',
  'Mallala District Council',
  'Marion City Council',
  'Mid Murray Council',
  'Mitcham City Council',
  'Mount Barker District Council',
  'Mount Gambier City Council',
  'Mount Remarkable District Council',
  'Murray Bridge Rural City Council',
  'Naracoorte Lucindale Council',
  'Northern Areas Council',
  'Norwood Payneham and St Peters City Council',
  'Onkaparinga City Council',
  'Orroroo Carrieton District Council',
  'Peterborough District Council',
  'Playford City Council',
  'Port Adelaide Enfield City Council',
  'Port Augusta City Council',
  'Port Lincoln City Council',
  'Port Pirie City and Districts Council',
  'Prospect City Council',
  'Renmark Paringa Council',
  'Robe District Council',
  'Roxby Downs Municipality',
  'Salisbury City Council',
  'Southern Mallee District Council',
  'Streaky Bay District Council',
  'Tatiara District Council',
  'Tea Tree Gully City Council',
  'The Coorong District Council',
  'Tumby Bay District Council',
  'Unley City Council',
  'Victor Harbor City Council',
  'Wakefield Regional Council',
  'Walkerville Town Council',
  'Wattle Range Council',
  'West Torrens City Council',
  'Whyalla City Council',
  'Wudinna District Council',
  'Yankalilla District Council',
  'Yorke Peninsula Council'
];

// Adelaide Hills Townships
const ADELAIDE_HILLS_TOWNSHIPS = [
  'Aldgate',
  'Balhannah',
  'Bridgewater',
  'Carey Gully',
  'Charleston',
  'Crafers',
  'Echunga',
  'Forreston',
  'Gumeracha',
  'Hahndorf',
  'Heathfield',
  'Lobethal',
  'Lenswood',
  'Macclesfield',
  'Meadows',
  'Mount Barker',
  'Mylor',
  'Nairne',
  'Norton Summit',
  'Oakbank',
  'Piccadilly',
  'Stirling',
  'Strathalbyn',
  'Summertown',
  'Uraidla',
  'Verdun',
  'Woodside',
  'Other'
];

// Generate day options (1-31)
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

// Month options
const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
];

// Generate year options (1920 to current year)
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1919 }, (_, i) => currentYear - i);

export default function AddParticipant() {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    dobMonth: '',
    dobDay: '',
    dobYear: '',
    addressLine1: '',
    addressLine2: '',
    township: '',
    townshipOther: '',
    postCode: '',
    councilRegion: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    additionalRequirements: ''
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Validate date of birth fields
      if (!formData.dobMonth || !formData.dobDay || !formData.dobYear) {
        throw new Error('Please select a complete date of birth');
      }

      // Construct date of birth
      const dateOfBirth = `${formData.dobYear}-${formData.dobMonth}-${formData.dobDay.padStart(2, '0')}`;

      // Determine final township value
      const finalTownship = formData.township === 'Other' ? formData.townshipOther : formData.township;

      const { data, error: supabaseError } = await supabase
        .from('participants')
        .insert([
          {
            first_name: formData.firstName,
            last_name: formData.lastName,
            gender: formData.gender,
            email: formData.email,
            phone: formData.phone,
            date_of_birth: dateOfBirth,
            address_line1: formData.addressLine1,
            address_line2: formData.addressLine2,
            township: formData.township,
            township_other: formData.township === 'Other' ? formData.townshipOther : null,
            post_code: formData.postCode,
            council_region: formData.councilRegion,
            emergency_contact_name: formData.emergencyContactName,
            emergency_contact_phone: formData.emergencyContactPhone,
            additional_requirements: formData.additionalRequirements
          }
        ])
        .select();

      if (supabaseError) throw supabaseError;

      console.log('New participant added:', data);
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Error adding participant:', err);
      setError(err.message || 'Failed to add participant. Please check your database connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (showSuccess) {
    return (
      <Layout title="Add New Participant">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-50 border-4 border-green-400 rounded-2xl p-12 md:p-16 text-center shadow-xl">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-600 rounded-full mb-6">
              <Check size={48} className="text-white" strokeWidth={3} />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-green-900 mb-4">
              Success!
            </h3>
            <p className="text-xl text-green-700 font-semibold">
              Participant has been added
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Add New Participant">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border-4 border-green-200">
          <div className="flex items-center gap-4 mb-8 bg-green-50 p-5 rounded-xl">
            <div className="p-3 bg-green-600 rounded-lg">
              <UserPlus size={32} className="text-white" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
              Registration Form
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-4 border-red-400 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle size={24} className="text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-lg font-bold text-red-900 mb-1">Error</h4>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Personal Information */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <h4 className="text-xl font-bold text-gray-900 mb-5">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="firstName" className="block text-lg font-bold text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-green-500 focus:border-green-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-lg font-bold text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-green-500 focus:border-green-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-lg font-bold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-green-500 focus:border-green-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-lg font-bold text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-green-500 focus:border-green-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="gender" className="block text-lg font-bold text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-green-500 focus:border-green-500 outline-none"
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="Man">Man</option>
                    <option value="Woman">Woman</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="dateOfBirth" className="block text-lg font-bold text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="dobMonth"
                      value={formData.dobMonth}
                      onChange={(e) => handleChange('dobMonth', e.target.value)}
                      className="flex-1 px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-green-500 focus:border-green-500 outline-none"
                      required
                    >
                      <option value="">Month</option>
                      {MONTHS.map(month => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                      ))}
                    </select>
                    <select
                      id="dobDay"
                      value={formData.dobDay}
                      onChange={(e) => handleChange('dobDay', e.target.value)}
                      className="flex-1 px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-green-500 focus:border-green-500 outline-none"
                      required
                    >
                      <option value="">Day</option>
                      {DAYS.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <select
                      id="dobYear"
                      value={formData.dobYear}
                      onChange={(e) => handleChange('dobYear', e.target.value)}
                      className="flex-1 px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-green-500 focus:border-green-500 outline-none"
                      required
                    >
                      <option value="">Year</option>
                      {YEARS.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="addressLine1" className="block text-lg font-bold text-gray-700 mb-2">
                    Address Line 1 *
                  </label>
                  <input
                    id="addressLine1"
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => handleChange('addressLine1', e.target.value)}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-green-500 focus:border-green-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="addressLine2" className="block text-lg font-bold text-gray-700 mb-2">
                    Address Line 2
                  </label>
                  <input
                    id="addressLine2"
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) => handleChange('addressLine2', e.target.value)}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="township" className="block text-lg font-bold text-gray-700 mb-2">
                    Township *
                  </label>
                  <select
                    id="township"
                    value={formData.township}
                    onChange={(e) => handleChange('township', e.target.value)}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-green-500 focus:border-green-500 outline-none"
                    required
                  >
                    <option value="">Select township</option>
                    {ADELAIDE_HILLS_TOWNSHIPS.map(township => (
                      <option key={township} value={township}>{township}</option>
                    ))}
                  </select>
                </div>

                {formData.township === 'Other' && (
                  <div>
                    <label htmlFor="townshipOther" className="block text-lg font-bold text-gray-700 mb-2">
                      If you chose other, input your township here *
                    </label>
                    <input
                      id="townshipOther"
                      type="text"
                      value={formData.townshipOther}
                      onChange={(e) => handleChange('townshipOther', e.target.value)}
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-green-500 focus:border-green-500 outline-none"
                      required
                      placeholder="Enter your township"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="postCode" className="block text-lg font-bold text-gray-700 mb-2">
                    Post Code *
                  </label>
                  <input
                    id="postCode"
                    type="text"
                    value={formData.postCode}
                    onChange={(e) => handleChange('postCode', e.target.value)}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-green-500 focus:border-green-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="councilRegion" className="block text-lg font-bold text-gray-700 mb-2">
                    Council Region *
                  </label>
                  <select
                    id="councilRegion"
                    value={formData.councilRegion}
                    onChange={(e) => handleChange('councilRegion', e.target.value)}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-green-500 focus:border-green-500 outline-none"
                    required
                  >
                    <option value="">Select a region</option>
                    {SA_COUNCIL_REGIONS.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-orange-50 p-6 rounded-xl border-2 border-orange-200">
              <h4 className="text-xl font-bold text-gray-900 mb-5">Emergency Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="emergencyContactName" className="block text-lg font-bold text-gray-700 mb-2">
                    Contact Name *
                  </label>
                  <input
                    id="emergencyContactName"
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="emergencyContactPhone" className="block text-lg font-bold text-gray-700 mb-2">
                    Contact Phone *
                  </label>
                  <input
                    id="emergencyContactPhone"
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="additionalRequirements" className="block text-lg font-bold text-gray-700 mb-2">
                    Additional Requirements
                  </label>
                  <textarea
                    id="additionalRequirements"
                    value={formData.additionalRequirements}
                    onChange={(e) => handleChange('additionalRequirements', e.target.value)}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    rows={3}
                    placeholder="Please enter any disabilities, special requirements, or other relevant information..."
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-teal-400"
              >
                Save Participant
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="sm:w-auto px-8 py-5 border-4 border-gray-400 text-gray-700 rounded-xl text-xl font-bold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
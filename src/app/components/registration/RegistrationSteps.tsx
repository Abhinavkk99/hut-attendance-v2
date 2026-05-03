import { 
  SA_COUNCIL_REGIONS, 
  ADELAIDE_HILLS_TOWNSHIPS, 
  DAYS, 
  MONTHS, 
  YEARS,
  COUNTRIES 
} from '../../utils/constants';
import { Check, X, Plus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface GeneralInfoStepProps {
  formData: any;
  handleChange: (field: string, value: any) => void;
}

export function GeneralInfoStep({ formData, handleChange }: GeneralInfoStepProps) {
  const [emailExists, setEmailExists] = useState(false);

  useEffect(() => {
    const checkEmail = async () => {
      if (formData.email) {
        const { data, error } = await supabase
          .from('registrations')
          .select('email')
          .eq('email', formData.email)
          .single();

        if (data) {
          setEmailExists(true);
        } else {
          setEmailExists(false);
        }
      }
    };

    checkEmail();
  }, [formData.email]);

  return (
    <div className="space-y-8">
      {/* Personal Information Section */}
      <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200">
        <h4 className="text-xl font-bold text-blue-900 mb-4">Personal Information</h4>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-lg font-bold text-gray-700 mb-2">
                Title
              </label>
              <select
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select title</option>
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Ms">Ms</option>
                <option value="Miss">Miss</option>
                <option value="Dr">Dr</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-700 mb-2">
                Given Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                placeholder="Enter given name"
              />
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-700 mb-2">
                Last Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-700 mb-2">
              Email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
              placeholder="Enter email address"
            />
            {emailExists && <p className="text-red-500 text-sm">Email already exists. Please use a different email.</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-lg font-bold text-gray-700 mb-2">
                Home Tel
              </label>
              <input
                type="tel"
                value={formData.homeTel}
                onChange={(e) => handleChange('homeTel', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                placeholder="Home telephone"
              />
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-700 mb-2">
                Mobile Tel <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                placeholder="Mobile telephone"
              />
            </div>
          </div>
        </div>

        {/* Gender */}
        <div className="mt-6">
          <label className="block text-lg font-bold text-gray-700 mb-2">
            Gender <span className="text-red-600">*</span>
          </label>
          <select
            value={formData.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select gender</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="I use a different term">I use a different term</option>
          </select>
        </div>

        {/* Conditional Gender Other Input */}
        {formData.gender === 'I use a different term' && (
          <div className="mt-4">
            <label className="block text-lg font-bold text-gray-700 mb-2">
              Please specify <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.genderOther}
              onChange={(e) => handleChange('genderOther', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
              placeholder="Enter your gender identity"
            />
          </div>
        )}

        {/* Date of Birth */}
        <div className="mt-6">
          <label className="block text-lg font-bold text-gray-700 mb-2">
            Date of Birth <span className="text-red-600">*</span>
          </label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Day</label>
              <select
                value={formData.dobDay}
                onChange={(e) => handleChange('dobDay', e.target.value)}
                className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="">Day</option>
                {DAYS.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Month</label>
              <select
                value={formData.dobMonth}
                onChange={(e) => handleChange('dobMonth', e.target.value)}
                className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="">Month</option>
                {MONTHS.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Year</label>
              <select
                value={formData.dobYear}
                onChange={(e) => handleChange('dobYear', e.target.value)}
                className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="">Year</option>
                {YEARS.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Home Address Section */}
      <div className="bg-green-50 p-6 rounded-xl border-2 border-green-200">
        <h4 className="text-xl font-bold text-green-900 mb-4">Home Address</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-lg font-bold text-gray-700 mb-2">
              Address Line 1 <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.addressLine1}
              onChange={(e) => handleChange('addressLine1', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
              placeholder="Street address"
            />
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-700 mb-2">
              Address Line 2
            </label>
            <input
              type="text"
              value={formData.addressLine2}
              onChange={(e) => handleChange('addressLine2', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
              placeholder="Apartment, suite, etc. (optional)"
            />
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-700 mb-2">
              Township <span className="text-red-600">*</span>
            </label>
            <select
              value={formData.township}
              onChange={(e) => handleChange('township', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select township</option>
              {ADELAIDE_HILLS_TOWNSHIPS.map(township => (
                <option key={township} value={township}>{township}</option>
              ))}
            </select>
          </div>

          {/* Conditional Township Other Input */}
          {formData.township === 'Other' && (
            <div>
              <label className="block text-lg font-bold text-gray-700 mb-2">
                Please specify township <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.townshipOther}
                onChange={(e) => handleChange('townshipOther', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                placeholder="Enter your township"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-lg font-bold text-gray-700 mb-2">
                Post Code <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.postCode}
                onChange={(e) => handleChange('postCode', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                placeholder="Enter post code"
              />
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-700 mb-2">
                Council Region <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.councilRegion}
                onChange={(e) => handleChange('councilRegion', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select a region</option>
                {SA_COUNCIL_REGIONS.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Postal Address Section */}
      <div className="bg-purple-50 p-6 rounded-xl border-2 border-purple-200">
        <h4 className="text-xl font-bold text-purple-900 mb-4">Postal Address (if different)</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-lg font-bold text-gray-700 mb-2">
              Postal Address Line 1
            </label>
            <input
              type="text"
              value={formData.postalAddressLine1}
              onChange={(e) => handleChange('postalAddressLine1', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
              placeholder="Postal street address (optional)"
            />
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-700 mb-2">
              Postal Address Line 2
            </label>
            <input
              type="text"
              value={formData.postalAddressLine2}
              onChange={(e) => handleChange('postalAddressLine2', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
              placeholder="Postal apartment, suite, etc. (optional)"
            />
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-700 mb-2">
              Postal Post Code
            </label>
            <input
              type="text"
              value={formData.postalPostcode}
              onChange={(e) => handleChange('postalPostcode', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
              placeholder="Postal post code (optional)"
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact Section */}
      <div className="bg-red-50 p-6 rounded-xl border-2 border-red-200">
        <h4 className="text-xl font-bold text-red-900 mb-4">Emergency Details</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-lg font-bold text-gray-700 mb-2">
              Emergency Contact First Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.emergencyContactFirstName}
              onChange={(e) => handleChange('emergencyContactFirstName', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
              placeholder="First name"
            />
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-700 mb-2">
              Emergency Contact Last Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.emergencyContactLastName}
              onChange={(e) => handleChange('emergencyContactLastName', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
              placeholder="Last name"
            />
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-700 mb-2">
              Emergency Contact Phone <span className="text-red-600">*</span>
            </label>
            <input
              type="tel"
              value={formData.emergencyContactPhone}
              onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
              placeholder="Phone number"
            />
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-700 mb-2">
              Relationship
            </label>
            <input
              type="text"
              value={formData.emergencyContactRelationship}
              onChange={(e) => handleChange('emergencyContactRelationship', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
              placeholder="e.g., Spouse, Parent, Friend"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-lg font-bold text-gray-700 mb-2">
              Emergency Contact Address
            </label>
            <input
              type="text"
              value={formData.emergencyContactAddress}
              onChange={(e) => handleChange('emergencyContactAddress', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
              placeholder="Full address (optional)"
            />
          </div>
        </div>
      </div>

      {/* Cultural Background Section */}
      <div className="bg-yellow-50 p-6 rounded-xl border-2 border-yellow-200">
        <h4 className="text-xl font-bold text-yellow-900 mb-4">Cultural Background (Optional)</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-lg font-bold text-gray-700 mb-2">
              Do you identify as Aboriginal or Torres Strait Islander?
            </label>
            <select
              value={formData.identifyAboriginalTSI}
              onChange={(e) => handleChange('identifyAboriginalTSI', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select an option</option>
              <option value="No">No</option>
              <option value="Yes - Aboriginal">Yes - Aboriginal</option>
              <option value="Yes - Torres Strait Islander">Yes - Torres Strait Islander</option>
              <option value="Yes - Both">Yes - Both</option>
            </select>
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-700 mb-2">
              Country of Birth
            </label>
            <select
              value={formData.countryOfBirth}
              onChange={(e) => handleChange('countryOfBirth', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select country</option>
              {COUNTRIES.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-700 mb-2">
              Do you speak a language other than English at home?
            </label>
            <select
              value={formData.speakOtherLanguage}
              onChange={(e) => handleChange('speakOtherLanguage', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select an option</option>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          {formData.speakOtherLanguage === 'Yes' && (
            <div>
              <label className="block text-lg font-bold text-gray-700 mb-2">
                Please specify the language(s)
              </label>
              <input
                type="text"
                value={formData.otherLanguageDetails}
                onChange={(e) => handleChange('otherLanguageDetails', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                placeholder="Enter language(s)"
              />
            </div>
          )}

          <div>
            <label className="block text-lg font-bold text-gray-700 mb-2">
              Cultural Identity
            </label>
            <select
              value={formData.culturalIdentity}
              onChange={(e) => handleChange('culturalIdentity', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select an option</option>
              <option value="No">I do not identify with any cultural group</option>
              <option value="Yes">Yes, I identify with a cultural group</option>
            </select>
          </div>

          {formData.culturalIdentity === 'Yes' && (
            <div>
              <label className="block text-lg font-bold text-gray-700 mb-2">
                Please specify your cultural identity
              </label>
              <input
                type="text"
                value={formData.culturalIdentityDetails}
                onChange={(e) => handleChange('culturalIdentityDetails', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                placeholder="Enter cultural identity"
              />
            </div>
          )}

          <div>
            <label className="block text-lg font-bold text-gray-700 mb-2">
              Are you accessing this service as a member of the LGBTI+ community?
            </label>
            <select
              value={formData.lgbtiCommunity}
              onChange={(e) => handleChange('lgbtiCommunity', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select an option</option>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-indigo-50 p-6 rounded-xl border-2 border-indigo-200">
        <h4 className="text-xl font-bold text-indigo-900 mb-4">Communication Preferences</h4>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.receiveNewsletter}
              onChange={(e) => handleChange('receiveNewsletter', e.target.checked)}
              className="w-6 h-6 rounded border-2 border-gray-300"
            />
            <span className="text-lg font-semibold text-gray-700">
              I would like to receive newsletters
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.receiveCourseNotifications}
              onChange={(e) => handleChange('receiveCourseNotifications', e.target.checked)}
              className="w-6 h-6 rounded border-2 border-gray-300"
            />
            <span className="text-lg font-semibold text-gray-700">
              I would like to receive course/program notifications
            </span>
          </label>
        </div>
      </div>

      {/* Referral Sources Section */}
      <div className="bg-orange-50 p-6 rounded-xl border-2 border-orange-200">
        <h4 className="text-xl font-bold text-orange-900 mb-4">How did you hear about us?</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.referralBrochure}
              onChange={(e) => handleChange('referralBrochure', e.target.checked)}
              className="w-6 h-6 rounded border-2 border-gray-300"
            />
            <span className="text-lg font-semibold text-gray-700">Brochure</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.referralReferral}
              onChange={(e) => handleChange('referralReferral', e.target.checked)}
              className="w-6 h-6 rounded border-2 border-gray-300"
            />
            <span className="text-lg font-semibold text-gray-700">Referral</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.referralEmailFromHut}
              onChange={(e) => handleChange('referralEmailFromHut', e.target.checked)}
              className="w-6 h-6 rounded border-2 border-gray-300"
            />
            <span className="text-lg font-semibold text-gray-700">Email from The Hut</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.referralFamilyFriend}
              onChange={(e) => handleChange('referralFamilyFriend', e.target.checked)}
              className="w-6 h-6 rounded border-2 border-gray-300"
            />
            <span className="text-lg font-semibold text-gray-700">Family/Friend</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.referralSocialMedia}
              onChange={(e) => handleChange('referralSocialMedia', e.target.checked)}
              className="w-6 h-6 rounded border-2 border-gray-300"
            />
            <span className="text-lg font-semibold text-gray-700">Social Media (Facebook)</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.referralLocalNewspaper}
              onChange={(e) => handleChange('referralLocalNewspaper', e.target.checked)}
              className="w-6 h-6 rounded border-2 border-gray-300"
            />
            <span className="text-lg font-semibold text-gray-700">Local Newspaper</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.referralLocalNoticeboard}
              onChange={(e) => handleChange('referralLocalNoticeboard', e.target.checked)}
              className="w-6 h-6 rounded border-2 border-gray-300"
            />
            <span className="text-lg font-semibold text-gray-700">Local Noticeboard</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.referralWeb}
              onChange={(e) => handleChange('referralWeb', e.target.checked)}
              className="w-6 h-6 rounded border-2 border-gray-300"
            />
            <span className="text-lg font-semibold text-gray-700">Web</span>
          </label>
        </div>

        <div className="mt-4">
          <label className="block text-lg font-bold text-gray-700 mb-2">
            Other (please specify)
          </label>
          <input
            type="text"
            value={formData.referralOther}
            onChange={(e) => handleChange('referralOther', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
            placeholder="Please specify other referral source"
          />
        </div>
      </div>

      {/* Photo Consent Section */}
      <div className="bg-pink-50 p-6 rounded-xl border-2 border-pink-200">
        <h4 className="text-xl font-bold text-pink-900 mb-4">Photo Consent</h4>
        <p className="text-gray-700 mb-4">
          I give permission for The Hut to use photographs or video recordings of me for:
        </p>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.photoConsentWebsite}
              onChange={(e) => handleChange('photoConsentWebsite', e.target.checked)}
              className="w-6 h-6 rounded border-2 border-gray-300"
            />
            <span className="text-lg font-semibold text-gray-700">Website</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.photoConsentSocialMedia}
              onChange={(e) => handleChange('photoConsentSocialMedia', e.target.checked)}
              className="w-6 h-6 rounded border-2 border-gray-300"
            />
            <span className="text-lg font-semibold text-gray-700">Social Media</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.photoConsentAnnualReport}
              onChange={(e) => handleChange('photoConsentAnnualReport', e.target.checked)}
              className="w-6 h-6 rounded border-2 border-gray-300"
            />
            <span className="text-lg font-semibold text-gray-700">Annual Report</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.photoConsentBrochures}
              onChange={(e) => handleChange('photoConsentBrochures', e.target.checked)}
              className="w-6 h-6 rounded border-2 border-gray-300"
            />
            <span className="text-lg font-semibold text-gray-700">Brochures and Flyers</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.photoConsentLocalMedia}
              onChange={(e) => handleChange('photoConsentLocalMedia', e.target.checked)}
              className="w-6 h-6 rounded border-2 border-gray-300"
            />
            <span className="text-lg font-semibold text-gray-700">Local Media</span>
          </label>
        </div>
      </div>
    </div>
  );
}

interface ProgramSelectionStepProps {
  selectedPrograms: string[];
  onToggleProgram: (programId: string) => void;
}

export function ProgramSelectionStep({ selectedPrograms, onToggleProgram }: ProgramSelectionStepProps) {
  const [programs, setPrograms] = useState<Array<{ id: string; name: string; description: string; color: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      // Map database programs to our format with colors and categories
      const mappedPrograms = (data || []).map((prog) => ({
        id: prog.id,
        name: prog.name,
        description: prog.description || 'Program details',
        color: 'blue' // Will be assigned based on category
      }));

      setPrograms(mappedPrograms);
    } catch (err) {
      console.error('Error fetching programs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Categorize programs
  const childrenProgramNames = [
    'Outdoor Playgroup',
    'Homework Club',
    'Dungeons & Dragons',
    'Intergenerational Mentoring'
  ];

  const fitnessProgramNames = [
    'Community Fun Fitness',
    'Strength & Balance (Stirling)',
    'Chi Kung',
    'Walking Group',
    "Men's Moves"
  ];

  const childrenPrograms = programs.filter(p => childrenProgramNames.includes(p.name));
  const fitnessPrograms = programs.filter(p => fitnessProgramNames.includes(p.name));
  const genericPrograms = programs.filter(p =>
    !childrenProgramNames.includes(p.name) && !fitnessProgramNames.includes(p.name)
  );

  const colorClasses = {
    purple: { bg: 'bg-purple-50', border: 'border-purple-300', selected: 'border-purple-600 bg-purple-100' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-300', selected: 'border-orange-600 bg-orange-100' },
    green: { bg: 'bg-green-50', border: 'border-green-300', selected: 'border-green-600 bg-green-100' }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-600">Loading programs...</p>
        </div>
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="bg-yellow-50 p-8 rounded-xl border-4 border-yellow-200 text-center">
        <p className="text-xl font-bold text-yellow-900 mb-2">No Programs Available</p>
        <p className="text-lg text-yellow-700">
          Please contact staff to add programs before registering.
        </p>
      </div>
    );
  }

  const renderProgramCard = (program: any, categoryColor: string) => {
    const isSelected = selectedPrograms.includes(program.id);
    const colors = colorClasses[categoryColor as keyof typeof colorClasses];

    return (
      <button
        key={program.id}
        type="button"
        onClick={() => onToggleProgram(program.id)}
        className={`p-6 rounded-xl border-4 text-left transition-all ${
          isSelected
            ? colors.selected + ' shadow-lg transform scale-105'
            : colors.bg + ' ' + colors.border + ' hover:shadow-md'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full border-3 flex items-center justify-center ${
            isSelected ? 'bg-green-600 border-green-600' : 'bg-white border-gray-300'
          }`}>
            {isSelected && <Check size={20} className="text-white" strokeWidth={3} />}
          </div>
          <div className="flex-1">
            <h5 className="text-lg font-bold text-gray-900 mb-1">{program.name}</h5>
            <p className="text-gray-700">{program.description}</p>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-8">
      <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200 mb-6">
        <p className="text-lg font-semibold text-blue-900">
          Select one or more programs you're interested in joining:
        </p>
      </div>

      {/* Children's Programs Section */}
      {childrenPrograms.length > 0 && (
        <div className="space-y-4">
          <div className="bg-purple-100 p-4 rounded-lg border-2 border-purple-300">
            <h4 className="text-xl font-bold text-purple-900">Children's Programs</h4>
            <p className="text-sm text-purple-700 mt-1">Programs designed for children and families</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {childrenPrograms.map(program => renderProgramCard(program, 'purple'))}
          </div>
        </div>
      )}

      {/* Fitness Programs Section */}
      {fitnessPrograms.length > 0 && (
        <div className="space-y-4">
          <div className="bg-orange-100 p-4 rounded-lg border-2 border-orange-300">
            <h4 className="text-xl font-bold text-orange-900">Fitness & Wellbeing Programs</h4>
            <p className="text-sm text-orange-700 mt-1">Physical activity and health programs</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fitnessPrograms.map(program => renderProgramCard(program, 'orange'))}
          </div>
        </div>
      )}

      {/* Generic Programs Section */}
      {genericPrograms.length > 0 && (
        <div className="space-y-4">
          <div className="bg-green-100 p-4 rounded-lg border-2 border-green-300">
            <h4 className="text-xl font-bold text-green-900">General Programs</h4>
            <p className="text-sm text-green-700 mt-1">Community activities and workshops</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {genericPrograms.map(program => renderProgramCard(program, 'green'))}
          </div>
        </div>
      )}

      {selectedPrograms.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200 mt-6">
          <p className="text-lg font-semibold text-blue-900">
            {selectedPrograms.length} program{selectedPrograms.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </div>
  );
}

interface ProgramSpecificStepProps {
  selectedPrograms: string[];
  programData: Record<string, any>;
  onDataChange: (categoryKey: string, field: string, value: any) => void;
}

export function ProgramSpecificStep({ selectedPrograms, programData, onDataChange }: ProgramSpecificStepProps) {
  const [programs, setPrograms] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('id, name')
        .in('id', selectedPrograms);

      if (error) throw error;
      setPrograms(data || []);
    } catch (err) {
      console.error('Error fetching programs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Define which programs require children-specific data
  const childrenPrograms = [
    'Outdoor Playgroup',
    'Homework Club',
    'Dungeons & Dragons',
    'Intergenerational Mentoring'
  ];

  // Define which programs require fitness/health data
  const fitnessPrograms = [
    'Community Fun Fitness',
    'Strength & Balance (Stirling)',
    'Chi Kung',
    'Walking Group',
    "Men's Moves"
  ];

  // Check if any selected programs require children-specific data
  const requiresChildrenData = programs.some(prog =>
    childrenPrograms.includes(prog.name)
  );

  // Check if any selected programs require fitness/health data
  const requiresFitnessData = programs.some(prog =>
    fitnessPrograms.includes(prog.name)
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no programs require specific data, show completion message
  if (!requiresChildrenData && !requiresFitnessData) {
    return (
      <div className="bg-green-50 p-8 rounded-xl border-4 border-green-200 text-center">
        <Check size={64} className="text-green-600 mx-auto mb-4" />
        <h4 className="text-2xl font-bold text-green-900 mb-2">All Set!</h4>
        <p className="text-lg text-green-700">
          All required information has been collected. Click "Complete Registration" to finish.
        </p>
      </div>
    );
  }

  // Filter selected programs by type
  const childrenProgramsSelected = programs.filter(prog =>
    childrenPrograms.includes(prog.name)
  );

  const fitnessProgramsSelected = programs.filter(prog =>
    fitnessPrograms.includes(prog.name)
  );

  return (
    <div className="space-y-8">
      {childrenProgramsSelected.length > 0 && (
        <>
          <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
            <p className="text-lg font-semibold text-blue-900">
              Additional information required for children's programs: {childrenProgramsSelected.map(p => p.name).join(', ')}
            </p>
          </div>

          <div className="bg-purple-50 p-6 rounded-xl border-2 border-purple-200">
            <h4 className="text-xl font-bold text-purple-900 mb-6">Children's Programs - Child Information</h4>
            <p className="text-sm text-purple-700 mb-4">This information will apply to all selected children's programs.</p>

            <div className="space-y-6">
              {(() => {
                const data = programData['children'] || {};

                return (
                  <>
                    {/* Child Names */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-lg font-bold text-gray-700 mb-2">
                          Child Given Name <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={data.childGivenName || ''}
                          onChange={(e) => onDataChange('children', 'childGivenName', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                          placeholder="Child's given name"
                        />
                      </div>

                      <div>
                        <label className="block text-lg font-bold text-gray-700 mb-2">
                          Child Family Name (Surname) <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={data.childFamilyName || ''}
                          onChange={(e) => onDataChange('children', 'childFamilyName', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                          placeholder="Child's family name"
                        />
                      </div>
                    </div>

                    {/* Child Gender and DOB */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-lg font-bold text-gray-700 mb-2">
                          Child Gender <span className="text-red-600">*</span>
                        </label>
                        <select
                          value={data.childGender || ''}
                          onChange={(e) => onDataChange('children', 'childGender', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">Select gender</option>
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-lg font-bold text-gray-700 mb-2">
                          Child Date of Birth <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="date"
                          value={data.childDOB || ''}
                          onChange={(e) => onDataChange('children', 'childDOB', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Aboriginal or Torres Strait Islander */}
                    <div>
                      <label className="block text-lg font-bold text-gray-700 mb-2">
                        Do you or your child identify as Aboriginal or Torres Strait Islander? <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={data.childAboriginalTSI || ''}
                        onChange={(e) => onDataChange('children', 'childAboriginalTSI', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Select an option</option>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    {/* Photo Consent for Child */}
                    <div className="bg-pink-50 p-4 rounded-lg border-2 border-pink-200">
                      <label className="block text-lg font-bold text-gray-700 mb-2">
                        Photo Consent for Child <span className="text-red-600">*</span>
                      </label>
                      <p className="text-sm text-gray-600 mb-3">
                        From time to time, members of the program/club may be photographed for the promotion of the program and/or The Hut.
                        Do you give consent for your child/children's photograph to be used for the following purposes?
                        <span className="text-red-600 font-bold"> *List possible uses rather than a tick box for each.</span>
                      </p>
                      <textarea
                        value={data.childPhotoConsent || ''}
                        onChange={(e) => onDataChange('children', 'childPhotoConsent', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                        rows={3}
                        placeholder="Please specify photo consent preferences"
                      />
                    </div>

                    {/* People Authorised to Collect Child */}
                    <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
                      <h5 className="text-lg font-bold text-gray-700 mb-3">
                        People Authorised to Collect Child <span className="text-red-600">*</span>
                      </h5>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">
                              Name & Relationship to Child
                            </label>
                            <input
                              type="text"
                              value={data.authorisedPerson1Name || ''}
                              onChange={(e) => onDataChange('children', 'authorisedPerson1Name', e.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                              placeholder="Name & relationship"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">
                              Phone
                            </label>
                            <input
                              type="tel"
                              value={data.authorisedPerson1Phone || ''}
                              onChange={(e) => onDataChange('children', 'authorisedPerson1Phone', e.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                              placeholder="Phone number"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">
                              Name & Relationship to Child
                            </label>
                            <input
                              type="text"
                              value={data.authorisedPerson2Name || ''}
                              onChange={(e) => onDataChange('children', 'authorisedPerson2Name', e.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                              placeholder="Name & relationship (optional)"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">
                              Phone
                            </label>
                            <input
                              type="tel"
                              value={data.authorisedPerson2Phone || ''}
                              onChange={(e) => onDataChange('children', 'authorisedPerson2Phone', e.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                              placeholder="Phone number (optional)"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Custody Issues */}
                    <div>
                      <label className="block text-lg font-bold text-gray-700 mb-2">
                        Any custody issues? <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={data.custodyIssues || ''}
                        onChange={(e) => onDataChange('children', 'custodyIssues', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Select an option</option>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    {data.custodyIssues === 'Yes' && (
                      <div>
                        <label className="block text-lg font-bold text-gray-700 mb-2">
                          Please provide details
                        </label>
                        <textarea
                          value={data.custodyIssuesDetails || ''}
                          onChange={(e) => onDataChange('children', 'custodyIssuesDetails', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                          rows={3}
                          placeholder="Describe custody issues"
                        />
                      </div>
                    )}

                    {/* Permission to Make Own Way Home */}
                    <div>
                      <label className="block text-lg font-bold text-gray-700 mb-2">
                        Permission granted to make own way home <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={data.ownWayHomePermission || ''}
                        onChange={(e) => onDataChange('children', 'ownWayHomePermission', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Select an option</option>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    {data.ownWayHomePermission === 'Yes' && (
                      <div>
                        <label className="block text-lg font-bold text-gray-700 mb-2">
                          Please provide details
                        </label>
                        <textarea
                          value={data.ownWayHomeDetails || ''}
                          onChange={(e) => onDataChange('children', 'ownWayHomeDetails', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                          rows={2}
                          placeholder="Provide details about permission"
                        />
                      </div>
                    )}

                    {/* School Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-lg font-bold text-gray-700 mb-2">
                          School Attending <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={data.schoolAttending || ''}
                          onChange={(e) => onDataChange('children', 'schoolAttending', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                          placeholder="School name"
                        />
                      </div>

                      <div>
                        <label className="block text-lg font-bold text-gray-700 mb-2">
                          Year Level <span className="text-red-600">*</span>
                        </label>
                        <select
                          value={data.yearLevel || ''}
                          onChange={(e) => onDataChange('children', 'yearLevel', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">Select year level</option>
                          <option value="Reception">Reception</option>
                          <option value="Year 1">Year 1</option>
                          <option value="Year 2">Year 2</option>
                          <option value="Year 3">Year 3</option>
                          <option value="Year 4">Year 4</option>
                          <option value="Year 5">Year 5</option>
                          <option value="Year 6">Year 6</option>
                          <option value="Year 7">Year 7</option>
                          <option value="Year 8">Year 8</option>
                          <option value="Year 9">Year 9</option>
                          <option value="Year 10">Year 10</option>
                          <option value="Year 11">Year 11</option>
                          <option value="Year 12">Year 12</option>
                        </select>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {fitnessProgramsSelected.length > 0 && (
        <>
          <div className="bg-orange-50 p-4 rounded-xl border-2 border-orange-200">
            <p className="text-lg font-semibold text-orange-900">
              Additional health information required for fitness programs: {fitnessProgramsSelected.map(p => p.name).join(', ')}
            </p>
          </div>

          <div className="bg-orange-50 p-6 rounded-xl border-2 border-orange-200">
            <h4 className="text-xl font-bold text-orange-900 mb-6">Fitness & Wellbeing Programs - Health Information</h4>
            <p className="text-sm text-orange-700 mb-4">This information will apply to all selected fitness & wellbeing programs.</p>

            <div className="space-y-6">
              {(() => {
                const data = programData['fitness'] || {};

                return (
                  <>
                    {/* Health Conditions */}
                    <div>
                      <label className="block text-lg font-bold text-gray-700 mb-3">
                        Health Info <span className="text-red-600">*</span>
                      </label>
                      <p className="text-sm text-gray-600 mb-3">Check boxes / drop down? Tick all that apply</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                          'Asthma', 'Back problems', 'Sight impairment', 'High blood pressure', 'Arthritis',
                          'Joint replacement', 'Stroke', 'Epilepsy', 'Low blood pressure', 'Insomnia',
                          'Heart issues', 'Menopause', 'Repetitive strain injury', 'Recent surgery', 'MS',
                          'Diabetes', 'Recent fracture', 'Difficulty hearing', 'Hernia', 'Osteoporosis',
                          'Detached Retina', 'Other'
                        ].map(condition => (
                          <label key={condition} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(data.healthConditions || []).includes(condition)}
                              onChange={(e) => {
                                const current = data.healthConditions || [];
                                const updated = e.target.checked
                                  ? [...current, condition]
                                  : current.filter((c: string) => c !== condition);
                                onDataChange('fitness', 'healthConditions', updated);
                              }}
                              className="w-5 h-5 rounded border-2 border-gray-300"
                            />
                            <span className="text-gray-700">{condition}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Exercise Level */}
                    <div>
                      <label className="block text-lg font-bold text-gray-700 mb-3">
                        Regular Exercise <span className="text-red-600">*</span>
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="exercise-fitness"
                            value="No regular exercise"
                            checked={data.regularExercise === 'No regular exercise'}
                            onChange={(e) => onDataChange('fitness', 'regularExercise', e.target.value)}
                            className="w-5 h-5 border-2 border-gray-300"
                          />
                          <span className="text-gray-700">No regular exercise</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="exercise-fitness"
                            value="Small amount of exercise"
                            checked={data.regularExercise === 'Small amount of exercise'}
                            onChange={(e) => onDataChange('fitness', 'regularExercise', e.target.value)}
                            className="w-5 h-5 border-2 border-gray-300"
                          />
                          <span className="text-gray-700">Small amount of exercise</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="exercise-fitness"
                            value="Do exercise regularly"
                            checked={data.regularExercise === 'Do exercise regularly'}
                            onChange={(e) => onDataChange('fitness', 'regularExercise', e.target.value)}
                            className="w-5 h-5 border-2 border-gray-300"
                          />
                          <span className="text-gray-700">Do exercise regularly</span>
                        </label>
                      </div>
                    </div>

                    {/* Medical Procedures */}
                    <div>
                      <label className="block text-lg font-bold text-gray-700 mb-2">
                        Medical procedures in the last 12 months? <span className="text-red-600">*</span>
                      </label>
                      <textarea
                        value={data.medicalProcedures || ''}
                        onChange={(e) => onDataChange('fitness', 'medicalProcedures', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                        rows={3}
                        placeholder="Please describe any medical procedures"
                      />
                    </div>

                    {/* Acknowledgement */}
                    <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                      <label className="flex items-start gap-3 cursor-pointer mb-3">
                        <input
                          type="checkbox"
                          checked={data.medicalTreatmentAcknowledged || false}
                          onChange={(e) => onDataChange('fitness', 'medicalTreatmentAcknowledged', e.target.checked)}
                          className="w-6 h-6 mt-1 rounded border-2 border-gray-300"
                        />
                        <span className="text-lg font-semibold text-gray-700">
                          Acknowledgement we will call for medical treatment if required <span className="text-red-600">*</span>
                        </span>
                      </label>

                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={data.medicalTreatmentAcknowledgedDate || ''}
                          onChange={(e) => onDataChange('fitness', 'medicalTreatmentAcknowledgedDate', e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { Edit, Check, AlertCircle, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { supabase, isSupabaseConfigured, Participant } from '../../lib/supabase';
import {
  SA_COUNCIL_REGIONS,
  ADELAIDE_HILLS_TOWNSHIPS,
  DAYS,
  MONTHS,
  YEARS,
  COUNTRIES
} from '../utils/constants';
import { GeneralInfoStep } from '../components/registration/RegistrationSteps';

export default function EditParticipant() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Program-specific data
  const [childrenData, setChildrenData] = useState<any[]>([]);
  const [fitnessData, setFitnessData] = useState<any>({});

  const [formData, setFormData] = useState({
    title: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    homeTel: '',
    gender: '',
    genderOther: '',
    dobMonth: '',
    dobDay: '',
    dobYear: '',

    // Home Address
    addressLine1: '',
    addressLine2: '',
    township: '',
    townshipOther: '',
    postCode: '',
    councilRegion: '',

    // Postal Address
    postalAddressLine1: '',
    postalAddressLine2: '',
    postalPostcode: '',

    // Preferences
    receiveNewsletter: false,
    receiveCourseNotifications: false,

    // Emergency Contact
    emergencyContactFirstName: '',
    emergencyContactLastName: '',
    emergencyContactAddress: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',

    // Cultural Background
    identifyAboriginalTSI: '',
    speakOtherLanguage: '',
    otherLanguageDetails: '',
    countryOfBirth: '',
    culturalIdentity: '',
    culturalIdentityDetails: '',
    lgbtiCommunity: '',

    // Referral Sources
    referralBrochure: false,
    referralReferral: false,
    referralEmailFromHut: false,
    referralFamilyFriend: false,
    referralSocialMedia: false,
    referralLocalNewspaper: false,
    referralLocalNoticeboard: false,
    referralWeb: false,
    referralOther: '',

    // Photo Consent
    photoConsentWebsite: false,
    photoConsentSocialMedia: false,
    photoConsentAnnualReport: false,
    photoConsentBrochures: false,
    photoConsentLocalMedia: false
  });

  useEffect(() => {
    if (id) {
      fetchParticipant();
    }
  }, [id]);

  const fetchParticipant = async () => {
    if (!isSupabaseConfigured || !id) {
      setError('Configuration error');
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('participants')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        // Parse date of birth
        let dobMonth = '', dobDay = '', dobYear = '';
        if (data.date_of_birth) {
          const dob = new Date(data.date_of_birth);
          dobMonth = String(dob.getMonth() + 1);
          dobDay = String(dob.getDate());
          dobYear = String(dob.getFullYear());
        }

        // Parse emergency contact name
        const emergencyNameParts = (data.emergency_contact_name || '').split(' ');
        const emergencyFirstName = emergencyNameParts[0] || '';
        const emergencyLastName = emergencyNameParts.slice(1).join(' ') || '';

        // Parse referral sources
        let referralSources: string[] = [];
        try {
          referralSources = typeof data.referral_sources === 'string'
            ? JSON.parse(data.referral_sources)
            : (data.referral_sources || []);
        } catch (e) {
          referralSources = [];
        }

        // Parse photo consent
        let photoConsent: any = {};
        try {
          photoConsent = typeof data.photo_consent === 'string'
            ? JSON.parse(data.photo_consent)
            : (data.photo_consent || {});
        } catch (e) {
          photoConsent = {};
        }

        // Parse program-specific data
        let programSpecificData: any = {};
        try {
          programSpecificData = typeof data.program_specific_data === 'string'
            ? JSON.parse(data.program_specific_data)
            : (data.program_specific_data || {});
        } catch (e) {
          programSpecificData = {};
        }

        // Load children data - support both old single child format and new multiple children format
        if (programSpecificData.allChildren && programSpecificData.allChildren.length > 0) {
          // New format with multiple children
          setChildrenData(programSpecificData.allChildren);
        } else {
          const childrenDataFromDB = programSpecificData.children || {};
          if (Object.keys(childrenDataFromDB).length > 0) {
            // Old format (single child), convert to array
            setChildrenData([childrenDataFromDB]);
          } else {
            setChildrenData([]);
          }
        }

        // Load fitness data
        setFitnessData(programSpecificData.fitness || {});

        setFormData({
          title: data.title || '',
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          homeTel: data.home_tel || '',
          gender: data.gender || '',
          genderOther: '',
          dobMonth,
          dobDay,
          dobYear,

          addressLine1: data.address_line1 || '',
          addressLine2: data.address_line2 || '',
          township: data.township || '',
          townshipOther: data.township_other || '',
          postCode: data.post_code || '',
          councilRegion: data.council_region || '',

          postalAddressLine1: data.postal_address_line1 || '',
          postalAddressLine2: data.postal_address_line2 || '',
          postalPostcode: data.postal_postcode || '',

          receiveNewsletter: data.receive_newsletter || false,
          receiveCourseNotifications: data.receive_course_notifications || false,

          emergencyContactFirstName: emergencyFirstName,
          emergencyContactLastName: emergencyLastName,
          emergencyContactAddress: data.emergency_contact_address || '',
          emergencyContactPhone: data.emergency_contact_phone || '',
          emergencyContactRelationship: data.emergency_contact_relationship || '',

          identifyAboriginalTSI: data.identify_aboriginal_tsi || '',
          speakOtherLanguage: data.speak_other_language || '',
          otherLanguageDetails: data.other_language_details || '',
          countryOfBirth: data.country_of_birth || '',
          culturalIdentity: data.cultural_identity || '',
          culturalIdentityDetails: data.cultural_identity_details || '',
          lgbtiCommunity: data.lgbti_community || '',

          referralBrochure: referralSources.includes('Brochure'),
          referralReferral: referralSources.includes('Referral'),
          referralEmailFromHut: referralSources.includes('Email from The Hut'),
          referralFamilyFriend: referralSources.includes('Family/Friend'),
          referralSocialMedia: referralSources.includes('Social Media (Facebook)'),
          referralLocalNewspaper: referralSources.includes('Local Newspaper'),
          referralLocalNoticeboard: referralSources.includes('Local Noticeboard'),
          referralWeb: referralSources.includes('Web'),
          referralOther: referralSources.find(s => s.startsWith('Other:'))?.replace('Other: ', '') || '',

          photoConsentWebsite: photoConsent.website || false,
          photoConsentSocialMedia: photoConsent.socialMedia || false,
          photoConsentAnnualReport: photoConsent.annualReport || false,
          photoConsentBrochures: photoConsent.brochures || false,
          photoConsentLocalMedia: photoConsent.localMedia || false
        });
      }
    } catch (err) {
      console.error('Error fetching participant:', err);
      setError('Failed to load participant data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    setError('');

    if (!formData.firstName || !formData.lastName) {
      setError('First name and last name are required');
      return false;
    }
    if (!formData.email || !formData.phone) {
      setError('Email and phone number are required');
      return false;
    }
    if (!formData.gender) {
      setError('Gender is required');
      return false;
    }
    if (formData.gender === 'I use a different term' && !formData.genderOther) {
      setError('Please specify your gender identity');
      return false;
    }
    if (!formData.dobMonth || !formData.dobDay || !formData.dobYear) {
      setError('Complete date of birth is required');
      return false;
    }
    if (!formData.addressLine1 || !formData.postCode || !formData.councilRegion) {
      setError('Address, post code, and council region are required');
      return false;
    }
    if (!formData.township) {
      setError('Township is required');
      return false;
    }
    if (formData.township === 'Other' && !formData.townshipOther) {
      setError('Please specify your township');
      return false;
    }
    if (!formData.emergencyContactFirstName || !formData.emergencyContactLastName || !formData.emergencyContactPhone) {
      setError('Emergency contact information is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Construct date of birth
      const dateOfBirth = `${formData.dobYear}-${formData.dobMonth}-${formData.dobDay.padStart(2, '0')}`;

      // Build referral sources array
      const referralSources = [];
      if (formData.referralBrochure) referralSources.push('Brochure');
      if (formData.referralReferral) referralSources.push('Referral');
      if (formData.referralEmailFromHut) referralSources.push('Email from The Hut');
      if (formData.referralFamilyFriend) referralSources.push('Family/Friend');
      if (formData.referralSocialMedia) referralSources.push('Social Media (Facebook)');
      if (formData.referralLocalNewspaper) referralSources.push('Local Newspaper');
      if (formData.referralLocalNoticeboard) referralSources.push('Local Noticeboard');
      if (formData.referralWeb) referralSources.push('Web');
      if (formData.referralOther) referralSources.push(`Other: ${formData.referralOther}`);

      // Build photo consent object
      const photoConsent = {
        website: formData.photoConsentWebsite,
        socialMedia: formData.photoConsentSocialMedia,
        annualReport: formData.photoConsentAnnualReport,
        brochures: formData.photoConsentBrochures,
        localMedia: formData.photoConsentLocalMedia
      };

      // Determine final gender value
      const finalGender = formData.gender === 'I use a different term'
        ? formData.genderOther
        : formData.gender;

      // Update participant
      const participantUpdate: any = {
        title: formData.title || null,
        first_name: formData.firstName,
        last_name: formData.lastName,
        gender: finalGender,
        email: formData.email,
        phone: formData.phone,
        home_tel: formData.homeTel || null,
        date_of_birth: dateOfBirth,
        address_line1: formData.addressLine1,
        address_line2: formData.addressLine2 || null,
        township: formData.township,
        township_other: formData.township === 'Other' ? formData.townshipOther : null,
        post_code: formData.postCode,
        council_region: formData.councilRegion,
        postal_address_line1: formData.postalAddressLine1 || null,
        postal_address_line2: formData.postalAddressLine2 || null,
        postal_postcode: formData.postalPostcode || null,
        receive_newsletter: formData.receiveNewsletter,
        receive_course_notifications: formData.receiveCourseNotifications,
        emergency_contact_name: `${formData.emergencyContactFirstName} ${formData.emergencyContactLastName}`,
        emergency_contact_phone: formData.emergencyContactPhone,
        emergency_contact_address: formData.emergencyContactAddress || null,
        emergency_contact_relationship: formData.emergencyContactRelationship || null,
        identify_aboriginal_tsi: formData.identifyAboriginalTSI || null,
        speak_other_language: formData.speakOtherLanguage || null,
        other_language_details: formData.otherLanguageDetails || null,
        country_of_birth: formData.countryOfBirth || null,
        cultural_identity: formData.culturalIdentity || null,
        cultural_identity_details: formData.culturalIdentityDetails || null,
        lgbti_community: formData.lgbtiCommunity || null,
        referral_sources: JSON.stringify(referralSources),
        photo_consent: JSON.stringify(photoConsent),
        program_specific_data: JSON.stringify({
          // Store first child as single object for backward compatibility
          // In future we can change this to support multiple children
          children: childrenData.length > 0 ? childrenData[0] : {},
          fitness: fitnessData,
          // Store all children data in separate field for future use
          allChildren: childrenData
        })
      };

      // Update — retry by stripping columns that aren't in the schema.
      // Keeps the form usable on databases that haven't run every migration yet.
      let attempt = participantUpdate;
      for (let i = 0; i < 20; i++) {
        const { error: updateError } = await supabase
          .from('participants')
          .update(attempt)
          .eq('id', id);
        if (!updateError) break;
        const missing = /'([a-zA-Z_]+)' column of '[a-zA-Z_]+' in the schema cache/.exec(updateError.message || '');
        if (missing && missing[1] in attempt) {
          console.warn(`Column "${missing[1]}" missing from participants table — dropping and retrying. Run supabase-setup.sql to update your schema.`);
          const { [missing[1]]: _drop, ...rest } = attempt;
          attempt = rest;
          continue;
        }
        throw updateError;
      }

      setShowSuccess(true);
      setTimeout(() => {
        navigate(`/participant/${id}`);
      }, 2000);
    } catch (err: any) {
      console.error('Error updating participant:', err);
      setError(err.message || 'Failed to update participant. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Loading...">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mx-auto mb-6"></div>
            <p className="text-2xl text-gray-600 font-semibold">Loading participant data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (showSuccess) {
    return (
      <Layout title="Edit Participant">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-50 border-4 border-green-400 rounded-2xl p-12 md:p-16 text-center shadow-xl">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-600 rounded-full mb-6">
              <Check size={48} className="text-white" strokeWidth={3} />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-green-900 mb-4">
              Updated Successfully!
            </h3>
            <p className="text-xl text-green-700 font-semibold">
              Participant details have been updated
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Edit Participant">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 border-4 border-blue-200">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6 bg-blue-50 p-5 rounded-xl">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Edit size={32} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                Edit Participant Details
              </h3>
              <p className="text-gray-600 text-lg mt-1">
                Update participant information
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-4 border-red-400 rounded-xl p-4 flex items-start gap-3 mb-6">
              <AlertCircle size={24} className="text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-bold text-red-900 mb-1">Error</h4>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <GeneralInfoStep
              formData={formData}
              handleChange={handleChange}
            />

            {/* Children's Programs Data */}
            <div className="mt-8 bg-purple-50 p-6 rounded-xl border-2 border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-purple-900">Children's Programs Information</h4>
                <button
                  type="button"
                  onClick={() => setChildrenData([...childrenData, {}])}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <Plus size={20} />
                  Add Child
                </button>
              </div>
              <p className="text-sm text-purple-700 mb-4">Add information for each child participating in children's programs</p>

              {childrenData.length === 0 ? (
                <div className="bg-white p-8 rounded-lg text-center">
                  <p className="text-gray-600">No children added. Click "Add Child" to add child information.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {childrenData.map((child, childIndex) => (
                    <div key={childIndex} className="bg-white p-6 rounded-xl border-2 border-purple-300">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="text-lg font-bold text-purple-800">Child {childIndex + 1}</h5>
                        <button
                          type="button"
                          onClick={() => {
                            const newChildren = childrenData.filter((_, i) => i !== childIndex);
                            setChildrenData(newChildren);
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold transition-colors"
                        >
                          <Trash2 size={18} />
                          Remove
                        </button>
                      </div>

                      <div className="space-y-4">
                        {/* Child Names */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-lg font-bold text-gray-700 mb-2">Child Given Name</label>
                            <input
                              type="text"
                              value={child.childGivenName || ''}
                              onChange={(e) => {
                                const newChildren = [...childrenData];
                                newChildren[childIndex] = { ...child, childGivenName: e.target.value };
                                setChildrenData(newChildren);
                              }}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                              placeholder="Child's given name"
                            />
                          </div>
                          <div>
                            <label className="block text-lg font-bold text-gray-700 mb-2">Child Family Name</label>
                            <input
                              type="text"
                              value={child.childFamilyName || ''}
                              onChange={(e) => {
                                const newChildren = [...childrenData];
                                newChildren[childIndex] = { ...child, childFamilyName: e.target.value };
                                setChildrenData(newChildren);
                              }}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                              placeholder="Child's family name"
                            />
                          </div>
                        </div>

                        {/* Gender and DOB */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-lg font-bold text-gray-700 mb-2">Child Gender</label>
                            <select
                              value={child.childGender || ''}
                              onChange={(e) => {
                                const newChildren = [...childrenData];
                                newChildren[childIndex] = { ...child, childGender: e.target.value };
                                setChildrenData(newChildren);
                              }}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                            >
                              <option value="">Select gender</option>
                              <option value="Female">Female</option>
                              <option value="Male">Male</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-lg font-bold text-gray-700 mb-2">Child Date of Birth</label>
                            <input
                              type="date"
                              value={child.childDOB || ''}
                              onChange={(e) => {
                                const newChildren = [...childrenData];
                                newChildren[childIndex] = { ...child, childDOB: e.target.value };
                                setChildrenData(newChildren);
                              }}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* School Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-lg font-bold text-gray-700 mb-2">School Attending</label>
                            <input
                              type="text"
                              value={child.schoolAttending || ''}
                              onChange={(e) => {
                                const newChildren = [...childrenData];
                                newChildren[childIndex] = { ...child, schoolAttending: e.target.value };
                                setChildrenData(newChildren);
                              }}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                              placeholder="School name"
                            />
                          </div>
                          <div>
                            <label className="block text-lg font-bold text-gray-700 mb-2">Year Level</label>
                            <select
                              value={child.yearLevel || ''}
                              onChange={(e) => {
                                const newChildren = [...childrenData];
                                newChildren[childIndex] = { ...child, yearLevel: e.target.value };
                                setChildrenData(newChildren);
                              }}
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

                        {/* Aboriginal/TSI */}
                        <div>
                          <label className="block text-lg font-bold text-gray-700 mb-2">Aboriginal or Torres Strait Islander</label>
                          <select
                            value={child.childAboriginalTSI || ''}
                            onChange={(e) => {
                              const newChildren = [...childrenData];
                              newChildren[childIndex] = { ...child, childAboriginalTSI: e.target.value };
                              setChildrenData(newChildren);
                            }}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                          >
                            <option value="">Select an option</option>
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        </div>

                        {/* Photo Consent */}
                        <div>
                          <label className="block text-lg font-bold text-gray-700 mb-2">Photo Consent</label>
                          <textarea
                            value={child.childPhotoConsent || ''}
                            onChange={(e) => {
                              const newChildren = [...childrenData];
                              newChildren[childIndex] = { ...child, childPhotoConsent: e.target.value };
                              setChildrenData(newChildren);
                            }}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                            rows={2}
                            placeholder="Photo consent details"
                          />
                        </div>

                        {/* Authorized Persons */}
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <p className="text-sm font-bold text-gray-700 mb-3">Authorized to Collect Child</p>
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={child.authorisedPerson1Name || ''}
                                onChange={(e) => {
                                  const newChildren = [...childrenData];
                                  newChildren[childIndex] = { ...child, authorisedPerson1Name: e.target.value };
                                  setChildrenData(newChildren);
                                }}
                                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                placeholder="Name & relationship"
                              />
                              <input
                                type="tel"
                                value={child.authorisedPerson1Phone || ''}
                                onChange={(e) => {
                                  const newChildren = [...childrenData];
                                  newChildren[childIndex] = { ...child, authorisedPerson1Phone: e.target.value };
                                  setChildrenData(newChildren);
                                }}
                                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                placeholder="Phone"
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={child.authorisedPerson2Name || ''}
                                onChange={(e) => {
                                  const newChildren = [...childrenData];
                                  newChildren[childIndex] = { ...child, authorisedPerson2Name: e.target.value };
                                  setChildrenData(newChildren);
                                }}
                                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                placeholder="Name & relationship (optional)"
                              />
                              <input
                                type="tel"
                                value={child.authorisedPerson2Phone || ''}
                                onChange={(e) => {
                                  const newChildren = [...childrenData];
                                  newChildren[childIndex] = { ...child, authorisedPerson2Phone: e.target.value };
                                  setChildrenData(newChildren);
                                }}
                                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                placeholder="Phone (optional)"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Custody Issues and Permission */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-lg font-bold text-gray-700 mb-2">Custody Issues</label>
                            <select
                              value={child.custodyIssues || ''}
                              onChange={(e) => {
                                const newChildren = [...childrenData];
                                newChildren[childIndex] = { ...child, custodyIssues: e.target.value };
                                setChildrenData(newChildren);
                              }}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                            >
                              <option value="">Select</option>
                              <option value="No">No</option>
                              <option value="Yes">Yes</option>
                            </select>
                            {child.custodyIssues === 'Yes' && (
                              <textarea
                                value={child.custodyIssuesDetails || ''}
                                onChange={(e) => {
                                  const newChildren = [...childrenData];
                                  newChildren[childIndex] = { ...child, custodyIssuesDetails: e.target.value };
                                  setChildrenData(newChildren);
                                }}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none mt-2"
                                rows={2}
                                placeholder="Details"
                              />
                            )}
                          </div>
                          <div>
                            <label className="block text-lg font-bold text-gray-700 mb-2">Own Way Home Permission</label>
                            <select
                              value={child.ownWayHomePermission || ''}
                              onChange={(e) => {
                                const newChildren = [...childrenData];
                                newChildren[childIndex] = { ...child, ownWayHomePermission: e.target.value };
                                setChildrenData(newChildren);
                              }}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                            >
                              <option value="">Select</option>
                              <option value="No">No</option>
                              <option value="Yes">Yes</option>
                            </select>
                            {child.ownWayHomePermission === 'Yes' && (
                              <textarea
                                value={child.ownWayHomeDetails || ''}
                                onChange={(e) => {
                                  const newChildren = [...childrenData];
                                  newChildren[childIndex] = { ...child, ownWayHomeDetails: e.target.value };
                                  setChildrenData(newChildren);
                                }}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none mt-2"
                                rows={2}
                                placeholder="Details"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fitness Programs Data */}
            <div className="mt-8 bg-orange-50 p-6 rounded-xl border-2 border-orange-200">
              <h4 className="text-xl font-bold text-orange-900 mb-4">Fitness & Wellbeing Programs - Health Information</h4>

              <div className="space-y-4">
                {/* Health Conditions */}
                <div className="bg-white p-4 rounded-lg">
                  <label className="block text-lg font-bold text-gray-700 mb-3">Health Conditions</label>
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
                          checked={(fitnessData.healthConditions || []).includes(condition)}
                          onChange={(e) => {
                            const current = fitnessData.healthConditions || [];
                            const updated = e.target.checked
                              ? [...current, condition]
                              : current.filter((c: string) => c !== condition);
                            setFitnessData({ ...fitnessData, healthConditions: updated });
                          }}
                          className="w-5 h-5 rounded border-2 border-gray-300"
                        />
                        <span className="text-gray-700">{condition}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Regular Exercise */}
                <div className="bg-white p-4 rounded-lg">
                  <label className="block text-lg font-bold text-gray-700 mb-3">Regular Exercise</label>
                  <div className="space-y-2">
                    {['No regular exercise', 'Small amount of exercise', 'Do exercise regularly'].map(level => (
                      <label key={level} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="exercise"
                          value={level}
                          checked={fitnessData.regularExercise === level}
                          onChange={(e) => setFitnessData({ ...fitnessData, regularExercise: e.target.value })}
                          className="w-5 h-5 border-2 border-gray-300"
                        />
                        <span className="text-gray-700">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Medical Procedures */}
                <div className="bg-white p-4 rounded-lg">
                  <label className="block text-lg font-bold text-gray-700 mb-2">Medical Procedures (Last 12 Months)</label>
                  <textarea
                    value={fitnessData.medicalProcedures || ''}
                    onChange={(e) => setFitnessData({ ...fitnessData, medicalProcedures: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                    rows={3}
                    placeholder="Describe any medical procedures"
                  />
                </div>

                {/* Medical Treatment Acknowledgement */}
                <div className="bg-white p-4 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={fitnessData.medicalTreatmentAcknowledged || false}
                      onChange={(e) => setFitnessData({ ...fitnessData, medicalTreatmentAcknowledged: e.target.checked })}
                      className="w-6 h-6 mt-1 rounded border-2 border-gray-300"
                    />
                    <span className="text-lg font-semibold text-gray-700">
                      Acknowledgement we will call for medical treatment if required
                    </span>
                  </label>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Date</label>
                    <input
                      type="date"
                      value={fitnessData.medicalTreatmentAcknowledgedDate || ''}
                      onChange={(e) => setFitnessData({ ...fitnessData, medicalTreatmentAcknowledgedDate: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-8 border-t-2 border-gray-200">
              <button
                type="button"
                onClick={() => navigate(`/participant/${id}`)}
                className="flex items-center justify-center gap-2 px-8 py-5 border-4 border-gray-400 text-gray-700 rounded-xl text-xl font-bold hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={24} />
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-400 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

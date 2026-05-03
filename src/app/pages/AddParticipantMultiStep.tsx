import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { UserPlus, Check, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { 
  SA_COUNCIL_REGIONS, 
  ADELAIDE_HILLS_TOWNSHIPS, 
  DAYS, 
  MONTHS, 
  YEARS,
  COUNTRIES 
} from '../utils/constants';
import { 
  GeneralInfoStep,
  ProgramSelectionStep,
  ProgramSpecificStep
} from '../components/registration/RegistrationSteps';

export default function AddParticipantMultiStep() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    // Personal Information
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
    
    // Referral Sources (checkboxes)
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
    photoConsentLocalMedia: false,
    
    // Program Selection
    selectedPrograms: [] as string[],
    
    // Program-specific data (dynamically filled based on selected programs)
    programSpecificData: {} as Record<string, any>
  });

  const totalSteps = 3;

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProgramToggle = (programName: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPrograms: prev.selectedPrograms.includes(programName)
        ? prev.selectedPrograms.filter(p => p !== programName)
        : [...prev.selectedPrograms, programName]
    }));
  };

  const handleProgramDataChange = (categoryKey: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      programSpecificData: {
        ...prev.programSpecificData,
        [categoryKey]: {
          ...(prev.programSpecificData[categoryKey] || {}),
          [field]: value
        }
      }
    }));
  };

  const validateStep = async (step: number): Promise<boolean> => {
    setError('');

    if (step === 1) {
      // Validate general information
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
    }

    if (step === 2) {
      // Validate program selection
      if (formData.selectedPrograms.length === 0) {
        setError('Please select at least one program');
        return false;
      }
    }

    if (step === 3) {
      // Fetch program names to validate properly
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('id, name')
        .in('id', formData.selectedPrograms);

      if (programsError) {
        console.error('Error fetching programs for validation:', programsError);
        setError('Unable to validate program data. Please try again.');
        return false;
      }

      // Define which programs require children-specific data
      const childrenProgramNames = [
        'Outdoor Playgroup',
        'Homework Club',
        'Dungeons & Dragons',
        'Intergenerational Mentoring'
      ];

      // Define which programs require fitness/health data
      const fitnessProgramNames = [
        'Community Fun Fitness',
        'Strength & Balance (Stirling)',
        'Chi Kung',
        'Walking Group',
        "Men's Moves"
      ];

      // Check if any selected programs are children's programs
      const hasChildrenPrograms = (programsData || []).some(prog =>
        childrenProgramNames.includes(prog.name)
      );

      // Check if any selected programs are fitness programs
      const hasFitnessPrograms = (programsData || []).some(prog =>
        fitnessProgramNames.includes(prog.name)
      );

      // Validate children's category data if needed
      if (hasChildrenPrograms) {
        const data = formData.programSpecificData['children'];

        if (!data) {
          setError('Please fill in the required information for children\'s programs');
          return false;
        }

        if (!data.childGivenName || !data.childFamilyName) {
          setError('Please enter the child\'s given name and family name');
          return false;
        }
        if (!data.childGender) {
          setError('Please select the child\'s gender');
          return false;
        }
        if (!data.childDOB) {
          setError('Please enter the child\'s date of birth');
          return false;
        }
        if (!data.childAboriginalTSI) {
          setError('Please answer the Aboriginal or Torres Strait Islander question');
          return false;
        }
        if (!data.childPhotoConsent) {
          setError('Please provide photo consent information');
          return false;
        }
        if (!data.authorisedPerson1Name || !data.authorisedPerson1Phone) {
          setError('Please provide at least one authorised person to collect the child');
          return false;
        }
        if (!data.custodyIssues) {
          setError('Please answer whether there are any custody issues');
          return false;
        }
        if (!data.ownWayHomePermission) {
          setError('Please indicate permission for child to make own way home');
          return false;
        }
        if (!data.schoolAttending) {
          setError('Please enter the school the child is attending');
          return false;
        }
        if (!data.yearLevel) {
          setError('Please select the child\'s year level');
          return false;
        }
      }

      // Validate fitness category data if needed
      if (hasFitnessPrograms) {
        const data = formData.programSpecificData['fitness'];

        if (!data) {
          setError('Please fill in the required health information for fitness programs');
          return false;
        }

        if (!data.healthConditions || data.healthConditions.length === 0) {
          setError('Please select health conditions (or check none apply)');
          return false;
        }
        if (!data.regularExercise) {
          setError('Please indicate your regular exercise level');
          return false;
        }
        if (!data.medicalProcedures) {
          setError('Please provide information about medical procedures');
          return false;
        }
        if (!data.medicalTreatmentAcknowledged) {
          setError('Please acknowledge the medical treatment policy');
          return false;
        }
      }
    }

    return true;
  };

  const nextStep = async () => {
    if (await validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate Step 3 before submitting
    if (!(await validateStep(3))) {
      return;
    }

    setError('');
    setLoading(true);
    
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

      // Insert participant - only include fields that exist in the database
      const participantInsert: any = {
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
        post_code: formData.postCode,
        council_region: formData.councilRegion,
        emergency_contact_name: `${formData.emergencyContactFirstName} ${formData.emergencyContactLastName}`,
        emergency_contact_phone: formData.emergencyContactPhone,
      };

      // Add optional fields that may not exist in older schemas
      const optionalFields = {
        township: formData.township,
        township_other: formData.township === 'Other' ? formData.townshipOther : null,
        postal_address_line1: formData.postalAddressLine1 || null,
        postal_address_line2: formData.postalAddressLine2 || null,
        postal_postcode: formData.postalPostcode || null,
        receive_newsletter: formData.receiveNewsletter,
        receive_course_notifications: formData.receiveCourseNotifications,
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
        program_specific_data: JSON.stringify(formData.programSpecificData)
      };

      // Try to add optional fields, but don't fail if they don't exist
      Object.assign(participantInsert, optionalFields);

      // Insert participant — retry by stripping columns that aren't in the schema.
      // This lets the form keep working on databases that haven't run every migration yet.
      let participantData: any = null;
      let attempt = participantInsert;
      for (let i = 0; i < 20; i++) {
        const { data, error: err } = await supabase
          .from('participants')
          .insert([attempt])
          .select()
          .single();
        if (!err) {
          participantData = data;
          break;
        }
        const missing = /'([a-zA-Z_]+)' column of '[a-zA-Z_]+' in the schema cache/.exec(err.message || '');
        if (missing && missing[1] in attempt) {
          console.warn(`Column "${missing[1]}" missing from participants table — dropping and retrying. Run supabase-setup.sql to update your schema.`);
          const { [missing[1]]: _drop, ...rest } = attempt;
          attempt = rest;
          continue;
        }
        throw err;
      }
      if (!participantData) throw new Error('Failed to insert participant');

      // Enroll participant in selected programs
      if (formData.selectedPrograms.length > 0) {
        // Create enrollment records using the program IDs directly
        const programEnrollments = formData.selectedPrograms.map(programId => ({
          participant_id: participantData.id,
          program_id: programId
        }));

        // Insert enrollments into database
        const { error: enrollmentError } = await supabase
          .from('program_enrollments')
          .insert(programEnrollments);

        if (enrollmentError) {
          console.error('Error enrolling participant in programs:', enrollmentError);
          throw enrollmentError;
        }

        console.log('Participant enrolled in', formData.selectedPrograms.length, 'programs');
      }
      
      console.log('New participant added:', participantData);
      console.log('Selected programs:', formData.selectedPrograms);
      
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

  if (showSuccess) {
    return (
      <Layout>
        <div className="mx-auto mt-10 max-w-md rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
            <Check size={22} className="text-emerald-400" strokeWidth={2.5} />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-emerald-200">Participant registered</h3>
          <p className="text-sm text-emerald-300/80">Taking you back to the dashboard…</p>
        </div>
      </Layout>
    );
  }

  const steps = [
    { num: 1, label: 'General info' },
    { num: 2, label: 'Select programs' },
    { num: 3, label: 'Program details' },
  ];

  return (
    <Layout title="Register participant" subtitle={`Step ${currentStep} of ${totalSteps}`}>
      <div className="mx-auto max-w-4xl">
        {/* Stepper */}
        <div className="mb-6 rounded-xl border border-zinc-800/80 bg-[#111113] p-4">
          <div className="flex items-center gap-2">
            {steps.map((s, i) => {
              const active = currentStep === s.num;
              const done = currentStep > s.num;
              return (
                <div key={s.num} className="flex flex-1 items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                        done
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : active
                            ? 'bg-blue-500 text-white'
                            : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {done ? <Check size={13} strokeWidth={3} /> : s.num}
                    </div>
                    <span
                      className={`hidden text-xs sm:inline ${
                        active ? 'text-zinc-100' : done ? 'text-zinc-300' : 'text-zinc-500'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`mx-2 h-px flex-1 ${done ? 'bg-emerald-500/40' : 'bg-zinc-800'}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="rounded-xl border border-zinc-800/80 bg-[#111113] p-6">
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && <GeneralInfoStep formData={formData} handleChange={handleChange} />}
            {currentStep === 2 && (
              <ProgramSelectionStep
                selectedPrograms={formData.selectedPrograms}
                onToggleProgram={handleProgramToggle}
              />
            )}
            {currentStep === 3 && (
              <ProgramSpecificStep
                selectedPrograms={formData.selectedPrograms}
                programData={formData.programSpecificData}
                onDataChange={handleProgramDataChange}
              />
            )}

            <div className="mt-8 flex flex-col-reverse gap-2 border-t border-zinc-800 pt-5 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-700 hover:text-white"
              >
                Cancel
              </button>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-700 hover:text-white"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              )}
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-indigo-500"
                >
                  Next <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Saving…' : 'Complete registration'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
